import React from 'react';

export const ProgressRing: React.FC<{
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: React.ReactNode;
}> = ({ pct, size = 180, stroke = 14, color = 'var(--brand)', label }) => {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const off = C * (1 - pct / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      {label && <div className="ring-label">{label}</div>}
    </div>
  );
};

export const DonutChart: React.FC<{
  parts: { k: string; v: number; c: string }[];
  size?: number;
  stroke?: number;
  centerLabel?: React.ReactNode;
}> = ({ parts, size = 170, stroke = 26, centerLabel }) => {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  let acc = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        {parts.map((p, idx) => {
          const len = (C * p.v) / total;
          const offset = -acc;
          acc += len;
          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={p.c}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - 2)} ${C}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${p.k}: ${Math.round((p.v / total) * 100)}%`}</title>
            </circle>
          );
        })}
      </svg>
      {centerLabel && <div className="ring-label">{centerLabel}</div>}
    </div>
  );
};

export const LegendList: React.FC<{ parts: { k: string; v: number; c: string }[] }> = ({ parts }) => {
  const total = parts.reduce((s, p) => s + p.v, 0) || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 150 }}>
      {parts.map((p, idx) => (
        <div key={idx} className="row-between small">
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i style={{ width: 10, height: 10, borderRadius: 3, background: p.c, display: 'inline-block' }} />
            {p.k}
          </span>
          <b>{Math.round((p.v / total) * 100)}%</b>
        </div>
      ))}
    </div>
  );
};

export const HorizontalBars: React.FC<{
  rows: { k: string; v: number; prev?: number }[];
  showPrev?: boolean;
}> = ({ rows, showPrev = false }) => {
  return (
    <div className="bars">
      {rows.map((r, idx) => (
        <div key={idx} className="b">
          <span>{r.k}</span>
          <div style={{ position: 'relative' }}>
            <div className="progress lg">
              <i style={{ width: `${r.v}%` }} />
            </div>
            {showPrev && r.prev !== undefined && (
              <span
                title={`Previous ${r.prev}%`}
                style={{
                  position: 'absolute',
                  top: -3,
                  left: `calc(${r.prev}% - 1px)`,
                  width: 2,
                  height: 18,
                  background: 'var(--ink-3)',
                  borderRadius: 2
                }}
              />
            )}
          </div>
          <span>{r.v}%</span>
        </div>
      ))}
    </div>
  );
};

export const LineChart: React.FC<{
  pts: { m: string; v: number }[];
  w?: number;
  h?: number;
  min?: number;
  max?: number;
  color?: string;
}> = ({ pts, w = 560, h = 220, min = 40, max = 100, color = 'var(--brand)' }) => {
  const pad = { l: 34, r: 16, t: 16, b: 28 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const x = (i: number) => pad.l + (pts.length === 1 ? iw / 2 : (i * iw) / (pts.length - 1));
  const y = (v: number) => pad.t + ih - ((v - min) / (max - min)) * ih;

  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.v)}`).join(' ');
  const area = `${d} L${x(pts.length - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: `${w}px`, display: 'block' }} role="img">
      {[min, (min + max) / 2, max].map((v, idx) => (
        <g key={idx}>
          <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink-3)">
            {v}
          </text>
        </g>
      ))}
      <path d={area} fill={color} opacity={0.08} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.v)} r="4.5" fill="var(--surface)" stroke={color} strokeWidth="2.5" />
          <text x={x(i)} y={y(p.v) - 12} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">
            {p.v}
          </text>
          <text x={x(i)} y={h - 8} textAnchor="middle" fontSize="11.5" fill="var(--ink-3)">
            {p.m}
          </text>
        </g>
      ))}
    </svg>
  );
};

export const RadarChart: React.FC<{
  rows: { k: string; prev: number; v: number }[];
  size?: number;
}> = ({ rows, size = 300 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 44;
  const n = rows.length;

  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + (Math.cos(a) * R * v) / 100, cy + (Math.sin(a) * R * v) / 100];
  };

  const rings = [25, 50, 75, 100];

  return (
    <svg
      viewBox={`-50 0 ${size + 100} ${size}`}
      width="100%"
      style={{ maxWidth: `${size + 100}px`, display: 'block', margin: '0 auto' }}
      role="img"
    >
      {rings.map((v, idx) => (
        <polygon
          key={idx}
          points={rows.map((_, i) => pt(i, v).join(',')).join(' ')}
          fill="none"
          stroke="var(--line)"
        />
      ))}
      {rows.map((r, i) => {
        const [x, y] = pt(i, 100);
        const [lx, ly] = pt(i, 122);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />
            <text x={lx} y={ly + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink-2)">
              {r.k}
            </text>
          </g>
        );
      })}
      <polygon
        points={rows.map((r, i) => pt(i, r.prev).join(',')).join(' ')}
        fill="var(--ink-3)"
        fillOpacity={0.06}
        stroke="var(--ink-3)"
        strokeWidth="2"
      />
      <polygon
        points={rows.map((r, i) => pt(i, r.v).join(',')).join(' ')}
        fill="var(--brand)"
        fillOpacity={0.18}
        stroke="var(--brand)"
        strokeWidth="2"
      />
    </svg>
  );
};

export const ColumnBars: React.FC<{
  rows: { k: string; v: number; c?: string }[];
  h?: number;
}> = ({ rows, h = 200 }) => {
  const w = Math.max(360, rows.length * 70);
  const pad = { l: 10, r: 10, t: 22, b: 28 };
  const ih = h - pad.t - pad.b;
  const bw = (w - pad.l - pad.r) / rows.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }} role="img">
      {rows.map((r, i) => {
        const bh = (ih * r.v) / 100;
        const x = pad.l + i * bw + bw * 0.22;
        const y = pad.t + ih - bh;
        return (
          <g key={i}>
            <rect x={x} y={pad.t} width={bw * 0.56} height={ih} rx="6" fill="var(--surface-2)" />
            <rect x={x} y={y} width={bw * 0.56} height={bh} rx="6" fill={r.c || 'var(--brand)'} />
            <text x={x + bw * 0.28} y={y - 6} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">
              {r.v}%
            </text>
            <text x={x + bw * 0.28} y={h - 8} textAnchor="middle" fontSize="11.5" fill="var(--ink-3)">
              {r.k}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export const PhotoArt: React.FC<{
  hue: number;
  seed: number;
  w?: number;
  h?: number;
}> = ({ hue, seed, w = 400, h = 300 }) => {
  let s = seed * 9301 + 49297;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const bg1 = `hsl(${hue} 38% 30%)`;
  const bg2 = `hsl(${(hue + 30) % 360} 45% 52%)`;

  const n = 4 + Math.floor(rnd() * 3);
  const people = [];
  for (let i = 0; i < n; i++) {
    const x = 40 + (i * (w - 80)) / (n - 1) + (rnd() * 20 - 10);
    const sc = 0.8 + rnd() * 0.4;
    const y = h * 0.62;
    people.push(
      <g key={i} opacity="0.92">
        <circle cx={x} cy={y - 38 * sc} r={15 * sc} fill={`hsl(${(hue + 200) % 360} 20% ${80 - rnd() * 20}%)`} />
        <rect
          x={x - 22 * sc}
          y={y - 20 * sc}
          width={44 * sc}
          height={70 * sc}
          rx={18 * sc}
          fill={`hsl(${(hue + rnd() * 120) % 360} 30% ${35 + rnd() * 20}%)`}
        />
      </g>
    );
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <defs>
        <linearGradient id={`g${seed}${hue}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bg1} />
          <stop offset="1" stopColor={bg2} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#g${seed}${hue})`} />
      <rect x={w * 0.18} y={h * 0.1} width={w * 0.64} height={h * 0.32} rx="6" fill={`hsl(${hue} 30% 92%)`} opacity="0.9" />
      {[0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={w * 0.22 + i * w * 0.15}
          y={h * 0.15 + (i % 2) * 12}
          width={w * 0.1}
          height={h * 0.08}
          rx="3"
          fill={`hsl(${(hue + i * 50) % 360} 60% 70%)`}
        />
      ))}
      <path
        d={`M${w * 0.27} ${h * 0.3} C ${w * 0.4} ${h * 0.36}, ${w * 0.55} ${h * 0.22}, ${w * 0.72} ${h * 0.33}`}
        stroke={`hsl(${hue} 30% 40%)`}
        strokeWidth="2"
        fill="none"
      />
      <rect y={h * 0.8} width={w} height={h * 0.2} fill={`hsl(${hue} 25% 22%)`} opacity="0.5" />
      {people}
      <rect x={w * 0.08} y={h * 0.78} width={w * 0.84} height="10" rx="5" fill={`hsl(${hue} 20% 18%)`} opacity="0.6" />
    </svg>
  );
};

export const BannerArt: React.FC<{ hue: number; title?: string }> = ({ hue, title }) => (
  <svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
    <rect width="800" height="350" fill={`hsl(${hue} 42% 26%)`} />
    <circle cx="660" cy="80" r="190" fill={`hsl(${(hue + 25) % 360} 50% 45%)`} opacity="0.55" />
    <circle cx="740" cy="300" r="120" fill={`hsl(${(hue + 60) % 360} 55% 60%)`} opacity="0.4" />
    <path d="M0 290 Q 200 230 400 280 T 800 250 V350 H0z" fill={`hsl(${hue} 35% 18%)`} opacity="0.6" />
    {title && (
      <>
        <text x="40" y="190" fontFamily="Newsreader, Georgia, serif" fontSize="44" fill="#fff">
          {title}
        </text>
        <text x="40" y="228" fontFamily="Manrope, sans-serif" fontSize="16" fill="rgba(255,255,255,.75)">
          WeGrow B School
        </text>
      </>
    )}
  </svg>
);
