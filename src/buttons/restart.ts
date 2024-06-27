import { ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";
import { PterodactylClient } from "../services/pterodactyl";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";
import { withPermission } from "../services/permissions";

export const data = new ButtonBuilder()
    .setCustomId("restart")
    .setLabel("Restart")
    .setStyle(ButtonStyle.Primary)
;

export const execute = withPermission("restart_server", needsConfiguration( async (GuildConfig: Prisma.GuildConfigGetPayload<{}>,interaction: ButtonInteraction) => {
    const serverId = interaction.message.embeds[0]?.footer?.text?.match(/Server ID: ([a-zA-Z0-9]+)/)?.[1] ?? null;
    if (!serverId) {
        return interaction.reply({content: "Aucun serveur trouvé", ephemeral: true});
    }
    if ('P_SERVER_UUID' in process.env && serverId === process.env.P_SERVER_UUID?.split('-')[0]) {
        await interaction.reply({content: "https://tenor.com/6fp8.gif", ephemeral: true});
    }

    const pteroClient = new PterodactylClient(GuildConfig.api_url, GuildConfig.token);
    await pteroClient.power(serverId, "restart");

    return interaction.reply({content: "La commande de redémarrage a été envoyée au serveur", ephemeral: true});
}));