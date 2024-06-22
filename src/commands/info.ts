import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction, inlineCode } from "discord.js";
import { buttons } from "../buttons";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";
import { PterodactylClient } from "../services/pterodactyl";
import { serverListAutoComplete } from "../services/serverListAutoComplete";

export const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("display the information of a server")
  .addStringOption(option => option.setName("server").setDescription("The server name").setRequired(true).setAutocomplete(true))
  .addBooleanOption(option => option.setName("detailed").setDescription("Avec les détails de performance du serveur ?").setRequired(false))
;

export const autocomplete = serverListAutoComplete("server");

export const select = needsConfiguration(async(guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: StringSelectMenuInteraction) => {
    const serverId = interaction.values[0];
    return replyWithInfo(guildConfig, interaction, serverId);
});

const replyWithInfo = async (guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction|StringSelectMenuInteraction, serverId: string, withDetail: boolean = false) => {
    
    const pteroClient = new PterodactylClient(guildConfig.api_url, guildConfig.token);

    const serverData = (await pteroClient.getServer(serverId)).attributes ?? null;

    if (!serverData) {
        return interaction.reply("Server not found");
    }
    const ressources = (await pteroClient.getRessources(serverData.identifier)).attributes;

    const state = ressources.current_state == "running" ? "running" : ressources.current_state == "offline" ? "offline" : "starting";
    const cpuPercent = Math.round(100 * ressources.resources.cpu_absolute / serverData.limits.cpu);
    const memoryPercent = Math.round(100 * ressources.resources.memory_bytes / 1024 / 1024 / serverData.limits.memory);
    const diskPercent = Math.round(100 * ressources.resources.disk_bytes / 1024 / 1024 / serverData.limits.disk);

    const createBar = (percent: number) => {
        const minPercent = Math.min(percent, 100);
        const emojiCount = 6;
        const color = percent < 10 ? '🟩' : percent < 50 ? '🟦' : percent < 90 ? '🟨': percent < 100 ? '🟧': '🟥';
        return color.repeat(Math.round(emojiCount * minPercent / 100)) + '⬜'.repeat(emojiCount - Math.round(emojiCount * minPercent / 100)) + '\n' + '〰️'.repeat(Math.min(Math.round(emojiCount * minPercent / 100), emojiCount - 2)) + `**${percent}%**`;
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
        .addComponents([buttons.start.data, buttons.restart.data, buttons.stop.data, panelLinkButton]);

    if (serverData.docker_image == 'ghcr.io/pterodactyl/games:source') {
        row.addComponents([
            new ButtonBuilder()
                .setLabel("Rejoindre")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://rushr.dev/steam-redirect/?ip=${serverData.relationships.allocations.data[0].attributes.ip}:${serverData.relationships.allocations.data[0].attributes.port}`)
        ])
    }

    return interaction.reply({ 
        embeds: [{
            title: `✨${serverData.name}✨`,
            thumbnail: {
                url: `https://cdn-icons-png.flaticon.com/512/2917/2917242.png`
            },
            fields,
            color: 0x3498db,
            footer: {
                text: `Server ID: ${serverData.identifier}`,
                icon_url: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png"
            }
        }],
        components: [row]
    });
}
export const execute = needsConfiguration(async(guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction) => {

    const data = interaction.options.get("server")?.value as string;
    const withDetail = interaction.options.get("detailed")?.value as boolean ?? false;
    return replyWithInfo(guildConfig, interaction, data, withDetail);
});