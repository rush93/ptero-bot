import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getGuildConfig(guildId: string) {
    return await prisma.guildConfig.findUnique({
        where: {
            guildId
        }
    })
}

export async function insertGuildConfig(guildId: string, config: Omit<Prisma.GuildConfigCreateInput, 'guildId'>) {
    return await prisma.guildConfig.create({
        data: {
            guildId,
            ...config
        }
    })
}

export async function updateGuildConfig(guildId: string, config: Partial<Omit<Prisma.GuildConfigCreateInput, 'guildId'>>) {
    return await prisma.guildConfig.update({
        where: {
            guildId
        },
        data: config
    })
}