-- CreateTable
CREATE TABLE `GuildConfig` (
    `guildId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `api_url` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`guildId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsoleChannel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `channelId` VARCHAR(191) NOT NULL,
    `serverId` VARCHAR(191) NOT NULL,
    `guildId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConsoleChannel` ADD CONSTRAINT `ConsoleChannel_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `GuildConfig`(`guildId`) ON DELETE RESTRICT ON UPDATE CASCADE;
