"use client";

import { useState } from "react";
import styles from './Settings.module.css';

export default function SettingsPage() {
  const [network, setNetwork] = useState("devnet");

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Configurações</h2>
      <label className={styles.label}>
        <span className={styles.labelText}>Rede:</span>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          className={styles.select}
        >
          <option value="devnet">Devnet</option>
          <option value="mainnet-beta">Mainnet</option>
        </select>
      </label>
    </div>
  );
}
