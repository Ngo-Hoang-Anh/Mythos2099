import { getSquadArt } from "../data/squadArt";
import { squadLayout } from "./squadLayout";

export function SquadArt({
  unitId,
  facingDeg = 0,
  turretExtraDeg = 0,
  deployed = true,
  running = false,
  showSoldiers = true,
  showProps,
}: {
  unitId?: number;
  unitClass?: string;
  facingDeg?: number;
  turretExtraDeg?: number;
  deployed?: boolean;
  running?: boolean;
  showSoldiers?: boolean;
  showProps?: boolean;
}) {
  const spec = getSquadArt(unitId);
  const layout = squadLayout(unitId, deployed, running);
  if (!spec || !layout) return null;
  const drawProps = showProps ?? (deployed && !running);
  const airIdle = spec.kind === "drones" && !running;
  const swingGuns = spec.kind === "bikes" && !running;
  return (
    <svg className={`squad-svg ${running ? "running" : ""}`} viewBox="0 0 96 96" aria-hidden>
      <g className={airIdle ? "air-hover" : undefined}>
        <g transform={`translate(48 48) rotate(${facingDeg})`}>
        {drawProps
          ? layout.props.map((p, i) => (
              <image
                key={`prop-${i}`}
                href={p.src}
                x={p.x - p.originX}
                y={p.y - p.originY}
                width={p.width}
                height={p.height}
                style={{ imageRendering: "pixelated" }}
              />
            ))
          : null}
        {showSoldiers
          ? layout.members.map((m, i) => {
              const barrel = Math.hypot(m.tipX, m.tipY);
              const gunPivot = barrel > 2 ? 0.42 : 0;
              const restDeg = barrel > 0.001 ? (Math.atan2(m.tipX, -m.tipY) * 180) / Math.PI : 0;
              const reach = barrel * (1 - gunPivot);
              return (
                <g key={m.id} transform={`translate(${m.x} ${m.y}) scale(${m.scale})`}>
                  <g
                    className={running && spec.kind !== "drones" ? "squad-jog" : undefined}
                    style={running && spec.kind !== "drones" ? { animationDelay: `${(i % 5) * 0.05}s` } : undefined}
                  >
                    <image
                      href={m.src}
                      x={-m.originX}
                      y={-m.originY}
                      width={m.width}
                      height={m.height}
                      style={{ imageRendering: m.src.endsWith(".png") ? "auto" : "pixelated" }}
                    />
                  </g>
                  {swingGuns && m.shotScale > 0 && Math.abs(turretExtraDeg) > 4 ? (
                    <g
                      transform={`translate(${m.tipX * gunPivot} ${m.tipY * gunPivot}) rotate(${restDeg + turretExtraDeg})`}
                    >
                      <rect x={-1.1} y={-reach - 1} width={2.2} height={reach + 2} fill="#1a1e22" />
                    </g>
                  ) : null}
                </g>
              );
            })
          : null}
        </g>
      </g>
    </svg>
  );
}
