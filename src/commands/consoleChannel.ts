import { CommandInteraction, CommandInteractionOptionResolver, PermissionsBitField, SlashCommandBuilder, SlashCommandSubcommandBuilder, TextBasedChannel } from "discord.js";
import { needsConfiguration } from "../services/guildConfiguration";
import { Prisma } from "@prisma/client";
import { PterodactylWebsocketClient } from "../services/pterodactylWebsocket";
import { createConsoleChannel, deleteConsoleChannel, getConsoleChannel, getConsoleChannels } from "../services/db";
import { serverListAutoComplete } from "../services/serverListAutoComplete";
import { withPermission } from '../services/permissions';
import { client } from "..";

export const data = new SlashCommandBuilder()
  .setName("console_channel")
  .setDescription("Create a console channel on the current discord channel")
  .addStringOption(option => option.setName("server").setDescription("The server name").setRequired(true).setAutocomplete(true))
;


export const autocomplete = withPermission("update_config", serverListAutoComplete("server"));

export const messageCallback =  (channel: TextBasedChannel) => async (message:string) => {
    try {
        channel = await channel.fetch(true);
    } catch (e) {
        if (e && typeof e === 'object' && 'code' in e && e.code === 10003 && 'guild' in channel) {
            await deleteConsoleChannel(channel.guild.id, channel.id);
        }
        return;
    }
    const messageMaxLength = 1800;
    const maxMessageNb = 3;
    if (message.length > messageMaxLength * maxMessageNb) {
        message = message.slice(0, messageMaxLength) + "\n... message truncated see logs for full message";
    } else {
        if (message.length > messageMaxLength) {
            while (message.length > messageMaxLength) {
                await channel.send(`*<t:${Math.round(Date.now()/1000)}:R>*`+"``` " + (message.slice(0, messageMaxLength)).replace(/```/g, '`​`​`​') + " ```");
                message = message.slice(messageMaxLength);
            }
        }
    }
    channel.send(`*<t:${Math.round(Date.now()/1000)}:R>*`+"``` " + (message).replace(/```/g, '`​`​`​') + " ```"); // replace all ``` by `​`​` with zero witdh space to avoid discord code block
}
export const connectToChannel = (GuildConfig: Prisma.GuildConfigGetPayload<{}>, serverId: string, channel: TextBasedChannel) => {
    new PterodactylWebsocketClient(GuildConfig.api_url, GuildConfig.token, serverId, messageCallback(channel), channel.id ?? 'nan');
}

export const execute = withPermission("update_config", needsConfiguration(async (GuildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: CommandInteraction) => {
    const options = interaction.options as CommandInteractionOptionResolver;
    const serverId = options.getString("server");
    
    if (!serverId) return interaction.reply("You must provide a server");

    if (!interaction.channel) return interaction.reply("This command is only available in a server");

    const consoleChannel = await getConsoleChannel(interaction.guild?.id ?? 'null', interaction.channel.id);

    if (!!consoleChannel) {
        await deleteConsoleChannel(interaction.guild?.id ?? 'null', interaction.channel.id);
    }

    await connectToChannel(GuildConfig, serverId, interaction.channel)

    await createConsoleChannel(interaction.guild?.id ?? 'null', interaction.channel.id, serverId);

    const botMember = await interaction.guild?.members.me;
    if(!botMember) {
      return interaction.reply({content: "Je n'ai pas pu trouver le bot", ephemeral: true});
    }

    const channel = await interaction.guild?.channels.fetch(interaction.channel?.id ?? '');
    if (!channel || !('permissionOverwrites' in channel)) {
      return interaction.reply({content: "Je n'ai pas pu trouver le salon", ephemeral: true});
    }

    if (!channel.permissionsFor(botMember)?.has(PermissionsBitField.Flags.SendMessages) 
      || !channel.permissionsFor(botMember)?.has(PermissionsBitField.Flags.ViewChannel) 
      || !channel.permissionsFor(botMember)?.has(PermissionsBitField.Flags.ReadMessageHistory)
    ){
      try {
        await channel.permissionOverwrites.create(botMember, {SendMessages: true, ViewChannel: true, ReadMessageHistory: true});
      } catch {
        return interaction.reply({content: "le channel a été connecté, mais Attention cela ne marche pas encore! je n'ai pas les bonnes permissions dans ce channel, il me faut au minimum: pouvoir voir le channel, pouvoir envoyer des messages, pouvoir voir l'historique des messages.", ephemeral: true});
      }
    }

    return interaction.reply("Le channel a été connecté à la console du serveur!\nfaites `> command` pour envoyer une commande au serveur");
}))