import { Prisma } from "@prisma/client";
import { needsConfiguration } from "./guildConfiguration";
import { AutocompleteInteraction } from "discord.js";
import { PterodactylClient } from "./pterodactyl";

export const serverListAutoComplete = (fieldName:string) => needsConfiguration(async (guildConfig: Prisma.GuildConfigGetPayload<{}>, interaction: AutocompleteInteraction) => {
    const data = interaction.options.get(fieldName)?.value;
    
    const pteroClient = new PterodactylClient(guildConfig.api_url, guildConfig.token);
    const servers = (await pteroClient.getServers()).data.filter((server:any) => {
        return server.attributes.name.search(new RegExp(`${data}`, 'i')) !== -1
    });

    return interaction.respond(servers.map((server:any) => {
        return {
            name: server.attributes.name,
            value: server.attributes.identifier
        }
    }))
});