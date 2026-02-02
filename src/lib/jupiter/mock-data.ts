/**
 * Mock data for Jupiter/Kalshi Explore Mode
 * Used for development and testing
 */

import type { ExploreMarket } from './types';

export const MOCK_MARKETS: ExploreMarket[] = [
  // 1. Binary - Sports
  {
    id: 'SUPERBOWL-2025',
    title: 'Will the Kansas City Chiefs win Super Bowl 2025?',
    description: 'This market will resolve to "Yes" if the Kansas City Chiefs win Super Bowl LIX.',
    category: 'Sports',
    subcategory: 'NFL',
    volume: 2_500_000,
    end_date: '2025-02-09T23:00:00Z',
    event_ticker: 'SUPERBOWL',
    outcomes: [
      { id: 'SUPERBOWL-2025-yes', label: 'Yes', probability: 0.35, clob_id: 'SUPERBOWL-2025' },
      { id: 'SUPERBOWL-2025-no', label: 'No', probability: 0.65, clob_id: 'SUPERBOWL-2025' },
    ],
    is_binary: true,
    status: 'active',
  },
  // 2. Binary - Politics
  {
    id: 'FED-RATE-MAR25',
    title: 'Will the Fed cut rates in March 2025?',
    description: 'Resolves "Yes" if the Federal Reserve announces a rate cut at the March 2025 FOMC meeting.',
    category: 'Economy',
    subcategory: 'Fed',
    volume: 1_800_000,
    end_date: '2025-03-19T18:00:00Z',
    event_ticker: 'FEDRATE',
    outcomes: [
      { id: 'FED-RATE-MAR25-yes', label: 'Yes', probability: 0.42, clob_id: 'FED-RATE-MAR25' },
      { id: 'FED-RATE-MAR25-no', label: 'No', probability: 0.58, clob_id: 'FED-RATE-MAR25' },
    ],
    is_binary: true,
    status: 'active',
  },
  // 3. Multi-outcome - Oscars
  {
    id: 'OSCARS-BESTPIC-2025',
    title: 'Best Picture - Oscars 2025',
    description: 'Which film will win Best Picture at the 97th Academy Awards?',
    category: 'Entertainment',
    subcategory: 'Oscars',
    volume: 950_000,
    end_date: '2025-03-02T23:00:00Z',
    event_ticker: 'OSCARS2025',
    outcomes: [
      { id: 'OSCARS-BP-anora', label: 'Anora', probability: 0.28, clob_id: 'OSCARS-BP-ANORA' },
      { id: 'OSCARS-BP-brutalist', label: 'The Brutalist', probability: 0.22, clob_id: 'OSCARS-BP-BRUTALIST' },
      { id: 'OSCARS-BP-conclave', label: 'Conclave', probability: 0.18, clob_id: 'OSCARS-BP-CONCLAVE' },
      { id: 'OSCARS-BP-emilia', label: 'Emilia Pérez', probability: 0.12, clob_id: 'OSCARS-BP-EMILIA' },
      { id: 'OSCARS-BP-wicked', label: 'Wicked', probability: 0.08, clob_id: 'OSCARS-BP-WICKED' },
      { id: 'OSCARS-BP-substance', label: 'The Substance', probability: 0.05, clob_id: 'OSCARS-BP-SUBSTANCE' },
      { id: 'OSCARS-BP-dune', label: 'Dune: Part Two', probability: 0.04, clob_id: 'OSCARS-BP-DUNE' },
      { id: 'OSCARS-BP-other', label: 'Other', probability: 0.03, clob_id: 'OSCARS-BP-OTHER' },
    ],
    is_binary: false,
    status: 'active',
  },
  // 4. Binary - Crypto
  {
    id: 'BTC-100K-Q1',
    title: 'Will Bitcoin reach $100K in Q1 2025?',
    description: 'Resolves "Yes" if Bitcoin price reaches $100,000 USD on any major exchange before April 1, 2025.',
    category: 'Crypto',
    subcategory: 'Bitcoin',
    volume: 3_200_000,
    end_date: '2025-03-31T23:59:59Z',
    event_ticker: 'BTC100K',
    outcomes: [
      { id: 'BTC-100K-Q1-yes', label: 'Yes', probability: 0.72, clob_id: 'BTC-100K-Q1' },
      { id: 'BTC-100K-Q1-no', label: 'No', probability: 0.28, clob_id: 'BTC-100K-Q1' },
    ],
    is_binary: true,
    status: 'active',
  },
  // 5. Multi-outcome - NBA MVP
  {
    id: 'NBA-MVP-2025',
    title: 'NBA MVP 2024-25 Season',
    description: 'Who will win the NBA Most Valuable Player award for the 2024-25 season?',
    category: 'Sports',
    subcategory: 'NBA',
    volume: 1_450_000,
    end_date: '2025-06-15T23:00:00Z',
    event_ticker: 'NBAMVP',
    outcomes: [
      { id: 'NBA-MVP-shai', label: 'Shai Gilgeous-Alexander', probability: 0.35, clob_id: 'NBA-MVP-SHAI' },
      { id: 'NBA-MVP-jokic', label: 'Nikola Jokić', probability: 0.25, clob_id: 'NBA-MVP-JOKIC' },
      { id: 'NBA-MVP-giannis', label: 'Giannis Antetokounmpo', probability: 0.15, clob_id: 'NBA-MVP-GIANNIS' },
      { id: 'NBA-MVP-luka', label: 'Luka Dončić', probability: 0.10, clob_id: 'NBA-MVP-LUKA' },
      { id: 'NBA-MVP-jayson', label: 'Jayson Tatum', probability: 0.08, clob_id: 'NBA-MVP-JAYSON' },
      { id: 'NBA-MVP-other', label: 'Other', probability: 0.07, clob_id: 'NBA-MVP-OTHER' },
    ],
    is_binary: false,
    status: 'active',
  },
  // 6. Binary - Tech
  {
    id: 'APPLE-AI-WWDC',
    title: 'Will Apple announce AI hardware at WWDC 2025?',
    description: 'Resolves "Yes" if Apple announces dedicated AI hardware (chip or device) at WWDC 2025.',
    category: 'Tech',
    subcategory: 'Apple',
    volume: 780_000,
    end_date: '2025-06-10T20:00:00Z',
    event_ticker: 'APPLEAI',
    outcomes: [
      { id: 'APPLE-AI-WWDC-yes', label: 'Yes', probability: 0.55, clob_id: 'APPLE-AI-WWDC' },
      { id: 'APPLE-AI-WWDC-no', label: 'No', probability: 0.45, clob_id: 'APPLE-AI-WWDC' },
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
