import { ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";
import { PterodactylClient } from "../services/pterodactyl";

export const data = new ButtonBuilder()
    .setCustomId("stop")
    .setLabel("Stop")
    .setStyle(ButtonStyle.Danger)
;

export const execute = needsConfiguration( async (GuildConfig: Prisma.GuildConfigGetPayload<{}>,interaction: ButtonInteraction) => {
    const serverId = interaction.message.embeds[0]?.footer?.text?.replace('Server ID: ','') ?? null;
    if (!serverId) {
        return interaction.reply("Serveur non trouvé");
    }

    const pteroClient = new PterodactylClient(GuildConfig.api_url, GuildConfig.token);
    await pteroClient.power(serverId, "stop");

    return interaction.reply("La commande d'arrêt a été envoyée au serveur");
});