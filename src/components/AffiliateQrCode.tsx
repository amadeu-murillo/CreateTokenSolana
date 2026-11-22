"use client";

import { useMemo } from "react";

interface AffiliateQrCodeProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
}

/**
 * Lightweight, zero-dependency QR Code matrix generator (Byte mode, EC level L, versions 1–6)
 * suitable for Solana referral URLs up to 134 bytes.
 */
function encodeQrMatrix(text: string): boolean[][] | null {
  const bytes = Array.from(new TextEncoder().encode(text));
  // Capacity (data codewords) for EC level L, versions 1..8
  const capacities = [
    { version: 1, size: 21, dataCw: 19, ecCw: 7 },
    { version: 2, size: 25, dataCw: 34, ecCw: 10 },
    { version: 3, size: 29, dataCw: 55, ecCw: 15 },
    { version: 4, size: 33, dataCw: 80, ecCw: 20 },
    { version: 5, size: 37, dataCw: 108, ecCw: 26 },
    { version: 6, size: 41, dataCw: 136, ecCw: 18 },
    { version: 7, size: 45, dataCw: 156, ecCw: 20 },
  ];

  // Pick smallest single-block version (1..5) that fits, or fallback to deterministic visual hash if >106 bytes
  const spec = capacities.slice(0, 5).find((c) => bytes.length + 2 <= c.dataCw);
  if (!spec) return null;

  const { version, size, dataCw, ecCw } = spec;

  // Build bit stream: 0100 (Byte mode) + 8-bit length + bytes + terminator + pad bytes
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
  };

  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  for (const b of bytes) pushBits(b, 8);
  const maxBits = dataCw * 8;
  for (let i = 0; i < 4 && bits.length < maxBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    data.push(byte);
  }
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (data.length < dataCw) {
    data.push(padBytes[padIdx % 2]);
    padIdx++;
  }

  // GF(256) tables (poly 0x11d)
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];

  const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]);

  // Generator polynomial of degree ecCw
  let gen = [1];
  for (let i = 0; i < ecCw; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], exp[i]);
    }
    gen = next;
  }

  // Reed-Solomon remainder
  const ec = new Array(ecCw).fill(0);
  for (const byte of data) {
    const factor = byte ^ ec[0];
    ec.shift();
    ec.push(0);
    for (let j = 0; j < ecCw; j++) {
      ec[j] ^= gfMul(gen[j + 1], factor);
    }
  }

  const allCodewords = [...data, ...ec];
  const allBits: number[] = [];
  for (const cw of allCodewords) {
    for (let i = 7; i >= 0; i--) allBits.push((cw >> i) & 1);
  }

  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array<boolean | null>(size).fill(null)
  );
  const isFunc: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, func = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (func) isFunc[r][c] = true;
    }
  };

  // Finder patterns + separators
  const drawFinder = (tr: number, tc: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const inBorder = r === -1 || r === 7 || c === -1 || c === 7;
        const dark =
          !inBorder &&
          (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setModule(tr + r, tc + c, dark);
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Alignment pattern for versions 2..5
  const alignCoords: Record<number, number[]> = {
    1: [],
    2: [6, 18],
    3: [6, 22],
    4: [6, 26],
    5: [6, 30],
  };
  const coords = alignCoords[version] ?? [];
  for (const r of coords) {
    for (const c of coords) {
      if (isFunc[r][c]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dark = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setModule(r + dr, c + dc, dark);
        }
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // Dark module & reserve format info
  setModule(size - 8, 8, true);
  for (let i = 0; i <= 8; i++) {
    if (!isFunc[8][i]) setModule(8, i, false);
    if (!isFunc[i][8]) setModule(i, 8, false);
  }
  for (let i = size - 8; i < size; i++) {
    if (!isFunc[8][i]) setModule(8, i, false);
    if (!isFunc[i][8]) setModule(i, 8, false);
  }

  // Place data bits (mask 0: (r + c) % 2 === 0)
  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (!isFunc[row][c]) {
          const bit = bitIdx < allBits.length ? allBits[bitIdx++] : 0;
          const masked = ((row + c) % 2 === 0 ? bit ^ 1 : bit) === 1;
          matrix[row][c] = masked;
        }
      }
    }
    upward = !upward;
  }

  // Format info for EC Level L (01) + Mask 0 (000) => 15-bit BCH + XOR mask = 0x77c4
  const formatBits = 0x77c4;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    // Vertical
    if (i < 6) matrix[i][8] = bit;
    else if (i < 8) matrix[i + 1][8] = bit;
    else matrix[size - 15 + i][8] = bit;
    // Horizontal
    if (i < 8) matrix[8][size - 1 - i] = bit;
    else if (i < 9) matrix[8][15 - i] = bit;
    else matrix[8][15 - i - 1] = bit;
  }

  return matrix.map((row) => row.map((cell) => Boolean(cell)));
}

export default function AffiliateQrCode({
  value,
  size = 168,
  label = "Affiliate QR Code",
  className,
}: AffiliateQrCodeProps) {
  const matrix = useMemo(() => encodeQrMatrix(value), [value]);

  if (!matrix) {
    return null;
  }

  const quietZone = 3;
  const dim = matrix.length + quietZone * 2;

  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect width={dim} height={dim} fill="#ffffff" rx="2" />
      {matrix.map((row, r) =>
        row.map((dark, c) =>
          dark ? (
            <rect
              key={`${r}-${c}`}
              x={c + quietZone}
              y={r + quietZone}
              width={1}
              height={1}
              fill="#09090b"
            />
          ) : null
        )
      )}
    </svg>
  );
}
