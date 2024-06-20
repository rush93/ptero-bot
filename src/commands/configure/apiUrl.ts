import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandSubcommandBuilder } from "discord.js";
import { getGuildConfig, insertGuildConfig, updateGuildConfig } from "../../services/db";

export const data = new SlashCommandSubcommandBuilder()
  .setName("api_url")
  .setDescription("Configure api url for your servers")
  .addStringOption(option => option.setName("api_url").setDescription("The api url").setRequired(true))
;

export async function execute(interaction: CommandInteraction) {

  if (!interaction.guildId) return interaction.reply("This command is only available in a server");
  
  const options = interaction.options as CommandInteractionOptionResolver;
  const apiUrl = options.getString("api_url");

  if (!apiUrl) return interaction.reply("You must provide a api_url");

  const guildConfig = await getGuildConfig(interaction.guildId);

  if (!guildConfig) {
    await insertGuildConfig(interaction.guildId, { token:'', api_url: apiUrl });
    return interaction.reply("Guild configuration created!");
  }

  await updateGuildConfig(interaction.guildId, { api_url: apiUrl });
  return interaction.reply("Guild configuration updated!");
}