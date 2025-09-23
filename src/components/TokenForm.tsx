"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCreateToken } from "@/hooks/useCreateToken";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import styles from "@/components/TokenForm.module.css";

export default function TokenForm() {
  const router = useRouter();
  const { publicKey } = useWallet();
  const { createToken, isLoading, error } = useCreateToken();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [supply, setSupply] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
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

    // Validação da URL da imagem
    if (!imageUrl || !imageUrl.startsWith('http')) {
      alert("A URL da imagem deve ser um link público (http://... ou https://...). Por favor, hospede a imagem e cole o link direto.");
      return;
    }

    const tokenData = {
      name,
      symbol,
      decimals,
      supply: Number(supply),
      imageUrl,
    };

    await createToken(tokenData);
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
          placeholder="Ex: MEU (máx 10)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          maxLength={10}
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
        <Label htmlFor="imageUrl">URL da Imagem do Token</Label>
        <p className={styles.helperText}>
            Hospede sua imagem em um serviço como o{' '}
            <a href="https://imgur.com/upload" target="_blank" rel="noopener noreferrer">
              Imgur
            </a>{' '}
            e cole a URL pública abaixo.
        </p>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://i.imgur.com/seu-logo.png"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageFileChange}
          accept="image/png, image/jpeg, image/gif"
          style={{ display: 'none' }}
        />
        <Button 
            type="button" 
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
        >
            Fazer upload para pré-visualizar
        </Button>
        
         {(imagePreview || imageUrl) && (
          <div className={styles.preview}>
            <img src={imagePreview || imageUrl} alt="Preview do token" />
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading || !publicKey}>
        {isLoading ? "Criando..." : "Criar Token"}
      </Button>

      {!publicKey && <p className={styles.warning}>Conecte sua carteira para criar um token.</p>}
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

