# Ptero bot

# What is Ptero bot?
Ptero bot is a discord bot that is designed to help you manage your pterodactyl panel. It is designed to be easy to use and easy to setup.

# How do I setup Ptero bot?

- install docker
- configure the .env file with the correct values exemple: 
  ````
    DISCORD_TOKEN=your_discord_token
    DISCORD_CLIENT_ID=1253298808528572426
    DATABASE_URL="file:./dev.db"
  ```
- run `docker compose up -d`
- create prisma database with `docker-compose exec node npx prisma migrate dev`
- done !