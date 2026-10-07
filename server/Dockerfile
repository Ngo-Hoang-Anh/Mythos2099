# Build context = REPO ROOT (server imports ../src/engine + ../src/net).
#
# Deploy from repo root:
#   fly deploy . --config server/fly.toml --dockerfile server/Dockerfile --yes
# (or: npm run deploy:api)

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY server ./server

RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=8787
ENV DATA_DIR=/data

EXPOSE 8787

CMD ["npx", "tsx", "server/index.ts"]
