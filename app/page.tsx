"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";

/* ---------------- Types ---------------- */

type RenderKey =
  | "white-mount"
  | "white-nomount"
  | "black-mount"
  | "black-nomount"
  | "wood-mount"
  | "wood-nomount"
  | "canvas"
  | "rolled-art"
  | "rolled-canvas";

type Box = { x: number; y: number; w: number; h: number };

type ArtworkQueued = { id: string; file: File };

type ArtworkProcessed = {
  id: string;
  file: File;
  img: HTMLImageElement;
  handle: string;
};

/* ---------------- Boxes ---------------- */

const BOX_FRAMES: Box = { x: 513, y: 255, w: 1004, h: 1502 };
const BOX_CANVAS: Box = { x: 513, y: 253, w: 1003, h: 1502 };

// ✅ Rolled Art
const BOX_ROLLED_ART: Box = { x: 337, y: -2531, w: 2890, h: 4336 };

// ✅ Rolled Canvas (as provided)
const BOX_ROLLED_CANVAS: Box = { x: 353, y: -1412, w: 1949, h: 2922 };

/* ---------------- Renders ----------------
  - baseSrc optional: if missing, we’ll fill white and size from mask/overlay
  - maskSrc applies to artwork only (destination-in)
  - overlays draw on top (folds/shadows)
------------------------------------------ */

type RenderConfig = {
  key: RenderKey;
  baseSrc?: string; // optional background/base image
  box: Box;
  maskSrc?: string;
  overlays?: string[];
};

const RENDERS: RenderConfig[] = [
  { key: "white-mount", baseSrc: "/frames/white-mount.jpg", box: BOX_FRAMES },
  { key: "white-nomount", baseSrc: "/frames/white-nomount.jpg", box: BOX_FRAMES },
  { key: "black-mount", baseSrc: "/frames/black-mount.jpg", box: BOX_FRAMES },
  { key: "black-nomount", baseSrc: "/frames/black-nomount.jpg", box: BOX_FRAMES },
  { key: "wood-mount", baseSrc: "/frames/wood-mount.jpg", box: BOX_FRAMES },
  { key: "wood-nomount", baseSrc: "/frames/wood-nomount.jpg", box: BOX_FRAMES },

  // Canvas (single base + artwork mask)
  {
    key: "canvas",
    baseSrc: "/frames/canvas.jpg",
    box: BOX_CANVAS,
    maskSrc: "/frames/canvas-mask.png",
  },

  // Rolled Art (BG + artwork mask + overlays)
  {
    key: "rolled-art",
    baseSrc: "/frames/rolled-paper-bg.jpg",
    box: BOX_ROLLED_ART,
    maskSrc: "/frames/rolled-paper-mask.png",
    overlays: ["/frames/rolled-paper-shadow.png", "/frames/rolled-paper-fold.png"],
  },

  // ✅ Rolled Canvas (no bg mentioned → we size from mask/overlays & fill white)
  {
    key: "rolled-canvas",
    box: BOX_ROLLED_CANVAS,
    maskSrc: "/frames/rolled-canvas-mask.png",
    overlays: [
      "/frames/rolled-canvas-shadow.png",
      "/frames/rolled-canvas-fold-shadow.png",
      "/frames/rolled-canvas-fold.png",
    ],
  },
];

/* ---------------- Strict init records ---------------- */

const EMPTY_BASES: Record<RenderKey, HTMLImageElement | null> = {
  "white-mount": null,
  "white-nomount": null,
  "black-mount": null,
  "black-nomount": null,
  "wood-mount": null,
  "wood-nomount": null,
  canvas: null,
  "rolled-art": null,
  "rolled-canvas": null,
};

const EMPTY_MASKS: Record<RenderKey, HTMLImageElement | null> = { ...EMPTY_BASES };

const EMPTY_SIZE_REF: Record<RenderKey, HTMLImageElement | null> = { ...EMPTY_BASES };

const EMPTY_OVERLAYS: Record<RenderKey, HTMLImageElement[]> = {
  "white-mount": [],
  "white-nomount": [],
  "black-mount": [],
  "black-nomount": [],
  "wood-mount": [],
  "wood-nomount": [],
  canvas: [],
  "rolled-art": [],
  "rolled-canvas": [],
};

/* ---------------- Helpers ---------------- */

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function fileToImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Artwork load failed"));
    img.src = url;
  });
}

function sanitizeHandle(name: string) {
  return (
    name
      .replace(/\.[^/.]+$/, "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120) || "artwork"
  );
}

/* ---------------- Draw engine ---------------- */

function drawRender(params: {
  outCanvas: HTMLCanvasElement;
  base: HTMLImageElement | null;
  sizeRef: HTMLImageElement | null; // used when base missing
  art: HTMLImageElement;
  box: Box;
  mask: HTMLImageElement | null;
  overlays: HTMLImageElement[];
}) {
  const { outCanvas, base, sizeRef, art, box, mask, overlays } = params;
  const ctx = outCanvas.getContext("2d");
  if (!ctx) return;

  const ref = base || sizeRef;
  if (!ref) return;

  outCanvas.width = ref.naturalWidth;
  outCanvas.height = ref.naturalHeight;

  // Always start with white background (avoids black JPG background)
  ctx.clearRect(0, 0, outCanvas.width, outCanvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

  // Draw base (if exists)
  if (base) ctx.drawImage(base, 0, 0);

  // Contain fit (no crop) + clip to box (no bleed)
  const ratio = Math.min(box.w / art.naturalWidth, box.h / art.naturalHeight);
  const drawW = art.naturalWidth * ratio;
  const drawH = art.naturalHeight * ratio;
  const drawX = box.x + (box.w - drawW) / 2;
  const drawY = box.y + (box.h - drawH) / 2;

  const tmp = document.createElement("canvas");
  tmp.width = outCanvas.width;
  tmp.height = outCanvas.height;
  const tctx = tmp.getContext("2d");
  if (!tctx) return;

  tctx.save();
  tctx.beginPath();
  tctx.rect(box.x, box.y, box.w, box.h);
  tctx.clip();
  tctx.imageSmoothingEnabled = true;
  tctx.imageSmoothingQuality = "high";
  tctx.drawImage(art, drawX, drawY, drawW, drawH);
  tctx.restore();

  // Mask artwork only (destination-in)
  if (mask) {
    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(mask, 0, 0, tmp.width, tmp.height);
    tctx.globalCompositeOperation = "source-over";
  }

  ctx.drawImage(tmp, 0, 0);

  // Overlays on top
  for (const ov of overlays) {
    ctx.drawImage(ov, 0, 0, outCanvas.width, outCanvas.height);
  }
}

/* ---------------- Page ---------------- */

export default function Page() {
  const [step, setStep] = useState<"queue" | "render">("queue");

  const [queued, setQueued] = useState<ArtworkQueued[]>([]);
  const [artworks, setArtworks] = useState<ArtworkProcessed[]>([]);

  const [bases, setBases] = useState<Record<RenderKey, HTMLImageElement | null>>(EMPTY_BASES);
  const [masks, setMasks] = useState<Record<RenderKey, HTMLImageElement | null>>(EMPTY_MASKS);
  const [sizeRefs, setSizeRefs] = useState<Record<RenderKey, HTMLImageElement | null>>(EMPTY_SIZE_REF);
  const [overlaysMap, setOverlaysMap] =
    useState<Record<RenderKey, HTMLImageElement[]>>(EMPTY_OVERLAYS);

  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // canvasRefs: artwork.id -> renderKey -> canvas element
  const canvasRefs = useRef<Record<string, Partial<Record<RenderKey, HTMLCanvasElement | null>>>>(
    {}
  );

  // Load all base/mask/overlays once
  useEffect(() => {
    (async () => {
      const nextBases: Record<RenderKey, HTMLImageElement | null> = { ...EMPTY_BASES };
      const nextMasks: Record<RenderKey, HTMLImageElement | null> = { ...EMPTY_MASKS };
      const nextSize: Record<RenderKey, HTMLImageElement | null> = { ...EMPTY_SIZE_REF };
      const nextOverlays: Record<RenderKey, HTMLImageElement[]> = { ...EMPTY_OVERLAYS };

      for (const r of RENDERS) {
        const base = r.baseSrc ? await loadImage(r.baseSrc) : null;
        const mask = r.maskSrc ? await loadImage(r.maskSrc) : null;
        const overlays = r.overlays ? await Promise.all(r.overlays.map(loadImage)) : [];

        nextBases[r.key] = base;
        nextMasks[r.key] = mask;
        nextOverlays[r.key] = overlays;

        // If base missing, we need a sizing reference (mask first, else first overlay)
        nextSize[r.key] = base || mask || overlays[0] || null;
      }

      setBases(nextBases);
      setMasks(nextMasks);
      setOverlaysMap(nextOverlays);
      setSizeRefs(nextSize);
    })().catch(console.error);
  }, []);

  function addToQueue(files: FileList | null) {
    if (!files) return;
    const incoming = Array.from(files).map((file) => ({ id: uid(), file }));
    setQueued((prev) => [...prev, ...incoming].slice(0, 30));
  }

  function removeFromQueue(id: string) {
    setQueued((prev) => prev.filter((x) => x.id !== id));
  }

  function clearQueue() {
    setQueued([]);
  }

  async function continueToRender() {
    if (!queued.length) return;
    setProcessing(true);
    try {
      const loaded: ArtworkProcessed[] = [];
      for (const item of queued) {
        const img = await fileToImage(item.file);
        loaded.push({
          id: item.id,
          file: item.file,
          img,
          handle: sanitizeHandle(item.file.name),
        });
      }
      setArtworks(loaded);
      setStep("render");
    } finally {
      setProcessing(false);
    }
  }

  async function exportZip() {
    if (!artworks.length) return;

    setExporting(true);
    try {
      const zip = new JSZip();

      for (const art of artworks) {
        const folder = zip.folder(art.handle);
        if (!folder) continue;

        for (const r of RENDERS) {
          const canvas = canvasRefs.current[art.id]?.[r.key] || null;
          const base = bases[r.key];
          const sizeRef = sizeRefs[r.key];
          if (!canvas || !sizeRef) continue;

          drawRender({
            outCanvas: canvas,
            base,
            sizeRef,
            art: art.img,
            box: r.box,
            mask: masks[r.key],
            overlays: overlaysMap[r.key],
          });

          const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
          folder.file(`${art.handle}_${r.key}.jpg`, dataUrl.split(",")[1], { base64: true });
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "renders.zip";
      a.click();

      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>TheFramewala — Batch Renderer</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Max 30 files per batch</div>
        </div>

        {step === "render" ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => {
                setStep("queue");
                setArtworks([]);
              }}
              style={{ height: 36, padding: "0 14px" }}
            >
              Back to list
            </button>

            <button
              onClick={exportZip}
              disabled={!artworks.length || exporting}
              style={{ height: 36, padding: "0 14px" }}
            >
              {exporting ? "Exporting…" : "Export All"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={clearQueue}
              disabled={!queued.length}
              style={{ height: 36, padding: "0 14px" }}
            >
              Clear
            </button>
            <button
              onClick={continueToRender}
              disabled={!queued.length || processing}
              style={{ height: 36, padding: "0 14px" }}
            >
              {processing ? "Processing…" : "Continue"}
            </button>
          </div>
        )}
      </div>

      {step === "queue" ? (
        <section style={{ marginTop: 18 }}>
          <input type="file" accept="image/*" multiple onChange={(e) => addToQueue(e.target.files)} />

          <div style={{ marginTop: 10, border: "1px solid #ddd", borderRadius: 6 }}>
            {queued.length ? (
              queued.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    borderBottom: "1px solid #eee",
                    alignItems: "center",
                  }}
                >
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={item.file.name}
                    >
                      {item.file.name}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.65 }}>
                      {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromQueue(item.id)}
                    style={{ height: 30, padding: "0 10px" }}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: 14, fontSize: 13, opacity: 0.7 }}>
                Upload files to create a batch.
              </div>
            )}
          </div>
        </section>
      ) : (
        <section style={{ marginTop: 18 }}>
          {artworks.map((art) => (
            <section key={art.id} style={{ marginTop: 22 }}>
              <h3 style={{ margin: "0 0 10px" }}>{art.file.name}</h3>

              {/* 7 columns; wraps automatically */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(180px, 1fr))",
                  gap: 12,
                }}
              >
                {RENDERS.map((r) => {
                  const outName = `${art.handle}_${r.key}.jpg`;
                  canvasRefs.current[art.id] ??= {};

                  return (
                    <div key={r.key} style={{ border: "1px solid #ccc", background: "#fff" }}>
                      <div
                        title={outName}
                        style={{
                          padding: 8,
                          fontSize: 12,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {outName}
                      </div>

                      <canvas
                        ref={(el) => {
                          canvasRefs.current[art.id]![r.key] = el;

                          const sizeRef = sizeRefs[r.key];
                          if (el && sizeRef) {
                            drawRender({
                              outCanvas: el,
                              base: bases[r.key],
                              sizeRef,
                              art: art.img,
                              box: r.box,
                              mask: masks[r.key],
                              overlays: overlaysMap[r.key],
                            });
                          }
                        }}
                        style={{ width: "100%", aspectRatio: "1/1", display: "block" }}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </section>
      )}
    </main>
  );
}