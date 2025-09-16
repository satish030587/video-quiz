#!/bin/bash
# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate deploy

# Build the Next.js application
npm run build