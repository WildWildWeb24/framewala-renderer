"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import styles from "./DashboardLayout.module.css";

type Orientation = "portrait" | "square" | "landscape";
type Size = "ai" | "original";
type Step = "home" | "upload" | "adjust";

interface DashboardLayoutProps {
  children: ReactNode;
  currentStep: Step;
  orientation: Orientation | null;
  size: Size | null;
  onNavigate: (step: Step) => void;
  onSelectOrientation: (orientation: Orientation, size: Size) => void;
}

export default function DashboardLayout({
  children,
  currentStep,
  orientation,
  size,
  onNavigate,
  onSelectOrientation,
}: DashboardLayoutProps) {
  const getHeaderText = () => {
    if (!orientation || !size) return "";
    const orientationText =
      orientation.charAt(0).toUpperCase() + orientation.slice(1);
    const sizeText = size === "ai" ? "AI Size" : "Original Size";
    return `${orientationText} ${sizeText}`;
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar
        currentStep={currentStep}
        orientation={orientation}
        size={size}
        onNavigate={onNavigate}
        onSelectOrientation={onSelectOrientation}
      />
      <main className={styles.main}>
        {orientation && size && (
          <header className={styles.header}>
            <div className={styles.headerText}>{getHeaderText()}</div>
          </header>
        )}
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
