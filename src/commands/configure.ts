import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { modals } from "../modals";
import { withPermission } from '../services/permissions';

export const data = new SlashCommandBuilder()
  .setName("configure")
  .setDescription("Configure the bot for your discord server")
;

export const execute = withPermission("update_config", async (interaction: CommandInteraction) => {
  return interaction.showModal(modals.configure.modal);
})