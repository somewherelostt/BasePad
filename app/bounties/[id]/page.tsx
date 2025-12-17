"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Navbar } from "@/components/Navbar";
import { BrutalCard } from "@/components/BrutalCard";
import { BrutalButton } from "@/components/BrutalButton";
import { WalletGate } from "@/components/WalletGate";
import { SocialShare, SocialShareCompact } from "@/components/SocialShare";
import { BrutalReceipt } from "@/components/BrutalReceipt";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bounty, Submission, db } from "@/lib/supabase";
import { getExplorerAddressUrl } from "@/lib/base";

export default function BountyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectingWinner, setSelectingWinner] = useState(false);

  // Submission form
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [content, setContent] = useState("");
  const [contact, setContact] = useState("");

  const address = wallets[0]?.address;
  const bountyId = params.id as string;
  const isCreator =
    bounty?.creator_address.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    async function loadBounty() {
      try {
        const [bountyData, submissionsData] = await Promise.all([
          db.bounties.getById(bountyId),
          db.submissions.getByBounty(bountyId),
        ]);
        setBounty(bountyData);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Failed to load bounty:", error);
      } finally {
        setLoading(false);
      }
    }

    if (bountyId) {
      loadBounty();
    }
  }, [bountyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !content || !contact) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bounty_id: bountyId,
          hunter_address: address,
          content,
          contact,
        }),
      });

      if (response.ok) {
        const newSubmission = await response.json();
        setSubmissions([newSubmission, ...submissions]);
        setShowSubmitForm(false);
        setContent("");
        setContact("");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to submit");
      }
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectWinner = async (
    submissionId: string,
    winnerAddress: string
  ) => {
    if (!address || !isCreator) return;

    setSelectingWinner(true);
    try {
      const response = await fetch("/api/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bounty_id: bountyId,
          submission_id: submissionId,
          winner_address: winnerAddress,
          creator_address: address,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setBounty({
          ...bounty!,
          status: "PAID",
          winner_address: winnerAddress,
        });
        alert(`Payout executed! TX: ${result.txHash}`);
      } else {
        const error = await response.json();
        alert(error.message || "Payout failed");
      }
    } catch (error) {
      console.error("Payout failed:", error);
      alert("Payout failed. Please try again.");
    } finally {
      setSelectingWinner(false);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-white">
        <Navbar
          address={address}
          isConnected={authenticated}
          onConnect={login}
          onDisconnect={logout}
        />
        <main className="brutal-container py-8">
          <p className="text-xl font-black uppercase animate-pulse text-center py-12">
            LOADING BOUNTY...
          </p>
        </main>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-brutal-white">
        <Navbar
          address={address}
          isConnected={authenticated}
          onConnect={login}
          onDisconnect={logout}
        />
        <main className="brutal-container py-8">
          <BrutalCard variant="default" padding="lg" className="text-center">
            <p className="text-6xl mb-4">🚫</p>
            <h2 className="text-2xl font-black uppercase mb-4">
              BOUNTY NOT FOUND
            </h2>
            <BrutalButton
              variant="primary"
              onClick={() => router.push("/bounties")}
            >
              BACK TO BOUNTIES
            </BrutalButton>
          </BrutalCard>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-white">
      <Navbar
        address={address}
        isConnected={authenticated}
        onConnect={login}
        onDisconnect={logout}
      />

      <main className="brutal-container py-8">
        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/bounties")}
          className="font-black uppercase text-sm mb-6 hover:text-brutal-green transition-colors"
        >
          ← BACK TO BOUNTIES
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            {/* BOUNTY HEADER */}
            <BrutalCard variant="default" padding="lg">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 text-sm font-black ${
                    bounty.status === "OPEN"
                      ? "bg-brutal-green"
                      : "bg-brutal-pink"
                  }`}
                >
                  {bounty.status}
                </span>
                {isCreator && (
                  <span className="px-3 py-1 text-sm font-black bg-brutal-yellow">
                    YOUR BOUNTY
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase mb-4">
                {bounty.title}
              </h1>
              <p className="font-semibold text-lg whitespace-pre-wrap">
                {bounty.description}
              </p>
            </BrutalCard>

            {/* SUBMISSIONS */}
            <div>
              <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                <span className="bg-brutal-pink px-2">SUBMISSIONS</span>
                <span className="text-brutal-green">{submissions.length}</span>
              </h2>

              {submissions.length === 0 ? (
                <BrutalCard
                  variant="default"
                  padding="lg"
                  className="text-center"
                >
                  <p className="text-4xl mb-4">🎯</p>
                  <p className="font-bold uppercase text-gray-600">
                    NO SUBMISSIONS YET. BE THE FIRST HUNTER!
                  </p>
                </BrutalCard>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <BrutalCard
                      key={submission.id}
                      variant="default"
                      padding="md"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <a
                          href={getExplorerAddressUrl(
                            submission.hunter_address
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-bold text-sm hover:text-brutal-green"
                        >
                          {truncateAddress(submission.hunter_address)}
                        </a>
                        <span className="text-xs font-bold text-gray-500">
                          {formatDate(submission.created_at)}
                        </span>
                      </div>
                      <p className="font-semibold whitespace-pre-wrap mb-3">
                        {submission.content}
                      </p>
                      <p className="text-sm font-bold text-gray-600">
                        CONTACT: {submission.contact}
                      </p>

                      {/* SELECT WINNER BUTTON */}
                      {isCreator && bounty.status === "OPEN" && (
                        <div className="mt-4 pt-4 border-t-4 border-brutal-black">
                          <BrutalButton
                            variant="success"
                            size="sm"
                            onClick={() =>
                              handleSelectWinner(
                                submission.id,
                                submission.hunter_address
                              )
                            }
                            disabled={selectingWinner}
                          >
                            {selectingWinner
                              ? "PROCESSING..."
                              : "SELECT AS WINNER"}
                          </BrutalButton>
                        </div>
                      )}

                      {/* AI REVIEW SCORE */}
                      {submission.ai_score !== undefined &&
                        submission.ai_score > 0 && (
                          <div className="mt-4 pt-4 border-t-4 border-brutal-pink">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-black text-sm uppercase">
                                AI REVIEW
                              </span>
                              <span
                                className={`px-3 py-1 font-black text-sm ${
                                  submission.ai_score >= 80
                                    ? "bg-brutal-green"
                                    : submission.ai_score >= 50
                                    ? "bg-brutal-yellow"
                                    : "bg-brutal-pink"
                                }`}
                              >
                                {submission.ai_score}/100
                              </span>
                            </div>
                            {submission.ai_notes && (
                              <p className="text-sm font-semibold text-gray-700 whitespace-pre-wrap">
                                • {submission.ai_notes}
                              </p>
                            )}
                          </div>
                        )}

                      {/* WINNER BADGE */}
                      {bounty.winner_address?.toLowerCase() ===
                        submission.hunter_address.toLowerCase() && (
                        <div className="mt-4 pt-4 border-t-4 border-brutal-green">
                          <span className="px-4 py-2 bg-brutal-green font-black uppercase">
                            🏆 WINNER
                          </span>
                        </div>
                      )}
                    </BrutalCard>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* PRIZE BOX */}
            <BrutalCard variant="dark" padding="lg" className="text-center">
              <p className="text-sm font-bold uppercase mb-2 text-gray-400">
                BOUNTY PRIZE
              </p>
              <p className="text-5xl font-black text-brutal-green mb-2">
                {bounty.prize}
              </p>
              <p className="text-xl font-bold">ETH</p>
            </BrutalCard>

            {/* CREATOR INFO */}
            <BrutalCard variant="default" padding="md">
              <p className="text-sm font-bold uppercase mb-2 text-gray-600">
                POSTED BY
              </p>
              <a
                href={getExplorerAddressUrl(bounty.creator_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold hover:text-brutal-green"
              >
                {truncateAddress(bounty.creator_address)}
              </a>
              <p className="text-sm font-bold text-gray-500 mt-2">
                {formatDate(bounty.created_at)}
              </p>
            </BrutalCard>

            {/* SUBMIT BUTTON */}
            {bounty.status === "OPEN" && !isCreator && (
              <WalletGate
                isConnected={authenticated}
                onConnect={login}
                title="CONNECT TO SUBMIT"
                description="YOU NEED A WALLET TO HUNT BOUNTIES"
              >
                {showSubmitForm ? (
                  <BrutalCard variant="green" padding="lg">
                    <h3 className="text-xl font-black uppercase mb-4">
                      SUBMIT YOUR WORK
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block font-black uppercase text-sm mb-2">
                          YOUR SUBMISSION
                        </label>
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="DESCRIBE YOUR WORK, LINK TO REPO, ETC..."
                          rows={5}
                          required
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block font-black uppercase text-sm mb-2">
                          CONTACT (EMAIL/TELEGRAM/DISCORD)
                        </label>
                        <input
                          type="text"
                          value={contact}
                          onChange={(e) => setContact(e.target.value)}
                          placeholder="HOW CAN THEY REACH YOU?"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <BrutalButton
                          type="submit"
                          variant="primary"
                          fullWidth
                          disabled={submitting}
                        >
                          {submitting ? "SUBMITTING..." : "SUBMIT"}
                        </BrutalButton>
                        <BrutalButton
                          type="button"
                          variant="secondary"
                          onClick={() => setShowSubmitForm(false)}
                        >
                          CANCEL
                        </BrutalButton>
                      </div>
                    </form>
                  </BrutalCard>
                ) : (
                  <BrutalButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => setShowSubmitForm(true)}
                  >
                    SUBMIT YOUR WORK
                  </BrutalButton>
                )}
              </WalletGate>
            )}

            {bounty.status === "PAID" && (
              <>
                <BrutalCard variant="pink" padding="lg" className="text-center">
                  <p className="text-4xl mb-2">🎉</p>
                  <p className="font-black uppercase">BOUNTY COMPLETED</p>
                  <p className="font-bold text-sm mt-2">
                    WINNER: {truncateAddress(bounty.winner_address || "")}
                  </p>
                </BrutalCard>

                {/* BRUTAL RECEIPT */}
                <BrutalReceipt
                  bountyTitle={bounty.title}
                  bountyId={bounty.id}
                  amount={bounty.prize}
                  hunterAddress={bounty.winner_address || ""}
                  txHash={bounty.tx_hash || "0x..."}
                  timestamp={bounty.created_at}
                />

                {/* SHARE YOUR WIN */}
                <SocialShare
                  bountyTitle={bounty.title}
                  bountyId={bounty.id}
                  status="PAID"
                />
              </>
            )}

            {/* SOCIAL SHARE FOR HUNTERS WHO SUBMITTED */}
            {bounty.status === "OPEN" &&
              submissions.some(
                (s) => s.hunter_address.toLowerCase() === address?.toLowerCase()
              ) && (
                <div className="mt-4">
                  <p className="font-black uppercase text-sm mb-2 text-center">
                    SUBMITTED? SHARE IT!
                  </p>
                  <SocialShare
                    bountyTitle={bounty.title}
                    bountyId={bounty.id}
                    status="SUBMITTED"
                  />
                </div>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
