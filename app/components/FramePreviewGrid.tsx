"use client";

import { useEffect, useRef } from "react";
import styles from "./FramePreviewGrid.module.css";

type RenderConfig = {
  key: string;
  base: string;
  mask?: string;
  fold?: string;
  box: { x: number; y: number; w: number; h: number };
};

interface FramePreviewGridProps {
  renders: RenderConfig[];
  image: HTMLImageElement;
  adjustments: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  fileName: string;
  onRender: (
    canvas: HTMLCanvasElement,
    base: HTMLImageElement,
    art: HTMLImageElement,
    box: { x: number; y: number; w: number; h: number },
    adjustments: { scale: number; offsetX: number; offsetY: number },
    mask?: HTMLImageElement,
    fold?: HTMLImageElement
  ) => void;
}

export default function FramePreviewGrid({
  renders,
  image,
  adjustments,
  fileName,
  onRender,
}: FramePreviewGridProps) {
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const imageCache = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:44',message:'useEffect triggered - renders changed',data:{rendersCount:renders.length,renderKeys:renders.map(r=>r.key),firstRenderBase:renders[0]?.base,imageCacheKeys:Object.keys(imageCache.current)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Wait for next tick to ensure canvas refs are set
    const timeoutId = setTimeout(() => {
      const renderAll = async () => {
        try {
          // Helper to normalize URLs for comparison and cache keys (extract pathname from full URL or return as-is)
          const normalizeUrl = (url: string) => {
            try {
              if (url.startsWith('http')) {
                return new URL(url).pathname;
              }
              return url;
            } catch {
              return url;
            }
          };
          
          for (const render of renders) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:64',message:'Processing render config',data:{renderKey:render.key,base:render.base,mask:render.mask,fold:render.fold,hasCanvas:!!canvasRefs.current[render.key]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            const canvas = canvasRefs.current[render.key];
            if (!canvas) {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:67',message:'Canvas not found - skipping',data:{renderKey:render.key},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
              continue;
            }

          // Load base image - use normalized source URL in cache key to prevent AI/OG collisions
          const normalizedBase = normalizeUrl(render.base);
          const cacheKey = `${render.key}-base-${normalizedBase.replace(/[^a-z0-9]/gi, '-')}`;
          const cachedImage = imageCache.current[cacheKey];
          
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:75',message:'Checking cache for base image',data:{renderKey:render.key,cacheKey,hasCache:!!cachedImage,src:render.base,normalizedBase},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          if (!cachedImage) {
            // Not cached - load new image
            const baseImg = new Image();
            baseImg.crossOrigin = "anonymous";
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:80',message:'Starting base image load',data:{renderKey:render.key,src:render.base},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            await new Promise<void>((resolve, reject) => {
              baseImg.onload = () => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:85',message:'Base image loaded successfully',data:{renderKey:render.key,src:baseImg.src,width:baseImg.naturalWidth,height:baseImg.naturalHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                resolve();
              };
              baseImg.onerror = (error) => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:91',message:'Base image load FAILED',data:{renderKey:render.key,src:render.base,attemptedSrc:baseImg.src,errorType:error?.type,errorMessage:error?.message||String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                reject(new Error(`Failed to load base image for ${render.key} from ${render.base}`));
              };
              baseImg.src = render.base;
            });
            imageCache.current[cacheKey] = baseImg;
          }
          
          // Get base image from cache (either was cached or just loaded)
          const baseImg = imageCache.current[cacheKey];

        // Load mask if needed - gracefully handle missing files
        let maskImg: HTMLImageElement | undefined;
        if (render.mask) {
          const normalizedMask = normalizeUrl(render.mask);
          const maskCacheKey = `${render.key}-mask-${normalizedMask.replace(/[^a-z0-9]/gi, '-')}`;
          const cachedMask = imageCache.current[maskCacheKey];
          
          if (!cachedMask) {
            try {
              const mask = new Image();
              mask.crossOrigin = "anonymous";
              await new Promise<void>((resolve, reject) => {
                mask.onload = () => resolve();
                mask.onerror = (error) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:120',message:'Mask image load error - continuing without mask',data:{renderKey:render.key,src:render.mask},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                  reject(error);
                };
                mask.src = render.mask!;
              });
              imageCache.current[maskCacheKey] = mask;
              maskImg = mask;
            } catch (error) {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:131',message:'Mask image failed to load - rendering without mask',data:{renderKey:render.key,src:render.mask},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              // Continue without mask - rendering code handles undefined masks
              maskImg = undefined;
            }
          } else {
            maskImg = cachedMask;
          }
        }

        // Load fold if needed - gracefully handle missing files
        let foldImg: HTMLImageElement | undefined;
        if (render.fold) {
          const normalizedFold = normalizeUrl(render.fold);
          const foldCacheKey = `${render.key}-fold-${normalizedFold.replace(/[^a-z0-9]/gi, '-')}`;
          const cachedFold = imageCache.current[foldCacheKey];
          
          if (!cachedFold) {
            try {
              const fold = new Image();
              fold.crossOrigin = "anonymous";
              await new Promise<void>((resolve, reject) => {
                fold.onload = () => resolve();
                fold.onerror = (error) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:149',message:'Fold image load error - continuing without fold',data:{renderKey:render.key,src:render.fold},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                  reject(error);
                };
                fold.src = render.fold!;
              });
              imageCache.current[foldCacheKey] = fold;
              foldImg = fold;
            } catch (error) {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:160',message:'Fold image failed to load - rendering without fold',data:{renderKey:render.key,src:render.fold},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              // #endregion
              // Continue without fold - rendering code handles undefined folds
              foldImg = undefined;
            }
          } else {
            foldImg = cachedFold;
          }
        }

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:96',message:'Calling onRender',data:{renderKey:render.key,baseSrc:baseImg?.src,baseWidth:baseImg?.naturalWidth,baseHeight:baseImg?.naturalHeight,artWidth:image.naturalWidth,artHeight:image.naturalHeight,adjustments,box:render.box},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        onRender(
          canvas,
          baseImg,
          image,
          render.box,
          adjustments,
          maskImg,
          foldImg
        );
        }
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:195',message:'renderAll error caught - CRITICAL',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined,errorType:error?.constructor?.name,errorString:String(error),rendersCount:renders.length,rendersProcessed:renders.map(r=>r.key)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          console.error('Error rendering frames:', error);
        }
      };

      renderAll().catch((error) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/a2ba74e0-5be9-4be7-bb35-dd5617d1c00e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FramePreviewGrid.tsx:137',message:'renderAll promise rejection caught',data:{error:String(error),stack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Error in renderAll:', error);
      });
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [renders, image, adjustments, onRender]);

  return (
    <div className={styles.grid}>
      {renders.map((render) => (
        <div key={render.key} className={styles.previewItem}>
          <div className={styles.previewLabel}>{fileName || "<file name>"}</div>
          <canvas
            ref={(el) => {
              canvasRefs.current[render.key] = el;
            }}
            className={styles.canvas}
          />
        </div>
      ))}
    </div>
  );
}
