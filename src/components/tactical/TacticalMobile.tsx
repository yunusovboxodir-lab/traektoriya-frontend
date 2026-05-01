/**
 * TacticalMobile — мобильная версия Карты обучения.
 * Адаптировано из mobile-screen.jsx (handoff Claude Design 2026-05-01).
 *
 * Структура (top → bottom):
 *  1. Sticky top bar    (☰ · TRAEKTORIYA · РУ/UZ · 🔔)
 *  2. Hero strip        (avatar + ring · имя · XP · league chip)
 *  3. Daily quest       (CTA: «Закрой 1 раздел сегодня» +50 XP)
 *  4. Pinch/pan map     (вся карта, dots only, active pulses)
 *  5. Territory list    (sticky headers по зонам, тайлы посёлков)
 *  6. Friends strip     (активность команды)
 *  7. Bottom tab bar    (Карта · Курсы · Команда · Профиль)
 *  + VillageSheet       (bottom-sheet с деталями посёлка)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { NODES as DEFAULT_NODES, ZONES as DEFAULT_ZONES, STATE_STYLES, EDGES as DEFAULT_EDGES } from './data';
import type { MapEdge, MapNode, MapZone, NodeState } from './types';
import { useLangStore } from '../../stores/langStore';

const TERRITORY_NUMERAL: Record<string, string> = {
  stazher: 'I',
  praktik: 'II',
  expert: 'III',
  master: 'IV',
};

// =============================================================================
// Top bar
// =============================================================================
function MobileTopBar() {
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px 8px', flexShrink: 0,
      background: 'oklch(0.08 0.02 250 / 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid oklch(0.20 0.03 240 / 0.5)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <button
          style={{
            background: 'transparent', border: 0, color: 'oklch(0.85 0.13 88)',
            fontSize: 18, padding: 0, lineHeight: 1, cursor: 'pointer',
          }}
          aria-label="Меню"
        >
          ☰
        </button>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600,
            letterSpacing: '0.18em',
            background: 'linear-gradient(180deg, oklch(0.92 0.10 88), oklch(0.65 0.13 70))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>TRAEKTORIYA</span>
          <span style={{
            fontSize: 8, color: 'oklch(0.55 0.04 250)',
            letterSpacing: '0.1em', marginTop: 2,
          }}>{lang === 'uz' ? 'noldan ekspertgacha' : 'с нуля до эксперта'}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'flex', border: '1px solid oklch(0.30 0.04 240 / 0.5)',
          borderRadius: 7, overflow: 'hidden',
          fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <button
            onClick={() => setLang('ru')}
            style={{
              padding: '4px 7px', border: 0, cursor: 'pointer',
              background: lang === 'ru' ? 'oklch(0.28 0.10 220 / 0.4)' : 'transparent',
              color: lang === 'ru' ? 'oklch(0.92 0.05 220)' : 'oklch(0.50 0.04 250)',
              fontFamily: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
            }}
          >РУ</button>
          <button
            onClick={() => setLang('uz')}
            style={{
              padding: '4px 7px', border: 0, cursor: 'pointer',
              background: lang === 'uz' ? 'oklch(0.28 0.10 220 / 0.4)' : 'transparent',
              color: lang === 'uz' ? 'oklch(0.92 0.05 220)' : 'oklch(0.50 0.04 250)',
              fontFamily: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
            }}
          >UZ</button>
        </div>
        <div style={{ position: 'relative' }}>
          <span style={{ fontSize: 15, color: 'oklch(0.85 0.13 88)' }}>◷</span>
          <span style={{
            position: 'absolute', top: -2, right: -3, width: 6, height: 6,
            borderRadius: '50%', background: 'oklch(0.78 0.15 30)',
            boxShadow: '0 0 6px oklch(0.78 0.15 30)',
          }} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Hero strip
// =============================================================================
interface HeroStripProps {
  name: string;
  pct: number;
  xp: number;
  streak: number;
  league: string;
  rank: number;
}

function HeroStrip({ name, pct, xp, streak, league, rank }: HeroStripProps) {
  return (
    <div style={{
      padding: '10px 16px 12px', flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 11,
    }}>
      <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
        <svg viewBox="0 0 46 46" width="46" height="46">
          <circle cx="23" cy="23" r="20" fill="none" stroke="oklch(0.20 0.03 240)" strokeWidth="2.5" />
          <circle cx="23" cy="23" r="20" fill="none"
            stroke="url(#heroRing)" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 125.66} 125.66`}
            transform="rotate(-90 23 23)" />
          <defs>
            <linearGradient id="heroRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.85 0.13 88)" />
              <stop offset="100%" stopColor="oklch(0.78 0.15 220)" />
            </linearGradient>
          </defs>
        </svg>
        <div style={{
          position: 'absolute', inset: 3, borderRadius: '50%',
          background: 'linear-gradient(135deg, oklch(0.34 0.08 220), oklch(0.28 0.06 280))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 600,
          color: 'oklch(0.92 0.05 88)', letterSpacing: '0.04em',
          border: '1px solid oklch(0.40 0.04 240)',
        }}>{(name[0] || 'O').toUpperCase()}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 600,
            color: 'oklch(0.95 0.03 88)',
          }}>{name}</span>
          <span style={{
            fontSize: 8, color: 'oklch(0.55 0.04 250)',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
          }}>ТП · LVL {Math.floor(xp / 300)}</span>
        </div>
        <div style={{
          fontSize: 9, color: 'oklch(0.60 0.04 250)',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em', marginTop: 2,
        }}>
          {pct}% ПУТИ · {xp.toLocaleString('ru')} XP
        </div>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: 3, flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 7px', borderRadius: 99,
          background: 'oklch(0.30 0.10 70 / 0.30)',
          border: '1px solid oklch(0.65 0.13 75 / 0.5)',
        }}>
          <svg width="11" height="11" viewBox="0 0 12 12">
            <path d="M6 1 L8 4.5 L11 5 L8.5 7.5 L9 11 L6 9.5 L3 11 L3.5 7.5 L1 5 L4 4.5 Z"
              fill="oklch(0.78 0.13 75)" stroke="oklch(0.95 0.10 88)" strokeWidth="0.5" />
          </svg>
          <span style={{
            fontSize: 9, fontWeight: 700, color: 'oklch(0.92 0.10 80)',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
          }}>{league}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 9, fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span style={{ color: 'oklch(0.78 0.14 55)' }}>🔥{streak}</span>
          <span style={{ color: 'oklch(0.55 0.04 250)' }}>·</span>
          <span style={{ color: 'oklch(0.85 0.05 250)' }}>#{rank}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Daily quest banner
// =============================================================================
function DailyQuestBanner() {
  const lang = useLangStore((s) => s.lang);
  const t = (ru: string, uz: string) => (lang === 'uz' ? uz : ru);
  void t;
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      margin: '0 14px 10px', flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px',
      background: 'linear-gradient(90deg, oklch(0.18 0.06 220 / 0.7), oklch(0.16 0.04 240 / 0.5))',
      border: '1px solid oklch(0.45 0.10 220 / 0.4)',
      borderLeft: '2px solid oklch(0.85 0.13 88)',
      borderRadius: 8,
    }}>
      <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
        <circle cx="10" cy="10" r="8" fill="none" stroke="oklch(0.85 0.13 88)" strokeWidth="1.4" />
        <path d="M10 5 L10 10 L13 12" stroke="oklch(0.85 0.13 88)" strokeWidth="1.4"
          strokeLinecap="round" fill="none" />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 8, color: 'oklch(0.65 0.10 88)',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.14em',
        }}>{lang === 'uz' ? 'KUNDALIK QUEST' : 'ЕЖЕДНЕВНЫЙ КВЕСТ'}</div>
        <div style={{
          fontSize: 11, color: 'oklch(0.95 0.03 88)', marginTop: 1, fontWeight: 500,
        }}>
          {lang === 'uz' ? 'Bugun 1 ta bo\'limni yoping' : 'Закрой 1 раздел сегодня'}
        </div>
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'oklch(0.85 0.13 88)',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em',
        }}>+50 XP</span>
        <span style={{
          fontSize: 8, color: 'oklch(0.55 0.04 250)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>{time}</span>
      </div>
    </div>
  );
}

// =============================================================================
// Pinch/pan map
// =============================================================================
interface Transform {
  scale: number;
  tx: number;
  ty: number;
}

interface PinchMapProps {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  focusNode: MapNode | null;
  nodes: MapNode[];
  zones: MapZone[];
  edges: MapEdge[];
}

function PinchMap({ selectedId, setSelectedId, focusNode, nodes, zones, edges }: PinchMapProps) {
  const MAP_W = 1100, MAP_H = 580;
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 360, h: 220 });
  const [transform, setTransform] = useState<Transform>({ scale: 1, tx: 0, ty: 0 });
  const fitScale = Math.min(box.w / MAP_W, box.h / MAP_H);
  const minScale = 1, maxScale = 3.2;

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setBox({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!focusNode) return;
    const fx = focusNode.x * MAP_W, fy = focusNode.y * MAP_H + 80;
    setTransform((t) => {
      const sc = Math.max(t.scale, 1.4);
      const cx = box.w / 2, cy = box.h / 2;
      const tx = cx - fx * fitScale * sc;
      const ty = cy - fy * fitScale * sc;
      return { scale: sc, tx, ty };
    });
  }, [focusNode?.id, fitScale, box.w, box.h]);

  const stateRef = useRef<{ touches: Touch[] | null; startT: Transform | null }>({ touches: null, startT: null });
  const onTouchStart = (e: React.TouchEvent) => {
    const ts = Array.from(e.touches);
    stateRef.current = { touches: ts as unknown as Touch[], startT: { ...transform } };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const ts = Array.from(e.touches);
    const st = stateRef.current;
    if (!st.touches || !st.startT) return;
    if (ts.length === 1 && st.touches.length === 1) {
      const dx = ts[0].clientX - st.touches[0].clientX;
      const dy = ts[0].clientY - st.touches[0].clientY;
      setTransform((t) => ({ ...t, tx: st.startT!.tx + dx, ty: st.startT!.ty + dy }));
    } else if (ts.length === 2 && st.touches.length === 2) {
      const d0 = Math.hypot(
        st.touches[0].clientX - st.touches[1].clientX,
        st.touches[0].clientY - st.touches[1].clientY
      );
      const d1 = Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY);
      const ratio = d1 / Math.max(d0, 1);
      const ns = Math.max(minScale, Math.min(maxScale, st.startT.scale * ratio));
      setTransform((t) => ({ ...t, scale: ns }));
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY * 0.0015;
    setTransform((t) => ({
      ...t,
      scale: Math.max(minScale, Math.min(maxScale, t.scale + delta * t.scale)),
    }));
  };
  const fit = () => setTransform({ scale: 1, tx: 0, ty: 0 });

  const placed = useMemo(
    () => nodes.map((n) => ({ ...n, _px: n.x * MAP_W, _py: n.y * (MAP_H - 60) + 60 })),
    [nodes]
  );
  const idMap = useMemo(
    () => Object.fromEntries(placed.map((n) => [n.id, n])),
    [placed]
  );
  const renderedW = MAP_W * fitScale;
  const renderedH = MAP_H * fitScale;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative', height: 240, margin: '0 14px 6px',
        background: 'oklch(0.10 0.02 250 / 0.6)',
        border: '1px solid oklch(0.30 0.04 240 / 0.5)',
        borderRadius: 12, overflow: 'hidden', flexShrink: 0,
        touchAction: 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onWheel={onWheel}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0,
        transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
        transformOrigin: '0 0',
        transition: stateRef.current?.touches ? 'none' : 'transform 0.4s cubic-bezier(0.22, 0.36, 0, 1)',
      }}>
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width={renderedW} height={renderedH}
          style={{ display: 'block' }}>
          <defs>
            <radialGradient id="mPmVignette" cx="50%" cy="50%" r="75%">
              <stop offset="55%" stopColor="oklch(0.10 0.02 250)" stopOpacity="0" />
              <stop offset="100%" stopColor="oklch(0.06 0.02 250)" stopOpacity="0.85" />
            </radialGradient>
          </defs>
          <image href="/tactical/world-map-v4.png"
            x="0" y="0" width={MAP_W} height={MAP_H}
            preserveAspectRatio="xMidYMid slice"
            style={{ filter: 'saturate(0.55) brightness(0.78) contrast(1.10)', opacity: 0.88 }} />
          <rect width={MAP_W} height={MAP_H} fill="oklch(0.20 0.06 235)" opacity="0.22"
            style={{ mixBlendMode: 'multiply' }} />
          <rect width={MAP_W} height={MAP_H} fill="url(#mPmVignette)" />

          {zones.slice(0, -1).map((z) => {
            const xs = (z.x + z.w) * MAP_W;
            return (
              <line key={z.id}
                x1={xs} y1={56} x2={xs} y2={MAP_H - 30}
                stroke={z.accent} strokeOpacity="0.4"
                strokeWidth="1" strokeDasharray="4 5" />
            );
          })}

          {zones.map((z) => (
            <text key={z.id}
              x={(z.x + z.w / 2) * MAP_W} y={32}
              textAnchor="middle"
              fontFamily="Cinzel, serif" fontWeight="600"
              fontSize="13" letterSpacing="0.22em"
              fill={z.accent} opacity="0.85">
              {z.label}
            </text>
          ))}

          {edges.map(([a, b], i) => {
            const A = idMap[a], B = idMap[b];
            if (!A || !B) return null;
            const dim = A.state === 'locked' && B.state === 'locked';
            return (
              <line key={i} x1={A._px} y1={A._py} x2={B._px} y2={B._py}
                stroke={dim ? 'oklch(0.40 0.03 240)' : 'oklch(0.65 0.06 220)'}
                strokeOpacity={dim ? 0.25 : 0.45}
                strokeWidth="1" strokeDasharray="3 4" />
            );
          })}

          {placed.map((n) => {
            const s = STATE_STYLES[n.state];
            const isSel = n.id === selectedId;
            const r = isSel ? 8 : 6;
            const isActive = n.state === 'active';
            return (
              <g key={n.id}
                transform={`translate(${n._px} ${n._py})`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedId(n.id)}>
                {isSel && (
                  <circle r={r + 6} fill="none" stroke={s.stroke}
                    strokeWidth="1.2" opacity="0.7" />
                )}
                {isActive && (
                  <circle r={r} fill={s.stroke} fillOpacity="0.4">
                    <animate attributeName="r" values={`${r};${r + 8};${r}`}
                      dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity"
                      values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle r={r} fill={s.fill}
                  stroke={s.stroke}
                  strokeWidth={isSel ? 2.5 : 1.5} />
                {(n.state === 'done' || n.state === 'mastered') && (
                  <path d="M-2.5 0 L-0.5 2 L3 -2" stroke={s.stroke} strokeWidth="1.6"
                    fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
                {n.state === 'locked' && (
                  <text textAnchor="middle" y="2" fontSize="6" fill={s.stroke}>🔒</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{
        position: 'absolute', right: 8, bottom: 8,
        display: 'flex', flexDirection: 'column', gap: 4, zIndex: 2,
      }}>
        {([
          ['＋', () => setTransform((t) => ({ ...t, scale: Math.min(maxScale, t.scale * 1.25) }))],
          ['－', () => setTransform((t) => ({ ...t, scale: Math.max(minScale, t.scale / 1.25) }))],
          ['⊕', fit],
        ] as [string, () => void][]).map(([icon, fn], i) => (
          <button key={i} onClick={fn} style={{
            width: 28, height: 28, border: '1px solid oklch(0.30 0.04 240 / 0.6)',
            borderRadius: 6,
            background: 'oklch(0.10 0.02 250 / 0.85)',
            color: 'oklch(0.85 0.05 240)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}>{icon}</button>
        ))}
      </div>
      <div style={{
        position: 'absolute', left: 10, top: 10, fontSize: 8,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'oklch(0.65 0.04 250)', letterSpacing: '0.12em',
        background: 'oklch(0.10 0.02 250 / 0.7)',
        padding: '3px 7px', borderRadius: 4,
        border: '1px solid oklch(0.30 0.04 240 / 0.4)',
        backdropFilter: 'blur(8px)',
      }}>
        ZOOM ×{transform.scale.toFixed(2)}
      </div>
    </div>
  );
}

// =============================================================================
// Village tile
// =============================================================================
interface VillageTileProps {
  v: MapNode;
  zone: MapZone;
  selected: boolean;
  onSelect: () => void;
}

function VillageTile({ v, zone, selected, onSelect }: VillageTileProps) {
  const s = STATE_STYLES[v.state];
  const pct = Math.round(((v.done ?? 0) / Math.max(v.sections ?? 1, 1)) * 100);
  return (
    <button onClick={onSelect} style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '10px 12px',
      background: selected
        ? `linear-gradient(90deg, ${zone.accent}25, oklch(0.10 0.02 250 / 0.5))`
        : 'oklch(0.11 0.02 250 / 0.7)',
      border: `1px solid ${selected ? s.stroke : 'oklch(0.22 0.03 240 / 0.6)'}`,
      borderLeft: `3px solid ${s.stroke || zone.accent}`,
      borderRadius: 9, cursor: 'pointer', textAlign: 'left',
      transition: 'background 0.18s, border-color 0.18s',
    }}>
      <div style={{
        position: 'relative', flexShrink: 0, width: 24, height: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: s.fill, border: `1.5px solid ${s.stroke}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, color: s.stroke,
        }}>
          {v.state === 'done' || v.state === 'mastered' ? '✓' :
            v.state === 'active' ? '◆' :
              v.state === 'locked' ? '🔒' : ''}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, lineHeight: 1.1 }}>
          <span style={{
            fontSize: 8, color: 'oklch(0.55 0.04 250)',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
            flexShrink: 0,
          }}>{v.code}</span>
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600,
            color: 'oklch(0.93 0.03 88)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {v.title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
          <div style={{
            flex: 1, height: 3, borderRadius: 3,
            background: 'oklch(0.20 0.02 250)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${pct}%`, height: '100%',
              background: s.stroke,
              transition: 'width 0.4s',
            }} />
          </div>
          <span style={{
            fontSize: 9, color: 'oklch(0.60 0.04 250)',
            fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
          }}>
            {v.done}/{v.sections}
          </span>
        </div>
      </div>
      <span style={{
        fontSize: 14, color: 'oklch(0.50 0.04 250)', flexShrink: 0,
        opacity: v.state === 'locked' ? 0.4 : 1,
      }}>›</span>
    </button>
  );
}

// =============================================================================
// Territory list
// =============================================================================
interface TerritoryListProps {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  nodes: MapNode[];
  zones: MapZone[];
}

function TerritoryList({ selectedId, setSelectedId, nodes, zones }: TerritoryListProps) {
  return (
    <div style={{ padding: '4px 0 8px' }}>
      {zones.map((z, zi) => {
        const villages = nodes.filter((n) => n.zone === zi);
        const totalSec = villages.reduce((s, v) => s + (v.sections ?? 0), 0);
        const doneSec = villages.reduce((s, v) => s + (v.done ?? 0), 0);
        const pct = totalSec ? Math.round((doneSec / totalSec) * 100) : 0;
        const numeral = TERRITORY_NUMERAL[z.id] || (zi + 1);
        return (
          <div key={z.id} style={{ marginBottom: 6 }}>
            <div style={{
              position: 'sticky', top: 0, zIndex: 5,
              padding: '10px 16px 8px',
              background: 'oklch(0.07 0.02 250 / 0.94)',
              backdropFilter: 'blur(14px)',
              borderTop: `1px solid ${z.accent}30`,
              borderBottom: '1px solid oklch(0.18 0.03 240 / 0.6)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                border: `1px solid ${z.accent}80`,
                background: `linear-gradient(135deg, ${z.accent}25, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600,
                color: z.accent, letterSpacing: '0.04em', flexShrink: 0,
              }}>{numeral}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{
                    fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 600,
                    letterSpacing: '0.18em', color: z.accent,
                  }}>{z.label}</span>
                  <span style={{
                    fontSize: 9, color: 'oklch(0.55 0.04 250)',
                    fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em',
                  }}>
                    {villages.length} ПОСЁЛКОВ
                  </span>
                </div>
                <div style={{
                  height: 2, marginTop: 4, borderRadius: 2,
                  background: 'oklch(0.16 0.02 250)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: z.accent, transition: 'width 0.4s',
                  }} />
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, color: 'oklch(0.85 0.05 88)',
                fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
              }}>
                {pct}%
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '8px 14px 10px' }}>
              {villages.map((v) => (
                <VillageTile key={v.id} v={v} zone={z}
                  selected={v.id === selectedId}
                  onSelect={() => setSelectedId(v.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Friends activity strip
// =============================================================================
function FriendsStrip() {
  const lang = useLangStore((s) => s.lang);
  const t = (ru: string, uz: string) => (lang === 'uz' ? uz : ru);
  const items = [
    { name: t('Аиша', 'Oysha'), action: t('взяла Эксперта', 'Ekspert oldi'), when: t('2м', '2d'), avatar: 'А', tint: 'oklch(0.74 0.13 200)' },
    { name: t('Тимур', 'Temur'), action: t('прошёл ПР-04', "PR-04 o'tdi"), when: t('12м', '12d'), avatar: 'Т', tint: 'oklch(0.78 0.14 75)' },
    { name: t('Лейла', 'Layla'), action: t('15-дневный streak', '15-kunlik seriya'), when: t('1ч', '1s'), avatar: 'Л', tint: 'oklch(0.78 0.15 30)' },
  ];
  return (
    <div style={{
      padding: '14px 16px 16px', flexShrink: 0,
      borderTop: '1px solid oklch(0.18 0.03 240 / 0.6)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          color: 'oklch(0.55 0.04 250)', letterSpacing: '0.16em',
        }}>{t('АКТИВНОСТЬ КОМАНДЫ', "JAMOA FAOLIYATI")}</span>
        <span style={{ fontSize: 10, color: 'oklch(0.75 0.06 220)', fontWeight: 500 }}>{t('Все', 'Barchasi')} →</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: `linear-gradient(135deg, ${it.tint}40, oklch(0.20 0.02 250))`,
              border: `1px solid ${it.tint}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 600,
              color: it.tint,
            }}>
              {it.avatar}
            </div>
            <div style={{
              flex: 1, minWidth: 0, fontSize: 11,
              color: 'oklch(0.85 0.03 250)', lineHeight: 1.3,
            }}>
              <span style={{ color: 'oklch(0.95 0.03 88)', fontWeight: 500 }}>{it.name}</span>
              <span style={{ color: 'oklch(0.65 0.04 250)' }}> {it.action}</span>
            </div>
            <span style={{
              fontSize: 9, color: 'oklch(0.45 0.04 250)',
              fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
            }}>{it.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Bottom sheet — village detail
// =============================================================================
interface VillageSheetProps {
  village: MapNode;
  zone: MapZone;
  onClose: () => void;
  onOpenCourse?: (courseId: string) => void;
}

function VillageSheet({ village, zone, onClose, onOpenCourse }: VillageSheetProps) {
  const lang = useLangStore((s) => s.lang);
  const tt = (ru: string, uz: string) => (lang === 'uz' ? uz : ru);
  const s = STATE_STYLES[village.state];
  const totalXp = (village.sections ?? 0) * 60;
  const earnedXp = (village.done ?? 0) * 60;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'oklch(0.04 0.02 250 / 0.6)',
        backdropFilter: 'blur(4px)', zIndex: 20,
        animation: 'fadeIn 0.2s ease',
      }} />
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 21,
        background: 'linear-gradient(180deg, oklch(0.12 0.03 250 / 0.98), oklch(0.08 0.02 250 / 0.98))',
        borderTop: `2px solid ${zone.accent}`,
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
        padding: '10px 18px 22px',
        boxShadow: '0 -12px 32px oklch(0.04 0.02 250 / 0.7)',
        backdropFilter: 'blur(20px)',
        animation: 'slideUp 0.28s cubic-bezier(0.22, 0.36, 0, 1)',
        maxHeight: '72vh', overflowY: 'auto',
      }}>
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'oklch(0.40 0.04 240)', margin: '0 auto 12px',
        }} />
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <span style={{
                fontSize: 9, color: zone.accent,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.14em', fontWeight: 600,
              }}>
                {zone.label} · {village.code}
              </span>
              <span style={{
                fontSize: 9, color: s.stroke,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.1em', fontWeight: 600,
                padding: '1px 6px', borderRadius: 3,
                background: `${s.stroke}20`,
              }}>
                {s.label.toUpperCase()}
              </span>
            </div>
            <h2 style={{
              margin: 0, fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 600,
              color: 'oklch(0.95 0.03 88)', letterSpacing: '0.01em',
            }}>
              {village.title}
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 0,
            color: 'oklch(0.55 0.04 250)', fontSize: 20, cursor: 'pointer', padding: 0,
            lineHeight: 1,
          }}>×</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 9, color: 'oklch(0.55 0.04 250)',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '0.14em', marginBottom: 8,
          }}>
            {tt('КУРСЫ ПОСЁЛКА', 'POSYOLKA KURSLARI')}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {village.houses.map((h, i) => {
              const hs = STATE_STYLES[h.s as NodeState];
              const isDone = h.s === 'done' || h.s === 'mastered';
              return (
                <div key={i} style={{
                  flex: 1, padding: '12px 8px',
                  background: `${hs.stroke}10`,
                  border: `1px solid ${hs.stroke}`,
                  borderRadius: 8,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6,
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24">
                    <path d="M2 11 L12 2 L22 11 L22 22 L2 22 Z"
                      fill={hs.fill} stroke={hs.stroke} strokeWidth="1.4"
                      strokeLinejoin="round" />
                    {isDone && (
                      <path d="M7 14 L10 17 L17 11" stroke={hs.stroke} strokeWidth="2"
                        fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    )}
                    {h.s === 'active' && (
                      <circle cx="12" cy="15" r="2" fill={hs.stroke} />
                    )}
                    {h.s === 'locked' && (
                      <rect x="9" y="13" width="6" height="6" fill="none"
                        stroke={hs.stroke} strokeWidth="1.4" rx="1" />
                    )}
                  </svg>
                  <span style={{
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: hs.stroke, fontWeight: 600, letterSpacing: '0.05em',
                  }}>
                    {tt('Курс', 'Kurs')} {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>{tt('ПРОГРЕСС', 'JARAYON')}</div>
            <div style={statValueStyle}>{village.done}/{village.sections}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>{tt('НАГРАДА', 'MUKOFOT')}</div>
            <div style={{ ...statValueStyle, color: 'oklch(0.85 0.13 88)' }}>
              +{totalXp - earnedXp} XP
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (village.state === 'locked' || !onOpenCourse) return;
            // Открываем первый незаблокированный курс
            const firstActive = village.houses.find((h) => h.s !== 'locked' && h.course_id);
            if (firstActive?.course_id) {
              onOpenCourse(firstActive.course_id);
            }
          }}
          disabled={village.state === 'locked'}
          style={{
            width: '100%', padding: 12,
            background: village.state === 'locked'
              ? 'oklch(0.18 0.02 250 / 0.6)'
              : `linear-gradient(135deg, ${zone.accent}40, oklch(0.32 0.10 70 / 0.4))`,
            border: `1px solid ${village.state === 'locked' ? 'oklch(0.30 0.04 240)' : zone.accent}`,
            borderRadius: 9,
            color: village.state === 'locked' ? 'oklch(0.55 0.04 250)' : 'oklch(0.95 0.05 88)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 600, letterSpacing: '0.16em',
            cursor: village.state === 'locked' ? 'not-allowed' : 'pointer',
          }}
        >
          {village.state === 'locked'
            ? tt('🔒 ЗАБЛОКИРОВАНО', '🔒 BLOKLANGAN')
            : village.state === 'active' ? tt('ПРОДОЛЖИТЬ →', 'DAVOM ETISH →')
              : village.state === 'done' || village.state === 'mastered' ? tt('✓ ПОВТОРИТЬ', '✓ TAKRORLASH')
                : tt('НАЧАТЬ →', 'BOSHLASH →')}
        </button>
      </div>
    </>
  );
}

const statCardStyle: CSSProperties = {
  padding: '9px 11px',
  background: 'oklch(0.10 0.02 250 / 0.7)',
  border: '1px solid oklch(0.22 0.03 240 / 0.6)',
  borderRadius: 7,
};
const statLabelStyle: CSSProperties = {
  fontSize: 8, color: 'oklch(0.55 0.04 250)',
  fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.14em',
};
const statValueStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600,
  color: 'oklch(0.95 0.03 88)', marginTop: 2,
};

// =============================================================================
// Bottom tab bar
// =============================================================================
function MobileTabBar() {
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();
  const t = (ru: string, uz: string) => (lang === 'uz' ? uz : ru);
  const items: { l: string; i: string; active?: boolean; route?: string }[] = [
    { l: t('Карта', 'Xarita'), i: '◈', active: true },
    { l: t('Курсы', 'Kurslar'), i: '▤', route: '/learning' },
    { l: t('Команда', 'Jamoa'), i: '☷', route: '/team' },
    { l: t('Профиль', 'Profil'), i: '◉', route: '/dashboard' },
  ];
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around',
      padding: '10px 12px 18px', flexShrink: 0,
      background: 'oklch(0.06 0.02 250 / 0.95)',
      borderTop: '1px solid oklch(0.20 0.03 240 / 0.6)',
      backdropFilter: 'blur(16px)',
      position: 'sticky', bottom: 0, zIndex: 10,
    }}>
      {items.map((it, i) => (
        <button
          key={i}
          onClick={() => it.route && navigate(it.route)}
          style={{
            background: 'transparent', border: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: it.active ? 'oklch(0.85 0.13 88)' : 'oklch(0.50 0.04 250)',
            fontSize: 9, fontFamily: "'Inter', sans-serif", cursor: 'pointer',
            flex: 1, padding: 0,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{it.i}</span>
          <span style={{
            letterSpacing: '0.06em', fontWeight: it.active ? 600 : 400,
          }}>{it.l}</span>
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// Main TacticalMobile
// =============================================================================
interface TacticalMobileProps {
  operatorName: string;
  /** Реальные узлы из learning API. Если пусто — показывается loading или fallback на mock. */
  nodes?: MapNode[];
  zones?: MapZone[];
  edges?: MapEdge[];
  totalCourses?: number;
  doneCourses?: number;
  loading?: boolean;
  onOpenCourse?: (courseId: string) => void;
}

export function TacticalMobile({
  operatorName,
  nodes,
  zones,
  edges,
  totalCourses,
  doneCourses,
  loading,
  onOpenCourse,
}: TacticalMobileProps) {
  const lang = useLangStore((s) => s.lang);

  // Fallback на mock если nodes отсутствует или пуст и не идёт загрузка
  const useMock = (!nodes || nodes.length === 0) && !loading;
  const N = useMock ? DEFAULT_NODES : (nodes ?? []);
  const Z = useMock ? DEFAULT_ZONES : (zones ?? []);
  const E = useMock ? DEFAULT_EDGES : (edges ?? []);

  const initialActive = N.find((n) => n.state === 'active') || N[0];
  const [selectedId, setSelectedId] = useState<string | null>(initialActive?.id ?? null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Sync selected when nodes change (after async load)
  useEffect(() => {
    if (!selectedId && N.length > 0) {
      const ia = N.find((n) => n.state === 'active') || N[0];
      setSelectedId(ia?.id ?? null);
    }
  }, [N, selectedId]);

  const totalCount = totalCourses ?? N.reduce((s, n) => s + (n.sections ?? 0), 0);
  const doneCount = doneCourses ?? N.reduce((s, n) => s + (n.done ?? 0), 0);
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const selected = N.find((n) => n.id === selectedId) || initialActive;
  const selectedZone = Z[selected?.zone ?? 0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  return (
    <div style={{
      width: '100%', minHeight: '100vh',
      background:
        'radial-gradient(at 30% 0%, oklch(0.22 0.06 230 / 0.5), transparent 55%), ' +
        'radial-gradient(at 70% 100%, oklch(0.20 0.05 280 / 0.45), transparent 55%), ' +
        'oklch(0.07 0.02 250)',
      color: 'oklch(0.92 0.02 250)',
      fontFamily: "'Inter', system-ui, sans-serif",
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        scrollbarWidth: 'none',
        display: 'flex', flexDirection: 'column',
      }}>
        <style>{`::-webkit-scrollbar { display: none; }`}</style>
        <MobileTopBar />
        <HeroStrip
          name={operatorName}
          pct={pct}
          xp={2480}
          streak={17}
          league="ЗОЛОТО II"
          rank={7}
        />
        <DailyQuestBanner />
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'oklch(0.55 0.04 250)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.18em', fontSize: 11 }}>
            {lang === 'uz' ? 'XARITA YUKLANMOQDA...' : 'ЗАГРУЗКА КАРТЫ...'}
          </div>
        ) : (
          <>
            <PinchMap
              selectedId={selectedId}
              setSelectedId={handleSelect}
              focusNode={selected}
              nodes={N}
              zones={Z}
              edges={E}
            />
            <TerritoryList
              selectedId={selectedId}
              setSelectedId={handleSelect}
              nodes={N}
              zones={Z}
            />
          </>
        )}
        <FriendsStrip />
      </div>
      <MobileTabBar />
      {sheetOpen && selected && selectedZone && (
        <VillageSheet
          village={selected}
          zone={selectedZone}
          onClose={() => setSheetOpen(false)}
          onOpenCourse={onOpenCourse}
        />
      )}
    </div>
  );
}
