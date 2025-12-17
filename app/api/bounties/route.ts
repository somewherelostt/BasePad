import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// x402 Payment Requirements for bounty creation
const PAYMENT_REQUIREMENTS = {
  scheme: "exact",
  network: "base-sepolia",
  maxAmountRequired: "1000", // $0.001 USDC (6 decimals)
  payTo: process.env.NEXT_PUBLIC_PLATFORM_WALLET || "",
  asset: "0x036cbd53842c5426634e7929541ec2318f3dcf7e", // USDC on Base Sepolia (checksummed)
};

// Verify x402 payment on-chain directly
async function verifyX402Payment(
  txHash: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Import ethers for on-chain verification
    const { JsonRpcProvider } = await import("ethers");
    
    // Base Sepolia RPC
    const provider = new JsonRpcProvider("https://sepolia.base.org");
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return { valid: false, error: "Transaction not found" };
    }
    
    if (receipt.status !== 1) {
      return { valid: false, error: "Transaction failed" };
    }
    
    // Verify the transaction is to USDC contract
    const usdcAddress = PAYMENT_REQUIREMENTS.asset.toLowerCase();
    if (receipt.to?.toLowerCase() !== usdcAddress) {
      return { valid: false, error: "Transaction not to USDC contract" };
    }
    
    // Decode Transfer event to verify amount and recipient
    const transferEventSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const transferLog = receipt.logs.find(
      log => log.topics[0] === transferEventSignature && log.address.toLowerCase() === usdcAddress
    );
    
    if (!transferLog) {
      return { valid: false, error: "No USDC transfer found in transaction" };
    }
    
    // Decode the transfer log
    // topics[1] = from, topics[2] = to, data = amount
    const toAddress = "0x" + transferLog.topics[2].slice(26);
    const amount = BigInt(transferLog.data);
    
    const expectedTo = PAYMENT_REQUIREMENTS.payTo.toLowerCase();
    const expectedAmount = BigInt(PAYMENT_REQUIREMENTS.maxAmountRequired);
    
    if (toAddress.toLowerCase() !== expectedTo) {
      return { valid: false, error: `Payment sent to wrong address: ${toAddress}` };
    }
    
    if (amount < expectedAmount) {
      return { valid: false, error: `Insufficient payment amount: ${amount.toString()}` };
    }
    
    return { valid: true };
  } catch (error) {
    console.error("x402 verification error:", error);
    return { valid: false, error: `Failed to verify payment: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// POST: Create a new bounty
// Payment is verified via x402 protocol
export async function POST(request: NextRequest) {
  try {
    // Check for x402 payment header
    const paymentHeader = request.headers.get("X-PAYMENT");

    // If no payment, middleware already returned 402
    // But double-check here for safety
    if (!paymentHeader) {
      return NextResponse.json(
        {
          x402Version: 1,
          error: "Payment Required",
          accepts: [PAYMENT_REQUIREMENTS],
        },
        { status: 402 }
      );
    }

    // Verify payment with facilitator
    const verification = await verifyX402Payment(paymentHeader);
    if (!verification.valid) {
      return NextResponse.json(
        { message: verification.error || "Payment verification failed" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, description, prize, creator_address } = body;

    // Validate required fields
    if (!title || !description || !prize || !creator_address) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: title, description, prize, creator_address",
        },
        { status: 400 }
      );
    }

    // Create the bounty in Supabase
    const { data, error } = await supabaseAdmin
      .from("bounties")
      .insert({
        title,
        description,
        prize,
        creator_address: creator_address.toLowerCase(),
        status: "OPEN",
        // Store x402 payment reference
        tx_hash: "x402-verified",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { message: "Failed to create bounty" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Create bounty error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: List all bounties
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const creator = searchParams.get("creator");

    let query = supabaseAdmin
      .from("bounties")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (creator) {
      query = query.eq("creator_address", creator.toLowerCase());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json(
        { message: "Failed to fetch bounties" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Get bounties error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
