import React from "react";

// Google Font: Press Start 2P (pixel art font)
export const fontFamily = '"Press Start 2P", monospace';

export const loadFonts = () => {
  const link = document.createElement("link");
  link.href =
    "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
};

interface PixelTextProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  shadow?: boolean;
  glow?: string;
}

export const PixelText: React.FC<PixelTextProps> = ({
  children,
  size = 16,
  color = "white",
  style = {},
  shadow = true,
  glow,
}) => {
  return (
    <span
      style={{
        fontFamily,
        fontSize: size,
        color,
        textShadow: glow
          ? `0 0 10px ${glow}, 0 0 20px ${glow}, 0 0 30px ${glow}`
          : shadow
            ? "3px 3px 0 rgba(0,0,0,0.8)"
            : "none",
        letterSpacing: "0.05em",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
