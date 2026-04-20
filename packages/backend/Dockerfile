FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
RUN npm ci --workspace=@tallia/backend --workspace=@tallia/shared
COPY packages/shared packages/shared
COPY packages/backend packages/backend
COPY tsconfig.base.json ./
RUN npm run build -w @tallia/shared
RUN cd packages/backend && npx prisma generate
RUN npm run build -w @tallia/backend

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/backend/package.json packages/backend/
RUN npm ci --workspace=@tallia/backend --workspace=@tallia/shared --omit=dev
COPY --from=builder /app/packages/backend/dist packages/backend/dist
COPY --from=builder /app/packages/backend/prisma packages/backend/prisma
COPY --from=builder /app/packages/backend/node_modules/.prisma packages/backend/node_modules/.prisma
COPY --from=builder /app/node_modules/.prisma node_modules/.prisma

EXPOSE 3000
CMD ["node", "packages/backend/dist/packages/backend/src/main.js"]
