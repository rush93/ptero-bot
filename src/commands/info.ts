import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction, inlineCode } from "discord.js";
import { buttons } from "../buttons";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";
import { PterodactylClient } from "../services/pterodactyl";
import { serverListAutoComplete } from "../services/serverListAutoComplete";
import { withPermission } from '../services/permissions';
import { addAutorefreshMessage } from "../services/db";
import { runAutoRefreshMessages } from "../services/autorefreshMessages";
import { messageCallback } from './consoleChannel';

export const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("display the information of a server")
  .addStringOption(option => option.setName("server").setDescription("The server name").setRequired(true).setAutocomplete(true))
  .addBooleanOption(option => option.setName("detailed").setDescription("Avec les détails de performance du serveur ?").setRequired(false))
  .addBooleanOption(option => option.setName("autorefresh").setDescription("Met a jours les infos reguilièrement").setRequired(false))
  .addBooleanOption(option => option.setName("withbuttons").setDescription("Affiche les boutons d'action du serveur").setRequired(false))
;

export const autocomplete = withPermission("list_servers", serverListAutoComplete("server"));

export const selectString = withPermission("show_server_info", needsConfiguration(async(guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: StringSelectMenuInteraction) => {
    const serverId = interaction.values[0];
    return replyWithInfo(guildConfig, interaction, serverId);
}));

export const getEmbed = async (guildConfig: Prisma.GuildConfigGetPayload<{}>, serverId: string, withDetail: boolean, withButtons: boolean) => {
  const pteroClient = new PterodactylClient(guildConfig.api_url, guildConfig.token);

  const serverData = (await pteroClient.getServer(serverId)).attributes ?? null;

  if (!serverData) {
      return { content: "Server not found" };
  }
  const ressources = (await pteroClient.getRessources(serverData.identifier)).attributes;

  const state = ressources.current_state == "running" ? "running" : ressources.current_state == "offline" ? "offline" : "starting";
  const cpuPercent = Math.round(100 * ressources.resources.cpu_absolute / serverData.limits.cpu);
  const memoryPercent = Math.round(100 * ressources.resources.memory_bytes / 1024 / 1024 / serverData.limits.memory);
  const diskPercent = Math.round(100 * ressources.resources.disk_bytes / 1024 / 1024 / serverData.limits.disk);

  const createBar = (percent: number) => {
      const minPercent = Math.min(percent, 100);
      const emojiCount = 6;
      const nbEmoji = Math.round(emojiCount * minPercent / 100)
      const color = nbEmoji <= 1 ? '🟩' : percent < 50 ? '🟦' : nbEmoji < emojiCount-1 ? '🟨': percent < 100 ? '🟧': '🟥';
      return color.repeat(nbEmoji) + '⬜'.repeat(emojiCount - nbEmoji) + '\n' + '〰️'.repeat(Math.min(nbEmoji, emojiCount - 2)) + `**${percent}%**`;
  }

  const fields = [
      {
          name: `${{running: "🟢", offline: "🔴", starting: "🟡"}[state]} Statut`,
          value: `${ressources.current_state == state ? {running: "En cours d'exécution", offline: "Arrêter", starting: "Démarage en cours"}[state] : ressources.current_state}`,
          inline: false
      },
      {
          name: "🌐 Adresse IP",
          inline: false,
          value: `${serverData.relationships.allocations?.data[0]?.attributes?.ip}:${serverData.relationships.allocations?.data[0]?.attributes?.port}`
      },
      {
          name: `💻 CPU`,
          inline: true,
          value: (withDetail ? `${Math.round(ressources.resources.cpu_absolute)}/${serverData.limits.cpu} %\n` : '') + createBar(cpuPercent)
      },
      {
          name: "🧠 Mémoire",
          inline: true,
          value: (withDetail ? `${Math.round(ressources.resources.memory_bytes / 1024 / 1024 / 1024 * 100)/100}/${Math.round(serverData.limits.memory/1024 * 100)/100} Gb\n` : '')+createBar(memoryPercent)
      },
      {
          name: "💾 Disque",
          inline: true,
          value: (withDetail ? `${Math.round(ressources.resources.disk_bytes / 1024 / 1024 / 1024 * 100)/100}/${Math.round(serverData.limits.disk/1024 * 100)/100} Gb\n` : '')+createBar(diskPercent)
      }
  ];
      
  const panelLinkButton = new ButtonBuilder()
    .setLabel("Panel")
    .setStyle(ButtonStyle.Link)
    .setURL(`${guildConfig.api_url}/server/${serverData.identifier}`); 

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(withButtons ? [buttons.start.data, buttons.restart.data, buttons.stop.data, panelLinkButton] : []);

  if (serverData.docker_image == 'ghcr.io/pterodactyl/games:source') {
    row.addComponents([
      new ButtonBuilder()
        .setLabel("Rejoindre")
        .setStyle(ButtonStyle.Link)
        .setURL(` https://locktech.fr/connect/${serverData.relationships.allocations.data[0].attributes.ip}:${serverData.relationships.allocations.data[0].attributes.port}`)
    ])
  }

  return { 
    embeds: [{
        title: `✨${serverData.name}✨`,
        thumbnail: {
            url: `https://cdn-icons-png.flaticon.com/512/2917/2917242.png`
        },
        fields,
        color: 0x3498db,
        footer: {
            text: `Server ID: ${serverData.identifier}`,
            icon_url: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png",
        },
        timestamp: (new Date()).toISOString(),
    }],
    components: row.components.length > 0 ? [row] : [],
    fetchReply: true
  }
}

const replyWithInfo = async (guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction|StringSelectMenuInteraction, serverId: string, withDetail: boolean = false, autoRefresh: boolean = false, withButtons: boolean = true) => {
    
    const response = await interaction.reply(await getEmbed(guildConfig, serverId, withDetail, withButtons));

    if (autoRefresh) {
      await addAutorefreshMessage(guildConfig.guildId, response.id, interaction.channel?.id ?? '', withDetail, withButtons);
      runAutoRefreshMessages(guildConfig.guildId);
    }

    return response;
}
export const execute = withPermission("show_server_info", needsConfiguration(async(guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction) => {

    const data = interaction.options.get("server")?.value as string;
    const withDetail = interaction.options.get("detailed")?.value as boolean ?? false;
    const autoRefresh = interaction.options.get("autorefresh")?.value as boolean ?? false;
    const withButtons = interaction.options.get("withbuttons")?.value as boolean ?? true;

    return replyWithInfo(guildConfig, interaction, data, withDetail, autoRefresh, withButtons);
}));