import axios from 'axios';
import { games } from 'gamedig';

export class PterodactylClient {

    private apiKey: string;
    private apiUrl: string;

    constructor(apiUrl: string, apiKey: string) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
    }

    async getServers() {
        const result = await this.requestGet('');
    
        return result.data;
    }

    async getServer(serverId: string) {
        const result = await this.requestGet(`servers/${serverId}`);
        return result.data;
    }

    async getRessources(serverId: string) {
        const result = await this.requestGet(`servers/${serverId}/resources`);
        return result.data;
    }

    async power(serverId: string, action: 'start' | 'stop' | 'restart') {
        const result = await this.requestPost(`servers/${serverId}/power`, { signal: action });
        return result.data;
    }

    getGameName(type: string) {
      if(type in games) {
        return games[type].name;
      }
      const trans = {
        "nodejs": "NodeJS",
        "pteroBot": "PteroBot"
      }
      if (type in trans) {
        return trans[type as keyof typeof trans];
      }
      return "Inconnu";
    }

    getGameType(server: object) {
        if (!server || !('attributes' in server) || typeof server.attributes !== 'object' || !server.attributes || !('docker_image' in server.attributes)) return "unknown";
        const dockerImage = server.attributes.docker_image ?? null;

        if (server.attributes.docker_image == 'ghcr.io/pterodactyl/games:source') {
            return this.detectGameSource(server);
        }
        const games = {
            'ghcr.io/parkervcp/yolks:nodejs_12': 'nodejs',
            'rushr/ptero-bot': 'pteroBot',
        }
        if (dockerImage && typeof dockerImage == 'string' && dockerImage in games) {
            return games[dockerImage as keyof typeof games];
        }
        console.error(`Game type ${server.attributes.docker_image} not found: ${'name' in server.attributes ? server.attributes.name : 'unknown'}`);
        return "unknown";
    }

    private detectGameSource(server: object) {
        if (!server || !('attributes' in server) || typeof server.attributes !== 'object' || !server.attributes || !('invocation' in server.attributes) || typeof server.attributes.invocation !== 'string') return "unknown";

        const matches = server.attributes.invocation.match(/-game\s+([^\s]+)/);
        if (matches && matches.length > 1) {

            return matches[1];
        }

        return "unknown";
    }

    private requestPost(url: string, data: unknown) {
        return axios({
            method: 'POST',
            url: `${this.apiUrl}/api/client/${url}`,
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data
        });
    }

    private requestGet(endpoint: string) {
        return axios({
            method: 'GET',
            url: `${this.apiUrl}/api/client/${endpoint}`,
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        });
    }
}