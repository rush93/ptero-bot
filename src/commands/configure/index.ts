import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import * as token from './token';
import * as apiUrl from './apiUrl';
import * as consoleChannel from './consoleChannel';
import { serverListAutoComplete } from "../../services/serverListAutoComplete";

const subCommands = {
  [token.data.name]: token,
  [apiUrl.data.name]: apiUrl,
  [consoleChannel.data.name]: consoleChannel,
}

export const data = new SlashCommandBuilder()
  .setName("configure")
  .setDescription("Configure the bot for your discord server")
  .addSubcommand(token.data)
  .addSubcommand(apiUrl.data)
  .addSubcommand(consoleChannel.data)
;

export const autocomplete = serverListAutoComplete("server");

export async function execute(interaction: CommandInteraction) {
  const options = interaction.options as CommandInteractionOptionResolver;
  const subCommand = options.getSubcommand();
  if (subCommands[subCommand]) {
    return subCommands[subCommand].execute(interaction);
  }
  return interaction.reply("unknown subcommand");
}