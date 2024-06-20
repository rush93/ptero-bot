import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { needsConfiguration } from '../services/guildConfiguration';
import { Prisma } from "@prisma/client";
import { PterodactylClient } from "../services/pterodactyl";

export const data = new SlashCommandBuilder()
  .setName("servers")
  .setDescription("list the servers");

export const execute = needsConfiguration(async (guildConfig:Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction) => {
    console.log(guildConfig);
    const pteroClient = new PterodactylClient(guildConfig.api_url, guildConfig.token);

    const servers = (await pteroClient.getServers()).data;

    const fields = servers.map((server:any) => {    
        return {
            name: server.attributes.name,
            value: `IP: ${server.attributes.relationships.allocations.data[0].attributes.ip}:${server.attributes.relationships.allocations.data[0].attributes.port}`
        }
    });

    return interaction.reply({ embeds: [{
        title: "Liste des serveurs",
        fields,
        color: 0x5695C7
    }] });
});