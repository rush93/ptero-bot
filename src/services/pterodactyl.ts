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