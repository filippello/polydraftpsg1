/**
 * Jupiter Prediction Market API Client
 *
 * API for creating orders on Jupiter Prediction Markets on Solana.
 * Returns unsigned transactions that must be signed by the user's wallet.
 */

const PREDICTION_API_BASE = 'https://prediction-market-api.jup.ag/api/v1';

// USDC mint address on Solana mainnet
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// ============================================
// Request/Response Types
// ============================================

export interface CreateOrderRequest {
  userPubkey: string;
  marketId: string;        // e.g., "POLY-559652"
  depositMint: string;     // USDC mint address
  isBuy: boolean;
  isYes: boolean;
  maxBuyPriceUsd: string;  // micro-USD (e.g., "320000" for $0.32)
  depositAmount: string;   // micro-USDC (e.g., "5000000" for 5 USDC)
}

export interface CreateOrderResponse {
  transaction: string;     // base64-encoded unsigned transaction
  txMeta: {
    blockhash: string;
    lastValidBlockHeight: number;
  };
  order: {
    orderPubkey?: string;
    contracts: string;
    orderCostUsd: string;
    estimatedTotalFeeUsd: string;
  };
}

export interface JupiterMarket {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'active' | 'closed' | 'resolved';
  outcomes?: Array<{
    id: string;
    label: string;
    probability: number;
  }>;
}

export interface JupiterApiError {
  error: string;
  message?: string;
  details?: unknown;
}

// ============================================
// Conversion Helpers
// ============================================

/**
 * Convert USD to micro-USD (6 decimal places)
 * $0.32 → 320000
 */
export function usdToMicro(usd: number): string {
  return Math.floor(usd * 1_000_000).toString();
}

/**
 * Convert micro-USD back to USD
 * 320000 → $0.32
 */
export function microToUsd(micro: string | number): number {
  const value = typeof micro === 'string' ? parseInt(micro, 10) : micro;
  return value / 1_000_000;
}

/**
 * Convert USDC amount to micro (6 decimals)
 * 5 USDC → 5000000
 */
export function usdcToMicro(usdc: number): string {
  return Math.floor(usdc * 1_000_000).toString();
}

/**
 * Convert micro-USDC back to USDC
 * 5000000 → 5 USDC
 */
export function microToUsdc(micro: string | number): number {
  const value = typeof micro === 'string' ? parseInt(micro, 10) : micro;
  return value / 1_000_000;
}

// ============================================
// API Functions
// ============================================

/**
 * Create an order on Jupiter Prediction Market
 *
 * Returns an unsigned transaction that must be signed by the user's wallet.
 *
 * @param request Order parameters
 * @returns Unsigned transaction and order details
 */
export async function createOrder(
  request: CreateOrderRequest
): Promise<CreateOrderResponse> {
  const response = await fetch(`${PREDICTION_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = (await response.json()) as JupiterApiError;
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Use default error message
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<CreateOrderResponse>;
}

/**
 * Create an order with simplified parameters
 *
 * @param userPubkey User's wallet public key (base58)
 * @param marketId Jupiter market ID (e.g., "POLY-559652")
 * @param isYes Whether betting on YES outcome
 * @param priceUsd Price per contract in USD (e.g., 0.32)
 * @param amountUsdc Amount to spend in USDC (e.g., 5)
 */
export async function createPredictionOrder(
  userPubkey: string,
  marketId: string,
  isYes: boolean,
  priceUsd: number,
  amountUsdc: number
): Promise<CreateOrderResponse> {
  return createOrder({
    userPubkey,
    marketId,
    depositMint: USDC_MINT,
    isBuy: true,
    isYes,
    maxBuyPriceUsd: usdToMicro(priceUsd),
    depositAmount: usdcToMicro(amountUsdc),
  });
}

/**
 * Fetch available markets from Jupiter (if endpoint exists)
 * Note: This endpoint may not be publicly documented
 */
export async function getMarkets(): Promise<JupiterMarket[]> {
  try {
    const response = await fetch(`${PREDICTION_API_BASE}/markets`);
    if (!response.ok) {
      console.warn('Markets endpoint not available');
      return [];
    }
    const data = await response.json();
    return data.markets || data || [];
  } catch (error) {
    console.warn('Error fetching markets:', error);
    return [];
  }
}

/**
 * Fetch a single market by ID
 */
export async function getMarket(marketId: string): Promise<JupiterMarket | null> {
  try {
    const response = await fetch(`${PREDICTION_API_BASE}/markets/${marketId}`);
    if (!response.ok) {
      return null;
    }
    return response.json() as Promise<JupiterMarket>;
  } catch (error) {
    console.warn('Error fetching market:', error);
    return null;
  }
}
