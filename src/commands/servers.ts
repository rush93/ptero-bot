import { ActionRowBuilder, CommandInteraction, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import { needsConfiguration } from '../services/guildConfiguration';
import { Prisma } from "@prisma/client";
import { PterodactylClient } from "../services/pterodactyl";
import { config } from '../config';
import { commands } from './index';

export const data = new SlashCommandBuilder()
  .setName("servers")
  .setDescription("list the servers");

export const execute = needsConfiguration(async (guildConfig:Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction) => {
    const pteroClient = new PterodactylClient(guildConfig.api_url, guildConfig.token);

    const servers = (await pteroClient.getServers()).data;

    const fields = servers.map((server:any) => {   
        return {
            name: server.attributes.name,
            value: `🌐 - ${server.attributes.relationships.allocations.data[0].attributes.ip}:${server.attributes.relationships.allocations.data[0].attributes.port}\n🎮 - ${pteroClient.detectGame(server)}\n `
        }
    });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('info')
                .setPlaceholder('Plus d\'info')
                .addOptions(servers.map((server:any) => {
                    return {
                        label: server.attributes.name,
                        value: server.attributes.identifier
                    }
                }))
        )

    return interaction.reply({ embeds: [{
        title: `✨ Liste des serveurs ✨`,
        description: `*Hosted by [${guildConfig.api_url.replace('https://', '')}](${guildConfig.api_url})*`,
        fields,
        color: 0x3498db,
        thumbnail: {
            url: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png"
        },
    }] , components: [row]});
});