import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  DEFAULT_DIR_LABELS,
  frameForDir,
  ISO_MOVE,
  loadSheetPacks,
  type DirLabel,
  type SheetPack,
} from "./atlas";
import { buildRemappedAtlas, downloadBlob, downloadText } from "./exportAtlas";
import {
  clearRemap,
  hasCachedRemap,
  identityRemap,
  loadCachedPackId,
  loadRemap,
  saveLastPackId,
  saveRemap,
} from "./remapCache";

const PACKS = loadSheetPacks();
const DIR_LABELS = DEFAULT_DIR_LABELS;
const FIXED_SPEED = 72;
const FIXED_SCALE = 1.15;
const IDENTITY = identityRemap();

/** Clockwise octagon — nose turns with the path when atlas is SE..S. */
const OCTAGON_ORDER: DirLabel[] = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];

function dirIndexForLabel(label: DirLabel): number {
  const i = DIR_LABELS.indexOf(label);
  return i >= 0 ? i : 0;
}

function octagonVertices(sideLen: number): { x: number; y: number }[] {
  const verts: { x: number; y: number }[] = [];
  let x = 0;
  let y = 0;
  for (const label of OCTAGON_ORDER) {
    verts.push({ x, y });
    const move = ISO_MOVE[label];
    x += move.x * sideLen;
    y += move.y * sideLen;
  }
  const cx = verts.reduce((s, v) => s + v.x, 0) / verts.length;
  const cy = verts.reduce((s, v) => s + v.y, 0) / verts.length;
  return verts.map((v) => ({ x: v.x - cx, y: v.y - cy }));
}

function SpriteThumb({
  pack,
  sourceDir,
  size,
  selected,
  caption,
  draggable,
  onDragStart,
  onClick,
  className = "",
}: {
  pack: SheetPack;
  sourceDir: number | null;
  size: number;
  selected?: boolean;
  caption: string;
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onClick?: () => void;
  className?: string;
}) {
  if (sourceDir == null) {
    return (
      <div className={`frame-cell empty-slot ${className}`.trim()}>
        <div className="frame-sprite placeholder" style={{ width: size * 0.7, height: size * 0.7 }} />
        <span className="frame-caption">{caption}</span>
      </div>
    );
  }

  const frame = frameForDir(pack.data, sourceDir);
  if (!frame) {
    return (
      <div className={`frame-cell missing ${className}`.trim()}>
        <span>dir{sourceDir}</span>
      </div>
    );
  }

  const scale = size / Math.max(frame.w, frame.h);
  const w = frame.w * scale;
  const h = frame.h * scale;
  const atlas = pack.data.atlases[0]!;

  return (
    <button
      type="button"
      className={`frame-cell${selected ? " selected" : ""}${draggable ? " drag-source" : ""} ${className}`.trim()}
      title={caption}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={onClick}
    >
      <div
        className="frame-sprite"
        style={{
          width: w,
          height: h,
          backgroundImage: `url(${pack.atlasUrl})`,
          backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
          backgroundSize: `${atlas.size.width * scale}px ${atlas.size.height * scale}px`,
        }}
      />
      <span className="frame-caption">{caption}</span>
    </button>
  );
}

export function IsoPreviewApp() {
  const initialPackId = useMemo(() => {
    const fallback = PACKS[0]?.id ?? "";
    const cached = loadCachedPackId(fallback);
    return PACKS.some((p) => p.id === cached) ? cached : fallback;
  }, []);

  const [packId, setPackId] = useState(initialPackId);
  const [playing, setPlaying] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [legIndex, setLegIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  /** remap[slot] = source atlas dir index (null = empty while editing). */
  const [remap, setRemap] = useState<(number | null)[]>(() => loadRemap(initialPackId));
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const [cacheTick, setCacheTick] = useState(0);
  const actionLockUntilRef = useRef(0);
  const ACTION_COOLDOWN_MS = 450;

  const pack = useMemo(() => PACKS.find((p) => p.id === packId) ?? PACKS[0], [packId]);
  const cachedCustom = useMemo(() => hasCachedRemap(packId), [packId, cacheTick]);
  const controlsLocked = actionBusy || exporting;

  const runBuffered = (fn: () => void | Promise<void>) => {
    const now = performance.now();
    if (controlsLocked || now < actionLockUntilRef.current) return;
    actionLockUntilRef.current = now + ACTION_COOLDOWN_MS;
    setActionBusy(true);
    void (async () => {
      try {
        await fn();
      } finally {
        const wait = Math.max(0, actionLockUntilRef.current - performance.now());
        window.setTimeout(() => setActionBusy(false), wait);
      }
    })();
  };

  /** Active source dir for a logical slot (identity if slot empty). */
  const resolveSource = (slot: number): number => {
    const v = remap[slot];
    return v == null ? slot : v;
  };

  const stageRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const facingRef = useRef(3);
  const legRef = useRef(0);
  const legProgressRef = useRef(0);
  const sideLenRef = useRef(100);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [facing, setFacing] = useState(3);
  const [octagonPath, setOctagonPath] = useState<{ x: number; y: number }[]>([]);

  const resetOctagon = () => {
    const stage = stageRef.current;
    const sideLen = Math.min((stage?.clientWidth ?? 480) * 0.18, 96);
    sideLenRef.current = sideLen;
    const verts = octagonVertices(sideLen);
    setOctagonPath(verts);
    const start = verts[0]!;
    posRef.current = { x: start.x, y: start.y };
    setPos({ x: start.x, y: start.y });
    legRef.current = 0;
    legProgressRef.current = 0;
    setLegIndex(0);
    const idx = dirIndexForLabel(OCTAGON_ORDER[0]!);
    facingRef.current = idx;
    setFacing(idx);
  };

  useEffect(() => {
    facingRef.current = facing;
  }, [facing]);

  useEffect(() => {
    saveLastPackId(packId);
    setRemap(loadRemap(packId));
    setEditing(false);
    setDragOverSlot(null);
    setExportMsg(hasCachedRemap(packId) ? "Đã load remap từ cache." : "");
  }, [packId]);

  useEffect(() => {
    const id = requestAnimationFrame(() => resetOctagon());
    return () => cancelAnimationFrame(id);
  }, [packId]);

  useEffect(() => {
    if (!playing || !pack) return;

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const sideLen = sideLenRef.current;
      const verts = octagonVertices(sideLen);
      let label = OCTAGON_ORDER[legRef.current]!;
      const move = ISO_MOVE[label];
      legProgressRef.current += FIXED_SPEED * dt;

      if (legProgressRef.current >= sideLen) {
        const overflow = legProgressRef.current - sideLen;
        const nextLeg = (legRef.current + 1) % OCTAGON_ORDER.length;
        legRef.current = nextLeg;
        legProgressRef.current = Math.min(overflow, sideLen * 0.25);
        setLegIndex(nextLeg);
        label = OCTAGON_ORDER[nextLeg]!;
        const nextMove = ISO_MOVE[label];
        const vertex = verts[nextLeg]!;
        posRef.current = {
          x: vertex.x + nextMove.x * legProgressRef.current,
          y: vertex.y + nextMove.y * legProgressRef.current,
        };
      } else {
        const from = verts[legRef.current]!;
        posRef.current = {
          x: from.x + move.x * legProgressRef.current,
          y: from.y + move.y * legProgressRef.current,
        };
      }

      const idx = dirIndexForLabel(label);
      if (idx !== facingRef.current) {
        facingRef.current = idx;
        setFacing(idx);
      }

      setPos({ x: posRef.current.x, y: posRef.current.y });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, pack]);

  const startEdit = () =>
    runBuffered(() => {
      const cached = loadRemap(packId);
      setEditing(true);
      setRemap([...cached]);
      setExportMsg(
        hasCachedRemap(packId)
          ? "Đã load remap từ cache — kéo thả để sửa, rồi Save / Export."
          : "Kéo 8 hướng từ hàng trên xuống đúng slot, rồi Save / Export.",
      );
    });

  const cancelEdit = () =>
    runBuffered(() => {
      setEditing(false);
      setRemap(loadRemap(packId));
      setDragOverSlot(null);
      setExportMsg(hasCachedRemap(packId) ? "Đã hủy — giữ remap cache cũ." : "");
    });

  const persistRemap = (filled: number[]) => {
    saveRemap(packId, filled);
    setCacheTick((n) => n + 1);
  };

  const remapComplete = remap.every((v) => v != null);

  const saveEdit = () =>
    runBuffered(() => {
      if (!remapComplete) return;
      const filled = remap as number[];
      persistRemap(filled);
      setEditing(false);
      setDragOverSlot(null);
      setExportMsg("Đã lưu remap vào cache trình duyệt.");
    });

  const resetCachedRemap = () =>
    runBuffered(() => {
      clearRemap(packId);
      setRemap(identityRemap());
      setEditing(false);
      setDragOverSlot(null);
      setCacheTick((n) => n + 1);
      setExportMsg("Đã xóa cache remap của model này.");
    });

  const assignToSlot = (slot: number, sourceDir: number) => {
    if (controlsLocked) return;
    setRemap((prev) => {
      const next = [...prev];
      const existingAt = next.indexOf(sourceDir);
      if (existingAt >= 0 && existingAt !== slot) next[existingAt] = null;
      next[slot] = sourceDir;
      return next;
    });
  };

  const exportRemapped = () =>
    runBuffered(async () => {
      if (!pack || !remapComplete) return;
      setExporting(true);
      setExportMsg("Đang tạo atlas…");
      try {
        const filled = remap as number[];
        persistRemap(filled);
        const result = await buildRemappedAtlas(pack, filled);
        const base = pack.label.replace(/\s+/g, "_").toLowerCase() || "unit";
        downloadBlob(result.pngBlob, `${base}-atlas.remapped.png`);
        downloadText(result.texturePackerJson, `${base}-atlas.texturepacker.json`);
        downloadText(result.unityImporterJson, `${base}-atlas.unity-importer.json`);
        setExportMsg("Đã cache + tải atlas.png và 2 file JSON.");
        setEditing(false);
      } catch (err) {
        setExportMsg(err instanceof Error ? err.message : "Export failed");
      } finally {
        setExporting(false);
      }
    });

  if (!pack) {
    return (
      <div className="app empty">
        <p>
          No spritesheets found under <code>resource/isometric/Sheet</code>.
        </p>
      </div>
    );
  }

  const activeSlot = facing;
  const activeSource = resolveSource(activeSlot);
  const activeFrame = frameForDir(pack.data, activeSource);
  const atlasSize = pack.data.atlases[0]!.size;
  const drawScale = FIXED_SCALE * (activeFrame ? 140 / Math.max(activeFrame.w, activeFrame.h) : 1);

  return (
    <div className="app">
      <aside className="sidebar">
        <header>
          <h1>Iso Sprite Preview</h1>
          <p>Chọn model · chỉnh thứ tự 8 hướng · xuất atlas mới.</p>
        </header>

        <div className="folder-path">
          {pack.id}
          {cachedCustom ? <span className="cache-pill">cached</span> : null}
        </div>

        <div className="folder-list">
          {PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={p.id === pack.id ? "active" : ""}
              disabled={controlsLocked}
              onClick={() => runBuffered(() => setPackId(p.id))}
            >
              {p.label}
              {hasCachedRemap(p.id) ? <span className="cache-dot" title="Có remap cache" /> : null}
            </button>
          ))}
        </div>

        <label className="check">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Show isometric grid
        </label>

        <div className="toolbar">
          <button
            type="button"
            disabled={controlsLocked}
            onClick={() => runBuffered(() => setPlaying((v) => !v))}
          >
            {playing ? "Pause" : "Play"}
          </button>
          <button type="button" disabled={controlsLocked} onClick={() => runBuffered(() => resetOctagon())}>
            Reset
          </button>
        </div>

        <div className="toolbar">
          {!editing ? (
            <>
              <button type="button" className="accent" disabled={controlsLocked} onClick={startEdit}>
                Edit dirs
              </button>
              {cachedCustom && (
                <button type="button" disabled={controlsLocked} onClick={resetCachedRemap}>
                  Clear cache
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" disabled={controlsLocked} onClick={cancelEdit}>
                Cancel
              </button>
              <button
                type="button"
                className="accent"
                disabled={!remapComplete || controlsLocked}
                onClick={saveEdit}
              >
                Save
              </button>
              <button
                type="button"
                disabled={!remapComplete || controlsLocked}
                onClick={exportRemapped}
              >
                {exporting ? "…" : "Export"}
              </button>
            </>
          )}
        </div>

        {exportMsg && <div className="hint status">{exportMsg}</div>}
      </aside>

      <main className="main">
        <div className="stage-wrap">
          <div ref={stageRef} className={`stage${showGrid ? " grid" : ""}`}>
            <div className="iso-floor" />
            {octagonPath.length === 8 && (
              <svg className="octagon-path" aria-hidden>
                <polygon
                  points={[...octagonPath, octagonPath[0]!].map((v) => `${v.x},${v.y}`).join(" ")}
                  fill="rgba(110, 196, 255, 0.05)"
                  stroke="rgba(110, 196, 255, 0.45)"
                  strokeWidth="2"
                />
                {octagonPath.map((v, i) => (
                  <circle
                    key={i}
                    cx={v.x}
                    cy={v.y}
                    r={i === legIndex ? 4.5 : 3}
                    fill={i === legIndex ? "#6ec4ff" : "rgba(110, 196, 255, 0.55)"}
                  />
                ))}
              </svg>
            )}
            {activeFrame && (
              <div
                className="unit"
                style={{
                  transform: `translate(-50%, -70%) translate(${pos.x}px, ${pos.y}px)`,
                  width: activeFrame.w * drawScale,
                  height: activeFrame.h * drawScale,
                  backgroundImage: `url(${pack.atlasUrl})`,
                  backgroundPosition: `-${activeFrame.x * drawScale}px -${activeFrame.y * drawScale}px`,
                  backgroundSize: `${atlasSize.width * drawScale}px ${atlasSize.height * drawScale}px`,
                }}
              />
            )}
            <div className="facing-badge">
              {`leg ${legIndex + 1}/8 · ${OCTAGON_ORDER[legIndex]} · slot${activeSlot}←src${activeSource}`}
            </div>
          </div>
        </div>

        <section className="strip">
          <div className="strip-head">
            <h2>{editing ? "Source · atlas gốc dir0..7" : "8 directions · thứ tự đang dùng"}</h2>
            {editing && <span className="strip-note">Kéo xuống hàng Edit bên dưới</span>}
          </div>
          <div className="strip-row">
            {Array.from({ length: 8 }, (_, dir) => {
              const sourceDir = editing ? dir : resolveSource(dir);
              return (
                <SpriteThumb
                  key={`src-${dir}`}
                  pack={pack}
                  sourceDir={sourceDir}
                  size={72}
                  selected={!editing && dir === activeSlot}
                  caption={
                    editing
                      ? `dir${dir} · ${DIR_LABELS[dir]}`
                      : `dir${dir} · ${DIR_LABELS[dir]}${sourceDir !== dir ? ` ←src${sourceDir}` : ""}`
                  }
                  draggable={editing}
                  onDragStart={
                    editing
                      ? (e) => {
                          e.dataTransfer.setData("text/plain", String(dir));
                          e.dataTransfer.effectAllowed = "copyMove";
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>

          {editing && (
            <>
              <div className="strip-head edit-head">
                <h2>Edit · slot dir0..7 (drop here)</h2>
                <button
                  type="button"
                  className="linkish"
                  disabled={controlsLocked}
                  onClick={() => runBuffered(() => setRemap([...IDENTITY]))}
                >
                  Fill identity
                </button>
                <button
                  type="button"
                  className="linkish"
                  disabled={controlsLocked}
                  onClick={() => runBuffered(() => setRemap(Array.from({ length: 8 }, () => null)))}
                >
                  Clear
                </button>
              </div>
              <div className="strip-row edit-row">
                {Array.from({ length: 8 }, (_, slot) => (
                  <div
                    key={`slot-${slot}`}
                    className={`drop-slot${dragOverSlot === slot ? " over" : ""}${remap[slot] != null ? " filled" : ""}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverSlot(slot);
                    }}
                    onDragLeave={() => setDragOverSlot((v) => (v === slot ? null : v))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverSlot(null);
                      const raw = e.dataTransfer.getData("text/plain");
                      const sourceDir = Number(raw);
                      if (!Number.isInteger(sourceDir) || sourceDir < 0 || sourceDir > 7) return;
                      assignToSlot(slot, sourceDir);
                    }}
                  >
                    <SpriteThumb
                      pack={pack}
                      sourceDir={remap[slot] ?? null}
                      size={72}
                      selected={slot === activeSlot}
                      caption={
                        remap[slot] == null
                          ? `slot${slot} · ${DIR_LABELS[slot]}`
                          : `slot${slot}←dir${remap[slot]} · ${DIR_LABELS[slot]}`
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
