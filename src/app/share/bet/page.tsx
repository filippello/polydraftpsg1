import { Metadata } from "next";
import Link from "next/link";
import { getBetFromParams } from "@/lib/share/utils";
import { ShareRedirect } from "./ShareRedirect";

interface SharePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function getCategoryEmoji(market: string): string {
  const lower = market.toLowerCase();
  if (
    lower.includes("sport") ||
    lower.includes("nba") ||
    lower.includes("nfl")
  )
    return "sports";
  if (lower.includes("politic") || lower.includes("election")) return "politics";
  if (lower.includes("crypto") || lower.includes("bitcoin")) return "crypto";
  return "politics";
}

// Generate the same hash as the API to construct Supabase URL
// Must match the hash function in /api/share/generate/route.tsx
function generateImageHash(params: Record<string, unknown>): string {
  const str = JSON.stringify(params);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getSupabaseImageUrl(bet: {
  outcome: string;
  probability: number;
  direction: string;
  market: string;
}): string {
  // Hash must match the one in /api/share/generate
  const inputProps = {
    outcome: bet.outcome,
    probability: bet.probability,
    direction: bet.direction,
    market: bet.market,
  };
  const hash = generateImageHash(inputProps);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/images/share/bet-${hash}.png`;
}

export async function generateMetadata({
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const params = await searchParams;
  const bet = getBetFromParams(params as Record<string, string>);

  // Use the pre-generated image from Supabase
  const imageUrl = getSupabaseImageUrl(bet);
  const title = `${bet.outcome} - ${Math.round(bet.probability * 100)}% | Polydraft`;
  const description = `Bet ${bet.direction.toUpperCase()} on ${bet.market}`;

  return {
    title,
    description,
    openGraph: {
      title: `${bet.outcome} - ${Math.round(bet.probability * 100)}%`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${bet.outcome} - ${bet.direction.toUpperCase()}`,
        },
      ],
      type: "website",
      siteName: "Polydraft",
    },
    twitter: {
      card: "summary_large_image",
      title: `${bet.outcome} - ${Math.round(bet.probability * 100)}%`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const bet = getBetFromParams(params as Record<string, string>);
  const isYes = bet.direction === "yes";
  const category = getCategoryEmoji(bet.market);

  // Link to explore page (or specific market if marketId is available)
  const exploreLink = bet.marketId
    ? `/explore/${bet.marketId}`
    : `/explore`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#0f172a] flex flex-col items-center justify-center p-4">
      <ShareRedirect url={exploreLink} />
      {/* Bet Preview Card */}
      <div className="max-w-md w-full">
        <div
          className={`bg-card-bg border-4 rounded-2xl shadow-hard-lg overflow-hidden ${
            isYes ? "border-green-500" : "border-red-500"
          }`}
        >
          {/* Header */}
          <div
            className={`px-4 py-3 ${
              isYes ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            <div
              className={`font-bold text-lg font-pixel-heading ${
                isYes ? "text-green-400" : "text-red-400"
              }`}
            >
              {isYes ? "BET YES" : "BET NO"} {bet.amount && `$${bet.amount}`}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h2 className="text-2xl font-bold text-white mb-2 font-pixel-body">
              {bet.outcome}
            </h2>
            <p className="text-gray-400 mb-4">{bet.market}</p>

            {/* Probability bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Probability</span>
                <span
                  className={`font-bold ${
                    isYes ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {Math.round(bet.probability * 100)}%
                </span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isYes ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ width: `${bet.probability * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={exploreLink}
        className="mt-6 px-8 py-4 bg-purple-600 text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg"
      >
        Make Your Prediction
      </Link>

      {/* Branding */}
      <p className="mt-8 text-gray-500 text-sm">polydraft.app</p>
    </div>
  );
}
