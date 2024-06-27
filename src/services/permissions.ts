import { AutocompleteInteraction, ButtonInteraction, CommandInteraction, GuildMember, MessageComponentInteraction, ModalSubmitInteraction, PermissionFlagsBits } from 'discord.js';
import { getPermission } from "./db";

export const permissionsList = {
  "list_servers": "Lister les serveurs",
  "show_server_info": "Information d'un serveur",
  "start_server": "Démarer le serveur",
  "restart_server": "Redémarrer le serveur",
  "stop_server": "Arrêter le serveur",
  "send_console_command": "Envoyer une commande",
  "update_config": "Modifier la config",
};

export const hasPermission = async(user: GuildMember, permissionKey: string) => {

  if (user.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  const permission = await getPermission(user.guild.id, permissionKey);

  if (!permission) {
    return false;
  }

  const roles = JSON.parse(permission.roles) as string[];

  return roles.some(role => user.roles.cache.has(role));
}

type Interaction = CommandInteraction|ButtonInteraction|AutocompleteInteraction|MessageComponentInteraction|ModalSubmitInteraction;

const reply = async (interaction: Interaction, content: string) => {
  if ('reply' in interaction)
      return interaction.reply({content, ephemeral: true});
  return interaction.respond([{name: content, value: content}]);

}

export const withPermission = <T extends Interaction,P extends unknown,R extends Promise<P>>(permissionKey: keyof typeof permissionsList, interactor : (interaction: T) => R) => async (interaction: T) => {
  if (interaction.member == null) return reply(interaction, "This command is only available in a server");

  const member = await interaction.guild?.members.fetch(interaction.member.user.id);

  if (!member) return reply(interaction, "This server is not configured use /configure to configure it");

  if (await hasPermission(member, permissionKey)) {
    return interactor(interaction);
  }
  return reply(interaction, "Vous n'avez pas la permission d'utiliser cette commande");
}