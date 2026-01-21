import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Press_Start_2P, VT323 } from "next/font/google";
import { Providers } from "@/components/Providers";
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
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} ${pressStart2P.variable} ${vt323.variable} font-mono antialiased bg-game-bg text-foreground`}>
        <Providers>
          {/* Balatro post-processing effects wrapper */}
          <div className="min-h-screen min-h-dvh flex flex-col balatro-noise balatro-vignette balatro-scanlines">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
