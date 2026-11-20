import { frameForDir, type AtlasData, type SheetPack } from "./atlas";

const PAD = 4;
const GAP = 4;

/** `remap[slot] = sourceDir` — slot becomes the new dir index in the exported atlas. */
export async function buildRemappedAtlas(
  pack: SheetPack,
  remap: number[],
): Promise<{ pngBlob: Blob; texturePackerJson: string; unityImporterJson: string }> {
  const frames = remap.map((sourceDir, slot) => {
    const frame = frameForDir(pack.data, sourceDir);
    if (!frame) throw new Error(`Missing source frame for dir${sourceDir} (slot ${slot})`);
    return { slot, sourceDir, frame };
  });

  const cellW = Math.max(...frames.map((f) => f.frame.w));
  const cellH = Math.max(...frames.map((f) => f.frame.h));
  const atlasW = nextPow2(PAD * 2 + frames.length * cellW + (frames.length - 1) * GAP);
  const atlasH = nextPow2(PAD * 2 + cellH);

  const sourceImg = await loadImage(pack.atlasUrl);
  const canvas = document.createElement("canvas");
  canvas.width = atlasW;
  canvas.height = atlasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  ctx.clearRect(0, 0, atlasW, atlasH);

  const outFrames: AtlasData["frames"] = {};
  const unitySprites: object[] = [];

  frames.forEach(({ slot, frame }, i) => {
    const x = PAD + i * (cellW + GAP);
    const y = PAD;
    ctx.drawImage(sourceImg, frame.x, frame.y, frame.w, frame.h, x, y, frame.w, frame.h);
    const key = `static_dir${slot}_frame0`;
    outFrames[key] = {
      frame: { x, y, w: frame.w, h: frame.h },
      pivot: { x: 0.5, y: 0.5 },
    };
    unitySprites.push({
      name: key,
      rect: { x, y, width: frame.w, height: frame.h },
      alignment: "Center",
      pivot: { x: 0.5, y: 0.5 },
      border: { left: 0, right: 0, top: 0, bottom: 0 },
      rotated: false,
      originalSize: { width: frame.w, height: frame.h },
      trimmedRect: { x: 0, y: 0, width: frame.w, height: frame.h },
    });
  });

  const texturePacker = {
    generator: "Armored Legend iso-preview",
    format: "toolbuddy-texturepacker",
    settings: {
      exporter: "unity-native",
      trimTransparent: false,
      allowRotation: false,
      prependFolderName: false,
    },
    atlases: [
      {
        image: "atlas.png",
        size: { width: atlasW, height: atlasH },
        usedSize: { width: PAD * 2 + frames.length * cellW + (frames.length - 1) * GAP, height: PAD * 2 + cellH },
        occupancy: 0,
      },
    ],
    frames: Object.fromEntries(
      Object.entries(outFrames).map(([key, value]) => [
        key,
        {
          atlas: "atlas.png",
          frame: value.frame,
          rotated: false,
          trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: value.frame.w, h: value.frame.h },
          sourceSize: { w: value.frame.w, h: value.frame.h },
          pivot: value.pivot ?? { x: 0.5, y: 0.5 },
        },
      ]),
    ),
  };

  const unityImporter = {
    generator: "Armored Legend iso-preview",
    format: "unity-spritesheet",
    textureImporter: {
      textureType: "Sprite (2D and UI)",
      spriteMode: "Multiple",
      alphaIsTransparency: true,
    },
    sheets: [
      {
        image: "atlas.png",
        size: { width: atlasW, height: atlasH },
        sprites: unitySprites,
      },
    ],
  };

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG encode failed"))), "image/png");
  });

  return {
    pngBlob,
    texturePackerJson: JSON.stringify(texturePacker, null, 2),
    unityImporterJson: JSON.stringify(unityImporter, null, 2),
  };
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: "application/json" }), filename);
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}
