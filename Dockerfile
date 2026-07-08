FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY backend/package*.json ./
RUN npm prune --omit=dev
RUN mkdir -p /data /app/uploads
EXPOSE 5000
# v2 - hostinnegar sync
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
