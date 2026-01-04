"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Navbar } from "@/components/Navbar";
import { BrutalCard } from "@/components/BrutalCard";
import { BrutalButton } from "@/components/BrutalButton";
import { WalletGate } from "@/components/WalletGate";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { baseSepolia } from "@/lib/base";

type CreateStep = "FORM" | "PAYMENT" | "CONFIRMING" | "SUCCESS" | "ERROR";

// x402 uses USDC, displayed in dollars
const CREATION_FEE_USDC = 0.001;
const CREATION_FEE_DISPLAY = "$0.001 USDC";

interface PrizeTier {
  rank: number;
  amount: string;
}

export default function CreatePage() {
  const router = useRouter();
  const { login, logout, authenticated } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const [step, setStep] = useState<CreateStep>("FORM");
  const [error, setError] = useState<string>("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prizes, setPrizes] = useState<PrizeTier[]>([{ rank: 1, amount: "" }]);

  // Transaction state
  const [bountyId, setBountyId] = useState<string>("");

  // Get embedded wallet
  const embeddedWallet = wallets.find(
    (w: { walletClientType?: string }) => w.walletClientType === "privy"
  );
  const address = embeddedWallet?.address || wallets[0]?.address;

  // Calculate total required payment
  const totalPrizeAmount = prizes.reduce(
    (acc, curr) => acc + (parseFloat(curr.amount) || 0),
    0
  );
  const totalRequiredPayment = totalPrizeAmount + CREATION_FEE_USDC;

  // Ensure wallet is ready and connected
  useEffect(() => {
    const prepareWallet = async () => {
      if (!walletsReady || !authenticated) return;

      const wallet = embeddedWallet || wallets[0];
      if (wallet) {
        try {
          await wallet.switchChain(baseSepolia.id);
        } catch (err) {
          console.log("Chain switch:", err);
        }
      }
    };
    prepareWallet();
  }, [wallets, walletsReady, authenticated, embeddedWallet]);

  const addPrizeTier = () => {
    setPrizes([...prizes, { rank: prizes.length + 1, amount: "" }]);
  };

  const removePrizeTier = (index: number) => {
    if (prizes.length === 1) return;
    const newPrizes = prizes.filter((_, i) => i !== index);
    // Recalculate ranks
    const reordered = newPrizes.map((p, i) => ({ ...p, rank: i + 1 }));
    setPrizes(reordered);
  };

  const updatePrizeAmount = (index: number, amount: string) => {
    const newPrizes = [...prizes];
    newPrizes[index].amount = amount;
    setPrizes(newPrizes);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !title || !description || prizes.some((p) => !p.amount))
      return;

    setStep("PAYMENT");
    setError("");

    try {
      // First request - will get 402 with payment requirements
      const initialResponse = await fetch("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          prizes,
          creator_address: address,
        }),
      });

      if (initialResponse.status === 402) {
        // x402 payment required
        const paymentReq = await initialResponse.json();
        console.log("x402 Payment Required:", paymentReq);

        // Get the payment requirement details
        const requirement = paymentReq.accepts?.[0];
        if (!requirement) {
          throw new Error("Invalid payment requirement format");
        }

        // Get the wallet to send USDC payment
        const wallet = embeddedWallet || wallets[0];
        if (!wallet) {
          throw new Error("No wallet available");
        }

        // Get provider from wallet
        const provider = await wallet.getEthereumProvider();

        // USDC contract ABI (minimal - just transfer function)
        const usdcAbi = [
          {
            constant: false,
            inputs: [
              { name: "_to", type: "address" },
              { name: "_value", type: "uint256" },
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            type: "function",
          },
        ];

        // Import ethers dynamically
        const { Contract, BrowserProvider } = await import("ethers");

        // Create ethers provider and signer
        const ethersProvider = new BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();

        // Create USDC contract instance (lowercase address for consistency)
        const usdcContract = new Contract(
          requirement.asset.toLowerCase(),
          usdcAbi,
          signer
        );

        // Send USDC payment
        console.log(
          `Sending ${requirement.maxAmountRequired} USDC to ${requirement.payTo}`
        );
        const tx = await usdcContract.transfer(
          requirement.payTo,
          requirement.maxAmountRequired
        );

        console.log("Transaction sent:", tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        const txHash = receipt.hash;

        console.log("Payment confirmed:", txHash);

        // Now make the actual bounty creation request with payment proof
        const creationResponse = await fetch("/api/bounties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-PAYMENT": txHash,
          },
          body: JSON.stringify({
            title,
            description,
            prizes,
            creator_address: address,
          }),
        });

        if (creationResponse.ok) {
          setStep("CONFIRMING");
          const bounty = await creationResponse.json();
          setBountyId(bounty.id);
          setStep("SUCCESS");
        } else {
          const errorData = await creationResponse.json();
          throw new Error(errorData.message || "Failed to create bounty");
        }
      } else if (initialResponse.ok) {
        setStep("CONFIRMING");
        const bounty = await initialResponse.json();
        setBountyId(bounty.id);
        setStep("SUCCESS");
      } else {
        const errorData = await initialResponse.json();
        throw new Error(errorData.message || "Failed to create bounty");
      }
    } catch (err) {
      console.error("Creation failed:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setStep("ERROR");
    }
  };

  const resetForm = () => {
    setStep("FORM");
    setTitle("");
    setDescription("");
    setPrizes([{ rank: 1, amount: "" }]);
    setBountyId("");
    setError("");
  };

  return (
    <div className="min-h-screen">
      <Navbar
        address={address}
        isConnected={authenticated}
        onConnect={login}
        onDisconnect={logout}
      />

      <main className="px-4 py-6 md:px-8 md:py-12 lg:px-12 max-w-2xl mx-auto">
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-6 md:mb-8">
          CREATE <span className="text-brutal-green">BOUNTY</span>
        </h1>

        <WalletGate
          isConnected={authenticated}
          onConnect={login}
          title="CONNECT WALLET"
          description="YOU NEED A WALLET TO CREATE BOUNTIES"
        >
          <div className="max-w-2xl">
            {/* STEP: FORM */}
            {step === "FORM" && (
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <BrutalCard variant="yellow" padding="md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💰</span>
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-black uppercase">TOTAL TO PAY:</p>
                        <p className="font-black text-xl">
                          ${totalRequiredPayment.toFixed(3)} USDC
                        </p>
                      </div>
                      <div className="text-xs font-bold text-gray-700 flex justify-between border-t border-black pt-1">
                        <span>PRIZES: ${totalPrizeAmount.toFixed(3)}</span>
                        <span>FEE: {CREATION_FEE_DISPLAY}</span>
                      </div>
                    </div>
                  </div>
                </BrutalCard>

                <BrutalCard variant="default" padding="sm">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">ℹ️</span>
                    <div className="text-sm">
                      <p className="font-bold uppercase mb-1">
                        PRE-FUNDING REQUIRED
                      </p>
                      <p className="text-gray-600">
                        You must deposit the full prize amount + fee upfront.
                        Funds are held in the platform escrow until you select
                        winners.
                      </p>
                    </div>
                  </div>
                </BrutalCard>

                <div>
                  <label className="block font-black uppercase text-sm mb-2">
                    BOUNTY TITLE *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.G. BUILD A LANDING PAGE"
                    required
                    maxLength={100}
                    className="w-full p-3 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-brutal-green transition-all"
                  />
                </div>

                <div>
                  <label className="block font-black uppercase text-sm mb-2">
                    DESCRIPTION *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the task, requirements, and deliverables..."
                    rows={6}
                    required
                    maxLength={2000}
                    className="w-full p-3 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-brutal-green transition-all"
                  />
                  <p className="text-xs font-bold text-gray-500 mt-1">
                    {description.length}/2000 CHARACTERS
                  </p>
                </div>

                <div>
                  <label className="block font-black uppercase text-sm mb-2">
                    PRIZE TIERS (USDC) *
                  </label>
                  <div className="space-y-3">
                    {prizes.map((prize, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <div className="bg-black text-white font-black px-3 py-2 w-12 text-center">
                          #{prize.rank}
                        </div>
                        <input
                          type="text"
                          value={prize.amount}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            updatePrizeAmount(index, val);
                          }}
                          placeholder="Amount (e.g. 100)"
                          required
                          className="flex-1 p-2 bg-white border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-brutal-green"
                        />
                        {prizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePrizeTier(index)}
                            className="bg-brutal-pink px-3 py-2 border-4 border-black font-bold hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                          >
                            X
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addPrizeTier}
                    className="mt-3 text-sm font-black uppercase underline hover:text-brutal-green"
                  >
                    + ADD ANOTHER PRIZE TIER
                  </button>
                </div>

                <BrutalButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={
                    !title ||
                    !description ||
                    prizes.some((p) => !p.amount) ||
                    totalRequiredPayment <= 0
                  }
                >
                  PAY ${totalRequiredPayment.toFixed(3)} USDC & CREATE
                </BrutalButton>
              </form>
            )}

            {/* STEP: PAYMENT */}
            {step === "PAYMENT" && (
              <BrutalCard
                variant="default"
                padding="lg"
                className="text-center"
              >
                <div className="py-8">
                  <div className="animate-pulse">
                    <p className="text-6xl mb-4">💳</p>
                    <h2 className="text-2xl font-black uppercase mb-2">
                      PROCESSING PAYMENT
                    </h2>
                    <p className="font-bold text-gray-600 uppercase">
                      PLEASE APPROVE THE TRANSACTIONS
                    </p>
                  </div>
                </div>
              </BrutalCard>
            )}

            {/* STEP: CONFIRMING */}
            {step === "CONFIRMING" && (
              <BrutalCard variant="green" padding="lg" className="text-center">
                <div className="py-8">
                  <div className="animate-pulse">
                    <p className="text-6xl mb-4">⏳</p>
                    <h2 className="text-2xl font-black uppercase mb-2">
                      CONFIRMING ON CHAIN
                    </h2>
                    <p className="font-bold text-gray-700 uppercase mb-4">
                      VERIFYING YOUR x402 PAYMENT ON BASE SEPOLIA
                    </p>
                  </div>
                </div>
              </BrutalCard>
            )}

            {/* STEP: SUCCESS */}
            {step === "SUCCESS" && (
              <BrutalCard variant="green" padding="lg" className="text-center">
                <div className="py-8">
                  <p className="text-6xl mb-4">🎉</p>
                  <h2 className="text-2xl font-black uppercase mb-2">
                    BOUNTY CREATED!
                  </h2>
                  <p className="font-bold text-gray-700 uppercase mb-6">
                    FUNDS SECURED. BOUNTY IS LIVE.
                  </p>
                  <div className="space-y-3">
                    <BrutalButton
                      variant="primary"
                      size="lg"
                      fullWidth
                      onClick={() => router.push(`/bounties/${bountyId}`)}
                    >
                      VIEW YOUR BOUNTY
                    </BrutalButton>
                    <BrutalButton
                      variant="secondary"
                      size="md"
                      fullWidth
                      onClick={resetForm}
                    >
                      CREATE ANOTHER
                    </BrutalButton>
                  </div>
                </div>
              </BrutalCard>
            )}

            {/* STEP: ERROR */}
            {step === "ERROR" && (
              <BrutalCard variant="pink" padding="lg" className="text-center">
                <div className="py-8">
                  <p className="text-6xl mb-4">❌</p>
                  <h2 className="text-2xl font-black uppercase mb-2">
                    CREATION FAILED
                  </h2>
                  <p className="font-bold text-gray-700 mb-6 whitespace-pre-wrap">
                    {error || "SOMETHING WENT WRONG. PLEASE TRY AGAIN."}
                  </p>
                  <div className="space-y-3">
                    <BrutalButton
                      variant="primary"
                      size="lg"
                      onClick={resetForm}
                    >
                      TRY AGAIN
                    </BrutalButton>
                    <a
                      href="https://faucet.circle.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <BrutalButton variant="secondary" size="md" fullWidth>
                        GET TESTNET USDC →
                      </BrutalButton>
                    </a>
                  </div>
                </div>
              </BrutalCard>
            )}
          </div>
        </WalletGate>
      </main>
    </div>
  );
}
