import { ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";
import { PterodactylClient } from "../services/pterodactyl";
import { withPermission } from '../services/permissions';

export const data = new ButtonBuilder()
    .setCustomId("stop")
    .setLabel("Stop")
    .setStyle(ButtonStyle.Danger)
;

export const execute =  withPermission("server_actions", needsConfiguration( async (GuildConfig: Prisma.GuildConfigGetPayload<{}>,interaction: ButtonInteraction) => {
    const serverId = interaction.message.embeds[0]?.footer?.text?.match(/Server ID: ([a-zA-Z0-9]+)/)?.[1] ?? null;
    if (!serverId) {
        return interaction.reply({content: "Serveur non trouvé", ephemeral: true});
    }

    if ('P_SERVER_UUID' in process.env && serverId === process.env.P_SERVER_UUID?.split('-')[0]) {
        await interaction.reply({content: "https://tenor.com/6fp8.gif", ephemeral: true});
    }
    
    const pteroClient = new PterodactylClient(GuildConfig.api_url, GuildConfig.token);
    await pteroClient.power(serverId, "stop");

    return interaction.reply({content: "La commande d'arrêt a été envoyée au serveur", ephemeral: true});
}));