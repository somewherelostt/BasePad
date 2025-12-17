import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "@/lib/base";

// Custodial platform wallet for payouts
const PLATFORM_PRIVATE_KEY = process.env
  .PLATFORM_WALLET_PRIVATE_KEY as `0x${string}`;

// POST: Execute payout to winner
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bounty_id, submission_id, winner_address, creator_address } = body;

    // Validate required fields
    if (!bounty_id || !submission_id || !winner_address || !creator_address) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch the bounty
    const { data: bounty, error: bountyError } = await supabaseAdmin
      .from("bounties")
      .select("*")
      .eq("id", bounty_id)
      .single();

    if (bountyError || !bounty) {
      return NextResponse.json(
        { message: "Bounty not found" },
        { status: 404 }
      );
    }

    // Verify creator ownership
    if (
      bounty.creator_address.toLowerCase() !== creator_address.toLowerCase()
    ) {
      return NextResponse.json(
        { message: "Only the bounty creator can select a winner" },
        { status: 403 }
      );
    }

    // Check bounty is still open
    if (bounty.status !== "OPEN") {
      return NextResponse.json(
        { message: "Bounty has already been paid out" },
        { status: 400 }
      );
    }

    // Verify submission exists and belongs to this bounty
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", submission_id)
      .eq("bounty_id", bounty_id)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { message: "Submission not found" },
        { status: 404 }
      );
    }

    // Verify winner address matches submission
    if (
      submission.hunter_address.toLowerCase() !== winner_address.toLowerCase()
    ) {
      return NextResponse.json(
        { message: "Winner address does not match submission" },
        { status: 400 }
      );
    }

    // Execute payout from custodial wallet
    if (!PLATFORM_PRIVATE_KEY) {
      console.error("Platform wallet private key not configured");
      return NextResponse.json(
        { message: "Payout system not configured" },
        { status: 500 }
      );
    }

    try {
      const account = privateKeyToAccount(PLATFORM_PRIVATE_KEY);
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: http(),
      });

      // Send the prize to the winner
      const txHash = await walletClient.sendTransaction({
        to: winner_address as `0x${string}`,
        value: parseEther(bounty.prize),
      });

      // Update bounty status
      const { error: updateError } = await supabaseAdmin
        .from("bounties")
        .update({
          status: "PAID",
          winner_address: winner_address.toLowerCase(),
        })
        .eq("id", bounty_id);

      if (updateError) {
        console.error("Failed to update bounty status:", updateError);
        // Note: TX was sent, so we log but don't fail
      }

      return NextResponse.json({
        success: true,
        txHash,
        winner: winner_address,
        prize: bounty.prize,
      });
    } catch (txError) {
      console.error("Transaction failed:", txError);
      return NextResponse.json(
        {
          message:
            "Payout transaction failed. Platform wallet may have insufficient funds.",
          error: txError instanceof Error ? txError.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Payout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
