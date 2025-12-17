// x402 Payment Middleware for BasePad
// NOTE: x402-next middleware has Edge Runtime compatibility issues
// Using simplified middleware that returns 402 for POST requests without payment
// The actual x402 protocol can be integrated via API route handlers

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Platform wallet address that receives creation fees
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET;

export function middleware(request: NextRequest) {
  // Only apply to POST /api/bounties
  if (
    request.method === "POST" &&
    request.nextUrl.pathname === "/api/bounties"
  ) {
    // Check for x402 payment header
    const paymentHeader = request.headers.get("X-PAYMENT");

    if (!paymentHeader) {
      // Return 402 Payment Required with x402 format
      return NextResponse.json(
        {
          x402Version: 1,
          error: "Payment Required",
          accepts: [
            {
              scheme: "exact",
              network: "base-sepolia",
              maxAmountRequired: "1000", // $0.001 USDC (6 decimals)
              resource: request.url,
              description: "Create a new bounty on BasePad",
              mimeType: "application/json",
              payTo:
                PLATFORM_WALLET || "0x0000000000000000000000000000000000000000",
              maxTimeoutSeconds: 300,
              asset: "0x036cbd53842c5426634e7929541ec2318f3dcf7e", // USDC on Base Sepolia
            },
          ],
        },
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Payment header exists - let request through to API handler
    // The API handler will verify the payment with facilitator
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/api/bounties"],
};
