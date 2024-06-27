import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ModalSubmitInteraction, TextInputStyle } from "discord.js";
import { PterodactylClient } from "../services/pterodactyl";
import { getGuildConfig, insertGuildConfig, updateGuildConfig } from "../services/db";
import { withPermission } from '../services/permissions';

export const modal = new ModalBuilder()
  .setCustomId("configure")
  .setTitle("Configuration du bot")
  .addComponents([
    new ActionRowBuilder<TextInputBuilder>()
      .addComponents([
        new TextInputBuilder()
          .setCustomId("api_url")
          .setLabel("Url du panel pterodactyl")
          .setValue("https://panel.locktech.fr")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          
      ])
    ,
    new ActionRowBuilder<TextInputBuilder>()
      .addComponents([
        new TextInputBuilder()
          .setCustomId("token")
          .setLabel("Token d'api")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
      ])
  ])

export const submit = withPermission("update_config", async (interaction: ModalSubmitInteraction) => {
  const api_url = interaction.fields.getTextInputValue("api_url");
  const token = interaction.fields.getTextInputValue("token");

  const client = new PterodactylClient(api_url, token);
  try {
    await client.getServers()
  } catch {
    return interaction.reply("Impossible de se connecter au panel avec ces informations");
  }

  if (!interaction.guildId) {
    return interaction.reply("Impossible de récupérer l'identifiant du discord");
  }

  const guildConfig = await getGuildConfig(interaction.guildId);

  if (!guildConfig) {
    await insertGuildConfig(interaction.guildId, { api_url, token });
  } else {
    await updateGuildConfig(interaction.guildId, { api_url, token });
  }
  interaction.reply("Configuration enregistrée");
})