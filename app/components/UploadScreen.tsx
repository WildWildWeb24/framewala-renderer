"use client";

import { useRef } from "react";
import styles from "./UploadScreen.module.css";

export interface UploadedFile {
  file: File;
  img: HTMLImageElement;
  handle: string;
  adjustments: {
    scale: number;
    offsetX: number;
    offsetY: number;
  };
  fileName: string;
}

interface UploadScreenProps {
  files: UploadedFile[];
  onUpload: (files: FileList) => void;
  onRemove: (index: number) => void;
  onProceed: () => void;
}

export default function UploadScreen({
  files,
  onUpload,
  onRemove,
  onProceed,
}: UploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(e.target.files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <button className={styles.uploadButton} onClick={handleUploadClick}>
          Upload Artwork
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {files.length > 0 && (
          <button className={styles.proceedButton} onClick={onProceed}>
            Proceed to Adjust
          </button>
        )}
      </div>

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((item, index) => (
            <div key={index} className={styles.fileItem}>
              <div className={styles.thumbnail}>
                <img src={item.img.src} alt={item.file.name} />
              </div>
              <div className={styles.fileName}>{item.file.name}</div>
              <button
                className={styles.removeButton}
                onClick={() => onRemove(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
