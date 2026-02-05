/**
 * Mock data for Explore Mode - Real Polymarket Events
 *
 * Image paths follow this convention:
 * - Event images: /images/explore/events/{event-slug}.svg (or .png when real images available)
 * - Outcome images: /images/explore/outcomes/{event_ticker}-{image_slug}
 *   (image_slug includes the file extension, e.g., 'jd-vance.jpg')
 *
 * Fallback logic:
 * 1. If outcome.image_slug exists → construct path: /images/explore/outcomes/{event_ticker}-{image_slug}
 * 2. If market.image_url exists → use event image
 * 3. Otherwise → show category emoji
 *
 * To add images for outcomes:
 * 1. Add image_slug with extension to the outcome (e.g., 'arsenal.png', 'jd-vance.jpg')
 * 2. Place image at: public/images/explore/outcomes/{event_ticker}-{image_slug}
 */

import type { ExploreMarket } from './types';

export const MOCK_MARKETS: ExploreMarket[] = [
  {
    id: 'POLY-31552',
    title: 'Presidential Election Winner 2028',
    description: 'Which candidate will win the 2028 US Presidential Election?',
    image_url: '/images/explore/events/presidential-election-winner-2028.png',
    category: 'Politics',
    subcategory: 'US Elections',
    volume: 245_674_187,
    end_date: '2028-11-07T00:00:00Z',
    event_ticker: 'presidential-election-winner-2028',
    outcomes: [
      { id: 'POLY-31552-jdv', label: 'JD Vance', probability: 0.25, clob_id: 'POLY-31552-JDV', image_slug: 'jd-vance.jpg', jupiterMarketId: 'POLY-561229' },
      { id: 'POLY-31552-newsom', label: 'Gavin Newsom', probability: 0.19, clob_id: 'POLY-31552-NEWSOM', image_slug: 'gavin-newsom.jpg', jupiterMarketId: 'POLY-561230' },
      { id: 'POLY-31552-rubio', label: 'Marco Rubio', probability: 0.08, clob_id: 'POLY-31552-RUBIO', jupiterMarketId: 'POLY-561234' },
      { id: 'POLY-31552-aoc', label: 'Alexandria Ocasio-Cortez', probability: 0.05, clob_id: 'POLY-31552-AOC', image_slug: 'aoc.jpg', jupiterMarketId: 'POLY-561231' },
      { id: 'POLY-31552-harris', label: 'Kamala Harris', probability: 0.05, clob_id: 'POLY-31552-HARRIS', jupiterMarketId: 'POLY-561239' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-33506',
    title: 'UEFA Champions League Winner 2025-26',
    description: 'Which club will win the 2025–26 UEFA Champions League?',
    image_url: '/images/explore/events/ucl-winner-2025-26.svg',
    category: 'Sports',
    subcategory: 'UCL',
    volume: 203_313_747,
    end_date: '2026-05-31T00:00:00Z',
    event_ticker: 'uefa-champions-league-winner',
    outcomes: [
      { id: 'POLY-33506-ars', label: 'Arsenal', probability: 0.195, clob_id: 'POLY-33506-ARS', image_slug: 'arsenal.png' },
      { id: 'POLY-33506-mci', label: 'Manchester City', probability: 0.095, clob_id: 'POLY-33506-MCI', image_slug: 'manchester-city.png' },
      { id: 'POLY-33506-rma', label: 'Real Madrid', probability: 0.065, clob_id: 'POLY-33506-RMA', image_slug: 'real-madrid.png' },
      { id: 'POLY-33506-liv', label: 'Liverpool', probability: 0.12, clob_id: 'POLY-33506-LIV', image_slug: 'liverpool.png' },
      { id: 'POLY-33506-bar', label: 'Barcelona', probability: 0.09, clob_id: 'POLY-33506-BAR', image_slug: 'barcelona.png' },
      { id: 'POLY-33506-bay', label: 'Bayern Munich', probability: 0.07, clob_id: 'POLY-33506-BAY', image_slug: 'bayern-munich.png' },
      { id: 'POLY-33506-psg', label: 'PSG', probability: 0.05, clob_id: 'POLY-33506-PSG', image_slug: 'psg.png' },
      { id: 'POLY-33506-other', label: 'Other', probability: 0.315, clob_id: 'POLY-33506-OTHER' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-34587',
    title: 'Portugal Presidential Election 2026',
    description: 'Who will win the 2026 Portugal Presidential Election?',
    image_url: '/images/explore/events/portugal-presidential-2026.png',
    category: 'Politics',
    subcategory: 'Portugal',
    volume: 128_264_667,
    end_date: '2026-02-08T14:00:00Z',
    event_ticker: 'portugal-presidential-election',
    outcomes: [
      { id: 'POLY-34587-seguro', label: 'António José Seguro', probability: 0.99, clob_id: 'POLY-34587-SEGURO', jupiterMarketId: 'POLY-569433' },
      { id: 'POLY-34587-ventura', label: 'André Ventura', probability: 0.01, clob_id: 'POLY-34587-VENTURA', jupiterMarketId: 'POLY-569426' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-67284',
    title: 'Fed Decision March 2026',
    description: 'What will be the Federal Reserve interest rate decision in March 2026?',
    image_url: '/images/explore/events/fed-decision-march-2026.png',
    category: 'Economy',
    subcategory: 'Fed',
    volume: 49_746_381,
    end_date: '2026-03-18T00:00:00Z',
    event_ticker: 'fed-decision-in-march-885',
    outcomes: [
      { id: 'POLY-67284-nochange', label: 'No Change', probability: 0.81, clob_id: 'POLY-67284-NOCHANGE', jupiterMarketId: 'POLY-654414' },
      { id: 'POLY-67284-cut25', label: '25 bps decrease', probability: 0.18, clob_id: 'POLY-67284-CUT25', jupiterMarketId: 'POLY-654413' },
      { id: 'POLY-67284-cut50', label: '50+ bps decrease', probability: 0.01, clob_id: 'POLY-67284-CUT50', jupiterMarketId: 'POLY-654412' },
      { id: 'POLY-67284-hike25', label: '25+ bps increase', probability: 0.01, clob_id: 'POLY-67284-HIKE25', jupiterMarketId: 'POLY-654415' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-114242',
    title: 'US Strikes Iran By...?',
    description: 'When will the US strike Iran?',
    image_url: '/images/explore/events/us-strikes-iran.png',
    category: 'Politics',
    subcategory: 'Geopolitics',
    volume: 19_809_123,
    end_date: '2026-06-30T00:00:00Z',
    event_ticker: 'us-strikes-iran',
    outcomes: [
      { id: 'POLY-114242-jun30', label: 'By June 30', probability: 0.50, clob_id: 'POLY-114242-JUN30', jupiterMarketId: 'POLY-984442' },
      { id: 'POLY-114242-mar31', label: 'By March 31', probability: 0.39, clob_id: 'POLY-114242-MAR31', jupiterMarketId: 'POLY-984441' },
      { id: 'POLY-114242-feb28', label: 'By February 28', probability: 0.27, clob_id: 'POLY-114242-FEB28', jupiterMarketId: 'POLY-1198423' },
      { id: 'POLY-114242-feb20', label: 'By February 20', probability: 0.19, clob_id: 'POLY-114242-FEB20', jupiterMarketId: 'POLY-1320793' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-42365',
    title: 'U.S. Invades Venezuela?',
    description: 'Will the United States invade Venezuela?',
    image_url: '/images/explore/events/us-invades-venezuela.png',
    category: 'Politics',
    subcategory: 'Geopolitics',
    volume: 13_515_687,
    end_date: '2026-12-31T00:00:00Z',
    event_ticker: 'will-the-us-invade-venezuela-in-2025',
    outcomes: [
      { id: 'POLY-42365-dec26', label: 'By Dec 31, 2026', probability: 0.115, clob_id: 'POLY-42365-DEC26' },
      { id: 'POLY-42365-mar26', label: 'By Mar 31, 2026', probability: 0.029, clob_id: 'POLY-42365-MAR26' },
      { id: 'POLY-42365-jan26', label: 'By Jan 31, 2026', probability: 0.005, clob_id: 'POLY-42365-JAN26' },
      { id: 'POLY-42365-dec25', label: 'By Dec 31, 2025', probability: 0.001, clob_id: 'POLY-42365-DEC25' },
    ],
    is_binary: false,
    status: 'active',
  },
  {
    id: 'POLY-31759',
    title: 'Russia-Ukraine Ceasefire by March 2026?',
    description: 'Will there be a ceasefire between Russia and Ukraine by March 31, 2026?',
    image_url: '/images/explore/events/russia-ukraine-ceasefire.jpeg',
    category: 'Politics',
    subcategory: 'Geopolitics',
    volume: 12_959_057,
    end_date: '2026-03-31T00:00:00Z',
    event_ticker: 'russia-x-ukraine-ceasefire-by-march-31-2026',
    outcomes: [
      { id: 'POLY-31759-yes', label: 'Yes', probability: 0.115, clob_id: 'POLY-31759-YES' },
      { id: 'POLY-31759-no', label: 'No', probability: 0.885, clob_id: 'POLY-31759-NO' },
    ],
    is_binary: true,
    status: 'active',
  },
  {
    id: 'POLY-86832',
    title: 'Companies Acquired Before 2027',
    description: 'Which companies will be acquired before 2027?',
    image_url: '/images/explore/events/companies-acquired-2027.png',
    category: 'Business',
    subcategory: 'M&A',
    volume: 11_587_780,
    end_date: '2026-12-31T00:00:00Z',
    event_ticker: 'which-companies-will-be-acquired-before-2027',
    outcomes: [
      { id: 'POLY-86832-ubisoft', label: 'Ubisoft', probability: 0.295, clob_id: 'POLY-86832-UBISOFT', image_slug: 'ubisoft.jpeg' },
      { id: 'POLY-86832-snap', label: 'Snapchat', probability: 0.188, clob_id: 'POLY-86832-SNAP', image_slug: 'snapchat.jpeg' },
      { id: 'POLY-86832-viking', label: 'Viking Therapeutics', probability: 0.16, clob_id: 'POLY-86832-VIKING', image_slug: 'viking-therapeutics.jpeg' },
      { id: 'POLY-86832-zoom', label: 'Zoom', probability: 0.084, clob_id: 'POLY-86832-ZOOM', image_slug: 'zoom.jpeg' },
      { id: 'POLY-86832-irobot', label: 'iRobot', probability: 1.0, clob_id: 'POLY-86832-IROBOT', image_slug: 'irobot.jpeg' },
    ],
    is_binary: false,
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
