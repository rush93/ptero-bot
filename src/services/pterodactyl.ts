import axios from 'axios';

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

    detectGame(server: object) {
        if (!server || !('attributes' in server) || typeof server.attributes !== 'object' || !server.attributes || !('docker_image' in server.attributes)) return "Inconnu";
        const dockerImage = server.attributes.docker_image ?? null;

        if (server.attributes.docker_image == 'ghcr.io/pterodactyl/games:source') {
            return this.detectGameSource(server);
        }
        const games = {
            'ghcr.io/parkervcp/yolks:nodejs_12': 'NodeJS',
        }
        if (dockerImage && typeof dockerImage == 'string' && dockerImage in games) {
            return games[dockerImage as keyof typeof games];
        }
        return "Inconnu";
    }

    private detectGameSource(server: object) {
        if (!server || !('attributes' in server) || typeof server.attributes !== 'object' || !server.attributes || !('invocation' in server.attributes) || typeof server.attributes.invocation !== 'string') return "Inconnu";

        const matches = server.attributes.invocation.match(/-game\s+([^\s]+)/);
        if (matches && matches.length > 1) {
            
            const trans = {
                garrysmod: "Garry's Mod",
            }

            return matches[1] in trans ? trans[matches[1] as keyof typeof trans] : matches[1];
        }

        return "Inconnu";
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