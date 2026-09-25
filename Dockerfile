# ----------------------------
# Compilação
# ----------------------------
FROM node:24-alpine AS builder

WORKDIR /workspace

COPY app/package*.json ./app/

WORKDIR /workspace/app
RUN npm ci

COPY app/ ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ----------------------------
# Produção
# ----------------------------
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3010

COPY app/package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /workspace/app/.next ./.next
COPY --from=builder /workspace/app/public ./public
COPY --from=builder /workspace/app/next.config.ts ./next.config.ts

USER node

EXPOSE 3010

CMD ["npx", "next", "start", "-p", "3010"]
