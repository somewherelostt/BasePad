# BASEPAD

**The Trustless Bounty Marketplace on Base.**

---

## ⚡ The Problem

Freelancing is broken. Centralized platforms charge 20% fees, hold your funds hostage, and arbitrate disputes behind closed doors. You do the work, they take the cut.

**BasePad** changes the game. It is a **fully onchain bounty marketplace** where:
- **Funds are locked upfront** (Pre-funded in USDC)
- **Payments are instant** (Programmatic payouts on Base)
- **Reputation is self-sovereign** (Based on onchain history)
- **No middleman fees** (Only network gas + minimal protocol fee)

---

## 🛠️ The Solution

BasePad replaces trust with code. By leveraging the **x402 Protocol** (HTTP 402 Payment Required), we treat payments as first-class citizens of the web.

1.  **Creators post bounties** with locked multi-tier prize pools (USDC).
2.  **Hunters submit work** (Code, Design, Audits).
3.  **AI reviews submissions** (Gemini 2.0 Flash) for an objective initial score.
4.  **Winners get paid instantly** via on-chain settlement.

### Key Features

*   **🛡️ Protocol Hardening**:
    *   **Strict Funding Integrity**: Validates `AmountPaid == Sum(Prizes) + Fee` cryptographically.
    *   **Submission Anchoring**: All work is hashed (`SHA-256`) and anchored to Base block height to prevent tampering.
    *   **Auditable AI**: Evaluation logic is logged to a public audit trail.

*   **🏆 Multi-Prize Bounties**:
    *   Define prizes for 1st, 2nd, 3rd place.
    *   Automated multi-winner payouts in USDC.

*   **👤 Onchain Identity & Reputation**:
    *   **Verified Profiles**: High-reputation users (>500 Score) earn a protocol badge.
    *   **Weighted Score**: `Reputation = Earnings × Win Rate`. Farmers get penalized; pros get recognized.

*   **🎨 Neo-Brutalist Design**:
    *   High-contrast, no-nonsense UI focused on clarity and action.
    *   "Brutal" design system for max readability.

---

## 🏗️ Tech Stack

Built for speed, security, and transparency.

-   **Frontend:** Next.js 14, TypeScript, TailwindCSS, Framer Motion
-   **Auth/Wallet:** Privy (Embedded Wallets)
-   **Chain:** Base Sepolia
-   **Payments:** x402 Protocol + USDC
-   **Database:** Supabase (PostgreSQL with RLS)
-   **AI:** Gemini 2.0 Flash (Code Analysis)

---

## 🚀 How It Works

### Creating a Bounty
1.  Connect wallet via Privy.
2.  Define **Prize Tiers** (e.g., 100 USDC, 50 USDC).
3.  **x402 Gate**: Protocol requests `0.001 USDC` fee + Prize Pool total.
4.  Approve USDC transfer.
5.  Backend verifies transaction receipt on Base Sepolia.
6.  Bounty goes live.

### Hunting & Earning
1.  Browse active bounties.
2.  Submit work (URL/Text). Content is **hashed & anchored**.
3.  Gemini 2.0 analyzes submission (Security, Efficiency, Cleanliness).
4.  Creator selects winners.
5.  **Instant Payout**: Funds move from protocol escrow to your wallet.

---

## 📦 Setup

1.  **Clone & Install**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Copy `.env.example` to `.env.local` and add keys for Privy, Supabase, and Gemini.

3.  **Run Dev Server**
    ```bash
    npm run dev
    ```

---
**BasePad**. Code is Law. Work is Value.
