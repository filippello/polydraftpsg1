"use client";

import { useState } from "react";
import type { ExploreMarket, ExploreOutcome } from "@/lib/jupiter/types";
import { buildSharePageUrl } from "@/lib/share/utils";

interface ShareButtonProps {
  outcome: ExploreOutcome;
  market: ExploreMarket;
  direction?: "yes" | "no";
  amount?: number;
  variant?: "default" | "icon";
  className?: string;
}

function XLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function buildTweetText(
  outcome: string,
  probability: number,
  market: string,
  direction?: "yes" | "no",
  amount?: number
): string {
  const probText = `${Math.round(probability * 100)}%`;
  const bet = direction ? (direction === "yes" ? "YES" : "NO") : null;

  if (bet && amount) {
    return `${market}\n\n"${outcome}" at ${probText} — I just bet $${amount} ${bet}\n\nWhat's your pick? 👇\n@polydraftfun`;
  }

  if (bet) {
    return `${market}\n\n"${outcome}" at ${probText} — I'm betting ${bet}\n\nWhat's your pick? 👇\n@polydraftfun`;
  }

  return `${market}\n\n"${outcome}" is at ${probText}\n\nWhat do you think? 👇\n@polydraftfun`;
}

function getOutcomeImageUrl(
  outcome: ExploreOutcome,
  market: ExploreMarket
): string | undefined {
  // Construct full URL for the outcome image
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://polydraft.app";

  if (outcome.image_slug && market.event_ticker) {
    return `${baseUrl}/images/explore/outcomes/${market.event_ticker}-${outcome.image_slug}`;
  }
  if (outcome.image_url) return outcome.image_url;
  if (market.image_url) return market.image_url;
  return undefined;
}

export function ShareButton({
  outcome,
  market,
  direction,
  amount,
  variant = "default",
  className = "",
}: ShareButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      // Get outcome image URL for the share card
      const outcomeImageUrl = getOutcomeImageUrl(outcome, market);

      // Generate image and upload to Supabase
      await fetch("/api/share/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: outcome.label,
          probability: outcome.probability,
          direction: direction || "yes",
          market: market.title,
          amount,
          imageUrl: outcomeImageUrl,
        }),
      });

      // Build share page URL (no imageUrl needed - page constructs from same params)
      const sharePageUrl = buildSharePageUrl({
        outcomeId: outcome.id,
        marketId: market.id,
        outcome: outcome.label,
        probability: outcome.probability,
        direction: direction || "yes",
        market: market.title,
        amount,
      });

      // Build tweet text
      const text = buildTweetText(outcome.label, outcome.probability, market.title, direction, amount);

      // Open Twitter intent
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(sharePageUrl)}`;
      window.open(twitterUrl, "_blank", "width=550,height=420");
    } catch (error) {
      console.error("Share error:", error);
      // Still try to share - image might already exist or will be generated
      const sharePageUrl = buildSharePageUrl({
        outcomeId: outcome.id,
        marketId: market.id,
        outcome: outcome.label,
        probability: outcome.probability,
        direction: direction || "yes",
        market: market.title,
        amount,
      });
      const text = buildTweetText(outcome.label, outcome.probability, market.title, direction, amount);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(sharePageUrl)}`;
      window.open(twitterUrl, "_blank", "width=550,height=420");
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleShare}
        disabled={isLoading}
        className={`w-9 h-9 flex items-center justify-center rounded-lg bg-black/60 hover:bg-black/80 transition-colors border border-white/20 disabled:opacity-50 ${className}`}
        title="Share on X"
      >
        {isLoading ? (
          <Spinner className="w-4 h-4 text-white" />
        ) : (
          <XLogo className="w-4 h-4 text-white" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors border border-white/20 font-medium disabled:opacity-50 ${className}`}
    >
      {isLoading ? (
        <>
          <Spinner className="w-4 h-4" />
          Generating...
        </>
      ) : (
        <>
          <XLogo className="w-4 h-4" />
          Share on X
        </>
      )}
    </button>
  );
}
