'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PixelDissolveProps {
  imageSrc: string;
  width: number;
  height: number;
  blockSize?: number;
  duration?: number;
  onComplete?: () => void;
}

interface Block {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a: number;
  vx: number;
  vy: number;
  rotationSpeed: number;
}

function easeInQuad(t: number) {
  return t * t;
}

export function PixelDissolve({
  imageSrc,
  width,
  height,
  blockSize = 6,
  duration = 3000,
  onComplete,
}: PixelDissolveProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    const measure = measureRef.current;
    if (!canvas || !measure) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get pack position from the in-tree measure div (not affected by portal)
    const rect = measure.getBoundingClientRect();
    const originX = rect.left;
    const originY = rect.top;

    // Size canvas to full viewport
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    ctx.scale(dpr, dpr);

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    let rafId: number | null = null;

    img.onload = () => {
      // Sample pixels from offscreen canvas
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d')!;
      offCtx.drawImage(img, 0, 0, width, height);
      const imageData = offCtx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      // Build blocks in viewport coordinates
      const blocks: Block[] = [];
      const cx = width / 2;
      const cy = height / 2;

      for (let by = 0; by < height; by += blockSize) {
        for (let bx = 0; bx < width; bx += blockSize) {
          const sx = Math.min(bx + Math.floor(blockSize / 2), width - 1);
          const sy = Math.min(by + Math.floor(blockSize / 2), height - 1);
          const idx = (sy * width + sx) * 4;
          const a = pixels[idx + 3];

          if (a < 10) continue;

          const dx = bx + blockSize / 2 - cx;
          const dy = by + blockSize / 2 - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;

          const speed = 30 + Math.random() * 70;

          blocks.push({
            x: originX + bx,
            y: originY + by,
            r: pixels[idx],
            g: pixels[idx + 1],
            b: pixels[idx + 2],
            a,
            vx: nx * speed + (Math.random() - 0.5) * 20,
            vy: ny * speed - 40 + (Math.random() - 0.5) * 20,
            rotationSpeed: (Math.random() - 0.5) * 180 * 2 * (Math.PI / 180),
          });
        }
      }

      // First frame — intact image for seamless handoff
      ctx.clearRect(0, 0, vw, vh);
      for (const block of blocks) {
        ctx.fillStyle = `rgba(${block.r},${block.g},${block.b},${block.a / 255})`;
        ctx.fillRect(block.x, block.y, blockSize, blockSize);
      }

      // Physics
      const gravity = 50;
      const durationS = duration / 1000;
      const startTime = performance.now();

      const animate = (now: number) => {
        let dt = (now - startTime) / 1000;
        if (dt > durationS + 0.1) dt = durationS + 0.1;

        const progress = Math.min(dt / durationS, 1);
        const fadeAlpha = 1 - easeInQuad(progress);
        const scale = 1 - 0.5 * progress;

        ctx.clearRect(0, 0, vw, vh);

        for (const block of blocks) {
          const bx = block.x + block.vx * dt;
          const by = block.y + block.vy * dt + 0.5 * gravity * dt * dt;
          const rot = block.rotationSpeed * dt;
          const blockAlpha = (block.a / 255) * fadeAlpha;

          if (blockAlpha < 0.01) continue;

          ctx.save();
          ctx.globalAlpha = blockAlpha;
          ctx.translate(bx + blockSize / 2, by + blockSize / 2);
          ctx.rotate(rot);
          ctx.scale(scale, scale);
          ctx.fillStyle = `rgb(${block.r},${block.g},${block.b})`;
          ctx.fillRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
          ctx.restore();
        }

        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          onComplete?.();
        }
      };

      // Start after one frame so intact image is visible
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(animate);
      });
    };

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [mounted, imageSrc, width, height, blockSize, duration, onComplete]);

  return (
    <>
      {/* Invisible div stays in DOM tree to measure pack position */}
      <div ref={measureRef} className="absolute inset-0" />
      {/* Canvas portaled to body — escapes parent transforms */}
      {mounted && createPortal(
        <canvas
          ref={canvasRef}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 50,
          }}
        />,
        document.body
      )}
    </>
  );
}
