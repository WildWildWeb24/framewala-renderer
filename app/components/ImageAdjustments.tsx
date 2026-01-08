"use client";

import styles from "./ImageAdjustments.module.css";

interface ImageAdjustmentsProps {
  fileName: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  onFileNameChange: (fileName: string) => void;
  onScaleChange: (scale: number) => void;
  onOffsetXChange: (offsetX: number) => void;
  onOffsetYChange: (offsetY: number) => void;
}

export default function ImageAdjustments({
  fileName,
  scale,
  offsetX,
  offsetY,
  onFileNameChange,
  onScaleChange,
  onOffsetXChange,
  onOffsetYChange,
}: ImageAdjustmentsProps) {
  return (
    <div className={styles.adjustments}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>Scale</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.01"
              value={scale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              className={styles.slider}
            />
            <input
              type="number"
              min="0.5"
              max="2.0"
              step="0.01"
              value={scale.toFixed(2)}
              onChange={(e) => onScaleChange(parseFloat(e.target.value) || 1.0)}
              className={styles.numberInput}
            />
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>X Axis</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="-200"
              max="200"
              step="1"
              value={offsetX}
              onChange={(e) => onOffsetXChange(parseInt(e.target.value))}
              className={styles.slider}
            />
            <input
              type="number"
              min="-200"
              max="200"
              step="1"
              value={offsetX}
              onChange={(e) => onOffsetXChange(parseInt(e.target.value) || 0)}
              className={styles.numberInput}
            />
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.label}>Y Axis</label>
          <div className={styles.sliderContainer}>
            <input
              type="range"
              min="-200"
              max="200"
              step="1"
              value={offsetY}
              onChange={(e) => onOffsetYChange(parseInt(e.target.value))}
              className={styles.slider}
            />
            <input
              type="number"
              min="-200"
              max="200"
              step="1"
              value={offsetY}
              onChange={(e) => onOffsetYChange(parseInt(e.target.value) || 0)}
              className={styles.numberInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.fileNameGroup}>
        <label className={styles.label}>File name</label>
        <input
          type="text"
          value={fileName}
          onChange={(e) => onFileNameChange(e.target.value)}
          className={styles.fileNameInput}
          placeholder="Enter file name"
        />
      </div>
    </div>
  );
}
