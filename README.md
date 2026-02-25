<p align="center">
  <img width="1536" height="1024" alt="Image" src="https://github.com/user-attachments/assets/462b6cad-4243-416f-8ecd-eb81b46ab7e2" />

<h1 align="center">Polydraft</h1>

<p align="center">
  <strong>Fantasy prediction market gaming — open packs, draft picks, win points.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/Solana-Mainnet-9945FF?logo=solana" alt="Solana" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License" />
</p>

---

## What is Polydraft?

Polydraft is a prediction market gaming platform where players open packs of real-world prediction events, draft their picks, and earn points when outcomes resolve. Think fantasy sports meets trading cards — with real market data from Jupiter Prediction Markets on Solana.

Each pack contains 5 live prediction events. Swipe to pick outcomes, wait for the real world to play out, then reveal your results one by one. The harder the pick, the bigger the payout. Compete on the leaderboard and share your results.

Built with a retro pixel art aesthetic inspired by Balatro, designed for both web browsers and dedicated gaming handhelds.

## Screenshots

<p align="center">
  <img src="https://github.com/user-attachments/assets/6e22341f-3fba-4c98-a01d-cd8a99cb6c65" width="24%" />
  <img src="https://github.com/user-attachments/assets/11a6cae3-b29f-43d9-878f-a1210f8f351e" width="24%" />
  <img src="https://github.com/user-attachments/assets/1589e0e4-8b1d-47fd-8605-7735fae580c6" width="24%" />
  <img src="https://github.com/user-attachments/assets/cb9009ae-dcc1-43b1-86c5-09f44082cd62" width="24%" />
</p>

## Features

- **Pack-based prediction system** — 5 picks per pack, each a real prediction market event
- **Real-time market data** — Live odds from Jupiter Prediction Markets
- **Retro pixel art aesthetic** — Balatro-inspired card design with rarity tiers
- **Odds-based scoring** — Harder picks pay more, with tier bonuses for longshots
- **Sequential reveal** — Cards reveal one by one as events resolve in the real world
- **Gamepad-native controls** — First-class support for PSG1 handheld
- **PWA with offline support** — Installable, fullscreen, works offline
- **Leaderboard** — Weekly and all-time rankings
- **Share results** — Auto-generated OG images for social sharing
- **Premium packs** — On-chain purchases via Solana (PLAY token)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│  Next.js 14 (App Router) + Zustand + Framer Motion      │
│  Wallet Adapter (Phantom, MagicEden, etc.)              │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│   Supabase   │ │    Solana    │ │  Jupiter Prediction  │
│              │ │              │ │  Markets             │
│ PostgreSQL   │ │ SPL Token    │ │                      │
│ Row-Level    │ │ Transfers    │ │  Market data         │
│ Security     │ │              │ │  Direct trading      │
│ Auth         │ │ Anchor       │ │  Event capture       │
│              │ │ Program      │ │  Resolution sync     │
│              │ │ (Receipts)   │ │                      │
└──────────────┘ └──────────────┘ └──────────────────────┘
```

The architecture uses a **Venue Adapter pattern** that abstracts market data sources behind a common interface — `fetchMarkets`, `fetchPrices`, `checkResolution` — making it straightforward to integrate additional prediction market venues in the future.

## Explore & Jupiter Integration

### Market Discovery

The **Explore** section lets players browse live prediction markets from Jupiter. Users can search, filter by category, and view real-time odds for any active market — all without opening a pack.

### Direct Purchases via Jupiter Prediction Market API

From Explore, users can buy prediction contracts directly through Jupiter's Prediction Market API:

1. **User selects an outcome** — picks YES or NO on any market
2. **API returns an unsigned `VersionedTransaction`** — built server-side with the exact trade parameters
3. **Wallet signs** — user approves in Phantom, Magic Eden, or any Solana wallet
4. **On-chain confirmation** — transaction settles on Solana

This gives players a seamless trading experience without leaving the app, powered entirely by Jupiter's on-chain prediction market infrastructure.

### Automated Event Pipeline

Polydraft runs automated processes to keep market data fresh and resolve outcomes:

- **Event capture** — Scheduled jobs poll Jupiter's API to discover and ingest new prediction markets, mapping them into Polydraft's event format automatically
- **Price sync** — Periodic cron jobs update odds and probabilities for all active events
- **Resolution tracking** — Automated polling detects when markets settle, triggers outcome resolution, and recalculates pack scores — no manual intervention required

This pipeline ensures that packs always contain current, active markets and that results resolve as soon as the real-world outcome is known.

## Solana Integration

### Wallet Connection

Polydraft uses the standard Solana Wallet Adapter with Jupiter's wallet integration. Players connect with Phantom, Magic Eden, or any compatible Solana wallet.

### Purchase Flow

Premium packs are purchased on-chain. The flow:

1. **User selects a pack** — frontend builds transaction
2. **SPL token transfer** — PLAY tokens sent to treasury
3. **Wallet signs** — user approves in their wallet
4. **Server verifies** — backend confirms the on-chain transaction
5. **Pack created** — premium pack with payment receipt attached

### Transfer-Based Payments

Premium pack purchases use direct SPL token transfers to the treasury wallet:

```
Buyer ATA  ──→  Treasury ATA
         (USDC or PLAY)
```

The transfer is built with `createTransferCheckedInstruction` from `@solana/spl-token` — an atomic, verified operation that:

- Validates the token mint and decimal precision
- Ensures exact amount reaches the treasury
- Produces a unique transaction signature for verification

**Why transfers over a custom program?** The first production release uses the battle-tested SPL Token program rather than a custom smart contract for payments. This was a deliberate choice:

- **Proven reliability** — SPL Token transfers are the most battle-tested operation on Solana, used by every major protocol
- **No custom program risk** — No custom on-chain code to audit, exploit, or upgrade during initial launch
- **Faster iteration** — Payment logic changes happen in the backend, not through program deploys
- **Same security guarantees** — Server-side verification is equally rigorous (see below)

### Smart Contract (Anchor Program)

A custom Anchor program (`polydraft-purchase`) exists and is ready for future use:

```rust
// PDA-based receipt system for idempotent purchases
seeds = ["purchase", buyer.key(), client_seed.as_bytes()]
```

The program creates on-chain `PurchaseReceipt` accounts — PDAs that serve as permanent, tamper-proof proof of purchase. Each receipt records the buyer, amount, timestamp, and a client-generated seed that prevents duplicate purchases. This is planned for activation when more complex on-chain logic is needed (pack types, on-chain inventory, programmatic pricing).

### Backend Verification

Every premium pack purchase is verified server-side before the pack is created:

1. **Transaction confirmation** — Poll the Solana RPC until the signature is confirmed
2. **Instruction validation** — Parse the transaction and locate the SPL transfer instruction
3. **Amount matching** — Verify the exact token amount was transferred
4. **Recipient check** — Confirm tokens arrived at the correct treasury ATA
5. **Buyer authentication** — Match the transaction signer to the requesting wallet
6. **Double-spend prevention** — Unique constraint on `payment_signature` in the database

### Event Resolution

Prediction events resolve through real-world outcomes:

1. A scheduled job polls venue APIs for settlement status
2. Resolved events update in the database with the winning outcome
3. Each pick is marked correct or incorrect
4. Pack totals recalculate — points awarded based on the probability at pick time
5. Players reveal results through an animated sequential sequence

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript 5, Tailwind CSS, Framer Motion |
| **State** | Zustand (persisted stores) |
| **Backend** | Supabase (PostgreSQL + Row-Level Security + Edge Functions) |
| **Blockchain** | Solana Web3.js, SPL Token, Anchor, Jupiter Wallet Adapter |
| **PWA** | Serwist (service worker, offline fallback, precaching) |
| **Styling** | Pixel art fonts (Press Start 2P, VT323), Balatro-inspired card rarity system |

## Game Flow

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌────────────┐
│  Open   │───▶│  Draft  │───▶│   Wait   │───▶│ Reveal  │───▶│ Leaderboard│
│  Pack   │    │  Picks  │    │          │    │ Results │    │            │
└─────────┘    └─────────┘    └──────────┘    └─────────┘    └────────────┘
  5 events      Swipe to       Events          Cards flip      Points
  appear        pick A/B       resolve in      one by one      tallied,
                (or Draw)      the real         with            rank
                               world            animation       updated
```

**Scoring:**
- Each pick is a $1 bet. Payout = `1 / probability` at pick time
- A 10% pick pays 10x. A 50% pick pays 2x.
- Tier bonuses: longshots (< 10%) earn +$0.50, underdogs (10–25%) earn +$0.25
- Perfect pack (5/5) earns a +$5 bonus

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/nicolo-psg1/polydraft.git
cd polydraft

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase and Solana credentials

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

See `.env.local.example` for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_VENUE` | Active prediction market venue (e.g. `jupiter`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint |
| `NEXT_PUBLIC_TREASURY_PUBKEY` | Treasury wallet for premium payments |
| `NEXT_PUBLIC_PAYMENT_METHOD` | Payment method: `program` (Anchor) or `transfer` (SPL) |

## Project Structure

```
src/
├── app/              # Pages and API routes (Next.js App Router)
│   ├── api/          # REST endpoints (packs, events, auth, cron)
│   ├── game/         # Game pages (draft, reveal)
│   ├── explore/      # Market exploration
│   ├── leaderboard/  # Rankings
│   └── share/        # Social sharing + OG images
├── components/       # UI components organized by feature
│   ├── game/         # SwipeCard, PackSummary, QueueCard, EventCard
│   ├── explore/      # OutcomeCarousel, PurchaseModal, ExploreGrid
│   └── packs/        # Pack display and management
├── lib/              # Core business logic
│   ├── adapters/     # Venue adapter pattern (Jupiter Prediction Markets)
│   ├── solana/       # On-chain purchase + verification
│   ├── scoring/      # Odds-based scoring calculator
│   ├── resolution/   # Sequential reveal state machine
│   ├── supabase/     # Database operations
│   └── rarity/       # Card rarity tier calculation
├── stores/           # Zustand state stores (persisted)
├── hooks/            # Custom React hooks (gamepad, platform, sync)
└── types/            # TypeScript type definitions

programs/
└── polydraft-purchase/   # Anchor smart contract (Rust)

supabase/
└── migrations/           # PostgreSQL schema migrations
```

## License

MIT
