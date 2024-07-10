import { Prisma } from "@prisma/client";
import { needsConfiguration } from "./guildConfiguration";
import { AutocompleteInteraction } from "discord.js";
import { PterodactylClient } from "./pterodactyl";

export const serverListAutoComplete = (fieldName:string) => needsConfiguration(async (guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: AutocompleteInteraction) => {
    const data = interaction.options.get(fieldName)?.value as string;
    
    const pteroClient = new PterodactylClient(guildConfig.api_url, guildConfig.token);
    const servers = (await pteroClient.getServers()).data.filter((server:any) => {
        return server.attributes.name.toLowerCase().includes(data.toLowerCase());
    });

    if (servers.length == 0) {
      return interaction.respond([{ name: 'Aucun serveur trouvé', value: 'none' }]);
    } 
    return interaction.respond(servers.map((server:any) => {
        return {
            name: server.attributes.name,
            value: server.attributes.identifier
        }
    }))
});