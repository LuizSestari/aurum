"use client";

import { useRef, useEffect, useCallback } from "react";
import type { OrbState } from "@/lib/aurum-voice";

// ─────────────────────────────────────────────
// Aurum Gravitational Field
// Fullscreen particle system with dense nucleus
// Particles fill the ENTIRE viewport
// Responds to state: idle, listening, thinking, speaking, muted
// ─────────────────────────────────────────────

interface Props {
  state: OrbState;
  size?: number; // ignored now — always fullscreen
}

interface Particle {
  x: number;
  y: number;
  baseR: number;      // orbital radius from center
  angle: number;      // current orbital angle
  speed: number;      // orbital speed
  size: number;
  opacity: number;
  layer: number;      // 0=core, 1=inner, 2=mid, 3=outer, 4=far
  hue: number;        // 0=cyan, 1=indigo, 2=violet, 3=white
  wobbleAmp: number;
  wobbleSpeed: number;
  wobblePhase: number;
}

const STATE_CFG = {
  idle:      { speed: 0.3, breathSpeed: 0.004, breathAmp: 0.06, glow: 0.12, pulse: 0, scatter: 0 },
  listening: { speed: 1.2, breathSpeed: 0.02,  breathAmp: 0.15, glow: 0.35, pulse: 0.02, scatter: 0.1 },
  thinking:  { speed: 0.7, breathSpeed: 0.012, breathAmp: 0.1,  glow: 0.25, pulse: 0.015, scatter: 0.05 },
  speaking:  { speed: 2.0, breathSpeed: 0.035, breathAmp: 0.22, glow: 0.5,  pulse: 0.04, scatter: 0.15 },
  muted:     { speed: 0.1, breathSpeed: 0.002, breathAmp: 0.02, glow: 0.04, pulse: 0, scatter: 0 },
} as const;

const COLORS = {
  idle:      { c1: [0, 217, 255], c2: [76, 29, 149] },
  listening: { c1: [0, 217, 255], c2: [34, 211, 238] },
  thinking:  { c1: [167, 139, 250], c2: [76, 29, 149] },
  speaking:  { c1: [52, 211, 153], c2: [0, 217, 255] },
  muted:     { c1: [100, 116, 139], c2: [71, 85, 105] },
} as const;

const TOTAL_PARTICLES = 4000;

function createParticles(w: number, h: number): Particle[] {
  const cx = w / 2, cy = h / 2;
  const maxR = Math.max(w, h) * 0.8;
  const particles: Particle[] = [];

  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    // Distribute: 15% core, 25% inner, 30% mid, 20% outer, 10% far
    const roll = Math.random();
    const layer = roll < 0.15 ? 0 : roll < 0.4 ? 1 : roll < 0.7 ? 2 : roll < 0.9 ? 3 : 4;

    const rRange = [
      [0, maxR * 0.08],          // core — tight nucleus
      [maxR * 0.06, maxR * 0.18], // inner
      [maxR * 0.15, maxR * 0.35], // mid
      [maxR * 0.3, maxR * 0.55],  // outer
      [maxR * 0.5, maxR * 0.85],  // far — reaches edges of screen
    ][layer];

    const baseR = rRange[0] + Math.random() * (rRange[1] - rRange[0]);
    const angle = Math.random() * Math.PI * 2;

    particles.push({
      x: cx + Math.cos(angle) * baseR,
      y: cy + Math.sin(angle) * baseR,
      baseR,
      angle,
      speed: (0.0003 + Math.random() * 0.002) * (layer < 2 ? 1.5 : 1) * (Math.random() > 0.5 ? 1 : -1),
      size: layer === 0 ? 1.5 + Math.random() * 2.5
          : layer === 1 ? 1 + Math.random() * 2
          : layer === 2 ? 0.8 + Math.random() * 1.5
          : layer === 3 ? 0.4 + Math.random() * 1
          : 0.2 + Math.random() * 0.6,
      opacity: layer === 0 ? 0.4 + Math.random() * 0.6
             : layer === 1 ? 0.25 + Math.random() * 0.4
             : layer === 2 ? 0.1 + Math.random() * 0.2
             : layer === 3 ? 0.04 + Math.random() * 0.1
             : 0.015 + Math.random() * 0.04,
      layer,
      hue: layer < 2 ? (Math.random() < 0.7 ? 0 : 1) : Math.floor(Math.random() * 4),
      wobbleAmp: 2 + Math.random() * (layer < 2 ? 5 : 15),
      wobbleSpeed: 0.005 + Math.random() * 0.02,
      wobblePhase: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

export default function AurumOrb({ state }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[] | null>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const colorRef = useRef<number[]>([0, 217, 255]);
  const color2Ref = useRef<number[]>([76, 29, 149]);
  const sizeRef = useRef({ w: 0, h: 0 });

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  // Mouse tracking on the window
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const w = sizeRef.current.w || window.innerWidth;
      const h = sizeRef.current.h || window.innerHeight;
      mouseRef.current = {
        x: (e.clientX / w - 0.5) * 2,
        y: (e.clientY / h - 0.5) * 2,
        active: true,
      };
    };
    const onLeave = () => { mouseRef.current.active = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const getTargetColors = useCallback((s: OrbState) => {
    return COLORS[s] ?? COLORS.idle;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    let w = parent?.clientWidth ?? window.innerWidth;
    let h = parent?.clientHeight ?? window.innerHeight;

    const resize = () => {
      w = parent?.clientWidth ?? window.innerWidth;
      h = parent?.clientHeight ?? window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
      // Recreate particles on resize
      particlesRef.current = createParticles(w, h);
    };
    resize();
    window.addEventListener("resize", resize);

    if (!particlesRef.current) {
      particlesRef.current = createParticles(w, h);
    }

    let raf: number;

    function draw() {
      if (!ctx || !particlesRef.current) return;
      const particles = particlesRef.current;
      const cfg = STATE_CFG[state] ?? STATE_CFG.idle;
      const target = getTargetColors(state);

      // Smooth color interpolation
      const cc = colorRef.current;
      const c2 = color2Ref.current;
      for (let i = 0; i < 3; i++) {
        cc[i] = lerp(cc[i], target.c1[i], 0.02);
        c2[i] = lerp(c2[i], target.c2[i], 0.02);
      }

      frameRef.current++;
      const f = frameRef.current;
      const breath = Math.sin(f * cfg.breathSpeed) * cfg.breathAmp + 1;
      const pulse = cfg.pulse > 0 ? Math.sin(f * cfg.pulse * Math.PI * 2) * 0.5 + 0.5 : 0;

      const cx = w / 2;
      const cy = h / 2;
      const mouse = mouseRef.current;
      const mx = mouse.active ? mouse.x * 30 : 0;
      const my = mouse.active ? mouse.y * 30 : 0;

      ctx.clearRect(0, 0, w, h);

      // ── Large ambient glow layers ──
      const glows = [
        { r: Math.min(w, h) * 0.5, alpha: cfg.glow * 0.15 },
        { r: Math.min(w, h) * 0.35, alpha: cfg.glow * 0.2 },
        { r: Math.min(w, h) * 0.2, alpha: cfg.glow * 0.3 },
        { r: Math.min(w, h) * 0.1, alpha: cfg.glow * 0.5 },
      ];

      for (const g of glows) {
        const gr = g.r * breath;
        const grad = ctx.createRadialGradient(cx + mx, cy + my, 0, cx, cy, gr);
        grad.addColorStop(0, `rgba(${cc[0]|0},${cc[1]|0},${cc[2]|0},${g.alpha})`);
        grad.addColorStop(0.4, `rgba(${(cc[0]+c2[0])/2|0},${(cc[1]+c2[1])/2|0},${(cc[2]+c2[2])/2|0},${g.alpha * 0.3})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx + mx * 0.3, cy + my * 0.3, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Update and draw particles ──
      for (const p of particles) {
        // Orbital motion
        p.angle += p.speed * cfg.speed;

        // Wobble
        const wobble = Math.sin(f * p.wobbleSpeed + p.wobblePhase) * p.wobbleAmp;
        const r = p.baseR * breath + wobble + (pulse * p.baseR * 0.05);

        // Scatter effect (particles pushed outward during active states)
        const scatter = cfg.scatter * Math.sin(f * 0.01 + p.angle) * p.baseR * 0.1;

        const targetX = cx + Math.cos(p.angle) * (r + scatter);
        const targetY = cy + Math.sin(p.angle) * (r + scatter);

        // Smooth movement + mouse influence
        const mouseWeight = (1 - Math.min(p.layer / 4, 1)) * 0.3;
        p.x += (targetX - p.x) * 0.08 + mx * mouseWeight;
        p.y += (targetY - p.y) * 0.08 + my * mouseWeight;

        // Alpha with breathing and distance fade
        const dist = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
        const maxDist = Math.max(w, h) * 0.6;
        const distFade = Math.max(0, 1 - dist / maxDist);
        const alpha = p.opacity * (0.6 + breath * 0.4) * distFade * (1 + pulse * 0.3);

        if (alpha < 0.005) continue;

        // Color blend
        const mix = p.hue === 0 ? 0 : p.hue === 1 ? 1 : p.hue === 2 ? 0.6 : 0.2;
        const pr = lerp(cc[0], c2[0], mix);
        const pg = lerp(cc[1], c2[1], mix);
        const pb = lerp(cc[2], c2[2], mix);

        // White shimmer for hue=3
        const wr = p.hue === 3 ? lerp(pr, 255, 0.5) : pr;
        const wg = p.hue === 3 ? lerp(pg, 255, 0.5) : pg;
        const wb = p.hue === 3 ? lerp(pb, 255, 0.5) : pb;

        ctx.fillStyle = `rgba(${wr|0},${wg|0},${wb|0},${Math.min(1, alpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.3, p.size * (0.8 + breath * 0.2)), 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Connection lines between core particles ──
      ctx.lineWidth = 0.4;
      let lineCount = 0;
      for (let i = 0; i < particles.length && lineCount < 200; i++) {
        const a = particles[i];
        if (a.layer > 1) continue;
        for (let j = i + 1; j < particles.length && lineCount < 200; j++) {
          const b = particles[j];
          if (b.layer > 1) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 6000) {
            const lineAlpha = (1 - d2 / 6000) * 0.08;
            ctx.strokeStyle = `rgba(${cc[0]|0},${cc[1]|0},${cc[2]|0},${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            lineCount++;
          }
        }
      }

      // ── Bright nucleus core ──
      const coreR = Math.min(w, h) * 0.04 * breath;
      const coreGrad = ctx.createRadialGradient(cx + mx * 0.2, cy + my * 0.2, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, `rgba(${cc[0]|0},${cc[1]|0},${cc[2]|0},${0.3 + pulse * 0.2})`);
      coreGrad.addColorStop(0.5, `rgba(${cc[0]|0},${cc[1]|0},${cc[2]|0},${0.08})`);
      coreGrad.addColorStop(1, "transparent");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx + mx * 0.2, cy + my * 0.2, coreR, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [state, getTargetColors]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ touchAction: "none" }}
    />
  );
}
