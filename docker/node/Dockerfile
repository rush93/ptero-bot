FROM node:22-alpine AS builder

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json .
COPY .env .
COPY prisma ./prisma
RUN npm install --production
CMD ["npm", "start"]