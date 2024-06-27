-- CreateTable
CREATE TABLE `AutorefreshMessages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `messageId` VARCHAR(191) NOT NULL,
    `detailed` BOOLEAN NOT NULL,
    `guildId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AutorefreshMessages` ADD CONSTRAINT `AutorefreshMessages_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `GuildConfig`(`guildId`) ON DELETE RESTRICT ON UPDATE CASCADE;
