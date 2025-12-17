import { createPublicClient, http, Chain } from "viem";

// Base Sepolia Chain Configuration
export const baseSepolia: Chain = {
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://sepolia.base.org"],
    },
    public: {
      http: ["https://sepolia.base.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://sepolia.basescan.org",
    },
  },
  testnet: true,
};

// Public client for reading chain data
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Platform wallet address (custodial - receives creation fees)
export const PLATFORM_WALLET_ADDRESS = process.env
  .NEXT_PUBLIC_PLATFORM_WALLET as `0x${string}`;

// Creation fee in ETH - minimal for testing
export const CREATION_FEE = "0.0001";
export const CREATION_FEE_WEI = BigInt("100000000000000"); // 0.0001 ETH in wei

// Utility to verify transaction on Base Sepolia
export async function verifyTransaction(txHash: `0x${string}`): Promise<{
  success: boolean;
  from?: string;
  to?: string;
  value?: bigint;
  error?: string;
}> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    const tx = await publicClient.getTransaction({ hash: txHash });

    if (receipt.status !== "success") {
      return { success: false, error: "Transaction failed" };
    }

    return {
      success: true,
      from: tx.from,
      to: tx.to || undefined,
      value: tx.value,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Explorer base URL
const EXPLORER_URL = "https://sepolia.basescan.org";

// Get explorer URL for transaction
export function getExplorerTxUrl(txHash: string): string {
  return `${EXPLORER_URL}/tx/${txHash}`;
}

// Get explorer URL for address
export function getExplorerAddressUrl(address: string): string {
  return `${EXPLORER_URL}/address/${address}`;
}
