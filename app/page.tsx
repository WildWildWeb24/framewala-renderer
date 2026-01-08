"use client";

import { useState, useMemo } from "react";
import JSZip from "jszip";
import DashboardLayout from "./components/DashboardLayout";
import WelcomeScreen from "./components/WelcomeScreen";
import UploadScreen, { type UploadedFile } from "./components/UploadScreen";
import AdjustmentScreen from "./components/AdjustmentScreen";

/* =========================
   TYPES
========================= */

type Orientation = "portrait" | "square" | "landscape";
type Size = "ai" | "original";
type Step = "home" | "upload" | "adjust";

type Box = { x: number; y: number; w: number; h: number };

type RenderConfig = {
  key: string;
  base: string;
  mask?: string;
  fold?: string;
  box: Box;
};

/* =========================
   CONSTANTS
========================= */

const BOX_FRAMES: Box = { x: 513, y: 255, w: 1004, h: 1502 };
const BOX_CANVAS: Box = { x: 513, y: 253, w: 1003, h: 1502 };
const BOX_ROLLED: Box = { x: 513, y: 253, w: 1003, h: 1502 };

const getFramePath = (size: Size, filename: string) =>
  `/frames/portriat/${size === "ai" ? "ai" : "og"}/${filename}`;

const getFrameSrc = (size: Size, name: string) =>
  getFramePath(size, `${size === "ai" ? "ai" : "og"}-${name}.jpg`);

const getFrameMask = (size: Size) =>
  getFramePath(size, `${size === "ai" ? "ai" : "og"}-frame-mask.png`);

const RENDERS = (size: Size): RenderConfig[] => [
  { key: "white-mount", base: getFrameSrc(size, "white-mount"), mask: getFrameMask(size), box: BOX_FRAMES },
  { key: "white-nomount", base: getFrameSrc(size, "white-nomount"), mask: getFrameMask(size), box: BOX_FRAMES },
  { key: "black-mount", base: getFrameSrc(size, "black-mount"), mask: getFrameMask(size), box: BOX_FRAMES },
  { key: "black-nomount", base: getFrameSrc(size, "black-nomount"), mask: getFrameMask(size), box: BOX_FRAMES },
  { key: "wood-mount", base: getFrameSrc(size, "wood-mount"), mask: getFrameMask(size), box: BOX_FRAMES },
  { key: "wood-nomount", base: getFrameSrc(size, "wood-nomount"), mask: getFrameMask(size), box: BOX_FRAMES },
  {
    key: "canvas",
    base: getFrameSrc(size, "canvas"),
    mask: getFramePath(size, `${size === "ai" ? "ai" : "og"}-canvas-mask.png`),
    box: BOX_CANVAS,
  },
  {
    key: "rolled-paper",
    base: getFramePath(size, `${size === "ai" ? "ai" : "og"}-rolled-paper-base.png`), 
    fold: getFramePath(size, `${size === "ai" ? "ai" : "og"}-rolled-paper-fold.png`),
    mask: getFramePath(size, `${size === "ai" ? "ai" : "og"}-rolled-paper-mask.png`),
    box: BOX_ROLLED,
  },
  {
    key: "rolled-canvas",
    base: getFramePath(size, `${size === "ai" ? "ai" : "og"}-rolled-canvas-base.png`),
    fold: getFramePath(size, `${size === "ai" ? "ai" : "og"}-rolled-canvas-fold.png`),
    mask: getFramePath(size, `${size === "ai" ? "ai" : "og"}-rolled-canvas-mask.png`),
    box: BOX_ROLLED,
  },
];

/* =========================
   HELPERS
========================= */

const fileToImage = (file: File) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });

const sanitize = (n: string) =>
  n.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

/* =========================
   PAGE
========================= */

export default function Page() {
  const [currentStep, setCurrentStep] = useState<Step>("home");
  const [orientation, setOrientation] = useState<Orientation | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const renders = useMemo(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:109',message:'renders memo recalculated',data:{size,rendersCount:size?RENDERS(size).length:0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!size) return [];
    const renderList = RENDERS(size);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:114',message:'RENDER paths generated',data:{size,renders:renderList.map(r=>({key:r.key,base:r.base,mask:r.mask,fold:r.fold}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return renderList;
  }, [size]);

  const handleNavigate = (step: Step) => {
    if (step === "upload" && (!orientation || !size)) {
      // Can't go to upload without selecting orientation/size
      return;
    }
    setCurrentStep(step);
  };

  const handleSelectOrientation = (newOrientation: Orientation, newSize: Size) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:119',message:'handleSelectOrientation called',data:{newOrientation,newSize,currentStep,currentSize:size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    setOrientation(newOrientation);
    setSize(newSize);
    setCurrentStep("upload");
  };

  const handleUpload = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    const fileArray = Array.from(fileList).slice(0, 30);

    for (const file of fileArray) {
      const img = await fileToImage(file);
      const handle = sanitize(file.name);
      newFiles.push({
        file,
        img,
        handle,
        adjustments: {
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
        },
        fileName: handle,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProceedToAdjust = () => {
    if (files.length > 0) {
      setCurrentStep("adjust");
    }
  };

  const handleUpdateFile = (index: number, updates: Partial<UploadedFile>) => {
    setFiles((prev) =>
      prev.map((file, i) => (i === index ? { ...file, ...updates } : file))
    );
  };

  const handleExport = async (filesToExport: UploadedFile[]) => {
    if (!size || filesToExport.length === 0) return;

    const zip = new JSZip();
    const rendersList = RENDERS(size);

    // Create a temporary canvas for each render
    for (const fileItem of filesToExport) {
      for (const render of rendersList) {
        try {
          // Load all required images
          const base = await loadImage(render.base);
          const mask = render.mask ? await loadImage(render.mask) : undefined;
          const fold = render.fold ? await loadImage(render.fold) : undefined;

          // Create canvas and render
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;
          canvas.width = base.naturalWidth;
          canvas.height = base.naturalHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(base, 0, 0);

          // Apply adjustments
          const r =
            Math.min(render.box.w / fileItem.img.naturalWidth, render.box.h / fileItem.img.naturalHeight) *
            fileItem.adjustments.scale;
          const w = fileItem.img.naturalWidth * r;
          const h = fileItem.img.naturalHeight * r;
          const x = render.box.x + (render.box.w - w) / 2 + fileItem.adjustments.offsetX;
          const y = render.box.y + (render.box.h - h) / 2 + fileItem.adjustments.offsetY;

          ctx.save();
          if (mask) {
            const tmp = document.createElement("canvas");
            tmp.width = canvas.width;
            tmp.height = canvas.height;
            const tctx = tmp.getContext("2d")!;
            // Draw the scaled user image
            tctx.drawImage(fileItem.img, x, y, w, h);
            // Apply mask at canvas size (not scaled) - mask should match frame dimensions
            tctx.globalCompositeOperation = "destination-in";
            tctx.drawImage(mask, 0, 0, tmp.width, tmp.height);
            ctx.drawImage(tmp, 0, 0);
          } else {
            ctx.drawImage(fileItem.img, x, y, w, h);
          }
          ctx.restore();

          if (fold) ctx.drawImage(fold, 0, 0);

          // Add to zip
          const fileName = fileItem.fileName || fileItem.handle;
          zip.file(
            `${fileName}_${render.key}.jpg`,
            canvas.toDataURL("image/jpeg", 0.92).split(",")[1],
            { base64: true }
          );
        } catch (error) {
          console.error(`Error rendering ${fileItem.file.name} for ${render.key}:`, error);
        }
      }
    }

    // Download zip
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "framewala-renders.zip";
    a.click();
  };

  return (
    <DashboardLayout
      currentStep={currentStep}
      orientation={orientation}
      size={size}
      onNavigate={handleNavigate}
      onSelectOrientation={handleSelectOrientation}
    >
      {currentStep === "home" && <WelcomeScreen />}
      {currentStep === "upload" && (
        <UploadScreen
          files={files}
          onUpload={handleUpload}
          onRemove={handleRemove}
          onProceed={handleProceedToAdjust}
        />
      )}
      {currentStep === "adjust" && size && (
        <AdjustmentScreen
          files={files}
          renders={renders}
          onBack={() => setCurrentStep("upload")}
          onExport={handleExport}
          onUpdateFile={handleUpdateFile}
        />
      )}
    </DashboardLayout>
  );
}
