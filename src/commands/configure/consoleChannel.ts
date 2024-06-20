import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandSubcommandBuilder } from "discord.js";
import { getGuildConfig, insertGuildConfig, updateGuildConfig } from "../../services/db";
import { serverListAutoComplete } from "../../services/serverListAutoComplete";
import { needsConfiguration } from "../../services/guildConfiguration";
import { Prisma } from "@prisma/client";

export const data = new SlashCommandSubcommandBuilder()
  .setName("console_channel")
  .setDescription("Create a console channel on the current discord channel")
  .addStringOption(option => option.setName("server").setDescription("The server name").setRequired(true).setAutocomplete(true))
;

export const execute = needsConfiguration((GuildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction) => {
    const options = interaction.options as CommandInteractionOptionResolver;
    const server = options.getString("server");
    
    if (!server) return interaction.reply("You must provide a server");
    
    return interaction.reply("Not implemented yet");
})