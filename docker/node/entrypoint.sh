#!/bin/sh

npx prisma migrate deploy
npm install
npm run dev