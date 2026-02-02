/**
 * Mock data for Explore Mode - Testing
 * These match the POLY IDs that will be used in production
 */

import type { ExploreMarket } from './types';

export const MOCK_MARKETS: ExploreMarket[] = [
  {
    id: 'POLY-31552',
    title: 'Will Bitcoin reach $150K before July 2025?',
    description: 'Resolves Yes if Bitcoin price reaches $150,000 USD on any major exchange before July 1, 2025.',
    category: 'Crypto',
    subcategory: 'Bitcoin',
    volume: 4_250_000,
    end_date: '2025-06-30T23:59:59Z',
    event_ticker: 'btc-150k-jul-2025',
    outcomes: [
      { id: 'POLY-31552-yes', label: 'Yes', probability: 0.38, clob_id: 'POLY-31552' },
      { id: 'POLY-31552-no', label: 'No', probability: 0.62, clob_id: 'POLY-31552' },
    ],
    is_binary: true,
    status: 'active',
  },
  {
    id: 'POLY-33506',
    title: 'Lakers vs Celtics - NBA Finals MVP',
    description: 'Who will win the NBA Finals MVP if Lakers face Celtics?',
    category: 'Sports',
    subcategory: 'NBA',
    volume: 1_890_000,
    end_date: '2025-06-20T23:00:00Z',
    event_ticker: 'nba-finals-mvp-2025',
    outcomes: [
      { id: 'POLY-33506-lebron', label: 'LeBron James', probability: 0.28, clob_id: 'POLY-33506-LBJ' },
      { id: 'POLY-33506-tatum', label: 'Jayson Tatum', probability: 0.24, clob_id: 'POLY-33506-JT' },
      { id: 'POLY-33506-brown', label: 'Jaylen Brown', probability: 0.18, clob_id: 'POLY-33506-JB' },
      { id: 'POLY-33506-ad', label: 'Anthony Davis', probability: 0.15, clob_id: 'POLY-33506-AD' },
      { id: 'POLY-33506-other', label: 'Other', probability: 0.15, clob_id: 'POLY-33506-OTH' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-34587',
    title: 'Real Madrid vs Barcelona - El Clásico Winner',
    description: 'Who will win El Clásico on March 15, 2025?',
    category: 'Sports',
    subcategory: 'LaLiga',
    volume: 2_100_000,
    end_date: '2025-03-15T20:00:00Z',
    event_ticker: 'laliga-clasico-mar-2025',
    outcomes: [
      { id: 'POLY-34587-rma', label: 'Real Madrid', probability: 0.42, clob_id: 'POLY-34587-RMA' },
      { id: 'POLY-34587-fcb', label: 'Barcelona', probability: 0.35, clob_id: 'POLY-34587-FCB' },
      { id: 'POLY-34587-draw', label: 'Draw', probability: 0.23, clob_id: 'POLY-34587-DRW' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-67284',
    title: 'Fed Rate Decision - March 2025',
    description: 'Will the Federal Reserve cut interest rates at the March 2025 FOMC meeting?',
    category: 'Economy',
    subcategory: 'Fed',
    volume: 3_400_000,
    end_date: '2025-03-19T18:00:00Z',
    event_ticker: 'fed-rate-mar-2025',
    outcomes: [
      { id: 'POLY-67284-yes', label: 'Yes', probability: 0.45, clob_id: 'POLY-67284' },
      { id: 'POLY-67284-no', label: 'No', probability: 0.55, clob_id: 'POLY-67284' },
    ],
    is_binary: true,
    status: 'active',
  },
  {
    id: 'POLY-16167',
    title: 'Oscar Best Picture 2025',
    description: 'Which film will win Best Picture at the 97th Academy Awards?',
    category: 'Entertainment',
    subcategory: 'Oscars',
    volume: 1_560_000,
    end_date: '2025-03-02T23:00:00Z',
    event_ticker: 'oscars-best-pic-2025',
    outcomes: [
      { id: 'POLY-16167-anora', label: 'Anora', probability: 0.32, clob_id: 'POLY-16167-ANO' },
      { id: 'POLY-16167-brutalist', label: 'The Brutalist', probability: 0.25, clob_id: 'POLY-16167-BRU' },
      { id: 'POLY-16167-conclave', label: 'Conclave', probability: 0.18, clob_id: 'POLY-16167-CON' },
      { id: 'POLY-16167-emilia', label: 'Emilia Pérez', probability: 0.12, clob_id: 'POLY-16167-EMI' },
      { id: 'POLY-16167-wicked', label: 'Wicked', probability: 0.08, clob_id: 'POLY-16167-WIC' },
      { id: 'POLY-16167-other', label: 'Other', probability: 0.05, clob_id: 'POLY-16167-OTH' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-42365',
    title: 'Champions League Winner 2024-25',
    description: 'Which team will win the UEFA Champions League 2024-25?',
    category: 'Sports',
    subcategory: 'UCL',
    volume: 5_200_000,
    end_date: '2025-05-31T20:00:00Z',
    event_ticker: 'ucl-winner-2025',
    outcomes: [
      { id: 'POLY-42365-rma', label: 'Real Madrid', probability: 0.22, clob_id: 'POLY-42365-RMA' },
      { id: 'POLY-42365-mci', label: 'Manchester City', probability: 0.18, clob_id: 'POLY-42365-MCI' },
      { id: 'POLY-42365-ars', label: 'Arsenal', probability: 0.14, clob_id: 'POLY-42365-ARS' },
      { id: 'POLY-42365-bay', label: 'Bayern Munich', probability: 0.12, clob_id: 'POLY-42365-BAY' },
      { id: 'POLY-42365-liv', label: 'Liverpool', probability: 0.11, clob_id: 'POLY-42365-LIV' },
      { id: 'POLY-42365-psg', label: 'PSG', probability: 0.08, clob_id: 'POLY-42365-PSG' },
      { id: 'POLY-42365-bar', label: 'Barcelona', probability: 0.08, clob_id: 'POLY-42365-BAR' },
      { id: 'POLY-42365-other', label: 'Other', probability: 0.07, clob_id: 'POLY-42365-OTH' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-31759',
    title: 'Super Bowl LIX Winner',
    description: 'Which team will win Super Bowl LIX?',
    category: 'Sports',
    subcategory: 'NFL',
    volume: 8_900_000,
    end_date: '2025-02-09T23:30:00Z',
    event_ticker: 'nfl-superbowl-2025',
    outcomes: [
      { id: 'POLY-31759-kc', label: 'Kansas City Chiefs', probability: 0.28, clob_id: 'POLY-31759-KC' },
      { id: 'POLY-31759-det', label: 'Detroit Lions', probability: 0.18, clob_id: 'POLY-31759-DET' },
      { id: 'POLY-31759-phi', label: 'Philadelphia Eagles', probability: 0.15, clob_id: 'POLY-31759-PHI' },
      { id: 'POLY-31759-buf', label: 'Buffalo Bills', probability: 0.14, clob_id: 'POLY-31759-BUF' },
      { id: 'POLY-31759-bal', label: 'Baltimore Ravens', probability: 0.10, clob_id: 'POLY-31759-BAL' },
      { id: 'POLY-31759-other', label: 'Other', probability: 0.15, clob_id: 'POLY-31759-OTH' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-86832',
    title: 'Will ETH flip BTC market cap in 2025?',
    description: 'Resolves Yes if Ethereum market cap exceeds Bitcoin market cap at any point in 2025.',
    category: 'Crypto',
    subcategory: 'Ethereum',
    volume: 2_750_000,
    end_date: '2025-12-31T23:59:59Z',
    event_ticker: 'eth-flip-btc-2025',
    outcomes: [
      { id: 'POLY-86832-yes', label: 'Yes', probability: 0.12, clob_id: 'POLY-86832' },
      { id: 'POLY-86832-no', label: 'No', probability: 0.88, clob_id: 'POLY-86832' },
    ],
    is_binary: true,
    status: 'active',
  },
];

/**
 * Get all mock markets
 */
export function getMockMarkets(): ExploreMarket[] {
  return MOCK_MARKETS;
}

/**
 * Get a single mock market by ID
 */
export function getMockMarketById(id: string): ExploreMarket | null {
  return MOCK_MARKETS.find((m) => m.id === id) ?? null;
}
