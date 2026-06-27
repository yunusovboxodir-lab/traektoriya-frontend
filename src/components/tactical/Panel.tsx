/**
 * Panel — базовая обёртка с .glass-panel стилем (все панели Tactical UI).
 */
import type { ReactNode, CSSProperties } from 'react';

interface PanelProps {
  children: ReactNode;
  style?: CSSProperties;
  label?: string;
  code?: string;
}

export function Panel({ children, style, label, code }: PanelProps) {
  return (
    <div className="glass-panel" style={style}>
      {(label || code) && (
        <div className="panel-header">
          {label && <span className="panel-label">{label}</span>}
          {code && <span className="panel-code">{code}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

interface StatProps {
  k: string;
  v: string | number;
  accent?: string;
}

export function Stat({ k, v, accent }: StatProps) {
  return (
    <div className="stat-row">
      <span className="stat-k">{k}</span>
      <span className="stat-v" style={accent ? { color: accent } : undefined}>{v}</span>
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  level?: string;
}

export function ProgressBar({ value, max, color = 'var(--brass)', level = 'LVL 2' }: ProgressBarProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>ОПЫТ · {level}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: color, fontWeight: 700 }}>{value} / {max} XP</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: pct + '%', background: `linear-gradient(90deg, ${color}, var(--brass-light))` }} />
        {[25, 50, 75].map((p) => <div key={p} className="bar-tick" style={{ left: p + '%' }} />)}
      </div>
    </div>
  );
}

interface RingProgressProps {
  value: number;
  size?: number;
  label: string;
}

export function RingProgress({ value, size = 78, label }: RingProgressProps) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="var(--brass)" strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={off}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: 'drop-shadow(0 0 6px color-mix(in srgb, var(--brass) 70%, transparent))' }} />
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central"
        fontSize="18" fontWeight="700" fontFamily="Inter, sans-serif"
        fill="var(--text-primary)">{value}%</text>
      <text x="50%" y="68%" textAnchor="middle" dominantBaseline="central"
        fontSize="8" fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.15em" fill="var(--text-secondary)">{label}</text>
    </svg>
  );
}
