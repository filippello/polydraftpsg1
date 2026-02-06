/**
 * Share utilities for encoding bet data into URLs
 * Uses query params instead of database for stateless sharing
 */

export interface BetShareData {
  outcomeId?: string;
  marketId?: string;
  outcome: string;
  probability: number;
  direction: "yes" | "no";
  market: string;
  amount?: number;
}

/**
 * Build a share page URL with bet data encoded in query params
 */
export function buildSharePageUrl(data: BetShareData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://polydraft.app";
  const params = new URLSearchParams();

  params.set("o", data.outcome);
  params.set("p", String(data.probability));
  params.set("d", data.direction);
  params.set("m", data.market);

  if (data.amount) {
    params.set("a", String(data.amount));
  }
  if (data.marketId) {
    params.set("mid", data.marketId);
  }

  return `${baseUrl}/share/bet?${params.toString()}`;
}

/**
 * Decode bet data from URL query params
 */
export function getBetFromParams(
  params: Record<string, string | string[] | undefined>
): BetShareData {
  const getString = (key: string): string => {
    const value = params[key];
    if (Array.isArray(value)) return value[0] || "";
    return value || "";
  };

  return {
    outcome: getString("o"),
    probability: parseFloat(getString("p")) || 0,
    direction: (getString("d") as "yes" | "no") || "yes",
    market: getString("m"),
    amount: getString("a") ? parseFloat(getString("a")) : undefined,
    marketId: getString("mid") || undefined,
  };
}
