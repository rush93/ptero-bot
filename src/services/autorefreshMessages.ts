import { client } from "..";
import { getEmbed } from "../commands/info";
import { getAutorefreshMessages, removeAutorefreshMessage } from "./db";
import { getGuildIfConfigured } from "./guildConfiguration";

const intervals: {[key:string]: {number: number, interval: NodeJS.Timeout|null}} = {};

const RefreshDelay = 1000 * 30;

export const runAutoRefreshMessages = async (guildId: string) => {
    if (guildId in intervals && intervals[guildId].interval !== null) {
      return;
    }

    const messages = await getAutorefreshMessages(guildId);
    intervals[guildId] = {
      number: messages.length,
      interval: null
    };
    if (messages.length === 0) {
      return;
    }
    intervals[guildId].interval = setInterval(async () => {
      const messages = await getAutorefreshMessages(guildId);
      if (messages.length === 0) {
        clearInterval(intervals[guildId].interval as NodeJS.Timeout);
        delete intervals[guildId];
        return;
      }
      intervals[guildId].number = messages.length;
      messages.forEach(async message => {
        try {
          const guild = await client.guilds.fetch(guildId);
          if (!guild) {
            await removeAutorefreshMessage(guildId, message.messageId);
            return;
          }
          const channel = await guild.channels.fetch(message.channelId);
          if (!channel || !channel?.isTextBased()) {
            await removeAutorefreshMessage(guildId, message.messageId);
            return;
          }
          
          const discordMessage = await channel?.messages.fetch(message.messageId);
          if (!discordMessage) {
            await removeAutorefreshMessage(guildId, message.messageId);
            return;
          }

          const guildInfo = await getGuildIfConfigured(guildId);
          if (!guildInfo) {
            return;
          }

          const serverId = discordMessage.embeds[0]?.footer?.text?.match(/Server ID: ([a-zA-Z0-9]+)/)?.[1] ?? null;
          if (!serverId) {
            await removeAutorefreshMessage(guildId, message.messageId);
            return;
          }
          await discordMessage.edit(await getEmbed(guildInfo, serverId, message.detailed, message.withButton))
        } catch(e) {
          if (e && typeof e === 'object' && 'code' in e && (e.code === 10003 || e.code === 10008)) {
            await removeAutorefreshMessage(guildId, message.messageId);
          }
          return;
        }

      });
    }, RefreshDelay)
}