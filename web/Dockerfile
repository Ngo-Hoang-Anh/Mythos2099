# Build from repo root:
#   fly deploy . --config web/fly.toml --dockerfile web/Dockerfile --yes
# (or: npm run deploy:web)

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src

# Vite inlines VITE_* at build time — must be ARG/ENV here, not only fly [env]
ARG VITE_WS_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Vite-only for the image; full `tsc` suite runs in CI / locally via npm test.
RUN npx vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
