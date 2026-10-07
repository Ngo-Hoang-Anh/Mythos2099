import { createServer } from "node:http";
import { join } from "node:path";
import { WebSocketServer } from "ws";
import { AccountStore } from "./accounts";
import { DEFAULT_ROOM_CLEANUP_MS, DEFAULT_ROOM_IDLE_MS, GameServer } from "./gameServer";
import { RoomStore } from "./roomStore";

const PORT = Number(process.env.PORT ?? 8787);
const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), "data");
const ROOM_IDLE_MS = Number(process.env.ROOM_IDLE_MS ?? DEFAULT_ROOM_IDLE_MS);
const ROOM_CLEANUP_MS = Number(process.env.ROOM_CLEANUP_MS ?? DEFAULT_ROOM_CLEANUP_MS);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const game = new GameServer(
  new AccountStore(join(DATA_DIR, "accounts.json")),
  new RoomStore(join(DATA_DIR, "rooms.json")),
  { roomIdleMs: ROOM_IDLE_MS, cleanupIntervalMs: ROOM_CLEANUP_MS },
);
game.startCleanupLoop();

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({
  server: httpServer,
  path: "/ws",
  verifyClient: (info, done) => {
    if (ALLOWED_ORIGINS.length === 0) {
      done(true);
      return;
    }
    const origin = info.origin ?? "";
    done(ALLOWED_ORIGINS.includes(origin));
  },
});
wss.on("connection", (ws) => {
  game.connect(ws);
  ws.on("message", (data) => game.handleMessage(ws, String(data)));
  ws.on("close", () => game.disconnect(ws));
});

httpServer.listen(PORT, () => {
  console.log(`Mythos2099 server ws://0.0.0.0:${PORT}/ws`);
});
