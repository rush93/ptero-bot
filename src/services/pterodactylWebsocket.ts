import axios from "axios";
import { DiscordAPIError, Guild } from "discord.js";
import WebSocketClient from "websocket";
import { deleteConsoleChannel, getConsoleChannels } from "./db";
import { getGuildIfConfigured } from "./guildConfiguration";
import { messageCallback } from "../commands/consoleChannel";
import { PterodactylClient } from "./pterodactyl";

export const websockets: { [key:string]: PterodactylWebsocketClient } = {};

export const initWebsockets = async (guild: Guild) => {
    const consoleChannels = await getConsoleChannels(guild.id);
    const guildConfig = await getGuildIfConfigured(guild.id);

    if (!guildConfig) {
        return;
    }
    
    for (const consoleChannel of consoleChannels) {
        try {
            const channel = await guild.channels.fetch(consoleChannel.channelId);
            if (!channel || !channel.isTextBased()) {
                continue;
            }
            try {
              const client = new PterodactylClient(guildConfig.api_url, guildConfig.token);
              const server = await client.getServer(consoleChannel.serverId);
              if (!server) {
                await deleteConsoleChannel(guild.id, consoleChannel.channelId);
                await channel.send(`Le serveur ${consoleChannel.serverId} n'existe pas, veuillez vérifier les informations et recréer la connection a la console`);
                return;
              }
            } catch {
              await deleteConsoleChannel(guild.id, consoleChannel.channelId);
              await channel.send(`Le serveur ${consoleChannel.serverId} n'existe pas, veuillez vérifier les informations et recréer la connection a la console`);
              return;
            }
            await new PterodactylWebsocketClient(guildConfig.api_url, guildConfig.token, consoleChannel.serverId, messageCallback(channel), consoleChannel.channelId);
        } catch (e) {
            if (e && typeof e == 'object' && 'code' in e && e.code === 10003) {
                await deleteConsoleChannel(guild.id, consoleChannel.channelId);
            }
        }
    }
};

export class PterodactylWebsocketClient {

    private ws: WebSocketClient.connection|null = null;

    private messageToSend: string[] = [];

    constructor(api_url:string, api_token:string, server_id:string, consoleCallBack: (message:string) => void, channelId: string) {
        if (channelId in websockets) {
            websockets[channelId].ws?.close();
        }
        
        this.initSocket(api_url, api_token, server_id, consoleCallBack)
        websockets[channelId] = this;
    }

    public sendCommand(command: string) {
        this.ws?.send(JSON.stringify({
            "event": "send command",
            "args": [ command ]
        }));
    }

    private async initSocket(api_url:string, api_token:string, server_id:string, consoleCallBack: (message:string) => void) {
      try {
        try {
          const client = new PterodactylClient(api_url, api_token);
          const server = await client.getServer(server_id);
          if (!server) {
            consoleCallBack(`Le serveur ${server_id} n'existe pas, veuillez vérifier le serveur id dans la configuration du serveur discord`);
            return;
          }
        } catch {
          consoleCallBack(`Le serveur ${server_id} n'existe pas, veuillez vérifier le serveur id dans la configuration du serveur discord`);
          return;
        }
        const { data } = (await axios.get(`${api_url}/api/client/servers/${server_id}/websocket`, {
            headers: {
                Authorization: `Bearer ${api_token}`,
                "Accept": "application/vnd.pterodactyl.v1+json",
                "Content-Type": "application/json"
            }
        })).data;

        const ws = new WebSocketClient.client();
        ws.connect(data.socket, undefined, api_url, undefined);

        ws.on("connect", (connection: WebSocketClient.connection) => {
            this.ws = connection;
            this.ws.send(JSON.stringify({
                "event": "auth",
                "args": [ data.token ]
            }));
            setInterval(() => {
                if (this.messageToSend.length > 0) {
                    consoleCallBack(this.messageToSend.join('\n'));
                    this.messageToSend = [];
                }
            }, 1000 * 3);
            this.ws.on("message", (message:WebSocketClient.Message) => {
                if (message.type !== 'utf8') {
                    return;
                }
                const data = JSON.parse(message.utf8Data);
                if(data.event === "token expiring") {
                    this.renewToken(api_url, api_token, server_id)
                    return;
                }
                if(data.event === "console output") {
                    this.messageToSend.push(data.args.join('\n'));
                    return;
                }
            });

        });
      } catch (e) {
          console.log('websocket error:'  + (typeof e === 'object' && e && 'message' in e ? e.message : 'Unknown error'));
      }
    }

    private async renewToken(api_url:string, api_token:string, server_id:string) {
        const { data } = (await axios.get(`${api_url}/api/client/servers/${server_id}/websocket`, {
            headers: {
                Authorization: `Bearer ${api_token}`,
                "Accept": "application/vnd.pterodactyl.v1+json",
                "Content-Type": "application/json"
            }
        })).data;
        this.ws?.send(JSON.stringify({
            "event": "auth",
            "args": [ data.token ]
        }));
    }
}