# Mythos2099

Sci-Fi War Vehicle TCG. Luật trận chạy trên **server**; browser chỉ gửi action và hiển thị.

## Chạy local

```bash
npm install
npm test
npm run dev
```

`npm run dev` mở cả game server (`ws://127.0.0.1:8787/ws`) và Vite (thường `http://localhost:5173`). **Play as guest** hoặc đăng ký, chọn 8 unit, rồi vs AI / hotseat / PvP.

## Tài liệu

| Doc | Nội dung |
| --- | --- |
| [`docs/SSR-Mythos2099.md`](docs/SSR-Mythos2099.md) | **SSR** — cơ chế + tech stack yêu cầu |
| [`docs/implementation/`](docs/implementation/) | Luật khớp code, engine, deploy |
| [`docs/implementation/09-so-sanh-v4-v5.md`](docs/implementation/09-so-sanh-v4-v5.md) | So sánh V4/V5 với code |
| `docs/MechaLegend-.../` | Tài liệu thiết kế gốc (V4/V5) — tham chiếu lịch sử |

## Test

```bash
npm test
```

## Deploy

```bash
npm run deploy:api
npm run deploy:web
```

Web: https://mythos2099-web.fly.dev · API: https://mythos2099-api.fly.dev
