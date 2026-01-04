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



// POST: Create a new bounty
// Payment is verified via x402 protocol
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, prizes, creator_address } = body;

    // Validate required fields
    if (!title || !description || !prizes || !Array.isArray(prizes) || prizes.length === 0 || !creator_address) {
       // If it's a pre-flight or missing data check, we might want to return 400 or just proceed to 402 if strictly payment check.
       // But for x402 flow, we usually need to know the amount first.
       // In this flow, the client sends the data, we calculate amount, and return 402 if payment is missing/invalid.
    }

    // Calculate total required amount
    // Creation Fee ($0.001) + Sum of all prizes
    const creationFee = BigInt(PAYMENT_REQUIREMENTS.maxAmountRequired);
    
    // Sum prizes
    // PAYMENT: PRE-FUNDING MODEL. The user must pay the full prize amount + fee.
    // We parse the amount string to USDC units (6 decimals).
    // PAYMENT_REQUIREMENTS.maxAmountRequired is 1000 (0.001 USDC).
    // If a prize is 1 USDC, it's 1,000,000 units.
    
    let totalPrizeAmount = BigInt(0);
    const validatedPrizes = [];
    
    if (prizes && Array.isArray(prizes)) {
       for (const p of prizes) {
          // p.amount is expected to be a string like "0.1" or "100". 
          // NOTE: The previous code treated `prize` as just a string for display, but payment was fixed 0.001.
          // NEW MODEL: PRE-FUNDING. The user must pay the full prize amount + fee.
          // We need to parse the amount string to USDC units (6 decimals).
          const amountFloat = parseFloat(p.amount);
          if (isNaN(amountFloat) || amountFloat < 0) continue;
          
          const amountUnits = BigInt(Math.round(amountFloat * 1_000_000));
          totalPrizeAmount += amountUnits;
          validatedPrizes.push({ rank: p.rank, amount: p.amount }); // Keep original string for DB
       }
    }

    const totalRequired = creationFee + totalPrizeAmount;

    // Check for x402 payment header
    const paymentHeader = request.headers.get("X-PAYMENT");

    // Construct the specific payment requirement for this bounty
    const dynamicRequirement = {
        ...PAYMENT_REQUIREMENTS,
        maxAmountRequired: totalRequired.toString(),
    };

    if (!paymentHeader) {
      return NextResponse.json(
        {
          x402Version: 1,
          error: "Payment Required",
          accepts: [dynamicRequirement],
        },
        { status: 402 }
      );
    }

    // Verify payment with facilitator
    // We need to pass the dynamic amount to the verification function
    // But verifyX402Payment currently uses the static global constant.
    // We need to update verifyX402Payment signature or logic.
    // Let's refactor verifyX402Payment locally or inline it here for simplicity/flexibility
    
    // --- INLINED/UPDATED VERIFICATION ---
    const { JsonRpcProvider } = await import("ethers");
    const provider = new JsonRpcProvider("https://sepolia.base.org");
    const receipt = await provider.getTransactionReceipt(paymentHeader);
    
    if (!receipt || receipt.status !== 1) {
        return NextResponse.json({ message: "Invalid transaction" }, { status: 400 });
    }

    const usdcAddress = PAYMENT_REQUIREMENTS.asset.toLowerCase();
    const transferEventSignature = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    const transferLog = receipt.logs.find(
      log => log.topics[0] === transferEventSignature && log.address.toLowerCase() === usdcAddress
    );

    if (!transferLog) {
         return NextResponse.json({ message: "No USDC transfer found" }, { status: 400 });
    }

    const toAddress = "0x" + transferLog.topics[2].slice(26);
    const amountPaid = BigInt(transferLog.data);
    
    
    if (toAddress.toLowerCase() !== PAYMENT_REQUIREMENTS.payTo.toLowerCase()) {
         return NextResponse.json({ message: "Payment sent to wrong address" }, { status: 400 });
    }
    
    // STRICT FUNDING CHECK: The amount paid MUST match the required amount exactly.
    // This prevents overpayment (user error) and underpayment (exploit).
    if (amountPaid !== totalRequired) {
        return NextResponse.json({ 
            message: `Payment mismatch. Required: ${totalRequired}, Paid: ${amountPaid}. Exact payment required.` 
        }, { status: 400 });
    }
    // -------------------------------------

    // Create the bounty in Supabase
    const { data, error } = await supabaseAdmin
      .from("bounties")
      .insert({
        title,
        description,
        prizes: validatedPrizes, // Store the array
        prize: "MULTI", // Legacy field fallback or summary
        creator_address: creator_address.toLowerCase(),
        status: "OPEN",
        tx_hash: paymentHeader,
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
