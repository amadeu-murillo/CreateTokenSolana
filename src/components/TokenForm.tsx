"use client";

import { useState } from "react";

export default function TokenForm() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ name, symbol, decimals, supply, imageUrl });
    alert("Validação OK - integração Solana vem aqui 🚀");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 bg-white p-6 rounded-lg shadow"
    >
      <input
        type="text"
        placeholder="Nome do Token"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="text"
        placeholder="Símbolo (máx 8)"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        maxLength={8}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        placeholder="Decimais"
        value={decimals}
        onChange={(e) => setDecimals(Number(e.target.value))}
        min={0}
        max={9}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        placeholder="Fornecimento Total"
        value={supply}
        onChange={(e) => setSupply(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="url"
        placeholder="URL da Imagem"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Criar
      </button>
    </form>
  );
}
