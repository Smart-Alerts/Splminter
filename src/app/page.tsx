"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import MintForm from "@/components/MintForm";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8">
      <div className="flex justify-between items-center w-full max-w-5xl mb-8">
        <h1 className="text-3xl font-bold text-white">SPL Token Minter</h1>
        <WalletMultiButton />
      </div>

      <div className="flex-grow flex items-center justify-center">
        {publicKey ? (
          <MintForm />
        ) : (
          <p className="text-white text-lg">Please connect your wallet to get started.</p>
        )}
      </div>
    </main>
  );
}
