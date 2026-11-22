"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface AffiliateQrCodeProps {
  value: string;
  size?: number;
  label: string;
}

export default function AffiliateQrCode({ value, size = 148, label }: AffiliateQrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    if (!canvasRef.current || !value) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 1,
        color: { dark: "#09090B", light: "#FFFFFF" },
      },
      (err) => {
        if (active && err) setFailed(true);
      }
    );

    return () => {
      active = false;
    };
  }, [value, size]);

  if (failed) return null;

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      style={{ borderRadius: "0.75rem", background: "#ffffff", display: "block" }}
    />
  );
}
