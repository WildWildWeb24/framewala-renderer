"use client";

import { useState } from "react";
import ImageAdjustments from "./ImageAdjustments";
import FramePreviewGrid from "./FramePreviewGrid";
import styles from "./AdjustmentScreen.module.css";
import type { UploadedFile } from "./UploadScreen";

type RenderConfig = {
  key: string;
  base: string;
  mask?: string;
  fold?: string;
  box: { x: number; y: number; w: number; h: number };
};

interface AdjustmentScreenProps {
  files: UploadedFile[];
  renders: RenderConfig[];
  onBack: () => void;
  onExport: (files: UploadedFile[]) => void;
  onUpdateFile: (index: number, updates: Partial<UploadedFile>) => void;
}

export default function AdjustmentScreen({
  files,
  renders,
  onBack,
  onExport,
  onUpdateFile,
}: AdjustmentScreenProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const currentFile = files[currentImageIndex];

  const handleAdjustmentChange = (
    field: "scale" | "offsetX" | "offsetY" | "fileName",
    value: number | string
  ) => {
    if (!currentFile) return;

    const updates: Partial<UploadedFile> = {
      adjustments: {
        ...currentFile.adjustments,
        ...(field !== "fileName" && {
          [field]: value as number,
        }),
      },
      ...(field === "fileName" && { fileName: value as string }),
    };

    onUpdateFile(currentImageIndex, updates);
  };

  if (!currentFile) {
    return null;
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          Back to Uploads
        </button>
        <button className={styles.exportButton} onClick={() => onExport(files)}>
          Export Zip File
        </button>
      </div>

      {files.length > 1 && (
        <div className={styles.imageNavigation}>
          <button
            className={styles.navButton}
            onClick={() =>
              setCurrentImageIndex((prev) =>
                prev > 0 ? prev - 1 : files.length - 1
              )
            }
            disabled={files.length <= 1}
          >
            ← Previous
          </button>
          <span className={styles.imageCounter}>
            {currentImageIndex + 1} of {files.length}
          </span>
          <button
            className={styles.navButton}
            onClick={() =>
              setCurrentImageIndex((prev) =>
                prev < files.length - 1 ? prev + 1 : 0
              )
            }
            disabled={files.length <= 1}
          >
            Next →
          </button>
        </div>
      )}

      <ImageAdjustments
        fileName={currentFile.fileName}
        scale={currentFile.adjustments.scale}
        offsetX={currentFile.adjustments.offsetX}
        offsetY={currentFile.adjustments.offsetY}
        onFileNameChange={(value) => handleAdjustmentChange("fileName", value)}
        onScaleChange={(value) => handleAdjustmentChange("scale", value)}
        onOffsetXChange={(value) => handleAdjustmentChange("offsetX", value)}
        onOffsetYChange={(value) => handleAdjustmentChange("offsetY", value)}
      />

      <FramePreviewGrid
        renders={renders}
        image={currentFile.img}
        adjustments={currentFile.adjustments}
        fileName={currentFile.fileName || currentFile.file.name}
        onRender={(
          canvas,
          base,
          art,
          box,
          adjustments,
          mask,
          fold
        ) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdjustmentScreen.tsx:124',message:'onRender called - start',data:{baseWidth:base.naturalWidth,baseHeight:base.naturalHeight,artWidth:art.naturalWidth,artHeight:art.naturalHeight,box,adjustments,canvasWidthBefore:canvas.width,canvasHeightBefore:canvas.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          const ctx = canvas.getContext("2d")!;
          canvas.width = base.naturalWidth;
          canvas.height = base.naturalHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(base, 0, 0);

          // Apply scale
          const r =
            Math.min(box.w / art.naturalWidth, box.h / art.naturalHeight) *
            adjustments.scale;
          const w = art.naturalWidth * r;
          const h = art.naturalHeight * r;

          // Apply offsets
          const x = box.x + (box.w - w) / 2 + adjustments.offsetX;
          const y = box.y + (box.h - h) / 2 + adjustments.offsetY;
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdjustmentScreen.tsx:140',message:'onRender calculated positions',data:{r,w,h,x,y,canvasWidthAfter:canvas.width,canvasHeightAfter:canvas.height},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion

          ctx.save();
          if (mask) {
            const tmp = document.createElement("canvas");
            tmp.width = canvas.width;
            tmp.height = canvas.height;
            const tctx = tmp.getContext("2d")!;
            // Draw the scaled art image
            tctx.drawImage(art, x, y, w, h);
            // Apply mask at canvas size (not scaled) - mask should match frame dimensions
            tctx.globalCompositeOperation = "destination-in";
            tctx.drawImage(mask, 0, 0, tmp.width, tmp.height);
            ctx.drawImage(tmp, 0, 0);
          } else {
            ctx.drawImage(art, x, y, w, h);
          }
          ctx.restore();

          if (fold) ctx.drawImage(fold, 0, 0);
        }}
      />
    </div>
  );
}
