import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'psg1': '1240px',
    },
    extend: {
      // Pixel Art Color Palette
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Venue-aware colors (CSS variables set by layout)
        venue: {
          accent: "var(--venue-accent)",
          bg: "var(--venue-bg)",
        },
        // Primary game colors
        game: {
          bg: "#1a1a2e",
          primary: "#16213e",
          secondary: "#0f3460",
          accent: "#e94560",
          gold: "#ffd700",
          success: "#4ade80",
          failure: "#6b7280",
          warning: "#fbbf24",
        },
        // Card colors
        card: {
          bg: "#1e293b",
          border: "#334155",
          hover: "#2d3748",
        },
        // Outcome colors
        outcome: {
          a: "#3b82f6", // blue
          b: "#ef4444", // red
          selected: "#22c55e", // green
        },
      },
      // Pixel-perfect font sizes
      fontSize: {
        "pixel-xs": ["8px", { lineHeight: "12px" }],
        "pixel-sm": ["10px", { lineHeight: "14px" }],
        "pixel-base": ["12px", { lineHeight: "16px" }],
        "pixel-lg": ["16px", { lineHeight: "20px" }],
        "pixel-xl": ["20px", { lineHeight: "24px" }],
        "pixel-2xl": ["24px", { lineHeight: "28px" }],
        "pixel-3xl": ["32px", { lineHeight: "36px" }],
        // Balatro font sizes (multiples of 8)
        "balatro-xs": ["8px", { lineHeight: "12px" }],
        "balatro-sm": ["12px", { lineHeight: "16px" }],
        "balatro-base": ["16px", { lineHeight: "24px" }],
        "balatro-lg": ["24px", { lineHeight: "32px" }],
        "balatro-xl": ["32px", { lineHeight: "40px" }],
        "balatro-2xl": ["48px", { lineHeight: "56px" }],
      },
      // Pixel-perfect spacing (multiples of 4)
      spacing: {
        pixel: "4px",
        "pixel-2": "8px",
        "pixel-3": "12px",
        "pixel-4": "16px",
        "pixel-5": "20px",
        "pixel-6": "24px",
        "pixel-8": "32px",
        "pixel-10": "40px",
        "pixel-12": "48px",
      },
      // Border radius for pixel look
      borderRadius: {
        pixel: "0px",
        "pixel-sm": "2px",
        "pixel-md": "4px",
        "pixel-lg": "8px",
        // Balatro border radius
        "balatro": "8px",
        "balatro-card": "16px",
      },
      // Balatro border widths
      borderWidth: {
        "balatro": "3px",
        "balatro-thick": "4px",
      },
      // Custom animations
      animation: {
        "shake": "shake 0.5s ease-in-out",
        "shake-intense": "shake-intense 0.3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "card-flip": "card-flip 0.6s ease-in-out",
        "pop-in": "pop-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "slide-up": "slide-up 0.3s ease-out",
        "confetti": "confetti 1s ease-out forwards",
        "bounce-in": "bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        // Balatro animations
        "bounce-pop": "bounce-pop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "foil-shimmer": "foil-shimmer 3s linear infinite",
        "screen-shake": "screen-shake 0.5s ease-out",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
        },
        "shake-intense": {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "25%": { transform: "translateX(-8px) rotate(-2deg)" },
          "50%": { transform: "translateX(8px) rotate(2deg)" },
          "75%": { transform: "translateX(-8px) rotate(-2deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(255, 215, 0, 0)" },
          "50%": { boxShadow: "0 0 20px rgba(255, 215, 0, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "card-flip": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        confetti: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100px) rotate(720deg)", opacity: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Balatro keyframes
        "bounce-pop": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "foil-shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "screen-shake": {
          "0%, 100%": { transform: "translate(0) rotate(0deg)" },
          "10%": { transform: "translate(-8px, 4px) rotate(-1.5deg)" },
          "20%": { transform: "translate(10px, -3px) rotate(2deg)" },
          "30%": { transform: "translate(-10px, 6px) rotate(-2deg)" },
          "40%": { transform: "translate(8px, -4px) rotate(1.5deg)" },
          "50%": { transform: "translate(-6px, 3px) rotate(-1deg)" },
          "60%": { transform: "translate(6px, -2px) rotate(1deg)" },
          "70%": { transform: "translate(-4px, 2px) rotate(-0.5deg)" },
          "80%": { transform: "translate(3px, -1px) rotate(0.5deg)" },
          "90%": { transform: "translate(-2px, 1px) rotate(0deg)" },
        },
      },
      // Box shadows for pixel depth
      boxShadow: {
        pixel: "4px 4px 0 0 rgba(0, 0, 0, 0.3)",
        "pixel-lg": "8px 8px 0 0 rgba(0, 0, 0, 0.3)",
        "pixel-inset": "inset 4px 4px 0 0 rgba(0, 0, 0, 0.2)",
        glow: "0 0 20px rgba(255, 215, 0, 0.5)",
        "glow-success": "0 0 20px rgba(74, 222, 128, 0.5)",
        "glow-failure": "0 0 20px rgba(239, 68, 68, 0.5)",
        // Balatro hard shadows (no blur)
        "hard-sm": "2px 2px 0 0 rgba(0, 0, 0, 0.8)",
        "hard": "4px 4px 0 0 rgba(0, 0, 0, 0.8)",
        "hard-lg": "6px 6px 0 0 rgba(0, 0, 0, 0.8)",
      },
      // Font family for pixel look
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Balatro fonts
        "pixel-heading": ["var(--font-pixel-heading)", "monospace"],
        "pixel-body": ["var(--font-pixel-body)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
