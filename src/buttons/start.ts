import { ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";
import { PterodactylClient } from "../services/pterodactyl";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";

export const data = new ButtonBuilder()
    .setCustomId("start")
    .setLabel("Start")
    .setStyle(ButtonStyle.Success)
;

export const execute = needsConfiguration( async (GuildConfig: Prisma.GuildConfigGetPayload<{}>,interaction: ButtonInteraction) => {
    const serverId = interaction.message.embeds[0]?.footer?.text?.replace('Server ID: ','') ?? null;
    if (!serverId) {
        return interaction.reply("Aucun serveur trouvé");
    }
    const pteroClient = new PterodactylClient(GuildConfig.api_url, GuildConfig.token);
    await pteroClient.power(serverId, "start");

    return interaction.reply("La commande de démarrage a été envoyée au serveur");
});