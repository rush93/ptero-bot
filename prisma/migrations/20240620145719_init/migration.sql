-- CreateTable
CREATE TABLE "ConsoleChannel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channelId" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    CONSTRAINT "ConsoleChannel_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "GuildConfig" ("guildId") ON DELETE RESTRICT ON UPDATE CASCADE
);
