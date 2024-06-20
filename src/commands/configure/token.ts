import { CommandInteraction, CommandInteractionOptionResolver, SlashCommandSubcommandBuilder } from "discord.js";
import { getGuildConfig, insertGuildConfig, updateGuildConfig } from "../../services/db";

export const data = new SlashCommandSubcommandBuilder()
  .setName("token")
  .setDescription("Configure api token for your servers")
  .addStringOption(option => option.setName("token").setDescription("The api token").setRequired(true))
;

export async function execute(interaction: CommandInteraction) {

  if (!interaction.guildId) return interaction.reply("This command is only available in a server");
  
  const options = interaction.options as CommandInteractionOptionResolver;
  const token = options.getString("token");

  if (!token) return interaction.reply("You must provide a token");

  const guildConfig = await getGuildConfig(interaction.guildId);

  if (!guildConfig) {
    await insertGuildConfig(interaction.guildId, { token, api_url: '' });
    return interaction.reply("Guild configuration created!");
  }

  await updateGuildConfig(interaction.guildId, { token });
  return interaction.reply("Guild configuration updated!");
}