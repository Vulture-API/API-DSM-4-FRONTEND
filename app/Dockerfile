# ----------------------------
# Compilação
# ----------------------------
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Destinos dos rewrites do Next: gravados no build, por isso são build args.
ARG USERS_API_URL=http://localhost:3000
ARG PARAMETERS_API_URL=http://localhost:3001
ARG ALERTS_API_URL=http://localhost:3002
ARG STATIONS_API_URL=http://localhost:3005
ENV USERS_API_URL=$USERS_API_URL \
    PARAMETERS_API_URL=$PARAMETERS_API_URL \
    ALERTS_API_URL=$ALERTS_API_URL \
    STATIONS_API_URL=$STATIONS_API_URL

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

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

USER node

EXPOSE 3010

CMD ["npx", "next", "start", "-p", "3010"]
