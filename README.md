# BASEPAD

**Onchain bounty platform with x402 micropayments on Base**

---

## The Problem

I've been freelancing for 2 years. Every single time, the same nightmare:

- Client posts a job on Upwork/Fiverr
- I submit my work
- They ghost me or dispute the payment
- Platform takes 20% fees
- Payment takes 5-7 days to clear
- No transparency, no trust

I watched talented devs get scammed. I got scammed. The system is broken.

**The real issue?** Centralized platforms control everything. They hold your money. They decide disputes. They take massive cuts. And you have zero recourse.

I needed something different. Something where:
- Payment terms are locked onchain
- Winners get paid automatically
- No middleman taking 20%
- Full transparency on Base

But there was another problem: **how do you charge for bounty creation without building complex payment infrastructure?**

That's when I found **x402**.

---

## The Solution: BasePad + x402

BasePad is a **fully onchain bounty platform** where:

1. **Creators post bounties** with locked prize amounts
2. **Hunters submit work** (code, designs, whatever)
3. **AI reviews submissions** (Gemini 2.0 Flash for quality checks)
4. **Winners get paid instantly** in USDC on Base Sepolia
5. **Everything is transparent** - all transactions visible on BaseScan

### Why x402?

Instead of building custom payment flows, I used **x402 Protocol** (HTTP 402 Payment Required):

- **Standard HTTP status code** for payments
- **Works with any wallet** (I use Privy embedded wallets)
- **Micropayments made easy** - 0.001 USDC to create a bounty
- **On-chain verification** - I verify payments directly on Base Sepolia

**The flow is dead simple:**
1. User clicks "Create Bounty"
2. API returns `402 Payment Required` with USDC payment details
3. User approves 1000 USDC (0.001 USDC) transfer
4. Backend verifies the transaction on-chain
5. Bounty goes live

No external payment processors. No credit cards. No bullshit.

---

## What Makes This Different

### 1. Direct On-Chain Payment Verification
I don't trust external facilitators. BasePad verifies payments by:
- Fetching transaction receipts from Base Sepolia RPC
- Decoding USDC Transfer events from logs
- Validating recipient address and amount
- Zero external dependencies

### 2. Real x402 Implementation
This isn't a mock. It's a real x402 flow using:
- Official Circle USDC on Base Sepolia (`0x036cbd53842c5426634e7929541ec2318f3dcf7e`)
- Standard x402 response format
- Proper payment verification

### 3. Built for Builders
- **AI-powered reviews** - Gemini 2.0 checks submission quality
- **Telegram notifications** - Creators get instant alerts
- **Privy embedded wallets** - No MetaMask required
- **Neo-brutal UI** - Clean, functional, no distractions

---

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + TailwindCSS
- **Web3:** Privy (Auth/Wallet) + Viem + Ethers.js
- **Chain:** Base Sepolia
- **Payments:** x402 Protocol + USDC
- **Database:** Supabase (Postgres)
- **AI:** Gemini 2.0 Flash
- **Notifications:** Telegram Bot

---

## Why This Matters for BuildOnchain

x402 is the future of onchain payments. BasePad proves you can:
- Build real consumer products with x402
- Verify payments without external dependencies
- Create seamless UX with embedded wallets
- Ship meaningful onchain products fast

This is what BuildOnchain is about: **learning by building real shit.**

---

## Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript + TailwindCSS + Framer Motion
- **Web3:** Privy (Auth/Wallet) + Viem (Contract interactions) + Base Sepolia
- **Backend:** Next.js Route Handlers + Supabase (Postgres)
- **Payments:** **x402 Protocol** (HTTP 402 flow) + USDC on Base Sepolia
- **AI:** Gemini 2.0 Flash (Submission review)
- **Notifications:** Telegram Bot Integration

## Design System: Functional Neo-Brutalism

- **Borders:** 4-6px solid black
- **Shadows:** Hard only (`box-shadow: 4px 4px 0px 0px #000`)
- **Radius:** 0px (no rounded corners)
- **Typography:** Uppercase, bold, optimized for readability
- **Palette:** Black, White, Neon Green (#00FF00), Neon Pink (#FF00FF), Yellow (#FFFF00)
- **Motion:** Framer Motion for staggered animations and typewriter effects
- **Philosophy:** Minimal visual noise, maximum clarity, subtle motion for guidance

## Setup

1. **Clone & Install**

```bash
npm install
```

2. **Environment Variables**
Copy `.env.example` to `.env.local` and fill in:

- Privy App ID (from <https://dashboard.privy.io>)
- Supabase URL & Keys (from <https://supabase.com/dashboard>)
- Platform wallet address & private key

3. **Database Setup**
Run the SQL in `.env.example` comments in your Supabase SQL editor.

4. **Run Dev Server**

```bash
npm run dev
```

## Architecture

```
basepad/
├── app/
│   ├── layout.tsx (Global Privy + Brutal styles)
│   ├── page.tsx (Landing)
│   ├── bounties/
│   │   ├── page.tsx (List)
│   │   └── [id]/page.tsx (Detail)
│   ├── create/page.tsx (x402 payment gate)
│   ├── profile/page.tsx
│   └── api/ (bounties, submissions, payout)
├── components/
│   ├── BrutalButton.tsx
│   ├── BrutalCard.tsx
│   ├── Navbar.tsx
│   ├── WalletGate.tsx
│   └── Providers.tsx
└── lib/ (base.ts, privy.ts, supabase.ts, x402.ts)
```

## How It Works

### Creating a Bounty (x402 Flow)

1. Connect wallet (Privy embedded wallet)
2. Fill bounty details (title, description, prize in ETH)
3. Click "Create Bounty"
4. **x402 kicks in:**
   - API returns `402 Payment Required`
   - Shows payment requirement: 0.001 USDC
   - User approves USDC transfer
   - Transaction sent to Base Sepolia
5. **Backend verifies on-chain:**
   - Fetches transaction receipt
   - Decodes USDC Transfer event
   - Validates recipient and amount
6. Bounty goes live

### Hunting a Bounty

1. Browse open bounties
2. Submit your work (code, design, whatever)
3. AI reviews your submission (Gemini 2.0)
4. Creator picks winner
5. Get paid instantly in USDC

### Payment Verification (The Hard Part)

Most x402 implementations rely on external facilitators. I don't. Here's how BasePad verifies payments:

```typescript
1. Get transaction receipt from Base Sepolia RPC
2. Check transaction status (must be successful)
3. Verify transaction is to USDC contract
4. Find Transfer event in logs
5. Decode Transfer(from, to, amount)
6. Validate:
   - to === platform wallet
   - amount >= required amount
7. Create bounty if valid
```

**Why this matters:** No external dependencies. No single point of failure. Pure on-chain verification.

## Flows

### Creating a Bounty

1. User connects wallet (Privy embedded wallet)
2. Fills bounty details (title, description, prize)
3. Clicks "Create" → x402 payment gate triggers
4. Approves 0.001 USDC payment
5. Backend verifies payment on Base Sepolia
6. Bounty goes live, visible to hunters

### Hunting a Bounty

1. Hunter views bounty details
2. Submits work (code, design, etc.)
3. Gemini 2.0 auto-reviews submission
4. Creator reviews and selects winner
5. Platform executes payout (USDC to winner)

### Payout

1. Creator selects winning submission
2. Backend verifies ownership
3. Platform wallet sends prize to winner
4. Bounty status updates to PAID
5. Winner receives notification

## License

MIT
