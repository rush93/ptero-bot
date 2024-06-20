/*
  Warnings:

  - Added the required column `api_url` to the `GuildConfig` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GuildConfig" (
    "guildId" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "api_url" TEXT NOT NULL
);
INSERT INTO "new_GuildConfig" ("guildId", "token") SELECT "guildId", "token" FROM "GuildConfig";
DROP TABLE "GuildConfig";
ALTER TABLE "new_GuildConfig" RENAME TO "GuildConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
