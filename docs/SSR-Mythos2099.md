# Mythos2099 — Đặc tả yêu cầu phần mềm (SSR / SRS)

| Trường | Giá trị |
| --- | --- |
| Tên sản phẩm | **Mythos2099** (sci-fi war-vehicle TCG) |
| Phiên bản tài liệu | 1.0 |
| Ngày | 2026-09-19 |
| Nguồn luật chơi | Code `src/engine/` (ưu tiên); thiết kế gốc V4/V5 trong `docs/MechaLegend-.../` |
| So sánh V4/V5 | `docs/implementation/09-so-sanh-v4-v5.md` |

---

## 1. Mục tiêu sản phẩm

Mythos2099 là TCG chiến thuật theo lượt trên bàn 4×5: người chơi xây đội 8 unit, summon bằng Supply, chơi bài Move/Maneuver/Special, rồi giải quyết Engagement tự động. Luật trận chạy **authoritative trên server**; client chỉ gửi action và render.

### Mục tiêu hiện tại (MVP playable)

- Chơi local / online: AI, hotseat, PvP mã phòng
- Guest account (không DB) để test nhanh
- Deploy tách FE / BE trên Fly.io
- Tutorial + army builder

### Ngoài phạm vi MVP (đã dự kiến / TEMP)

- HQ breakpoint punish (code có skeleton, đang tắt)
- Database bền vững (accounts / ranked)
- Matchmaking xếp hạng

---

## 2. Thuật ngữ

| Thuật ngữ | Nghĩa |
| --- | --- |
| HQ | Hit Points căn cứ; về 0 → thua |
| Supply | Tài nguyên summon / một số lá (ex-CP) |
| Support / Frontline | Hai cột mỗi phe; summon vào Support |
| Engagement | Phase combat cuối lượt (hoặc mid-turn extra) |
| Rest / rested | Unit vừa Advance/Cover từ Support (hoặc Artillery/Jet mới deploy) — không volley / missile lượt đó |
| Sealed Orders | Lá Initiative của người đi sau |
| Guest | Session tạm in-memory, token cache FE |

---

## 3. Yêu cầu chức năng — Luật trận

### 3.1 Bàn & đội hình

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-B01 | Bàn 4 cột × 5 làn; P1 Support=0 Front=1; P2 Front=2 Support=3 | Done |
| FR-B02 | Unit không vượt biên; tối đa tới Frontline phe mình | Done |
| FR-B03 | Army đúng 8 unit khác nhau; deck = toàn bộ slot bài của 8 unit, không xáo lại khi hết | Done |

### 3.2 Kinh tế & lượt

| ID | Yêu cầu | Giá trị / hành vi |
| --- | --- | --- |
| FR-T01 | HQ khởi đầu | **60** HP |
| FR-T02 | Supply mỗi lượt | **4 + số unit trên bàn** |
| FR-T03 | Người không phải `firstPlayerId` | +**1** Supply trong **2** lượt đầu của họ |
| FR-T04 | Mở bài | 5 lá; người đi sau thêm Sealed Orders |
| FR-T05 | Rút bài | Từ lượt ≥ 2 của người đó: rút **2**; hand ≤ **9** |
| FR-T06 | Discard-redraw | ≤ **2**/lượt nếu còn deck |
| FR-T07 | Phase | Deployment → Maneuver → Engagement → passTurn |
| FR-T08 | Hand rỗng khi end Deployment | Bỏ Maneuver, vào Engagement ngay |
| FR-T09 | Deck hết | Vẫn Maneuver (chơi tay); không redraw |
| FR-T10 | Rest clear | Chỉ khi `passTurn`, không khi `endEngagement` |

### 3.3 Combat

| ID | Yêu cầu | Chi tiết |
| --- | --- | --- |
| FR-C01 | Damage súng | `ATK + Agg|Retaliate + SupportFire + temp − max(0, Armor+temp − AP)` |
| FR-C02 | Damage missile | `Missile − floor((Armor+temp)/2)`; không AP |
| FR-C03 | Volley | Unrested + Front **hoặc** Artillery/AirStrike/Jet trên Support |
| FR-C04 | Return fire | Trả từng attacker; không HQ; REST vẫn trả; Artillery không trade; Jet trade; 0 HP trả rồi chết |
| FR-C05 | Engagement phases | Relocation → Stats → Damage → Missile → Cleanup |
| FR-C06 | Relocation | Flank → Cover → Advance+rest (Artillery/Jet không Advance) |
| FR-C07 | Blitz | Deploy → Front nếu trống; không rest |
| FR-C08 | Playback | Server resolve xong mới gửi `combatPlayback`; client ack `endEngagement` |

Chi tiết phase: `docs/implementation/06-engagement-phases.md`.

### 3.4 Thắng / thua

| ID | Điều kiện |
| --- | --- |
| FR-W01 | HQ địch ≤ 0 |
| FR-W02 | Đối thủ surrender |
| FR-W03 | Elimination: hết unit trên bàn + không summon nổi (kể Desperate) + hết deck |

### 3.5 Online / session

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-N01 | WS protocol: register / login / guest / auth / rooms / actions | Done |
| FR-N02 | Guest in-memory; token FE `localStorage` | Done |
| FR-N03 | Modes: AI, hotseat, PvP (mã 4 ký tự) | Done |
| FR-N04 | Room idle TTL 30 phút (sweep) | Done |
| FR-N05 | Server authoritative; client không tự `applyAction` online | Done |

---

## 4. Yêu cầu phi chức năng

| ID | Hạng mục | Yêu cầu |
| --- | --- | --- |
| NFR-01 | Luật deterministic | Cùng seed + action → cùng state (trừ AI random có seed) |
| NFR-02 | Tách FE/BE | FE static không chứa secret DB; BE giữ session / sau này DB |
| NFR-03 | Origin lock | Production BE chỉ accept Origin FE (`ALLOWED_ORIGINS`) |
| NFR-04 | Scale-to-zero | Fly `auto_stop_machines`; guest mất khi process sleep (chấp nhận MVP) |
| NFR-05 | Test | Vitest cover engine + server protocol |
| NFR-06 | Ngôn ngữ UI | English (MVP); i18n sau |

---

## 5. Tech stack yêu cầu

### 5.1 Runtime & ngôn ngữ

| Layer | Stack | Ghi chú |
| --- | --- | --- |
| Language | **TypeScript** (strict) | Shared types FE/BE/engine |
| Frontend | **React 19** + **Vite 6** | SPA; build static |
| Game rules | Pure TS `src/engine/` | Không React, không I/O |
| Backend | **Node.js** + **`ws`** | HTTP `/health` + WS `/ws` |
| Dev runner | `tsx` + `concurrently` | `npm run dev` |
| Test | **Vitest** | `src/**`, `server/**` |

### 5.2 Giao thức

- Transport: WebSocket JSON messages (`src/net/protocol.ts`)
- Auth: opaque token; guest hoặc password (scrypt)
- State sync: server push `hello` / `state` / `peerStatus` / `rooms`

### 5.3 Deploy (hiện tại)

| Thành phần | Host | Image |
| --- | --- | --- |
| `mythos2099-api` | Fly.io (sin) | Node 22 + `tsx server/index.ts` |
| `mythos2099-web` | Fly.io (sin) | nginx phục vụ Vite `dist` |

Env quan trọng BE: `PORT`, `DATA_DIR`, `ALLOWED_ORIGINS`, `ROOM_IDLE_MS`.  
Env build FE: `VITE_WS_URL`.

### 5.4 Lưu trữ (MVP)

| Dữ liệu | Cách lưu |
| --- | --- |
| Password accounts | File `accounts.json` (optional path) |
| Guest sessions | RAM only |
| Rooms | File `rooms.json` + Map RAM; orphan guest không restore |

### 5.5 Hướng mở rộng (không bắt buộc MVP)

| Hạng mục | Gợi ý |
| --- | --- |
| DB | PostgreSQL / Redis cho account + ranked (tách app BE) |
| Realtime scale | Sticky sessions hoặc room shard |
| CDN FE | Giữ static web; chỉ trỏ `VITE_WS_URL` |
| Observability | `/health` + Fly metrics; sau thêm structured logs |

### 5.6 Ràng buộc kỹ thuật

1. **Không** đưa credential DB vào image FE.
2. Engine phải test được offline không cần WS.
3. Mọi thay đổi luật cân bằng ưu tiên sửa constant trong `types.ts` + cập nhật `docs/implementation/00-quy-tac-local.md`.

---

## 6. Kiến trúc logic

```
┌─────────────────┐     wss://api/.../ws      ┌──────────────────┐
│  mythos2099-web │ ────────────────────────► │ mythos2099-api   │
│  React + Vite   │     JSON ClientMessage    │ GameServer + WS  │
│  (nginx static) │ ◄──────────────────────── │ AccountStore     │
└─────────────────┘     ServerMessage+state   │ Room Map         │
                                              │ src/engine/*     │
                                              └──────────────────┘
```

Luồng lượt: Client `action` → Server `applyAction` / room.submit → `combatPlayback` → Client FX → `endEngagement` → `passTurn`.

---

## 7. Tài liệu liên quan

| Tài liệu | Nội dung |
| --- | --- |
| `docs/implementation/00-quy-tac-local.md` | Luật khớp code |
| `docs/implementation/01-engine.md` | Map file engine |
| `docs/implementation/02-chay-local.md` | Dev + Fly |
| `docs/implementation/06-engagement-phases.md` | Combat phases |
| `docs/implementation/09-so-sanh-v4-v5.md` | Diff thiết kế gốc |
| V4 docx / V5 PDF | Nguồn thiết kế lịch sử (không override code) |

---

## 8. Lịch sử thay đổi tài liệu

| Ver | Ngày | Ghi chú |
| --- | --- | --- |
| 1.0 | 2026-09-19 | SSR khởi tạo từ code Mythos2099 (HQ 60, P2 +1×2 turn, guest, Fly split) |
