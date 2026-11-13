import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CreateTokenSolana — SPL & Token-2022 Launchpad",
    short_name: "CreateToken",
    description:
      "No-code Solana SPL & Token-2022 token creator, Raydium/Meteora liquidity pool builder, token burner, and mass airdrop tool.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#7C3AED",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/sol.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
