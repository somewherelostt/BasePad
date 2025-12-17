import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import BasePad3DScene from "@/components/BasePad3DScene";

// Force dynamic rendering for all pages (Privy needs client-side)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BASEPAD | ONCHAIN BOUNTIES",
  description: "Post bounties. Hunt rewards. Get paid onchain.",
  keywords: ["bounty", "web3", "base", "crypto", "onchain"],
  icons: {
    icon: "/basepad-icon-32.png",
    shortcut: "/basepad-icon-64.png",
    apple: "/basepad-icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-brutal-white text-brutal-black min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
