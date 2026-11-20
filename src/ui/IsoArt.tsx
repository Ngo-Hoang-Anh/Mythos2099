import { isoFrameIndex, type IsoArtSpec } from "../data/isoArt";

export function IsoArt({
  spec,
  facingDeg = 0,
}: {
  spec: IsoArtSpec;
  facingDeg?: number;
}) {
  const box = spec.box ?? 92;
  const idx = isoFrameIndex(facingDeg, spec.dirs);
  const frame = spec.frames[idx] ?? spec.frames[0]!;
  const scale = box / Math.max(frame.w, frame.h);

  return (
    <div className="iso-art" style={{ width: box, height: box }}>
      <div
        className="iso-art-frame"
        style={{
          width: frame.w * scale,
          height: frame.h * scale,
          backgroundImage: `url(${spec.src})`,
          backgroundPosition: `-${frame.x * scale}px -${frame.y * scale}px`,
          backgroundSize: `${spec.atlasW * scale}px ${spec.atlasH * scale}px`,
        }}
      />
    </div>
  );
}
