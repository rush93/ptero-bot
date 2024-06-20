import { Client } from "discord.js";
import { deployCommands, deployGlobalCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config } from "./config";
import { buttons } from "./buttons";
import { autocomplete } from './commands/info';

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

client.once("ready", () => {
  console.log("Discord bot is ready! 🤖");
  
  deployCommands({
    guildId: "399946899697827840",
  });
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

client.login(config.DISCORD_TOKEN);