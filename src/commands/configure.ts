import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { modals } from "../modals";

export const data = new SlashCommandBuilder()
  .setName("configure")
  .setDescription("Configure the bot for your discord server")
;

export async function execute(interaction: CommandInteraction) {
  return interaction.showModal(modals.configure.modal);
}