import { ActionRowBuilder, CommandInteraction, RoleSelectMenuBuilder, RoleSelectMenuInteraction, SlashCommandSubcommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { getPermission, getPermissions, insertPermission, updatePermission } from "../services/db";
import { permissionsList, withPermission } from '../services/permissions';
import { needsConfiguration } from "../services/guildConfiguration";


export const data = new SlashCommandSubcommandBuilder()
  .setName("permissions")
  .setDescription("Change the permissions for the bot")
;

const messagesRolesSelected: {[key:string]:string} = {}

const getEmbed = async (guildId: string, message: string|null = null, selectedRole: string|null = null) => {

  const permissionsDb = await getPermissions(guildId);

  const permissionMap = permissionsDb.reduce((acc, permission) => {
    acc[permission.name] = permission;
    return acc;
  }, {} as {[key:string]: typeof permissionsDb[0]});

  const permissions = Object.keys(permissionsList).map(key => (key in permissionMap ? permissionMap[key] : {
    name: key,
    roles: "[]",
    guildId: guildId,
    id: 0
  }));

  const row = new ActionRowBuilder<RoleSelectMenuBuilder>()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("permissions.roles")
        .setPlaceholder("Choisissez un rôle")
        .setDefaultRoles(selectedRole ? [selectedRole] : [])
    )

  const row2 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("permissions.permissions")
        .setPlaceholder("Choisissez une permission")
        .addOptions(
          permissions.map(permission => {
            return {
              label: permissionsList[permission.name as keyof typeof permissionsList],
              value: permission.name,
            }
          })
        )
    )

  const fields = permissions.map(permission => {
    const roles = JSON.parse(permission.roles) as string[];
    return {
      name: permissionsList[permission.name as keyof typeof permissionsList],
      value: roles.length === 0 ? "*🚫*" : roles.map(role => `<@&${role}>`).join(', '),
      inline: false
    }
  });
  
  return {
    embeds: [
      {
        title: `✨ Permissions ✨`,
        fields,
        description: "Voici la liste actuelle des permissions et des rôles autorisés à les utiliser." + (message ? `\n${message}\n` : ""),
        color: 0x3498db,
        thumbnail: {
            url: "https://cdn-icons-png.flaticon.com/512/2917/2917242.png"
        },
      }
    ],
    components: [row, row2]
  }
}

export const selectString = withPermission("update_config", async (interraction: StringSelectMenuInteraction) => {
  const selectedRole = messagesRolesSelected[interraction.message.id];
  if (!selectedRole) {
    return interraction.update(await getEmbed(interraction.guildId ?? '', "⚠️ **Vous devez d'abord sélectionner un rôle**"));
  }

  const selectedPermission = interraction.values[0];

  const permission = await getPermission(interraction.guildId ?? '', selectedPermission);
  if (!permission) {
    await insertPermission(interraction.guildId ?? '', selectedPermission, JSON.stringify([selectedRole]));
  } else {
    const roles = JSON.parse(permission.roles) as string[];
    if (roles.includes(selectedRole)) {
      roles.splice(roles.indexOf(selectedRole), 1);
    } else {
      roles.push(selectedRole);
    }
    await updatePermission(interraction.guildId ?? '', selectedPermission, JSON.stringify(roles));
  }

  return interraction.update(await getEmbed(interraction.guildId ?? '', null, selectedRole));
});

export const selectRole = withPermission("update_config", async (interraction: RoleSelectMenuInteraction) => {
  messagesRolesSelected[interraction.message.id] = interraction.values[0];
  return interraction.update(await getEmbed(interraction.guildId ?? '', null, interraction.values[0]));
})

export const execute = withPermission("update_config", needsConfiguration(async (guildConfig, interraction: CommandInteraction) => {
  return interraction.reply(await getEmbed(interraction.guildId ?? '', null, null));
}))