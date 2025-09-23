"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateToken } from "@/hooks/useCreateToken";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function TokenForm() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { createToken, isLoading, error } = useCreateToken();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert("Por favor, conecte sua carteira primeiro.");
      return;
    }

    const tokenData = {
      name,
      symbol,
      decimals,
      supply: Number(supply),
      imageUrl,
    };
    
    const result = await createToken(tokenData);

    if (result) {
      router.push(`/confirmation?status=success&tokenAddress=${result.tokenAddress}`);
    } else {
      router.push(`/confirmation?status=error&error=${error}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Token</Label>
        <Input
          id="name"
          type="text"
          placeholder="Ex: Meu Token"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="symbol">Símbolo</Label>
        <Input
          id="symbol"
          type="text"
          placeholder="Ex: MEU (máx 8)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          maxLength={8}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="decimals">Decimais</Label>
        <Input
          id="decimals"
          type="number"
          placeholder="Ex: 9"
          value={decimals}
          onChange={(e) => setDecimals(Number(e.target.value))}
          min={0}
          max={9}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supply">Fornecimento Total</Label>
        <Input
          id="supply"
          type="number"
          placeholder="Ex: 1000000"
          value={supply}
          onChange={(e) => setSupply(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL da Imagem</Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://exemplo.com/imagem.png"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || !publicKey}>
        {isLoading ? "Criando..." : "Criar Token"}
      </Button>

      {!publicKey && <p className="text-center text-sm text-yellow-600">Conecte sua carteira para criar um token.</p>}
    </form>
  );
}
