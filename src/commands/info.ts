import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, CommandInteraction, SlashCommandBuilder } from "discord.js";
import { buttons } from "../buttons";
import { getGuildIfConfigured, needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";
import { PterodactylClient } from "../services/pterodactyl";
import { serverListAutoComplete } from "../services/serverListAutoComplete";

export const data = new SlashCommandBuilder()
  .setName("info")
  .setDescription("display the information of a server")
  .addStringOption(option => option.setName("server").setDescription("The server name").setRequired(true).setAutocomplete(true)
);

export const autocomplete = serverListAutoComplete("server");
export const execute = needsConfiguration(async(guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction) => {

    const data = interaction.options.get("server")?.value as string;

    const pteroClient = new PterodactylClient(guildConfig.api_url, guildConfig.token);

    const serverData = (await pteroClient.getServer(data)).attributes ?? null;

    if (!serverData) {
        return interaction.reply("Server not found");
    }
    const ressources = (await pteroClient.getRessources(serverData.identifier)).attributes;

    const fields = [
        {
            name: "ID",
            value: serverData.identifier
        },
        {
            name: "Name",
            value: serverData.name
        },
        {
            name: "Description",
            value: serverData.description
        },
        {
            name: "Status",
            value: ressources.current_state ?? "Unknown"
        },
        {
            name: "CPU",
            value: `${Math.round(ressources.resources.cpu_absolute * 100)/100} %`
        },
        {
            name: "Memory",
            value: `${Math.round(ressources.resources.memory_bytes / 1024 / 1024 / 1024 * 100)/100} GB`
        },
        {
            name: "Disk",
            value: `${Math.round(ressources.resources.disk_bytes / 1024 / 1024 / 1024 * 100)/100} GB`
        }
    ];

    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents([buttons.start.data, buttons.restart.data, buttons.stop.data]);

    const state = ressources.current_state == "running" ? "running" : ressources.current_state == "offline" ? "offline" : "starting"; 

    const colorState = {
        running: 0x6aa84f,
        offline: 0xcc0000,
        starting: 0xe69138,
    }[state] ?? 0x000000;

    return interaction.reply({ 
        embeds: [{
            title: "Server informations",
            fields,
            color: colorState
        }],
        components: [row]
    });
});