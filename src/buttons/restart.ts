import { ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";
import { PterodactylClient } from "../services/pterodactyl";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";

export const data = new ButtonBuilder()
    .setCustomId("restart")
    .setLabel("Restart")
    .setStyle(ButtonStyle.Primary)
;

export const execute = needsConfiguration( async (GuildConfig: Prisma.GuildConfigGetPayload<{}>,interaction: ButtonInteraction) => {
    const serverId = interaction.message.embeds[0]?.footer?.text?.replace('Server ID: ','') ?? null;
    if (!serverId) {
        return interaction.reply("Aucun serveur trouvé");
    }
    if ('P_SERVER_UUID' in process.env && serverId === process.env.P_SERVER_UUID?.split('-')[0]) {
        await interaction.reply("https://tenor.com/6fp8.gif");
    }

    const pteroClient = new PterodactylClient(GuildConfig.api_url, GuildConfig.token);
    await pteroClient.power(serverId, "restart");

    return interaction.reply("La commande de redémarrage a été envoyée au serveur");
});