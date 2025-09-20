"use client";

import { useState, useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { PublicKey } from "@solana/web3.js";

const MintForm = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [amount, setAmount] = useState(1000);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isMinting, setIsMinting] = useState(false);
  const [mintAddress, setMintAddress] = useState<PublicKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const metaplex = useMemo(
    () => Metaplex.make(connection).use(walletAdapterIdentity(wallet)),
    [connection, wallet]
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError("Please select an image.");
      return;
    }
    if (!wallet.publicKey) {
        setError("Wallet not connected.");
        return;
    }

    setIsMinting(true);
    setError(null);
    setMintAddress(null);

    try {
      // 1. Upload Image to Pinata
      const imageFormData = new FormData();
      imageFormData.append("file", image);
      const imageUploadRes = await fetch("/api/uploadImage", {
        method: "POST",
        body: imageFormData,
      });
      const imageUploadData = await imageUploadRes.json();
      if (!imageUploadData.success) {
        throw new Error("Failed to upload image to Pinata.");
      }
      const imageUri = `https://gateway.pinata.cloud/ipfs/${imageUploadData.ipfsHash}`;

      // 2. Upload Metadata to Pinata
      const metadata = {
        name: tokenName,
        symbol: symbol,
        description: description,
        image: imageUri,
      };
      const metadataUploadRes = await fetch("/api/uploadMetadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });
      const metadataUploadData = await metadataUploadRes.json();
      if (!metadataUploadData.success) {
        throw new Error("Failed to upload metadata to Pinata.");
      }
      const metadataUri = `https://gateway.pinata.cloud/ipfs/${metadataUploadData.ipfsHash}`;

      // 3. Create the token on-chain
      const { nft } = await metaplex.nfts().create({
        uri: metadataUri,
        name: tokenName,
        symbol: symbol,
        sellerFeeBasisPoints: 0,
        isCollection: false,
      });

      // 4. Mint the tokens
      const mintAmount = BigInt(amount * Math.pow(10, decimals));
      await metaplex.tokens().mint({
        mintAddress: nft.address,
        amount: {
          basisPoints: mintAmount,
          currency: { symbol, decimals, namespace: 'spl-token' }
        },
      });

      setMintAddress(nft.address);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="bg-white/10 p-8 rounded-lg shadow-xl backdrop-blur-md">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Create a new SPL Token</h2>

        {/* Form fields... */}
        <div className="mb-4">
          <label htmlFor="tokenName" className="block text-sm font-medium text-gray-300 mb-1">Token Name</label>
          <input type="text" id="tokenName" value={tokenName} onChange={(e) => setTokenName(e.target.value)} className="w-full bg-white/10 text-white border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div className="mb-4">
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
          <input type="text" id="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full bg-white/10 text-white border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div className="mb-4">
          <label htmlFor="decimals" className="block text-sm font-medium text-gray-300 mb-1">Decimals</label>
          <input type="number" id="decimals" value={decimals} onChange={(e) => setDecimals(Number(e.target.value))} className="w-full bg-white/10 text-white border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount to Mint</label>
          <input type="number" id="amount" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-white/10 text-white border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" required />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-white/10 text-white border border-gray-600 rounded-md p-2 focus:ring-purple-500 focus:border-purple-500" rows={3} />
        </div>
        <div className="mb-6">
          <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-1">Image</label>
          <input type="file" id="image" onChange={handleImageChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700" accept="image/*" required />
          {imagePreview && <img src={imagePreview} alt="Image preview" className="mt-4 rounded-md max-h-40" />}
        </div>

        <button type="submit" className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-500" disabled={isMinting || !wallet.publicKey}>
          {isMinting ? "Minting..." : "Mint Token"}
        </button>
      </form>

      {mintAddress && (
        <div className="mt-4 p-4 bg-green-900/50 text-white rounded-md">
          <p className="font-bold">Mint Successful!</p>
          <a
            href={`https://explorer.solana.com/address/${mintAddress.toBase58()}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
          >
            View on Explorer: {mintAddress.toBase58()}
          </a>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 text-white rounded-md">
          <p className="font-bold">Error:</p>
          <p className="break-all">{error}</p>
        </div>
      )}
    </div>
  );
};

export default MintForm;
