"use client";

import styles from "./WelcomeScreen.module.css";

export default function WelcomeScreen() {
  return (
    <div className={styles.welcomeCard}>
      <h1 className={styles.welcomeTitle}>
        Welcome to the
        <br />
        product image
        <br />
        exporter application
      </h1>
    </div>
  );
}
