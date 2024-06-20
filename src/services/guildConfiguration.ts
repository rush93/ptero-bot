import { AutocompleteInteraction, ButtonInteraction, CommandInteraction, InteractionResponse } from "discord.js";
import { getGuildConfig } from "./db";
import { Prisma } from "@prisma/client";

export async function getGuildIfConfigured(guildId: string) {
    const guildConfig = await getGuildConfig(guildId);

    if (!guildConfig) {
        return null;
    }

    if (!guildConfig.api_url || !guildConfig.token || guildConfig.api_url === '' || guildConfig.token === '') {
        return null;
    }

    return guildConfig;
} 

const reply = async (interaction: CommandInteraction|ButtonInteraction|AutocompleteInteraction, content: string) => {
    if ('reply' in interaction)
        return interaction.reply(content);
    return interaction.respond([{name: content, value: content}]);

}

export const needsConfiguration = <T extends CommandInteraction|ButtonInteraction|AutocompleteInteraction,P extends unknown,R extends Promise<P>>(interactor : (guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: T) => R) => async (interaction: T) => {
    console.log("ici ? ");
    if (!interaction.guildId) return reply(interaction, "This command is only available in a server");

    const guildConfig = await getGuildIfConfigured(interaction.guildId);

    if (!guildConfig) return reply(interaction, "This server is not configured use /configure to configure it");

    return interactor(guildConfig, interaction);
}