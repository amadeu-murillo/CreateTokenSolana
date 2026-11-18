/**
 * Official Solana Actions & Blinks v2.1.3 CORS and CAIP-2 Blockchain Headers.
 */
export const ACTIONS_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Content-Encoding, Accept-Encoding, X-Action-Version, X-Blockchain-Ids",
  "X-Action-Version": "2.1.3",
  "X-Blockchain-Ids": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  "Content-Type": "application/json",
};

export interface ActionParameter {
  name: string;
  label?: string;
  required?: boolean;
}

export interface LinkedAction {
  type?: "transaction" | "post" | "external-link";
  label: string;
  href: string;
  parameters?: ActionParameter[];
}

export interface ActionGetResponse {
  type?: "action";
  icon: string;
  title: string;
  description: string;
  label: string;
  disabled?: boolean;
  links?: {
    actions: LinkedAction[];
  };
}

export interface ActionPostResponse {
  type?: "transaction";
  transaction: string;
  message?: string;
}
