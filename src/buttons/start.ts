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
    const serverId = interaction.message.embeds[0]?.fields[0]?.value ?? null;
    if (!serverId) {
        return interaction.reply("Server not found");
    }
    const pteroClient = new PterodactylClient(GuildConfig.api_url, GuildConfig.token);
    await pteroClient.power(serverId, "start");

    return interaction.reply("Server started");
});