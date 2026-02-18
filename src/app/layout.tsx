import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Press_Start_2P, VT323 } from "next/font/google";
import { Providers } from "@/components/Providers";
import { PWARegister } from "@/components/PWARegister";
import { getActiveVenue } from "@/lib/adapters/config";
import { isPSG1, isTestDevice, TEST_DEVICE } from "@/lib/platform";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Polydraft",
  },
};

export const viewport: Viewport = isPSG1()
  ? {
      // Test device (e.g. Retroid Pocket 5): use native resolution, content centers via max-w
      // PSG1 hardware: fixed 1240x1080
      width: isTestDevice() ? 'device-width' : 1240,
      height: isTestDevice() ? undefined : 1080,
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      themeColor: "#1a1a2e",
    }
  : {
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
        <PWARegister />
        <Providers>
          {/* Balatro post-processing effects wrapper */}
          <div className={`min-h-screen min-h-dvh flex flex-col balatro-noise balatro-vignette balatro-scanlines${isPSG1() && isTestDevice() ? ' items-center justify-center' : ''}`}>
            <div
              className={
                isPSG1() && isTestDevice()
                  ? "relative flex flex-col overflow-hidden"
                  : isPSG1()
                    ? "w-full max-w-[1240px] h-screen mx-auto relative flex flex-col overflow-hidden"
                    : "w-full max-w-[430px] mx-auto relative min-h-screen min-h-dvh flex flex-col md:my-4 md:rounded-2xl md:overflow-hidden md:shadow-2xl md:shadow-black/50 md:border md:border-white/10"
              }
              style={isPSG1() && isTestDevice() ? {
                aspectRatio: '1240 / 1080',
                width: 'min(100vw, calc(100vh * 1240 / 1080))',
                maxWidth: '1240px',
                maxHeight: '1080px',
                border: '1px solid rgba(74,222,128,0.4)',
                boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4), 0 0 8px rgba(74,222,128,0.15)',
              } : undefined}
            >
              {children}
            </div>
          </div>
          {isPSG1() && isTestDevice() && (
            <div style={{
              position: 'fixed', bottom: 4, right: 4,
              fontSize: 10, padding: '2px 6px',
              background: 'rgba(0,0,0,0.7)', color: '#4ade80',
              borderRadius: 4, fontFamily: 'monospace', zIndex: 99999,
            }}>
              TEST:{TEST_DEVICE} | PSG1
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
