"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [network, setNetwork] = useState("devnet");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Configurações</h2>
      <label className="block">
        <span className="text-gray-700">Rede:</span>
        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          className="ml-2 border rounded p-1"
        >
          <option value="devnet">Devnet</option>
          <option value="mainnet-beta">Mainnet</option>
        </select>
      </label>
    </div>
  );
}
