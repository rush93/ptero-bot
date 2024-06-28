import { ButtonBuilder, ButtonInteraction, ButtonStyle } from "discord.js";
import { PterodactylClient } from "../services/pterodactyl";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";
import { withPermission } from "../services/permissions";

export const data = new ButtonBuilder()
    .setCustomId("start")
    .setLabel("Start")
    .setStyle(ButtonStyle.Success)
;

export const execute = withPermission("server_actions", needsConfiguration( async (GuildConfig: Prisma.GuildConfigGetPayload<{}>,interaction: ButtonInteraction) => {
    const serverId = interaction.message.embeds[0]?.footer?.text?.match(/Server ID: ([a-zA-Z0-9]+)/)?.[1] ?? null;
    if (!serverId) {
        return interaction.reply({content: "Aucun serveur trouvé", ephemeral: true});
    }
    const pteroClient = new PterodactylClient(GuildConfig.api_url, GuildConfig.token);
    await pteroClient.power(serverId, "start");

    return interaction.reply({content: "La commande de démarrage a été envoyée au serveur", ephemeral: true});
}));