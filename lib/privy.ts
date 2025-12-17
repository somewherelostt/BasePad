import { PrivyClientConfig } from "@privy-io/react-auth";
import { baseSepolia } from "./base";

// Privy App ID from environment
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

// Privy configuration for BasePad
export const privyConfig: PrivyClientConfig = {
  // Appearance - Brutal theme
  appearance: {
    theme: "light",
    accentColor: "#00FF00", // Brutal green
    logo: undefined, // Use text logo
    showWalletLoginFirst: true,
  },
  // Login methods
  loginMethods: ["email", "wallet", "google"],
  // Embedded wallet configuration
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  // Default chain
  defaultChain: baseSepolia,
  // Supported chains
  supportedChains: [baseSepolia],
};

// Type for wallet with address
export interface ConnectedWallet {
  address: string;
  chainId: number;
}
