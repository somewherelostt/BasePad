"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Navbar } from "@/components/Navbar";
import { BrutalCard } from "@/components/BrutalCard";
import { BrutalButton } from "@/components/BrutalButton";
import { WalletGate } from "@/components/WalletGate";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bounty, Submission, db } from "@/lib/supabase";

export default function ProfilePage() {
  const { login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [myBounties, setMyBounties] = useState<Bounty[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const address = wallets[0]?.address;

  useEffect(() => {
    async function loadData() {
      if (!address) return;

      try {
        const [bounties, submissions] = await Promise.all([
          db.bounties.getByCreator(address),
          db.submissions.getByHunter(address),
        ]);
        setMyBounties(bounties);
        setMySubmissions(submissions);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (authenticated && address) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [authenticated, address]);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-brutal-white">
      <Navbar
        address={address}
        isConnected={authenticated}
        onConnect={login}
        onDisconnect={logout}
      />

      <main className="brutal-container py-8">
        <WalletGate
          isConnected={authenticated}
          onConnect={login}
          title="ACCESS DENIED"
          description="CONNECT WALLET TO VIEW YOUR PROFILE"
        >
          {/* PROFILE HEADER */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-black mb-4">
              YOUR <span className="text-brutal-green">PROFILE</span>
            </h1>
            {address && (
              <BrutalCard
                variant="default"
                padding="md"
                className="inline-block"
              >
                <p className="font-mono font-bold text-lg">
                  {truncateAddress(address)}
                </p>
                <p className="text-sm font-bold text-gray-600 uppercase mt-1">
                  BASE SEPOLIA
                </p>
              </BrutalCard>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-xl font-black uppercase animate-pulse">
                LOADING...
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* MY BOUNTIES */}
              <div>
                <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                  <span className="bg-brutal-yellow px-2">MY BOUNTIES</span>
                  <span className="text-brutal-pink">{myBounties.length}</span>
                </h2>

                {myBounties.length === 0 ? (
                  <BrutalCard variant="default" padding="lg">
                    <p className="font-bold uppercase text-gray-600 mb-4">
                      YOU HAVEN&apos;T CREATED ANY BOUNTIES YET
                    </p>
                    <Link href="/create">
                      <BrutalButton variant="primary" size="sm">
                        CREATE FIRST BOUNTY
                      </BrutalButton>
                    </Link>
                  </BrutalCard>
                ) : (
                  <div className="space-y-4">
                    {myBounties.map((bounty) => (
                      <Link key={bounty.id} href={`/bounties/${bounty.id}`}>
                        <BrutalCard variant="default" padding="md" hover>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-black text-lg uppercase">
                              {bounty.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-black ${
                                bounty.status === "OPEN"
                                  ? "bg-brutal-green"
                                  : "bg-brutal-pink"
                              }`}
                            >
                              {bounty.status}
                            </span>
                          </div>
                          <p className="font-bold text-brutal-green">
                            {bounty.prize} ETH
                          </p>
                        </BrutalCard>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* MY SUBMISSIONS */}
              <div>
                <h2 className="text-2xl font-black mb-4 flex items-center gap-2">
                  <span className="bg-brutal-pink px-2">MY HUNTS</span>
                  <span className="text-brutal-green">
                    {mySubmissions.length}
                  </span>
                </h2>

                {mySubmissions.length === 0 ? (
                  <BrutalCard variant="default" padding="lg">
                    <p className="font-bold uppercase text-gray-600 mb-4">
                      YOU HAVEN&apos;T SUBMITTED TO ANY BOUNTIES YET
                    </p>
                    <Link href="/bounties">
                      <BrutalButton variant="primary" size="sm">
                        BROWSE BOUNTIES
                      </BrutalButton>
                    </Link>
                  </BrutalCard>
                ) : (
                  <div className="space-y-4">
                    {mySubmissions.map((submission) => (
                      <Link
                        key={submission.id}
                        href={`/bounties/${submission.bounty_id}`}
                      >
                        <BrutalCard variant="default" padding="md" hover>
                          <p className="font-bold text-sm text-gray-600 uppercase mb-2">
                            BOUNTY #{submission.bounty_id.slice(0, 8)}
                          </p>
                          <p className="font-bold line-clamp-2">
                            {submission.content.slice(0, 100)}...
                          </p>
                        </BrutalCard>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </WalletGate>
      </main>
    </div>
  );
}
