import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Press_Start_2P, VT323 } from "next/font/google";
import { Providers } from "@/components/Providers";
import { getActiveVenue } from "@/lib/adapters/config";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ["latin"],
  variable: "--font-pixel-heading",
});

const vt323 = VT323({
  weight: '400',
  subsets: ["latin"],
  variable: "--font-pixel-body",
});

export const metadata: Metadata = {
  title: "Polydraft",
  description: "Fantasy betting with pixel art packs. Open packs, make picks, win points!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Polydraft",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const venue = getActiveVenue();
  const themeStyle = {
    '--venue-accent': venue.theme.accentColor,
    '--venue-bg': venue.theme.backgroundColor || '#1a1a2e',
  } as React.CSSProperties;

  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${pressStart2P.variable} ${vt323.variable} font-mono antialiased bg-game-bg text-foreground`}
        style={themeStyle}
      >
        <Providers>
          {/* Balatro post-processing effects wrapper */}
          <div className="min-h-screen min-h-dvh flex flex-col balatro-noise balatro-vignette balatro-scanlines">
            <div className="w-full max-w-[430px] mx-auto relative min-h-screen min-h-dvh flex flex-col md:my-4 md:rounded-2xl md:overflow-hidden md:shadow-2xl md:shadow-black/50 md:border md:border-white/10">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
