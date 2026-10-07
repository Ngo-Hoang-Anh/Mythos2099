# 02 — Chạy local & deploy

## Local

```bash
npm install
npm test
npm run dev
```

- `npm test` = Vitest (một lần).
- `npm run test:watch` nếu muốn watch.
- `npm run dev` = game server WS (`:8787/ws`) + Vite (thường `:5173`).
- Auth: **Play as guest** (token FE `localStorage`) hoặc register/login. Guest chỉ nằm memory BE.
- Modes: vs AI, hotseat, host/join PvP (mã phòng 4 ký tự).

## Deploy Fly (2 app)

| App | URL | Config |
| --- | --- | --- |
| API | https://mythos2099-api.fly.dev | `server/fly.toml`, `server/Dockerfile` |
| Web | https://mythos2099-web.fly.dev | `web/fly.toml`, `web/Dockerfile` |

```bash
npm run deploy:api   # từ repo root, đã fly auth login
npm run deploy:web
```

Web build bake `VITE_WS_URL=wss://mythos2099-api.fly.dev/ws`. API chỉ chấp nhận Origin trong `ALLOWED_ORIGINS`.
