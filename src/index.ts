import { Client } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
import { buttons } from "./buttons";
import { initWebsockets, websockets } from "./services/pterodactylWebsocket";
import { modals } from "./modals";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"],
});

client.once("ready", async (bot) => {
  console.log("Discord bot is ready! 🤖");
  const guild = await bot.guilds.fetch()
  guild.each(async (guild) => {
    await deployCommands({ guildId: guild.id });

    await initWebsockets(await guild.fetch());
  })
});

client.on("guildCreate", async (guild) => {
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isCommand()) {
      const { commandName } = interaction;
      if (commands[commandName as keyof typeof commands]) {
        await commands[commandName as keyof typeof commands].execute(interaction);
      }
      return;
    }
  
    if (interaction.isButton()) {
      const { customId } = interaction;
      if (buttons[customId as keyof typeof buttons]) {
        await buttons[customId as keyof typeof buttons].execute(interaction);
      }
      return;
    }
  
    if (interaction.isAutocomplete()) {
      const { commandName } = interaction;
      const command = commands[commandName as keyof typeof commands];
      if (command && 'autocomplete' in command && typeof command.autocomplete == 'function'){
        await command.autocomplete(interaction);
      }
    }

    if (interaction.isStringSelectMenu()) {
      const { customId } = interaction;
      const command = commands[customId as keyof typeof commands];
      if (command && 'selectString' in command && typeof command.selectString == 'function'){
        await command.selectString(interaction);
      }
      const customIdSplit = customId.split('.')[0];
      const commandSplited = commands[customIdSplit as keyof typeof commands];
      console.log(customIdSplit, commandSplited);
      if (commandSplited && 'selectString' in commandSplited && typeof commandSplited.selectString == 'function'){
        await commandSplited.selectString(interaction);
      }
    }

    if (interaction.isRoleSelectMenu()) {
      const { customId } = interaction;
      const command = commands[customId as keyof typeof commands];
      if (command && 'selectRole' in command && typeof command.selectRole == 'function'){
        await command.selectRole(interaction);
      }
      const customIdSplit = customId.split('.')[0];
      const commandSplited = commands[customIdSplit as keyof typeof commands];
      console.log(customIdSplit, commandSplited);
      if (commandSplited && 'selectRole' in commandSplited && typeof commandSplited.selectRole == 'function'){
        await commandSplited.selectRole(interaction);
      }
    }

    if (interaction.isModalSubmit()) {
      const { customId } = interaction;
      const modal = modals[customId as keyof typeof modals];
      if (modal && 'submit' in modal && typeof modal.submit == 'function'){
        await modal.submit(interaction);
      }
    }
  } catch (error) {
    console.error(error);
    if ('reply' in interaction) {
      await interaction.reply({
        content: "There was an error while executing this command, did you configure the api correctly ?",
        ephemeral: true,
      });
      return;
    }
    if ('respond' in interaction) {
      await interaction.respond([{name: "There was an error while executing this command, did you configure the api correctly ?", value: "did you configure the api correctly ?"}]);
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id in websockets && message.content.startsWith("> ")) {
    websockets[message.channel.id].sendCommand(message.content.slice(2));
  }
});

client.login(config.DISCORD_TOKEN);