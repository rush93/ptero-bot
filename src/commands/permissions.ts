import { ActionRowBuilder, CommandInteraction, RoleSelectMenuBuilder, RoleSelectMenuInteraction, SlashCommandSubcommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction } from "discord.js";
import { getPermissions } from "../services/db";
import { permissionsList } from "../services/permissions";


export const data = new SlashCommandSubcommandBuilder()
  .setName("permissions")
  .setDescription("Change the permissions for the bot")
;

export const selectString = async (interraction: StringSelectMenuInteraction) => {
  return interraction.reply("Not implemented yet");
};

export const selectRole = async (interraction: RoleSelectMenuInteraction) => {
  return interraction.reply("Not implemented yet");
}

export const execute = async (interraction: CommandInteraction) => {
  

  let permissions = await getPermissions(interraction.guildId ?? "")

  if (permissions.length === 0) {
    permissions = Object.keys(permissionsList).map(key => ({
      name: key,
      roles: "[]",
      guildId: interraction.guildId ?? "",
      id: 0
    }));
  }

  const row = new ActionRowBuilder<RoleSelectMenuBuilder>()
    .addComponents(
      new RoleSelectMenuBuilder()
        .setCustomId("permissions.roles")
        .setPlaceholder("Choisissez un rôle")
    )

  const qsdqd = permissions.map(permission => {
    return {
      label: permissionsList[permission.name as keyof typeof permissionsList],
      value: permission.name,
    }
  });

  const row2 = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("permissions.permissions")
        .setPlaceholder("Choisissez une permission")
        .addOptions(
          qsdqd
        )
    )
  
  const permissionsText = permissions.map(permission => permissionsList[permission.name as keyof typeof permissionsList],).join("\n");

  const rolesText = permissions.map(permission => (JSON.parse(permission.roles) as String[]).join(', ')).join("\n");

  const fields = [
    {
      name: "Permissions",
      value: permissionsText,
      inline: true
    },
    {
      name: "Roles autorisés",
      value: rolesText,
      inline: true
    }
  ];
  

  return interraction.reply(
    {
      embeds: [
        {
          title: `Permissions`,
          fields,
          description: "Voici la liste actuelle des permissions et des rôles autorisés à les utiliser.",
          color: 0x3498db
        }
      ],
      components: [row, row2]
    }
  );
}