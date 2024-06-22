import axios from "axios";
import { DiscordAPIError, Guild } from "discord.js";
import WebSocketClient from "websocket";
import { deleteConsoleChannel, getConsoleChannels } from "./db";
import { getGuildIfConfigured } from "./guildConfiguration";
import { messageCallback } from "../commands/configure/consoleChannel";

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
            new PterodactylWebsocketClient(guildConfig.api_url, guildConfig.token, consoleChannel.serverId, messageCallback(channel), consoleChannel.channelId);
            channel.send("Le channel a été reconnecté à la console du serveur!\nfaites `> command` pour envoyer une commande au serveur");
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