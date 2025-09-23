"use client";

import { useSearchParams } from "next/navigation";
import Feedback from "@/components/Feedback";
import Link from "next/link";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const tokenAddress = searchParams.get("tokenAddress");
  const errorMessage = searchParams.get("error");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">Status da Criação</h2>
        {status === "success" && tokenAddress ? (
          <Feedback success={true} tokenAddress={tokenAddress} />
        ) : (
          <Feedback success={false} errorMessage={errorMessage || "Ocorreu um erro desconhecido."} />
        )}
        <div className="mt-6 text-center">
          <Link href="/create" className="text-blue-500 hover:underline">
            Criar outro token
          </Link>
        </div>
      </div>
    </div>
  );
}
