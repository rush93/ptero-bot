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

export async function deleteConsoleChannel(guildId: string, channelId: string) {
    return await prisma.consoleChannel.deleteMany({
        where: {
            guildId,
            channelId
        }
    })
}

export async function createConsoleChannel(guildId: string, channelId: string, serverId: string) {
    return await prisma.consoleChannel.create({
        data: {
            guildId,
            channelId,
            serverId
        }
    })
}

export async function getConsoleChannels(guildId: string) {
    return await prisma.consoleChannel.findMany({
        where: {
            guildId
        }
    })
}

export async function getConsoleChannel(guildId: string, channelId: string) {
    return await prisma.consoleChannel.findFirst({
        where: {
            guildId,
            channelId
        }
    })
}

export async function getPermissions(guildId: string) {
    return await prisma.permission.findMany({
        where: {
            guildId
        }
    })
}

export async function getPermission(guildId: string, name: string) {
  return await prisma.permission.findFirst({
    where: {
      guildId,
      name
    }
  })
}

export async function insertPermission(guildId: string, name: string, roles: string) {
  return await prisma.permission.create({
    data: {
      guildId,
      name,
      roles
    }
  })
}

export async function updatePermission(guildId: string, name: string, roles: string) {
  return await prisma.permission.updateMany({
    where: {
      guildId,
      name
    },
    data: {
      roles
    }
  })
}