"use client";

import styles from "./Sidebar.module.css";

type Orientation = "portrait" | "square" | "landscape";
type Size = "ai" | "original";

interface SidebarProps {
  currentStep: "home" | "upload" | "adjust";
  orientation: Orientation | null;
  size: Size | null;
  onNavigate: (step: "home" | "upload" | "adjust") => void;
  onSelectOrientation: (orientation: Orientation, size: Size) => void;
}

export default function Sidebar({
  currentStep,
  orientation,
  size,
  onNavigate,
  onSelectOrientation,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/logo.svg" alt="Framewala logo" className={styles.logoImage} />
      </div>
      <nav className={styles.nav}>
        <button
          className={`${styles.navItem} ${currentStep === "home" ? styles.active : ""}`}
          onClick={() => onNavigate("home")}
        >
          Home
        </button>
        <div className={styles.category}>
          <div className={styles.categoryLabel}>Portrait</div>
          <button
            className={`${styles.subItem} ${orientation === "portrait" && size === "ai" ? styles.active : ""}`}
            onClick={() => onSelectOrientation("portrait", "ai")}
          >
            AI Size
          </button>
          <button
            className={`${styles.subItem} ${orientation === "portrait" && size === "original" ? styles.active : ""}`}
            onClick={() => onSelectOrientation("portrait", "original")}
          >
            Original Size
          </button>
        </div>
        <div className={styles.category}>
          <div className={styles.categoryLabel}>Square</div>
          <button
            className={`${styles.subItem} ${orientation === "square" && size === "ai" ? styles.active : ""}`}
            onClick={() => onSelectOrientation("square", "ai")}
          >
            AI Size
          </button>
          <button
            className={`${styles.subItem} ${orientation === "square" && size === "original" ? styles.active : ""}`}
            onClick={() => onSelectOrientation("square", "original")}
          >
            Original Size
          </button>
        </div>
        <div className={styles.category}>
          <div className={styles.categoryLabel}>Landscape</div>
          <button
            className={`${styles.subItem} ${orientation === "landscape" && size === "ai" ? styles.active : ""}`}
            onClick={() => onSelectOrientation("landscape", "ai")}
          >
            AI Size
          </button>
          <button
            className={`${styles.subItem} ${orientation === "landscape" && size === "original" ? styles.active : ""}`}
            onClick={() => onSelectOrientation("landscape", "original")}
          >
            Original Size
          </button>
        </div>
      </nav>
    </aside>
  );
}
