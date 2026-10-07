import type { TankArtSpec } from "../data/unitArt";

const ART_BOX = 92;

function UpperAssembly({ spec, gunYaw }: { spec: TankArtSpec; gunYaw: number }) {
  const biped = Boolean(spec.legs?.length);
  return (
    <>
      <img
        className={biped ? "tank-torso" : "tank-hull"}
        src={spec.hull}
        alt=""
        draggable={false}
        style={
          biped
            ? {
                left: spec.torsoX,
                top: spec.torsoY,
                width: spec.torsoW,
                height: spec.torsoH,
              }
            : undefined
        }
      />
      {spec.turrets.map((turret, i) => (
        <div
          key={i}
          className="turret-pivot"
          style={{ left: turret.x, top: turret.y, zIndex: spec.upper ? 3 : 4 - i }}
        >
          <div className="gun-rot" style={{ transform: `rotate(${turret.aim + gunYaw}deg)` }}>
            {turret.barrels.map((barrel, j) => (
              <img
                key={j}
                src={barrel.src}
                alt=""
                draggable={false}
                style={{
                  width: barrel.width,
                  height: barrel.height,
                  transform: `translate(${-barrel.originX}px, ${-barrel.originY}px)`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
      {spec.upper ? (
        <img
          className="tank-upper"
          src={spec.upper.src}
          alt=""
          draggable={false}
          style={{
            left: spec.upper.x,
            top: spec.upper.y,
            width: spec.upper.width,
            height: spec.upper.height,
            zIndex: 6,
          }}
        />
      ) : null}
    </>
  );
}

function SingleTankArt({
  spec,
  facingDeg,
  turretExtraDeg,
  walking,
  size,
}: {
  spec: TankArtSpec;
  facingDeg: number;
  turretExtraDeg: number;
  walking: boolean;
  size: number;
}) {
  const pad = spec.kind === "heavy" ? 1.32 : spec.kind === "biped" ? 1.28 : 1.2;
  const scale = Math.min(size / (spec.hullW * pad), size / (spec.hullH * pad));
  const biped = Boolean(spec.legs?.length);
  return (
    <div className={`tank-fit ${spec.kind}`}>
      <div
        className={`tank-rig${walking && biped ? " walking" : ""}`}
        style={{
          width: spec.hullW,
          height: spec.hullH,
          marginLeft: -spec.pivotX,
          marginTop: -spec.pivotY,
          transformOrigin: `${spec.pivotX}px ${spec.pivotY}px`,
          transform: `scale(${scale}) rotate(${facingDeg}deg)`,
        }}
      >
        {spec.legs?.map((leg, i) => {
          const side = leg.side ?? (i % 2 === 0 ? "left" : "right");
          const end = leg.end ?? "";
          const flip = leg.flipY ? "flip-y" : "";
          return (
            <div
              key={i}
              className={`robot-leg ${side} ${end} ${flip}`.trim()}
              style={{ left: leg.x, top: leg.y, width: leg.width, height: leg.height }}
            >
              <img src={leg.src} alt="" draggable={false} />
            </div>
          );
        })}
        {spec.lower ? (
          <img
            className="tank-lower"
            src={spec.lower.src}
            alt=""
            draggable={false}
            style={{
              left: spec.lower.x,
              top: spec.lower.y,
              width: spec.lower.width,
              height: spec.lower.height,
            }}
          />
        ) : null}
        {biped ? (
          <div
            className="tank-torso-spin"
            style={{
              transformOrigin: `${spec.pivotX}px ${spec.pivotY}px`,
              transform: `rotate(${turretExtraDeg}deg)`,
            }}
          >
            <UpperAssembly spec={spec} gunYaw={0} />
          </div>
        ) : (
          <UpperAssembly spec={spec} gunYaw={turretExtraDeg} />
        )}
      </div>
    </div>
  );
}

export function TankArt({
  spec,
  facingDeg = 0,
  turretExtraDeg = 0,
  walking = false,
  size = ART_BOX,
}: {
  spec: TankArtSpec;
  facingDeg?: number;
  turretExtraDeg?: number;
  walking?: boolean;
  size?: number;
}) {
  if (spec.pair) {
    const piece = size * 0.58;
    const gap = size * 0.24;
    return (
      <div className="tank-pair" style={{ width: size, height: size }}>
        <div className="tank-pair-slot" style={{ transform: `translate(${-gap}px, 0)` }}>
          <SingleTankArt
            spec={spec}
            facingDeg={facingDeg}
            turretExtraDeg={turretExtraDeg}
            walking={walking}
            size={piece}
          />
        </div>
        <div className="tank-pair-slot" style={{ transform: `translate(${gap}px, 0)` }}>
          <SingleTankArt
            spec={spec}
            facingDeg={facingDeg}
            turretExtraDeg={turretExtraDeg}
            walking={walking}
            size={piece}
          />
        </div>
      </div>
    );
  }
  return (
    <SingleTankArt
      spec={spec}
      facingDeg={facingDeg}
      turretExtraDeg={turretExtraDeg}
      walking={walking}
      size={size}
    />
  );
}
