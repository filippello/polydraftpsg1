import { ImageResponse } from "@vercel/og";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outcome, probability, direction, market, imageUrl } = body;

    if (!outcome || probability === undefined || !direction || !market) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Load pixel font
    const fontResponse = await fetch(
      "https://cdn.jsdelivr.net/npm/@fontsource/press-start-2p@5.0.18/files/press-start-2p-latin-400-normal.woff"
    );
    if (!fontResponse.ok) {
      throw new Error(`Failed to load font: ${fontResponse.status}`);
    }
    const fontData = await fontResponse.arrayBuffer();

    // Pre-fetch image as data URL for reliable rendering
    let imageDataUrl: string | null = null;
    if (imageUrl) {
      console.log("Fetching image from:", imageUrl);
      imageDataUrl = await fetchImageAsDataUrl(imageUrl);
      console.log("Image fetch result:", imageDataUrl ? "success" : "failed");
    }

    const prob = parseFloat(probability);
    const isYes = direction === "yes";
    const percentText = `${Math.round(prob * 100)}%`;

    // Landscape card for Twitter summary_large_image (2:1 ratio)
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#16213e",
            borderRadius: 24,
            border: "5px solid #a855f7",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Inner border glow */}
          <div
            style={{
              position: "absolute",
              top: 3,
              left: 3,
              right: 3,
              bottom: 3,
              border: "2px solid rgba(168, 85, 247, 0.4)",
              borderRadius: 18,
            }}
          />

          {/* Market question header */}
          <div
            style={{
              padding: "16px 32px",
              background: "rgba(0,0,0,0.4)",
              borderBottom: "3px solid rgba(168, 85, 247, 0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: '"Press Start 2P"',
                fontSize: 16,
                color: "white",
                textAlign: "center",
                textTransform: "uppercase",
                lineHeight: 1.5,
                textShadow: "2px 2px 0 rgba(0,0,0,0.8)",
              }}
            >
              {market.length > 60 ? market.slice(0, 60) + "..." : market}
            </span>
          </div>

          {/* Main content: image left, info right */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "row",
              overflow: "hidden",
            }}
          >
            {/* Left: outcome image (~45% width) */}
            <div
              style={{
                width: "45%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
                position: "relative",
                borderRight: "3px solid rgba(168, 85, 247, 0.5)",
                overflow: "hidden",
              }}
            >
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageDataUrl}
                  alt=""
                  width={540}
                  height={540}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <span style={{ fontSize: 120 }}>🎯</span>
                </div>
              )}

              {/* Gradient overlay on right edge */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: 60,
                  background: "linear-gradient(to left, #16213e, transparent)",
                }}
              />
            </div>

            {/* Right: info (~55% width) */}
            <div
              style={{
                width: "55%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 40px",
                gap: 16,
              }}
            >
              {/* Outcome name */}
              <span
                style={{
                  fontFamily: '"Press Start 2P"',
                  fontSize: 22,
                  color: "white",
                  textAlign: "center",
                  textShadow: "2px 2px 0 rgba(0,0,0,0.8)",
                  lineHeight: 1.4,
                }}
              >
                {outcome}
              </span>

              {/* Probability */}
              <span
                style={{
                  fontFamily: '"Press Start 2P"',
                  fontSize: 64,
                  color: "#a855f7",
                  textAlign: "center",
                  textShadow: "3px 3px 0 rgba(0,0,0,0.8)",
                }}
              >
                {percentText}
              </span>

              {/* Swipe hints */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  paddingTop: 16,
                  borderTop: "2px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: '"Press Start 2P"', fontSize: 16, color: "#ef4444" }}>←</span>
                  <span
                    style={{
                      fontFamily: '"Press Start 2P"',
                      fontSize: 14,
                      color: isYes ? "rgba(239,68,68,0.4)" : "#ef4444",
                    }}
                  >
                    NO
                  </span>
                </div>

                <span style={{ fontFamily: '"Press Start 2P"', fontSize: 12, color: "#6b7280" }}>
                  ↓ PASS
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      fontFamily: '"Press Start 2P"',
                      fontSize: 14,
                      color: isYes ? "#22c55e" : "rgba(34,197,94,0.4)",
                    }}
                  >
                    YES
                  </span>
                  <span style={{ fontFamily: '"Press Start 2P"', fontSize: 16, color: "#22c55e" }}>→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Press Start 2P",
            data: fontData,
            style: "normal",
          },
        ],
      }
    );

    // Convert and upload
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Hash only uses core bet params (must match share page hash)
    const inputProps = { outcome, probability: prob, direction, market };
    const imageHash = generateImageHash(inputProps);
    const fileName = `bet-${imageHash}.png`;
    const filePath = `share/${fileName}`;

    const supabase = getSupabaseAdmin();

    await supabase.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: "image/png",
        cacheControl: "31536000",
        upsert: true,
      });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/images/${filePath}`;

    return NextResponse.json({ imageUrl: publicUrl });
  } catch (error) {
    console.error("Error generating share image:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate image" },
      { status: 500 }
    );
  }
}
