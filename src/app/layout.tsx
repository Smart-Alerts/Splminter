import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "@/components/WalletContextProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SPL Token Minter",
  description: "Create your own SPL token",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-gray-900 to-purple-900`}>
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}
