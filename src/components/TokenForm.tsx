"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateToken } from "@/hooks/useCreateToken";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import styles from "./TokenForm.module.css";

export default function TokenForm() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { createToken, isLoading, error } = useCreateToken();

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // link final
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setImageUrl(reader.result as string); // base64 temporário
      };
      reader.readAsDataURL(file);
    }
  };

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
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
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
      <div className={styles.field}>
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
      <div className={styles.field}>
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
      <div className={styles.field}>
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

      <div className={styles.field}>
        <Label htmlFor="imageFile">Imagem do Token</Label>
        <input
          id="imageFile"
          type="file"
          accept="image/*"
          className={styles.squareInput}
          onChange={handleImageUpload}
        />
        {preview && (
          <div className={styles.preview}>
            <img src={preview} alt="Preview" />
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading || !publicKey}>
        {isLoading ? "Criando..." : "Criar Token"}
      </Button>

      {!publicKey && <p className={styles.warning}>Conecte sua carteira para criar um token.</p>}
    </form>
  );
}
