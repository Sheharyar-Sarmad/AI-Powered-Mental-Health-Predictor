'use client';

import { useEffect, useRef } from 'react';

/**
 * Ambient, low-cost canvas starfield with slow parallax drift and
 * occasional twinkle. Respects prefers-reduced-motion.
 */
export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    type Star = {
      x: number;
      y: number;
      r: number;
      baseAlpha: number;
      phase: number;
      speed: number;
      layer: number;
    };

    const STAR_COUNT = Math.min(220, Math.floor((width * height) / 9000));
    const stars: Star[] = Array.from({ length: STAR_COUNT }).map(() => {
      const layer = Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: layer === 3 ? Math.random() * 1.4 + 1.1 : layer === 2 ? Math.random() * 1 + 0.6 : Math.random() * 0.7 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.35,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.4 + 0.15,
        layer,
      };
    });

    let raf = 0;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // deep-space gradient wash
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.15,
        0,
        width * 0.5,
        height * 0.15,
        Math.max(width, height) * 0.9
      );
      grad.addColorStop(0, 'rgba(76, 29, 149, 0.16)');
      grad.addColorStop(0.5, 'rgba(15, 10, 40, 0.08)');
      grad.addColorStop(1, 'rgba(4, 3, 14, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      for (const s of stars) {
        const twinkle = reduceMotion ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.28;
        const alpha = Math.max(0.08, Math.min(1, twinkle));
        ctx.beginPath();
        ctx.fillStyle = `rgba(224, 220, 255, ${alpha})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (s.layer === 3 && alpha > 0.75) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(167, 139, 250, ${alpha * 0.25})`;
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }

        if (!reduceMotion) {
          s.y += s.layer * 0.02;
          if (s.y > height) {
            s.y = -2;
            s.x = Math.random() * width;
          }
        }
      }

      t += 0.016;
      raf = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}