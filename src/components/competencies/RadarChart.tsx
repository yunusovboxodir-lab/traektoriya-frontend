/**
 * RadarChart — SVG-радар для визуализации Пульса по N компетенциям.
 *
 * v2 (2026-05-05):
 *  - Tooltip при hover на точке
 *  - onPointClick — drill-down (открыть курсы компетенции)
 *  - targetValues — пунктирная линия целевого профиля
 *  - Цветные подписи % по уровню
 *  - Темная тема (бренд-токены)
 *
 * Чистый SVG, без библиотек.
 */
import { useMemo, useState } from 'react';

export interface RadarDataPoint {
  label: string;
  value: number;     // 0-100
  level?: string;    // trainee/practitioner/expert/master
  /** ID для click-callback */
  id?: string;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  /** Показывать ли значения рядом с метками */
  showValues?: boolean;
  /** Цвет заливки */
  fillColor?: string;
  /** Цвет обводки */
  strokeColor?: string;
  /** Целевой профиль — пунктирная линия (одно число = тот же target для всех осей, массив = индивидуально) */
  targetValues?: number | number[];
  /** Колбэк по клику на точку */
  onPointClick?: (idx: number, datum: RadarDataPoint) => void;
  /** Дополнительный контент в tooltip (например, "X / Y курсов") */
  tooltipExtra?: (datum: RadarDataPoint, idx: number) => React.ReactNode;
}

// Цвета уровней (соответствуют CSS-токенам)
const LEVEL_COLORS: Record<string, string> = {
  trainee: '#EF4444',
  practitioner: '#FBBF24',
  expert: '#60A5FA',
  master: '#4ADE80',
};

function levelByValue(v: number): string {
  if (v >= 76) return 'master';
  if (v >= 51) return 'expert';
  if (v >= 26) return 'practitioner';
  return 'trainee';
}

export function RadarChart({
  data,
  size = 380,
  showValues = true,
  fillColor = 'rgba(96, 165, 250, 0.20)',
  strokeColor = '#60A5FA',
  targetValues,
  onPointClick,
  tooltipExtra,
}: RadarChartProps) {
  const n = data.length;
  const svgSize = size * 1.35;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const maxR = size * 0.32;
  const labelR = size * 0.44;

  const angles = useMemo(
    () => data.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2),
    [n, data],
  );

  const polarToXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const gridLevels = [0.25, 0.50, 0.75, 1.0];

  // Полигон значений
  const dataPoints = data.map((d, i) => {
    const r = (d.value / 100) * maxR;
    return polarToXY(angles[i], r);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  // Полигон targetValues
  const targetPath = useMemo(() => {
    if (targetValues == null) return null;
    const targetArray = Array.isArray(targetValues)
      ? targetValues
      : data.map(() => targetValues as number);
    const tPoints = targetArray.map((v, i) => {
      const r = (Math.max(0, Math.min(100, v)) / 100) * maxR;
      return polarToXY(angles[i], r);
    });
    return tPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  }, [targetValues, data, angles, cx, cy, maxR]);

  // Tooltip state
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const interactive = !!onPointClick;

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        width={size}
        height={size}
        style={{ overflow: 'visible', display: 'block', width: '100%', height: '100%' }}
      >
        {/* Сетка — концентрические октагоны */}
        {gridLevels.map((level) => {
          const r = level * maxR;
          const points = angles.map((a) => polarToXY(a, r));
          const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
          return (
            <path
              key={level}
              d={path}
              fill="none"
              stroke="var(--border)"
              strokeWidth={level === 1 ? 1.2 : 0.5}
              strokeDasharray={level < 1 ? '2,2' : undefined}
            />
          );
        })}

        {/* Оси от центра */}
        {angles.map((a, i) => {
          const end = polarToXY(a, maxR);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="var(--border)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Цифры на оси (25/50/75/100) — только сверху */}
        {gridLevels.map((level) => (
          <text
            key={`grid-label-${level}`}
            x={cx}
            y={cy - level * maxR - 4}
            textAnchor="middle"
            style={{ fontSize: '9px', fill: 'var(--text-muted)', fontWeight: 500 }}
          >
            {Math.round(level * 100)}
          </text>
        ))}

        {/* Целевой профиль — пунктирная заливка */}
        {targetPath && (
          <path
            d={targetPath}
            fill="rgba(200, 168, 75, 0.04)"
            stroke="#C8A84B"
            strokeWidth={1.5}
            strokeDasharray="5,5"
          />
        )}

        {/* Полигон данных */}
        <path d={dataPath} fill={fillColor} stroke={strokeColor} strokeWidth={2.5} strokeLinejoin="round" />

        {/* Точки данных (interactive) */}
        {dataPoints.map((p, i) => {
          const lvl = data[i].level || levelByValue(data[i].value);
          const color = LEVEL_COLORS[lvl] || strokeColor;
          const isHovered = hoverIdx === i;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isHovered ? 7 : 5}
              fill={isHovered ? '#C8A84B' : 'var(--bg-elevated)'}
              stroke={isHovered ? '#C8A84B' : color}
              strokeWidth={isHovered ? 3 : 2}
              style={{
                cursor: interactive ? 'pointer' : 'default',
                transition: 'r 0.15s ease, fill 0.15s ease, stroke 0.15s ease',
              }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => { setHoverIdx(null); setTooltipPos(null); }}
              onMouseMove={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
              onClick={() => onPointClick?.(i, data[i])}
            />
          );
        })}

        {/* Метки компетенций */}
        {data.map((d, i) => {
          const pos = polarToXY(angles[i], labelR);
          let anchor: 'start' | 'end' | 'middle' = 'middle';
          if (Math.cos(angles[i]) > 0.3) anchor = 'start';
          if (Math.cos(angles[i]) < -0.3) anchor = 'end';

          const lvl = d.level || levelByValue(d.value);
          const valueColor = LEVEL_COLORS[lvl] || '#9CA3AF';

          // Разбиваем длинные названия на 2 строки
          const words = d.label.split(' ');
          let line1 = d.label;
          let line2 = '';
          if (d.label.length > 14 && words.length >= 2) {
            const mid = Math.ceil(words.length / 2);
            line1 = words.slice(0, mid).join(' ');
            line2 = words.slice(mid).join(' ');
          }

          return (
            <g key={i}>
              <text
                x={pos.x}
                y={pos.y - (line2 ? 8 : 0) - (showValues ? 8 : 0)}
                textAnchor={anchor}
                dominantBaseline="central"
                style={{
                  fontSize: '11px',
                  fill: 'var(--text-primary)',
                  fontWeight: 600,
                  fontFamily: "'Inter','Golos Text',sans-serif",
                  paintOrder: 'stroke',
                  stroke: 'var(--bg-card)',
                  strokeWidth: 3,
                }}
              >
                {line1}
              </text>
              {line2 && (
                <text
                  x={pos.x}
                  y={pos.y + 6 - (showValues ? 8 : 0)}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  style={{
                    fontSize: '11px',
                    fill: 'var(--text-primary)',
                    fontWeight: 600,
                    fontFamily: "'Inter','Golos Text',sans-serif",
                    paintOrder: 'stroke',
                    stroke: 'var(--bg-card)',
                    strokeWidth: 3,
                  }}
                >
                  {line2}
                </text>
              )}
              {showValues && (
                <text
                  x={pos.x}
                  y={pos.y + (line2 ? 20 : 10)}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  style={{
                    fontSize: '12px',
                    fontFamily: "'Unbounded','Inter',sans-serif",
                    fill: valueColor,
                    fontWeight: 800,
                    paintOrder: 'stroke',
                    stroke: 'var(--bg-card)',
                    strokeWidth: 3,
                  }}
                >
                  {Math.round(d.value)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip (отдельный DOM-элемент, чтобы не обрезался SVG-overflow) */}
      {hoverIdx !== null && tooltipPos && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.x + 14,
            top: tooltipPos.y + 14,
            background: 'var(--bg-elevated)',
            border: '1px solid #C8A84B',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 9999,
            pointerEvents: 'none',
            maxWidth: 240,
            fontFamily: "'Inter',sans-serif",
          }}
        >
          <div style={{
            fontFamily: "'Unbounded',sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: '#C8A84B',
            marginBottom: 6,
          }}>
            {data[hoverIdx].label}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Пульс</span>
            <strong style={{ color: LEVEL_COLORS[data[hoverIdx].level || levelByValue(data[hoverIdx].value)] }}>
              {Math.round(data[hoverIdx].value)}%
            </strong>
          </div>
          {tooltipExtra && tooltipExtra(data[hoverIdx], hoverIdx)}
          {interactive && (
            <div style={{
              marginTop: 8,
              paddingTop: 6,
              borderTop: '1px solid var(--border)',
              fontSize: 11,
              color: '#E5C76B',
            }}>
              Клик — открыть курсы
            </div>
          )}
        </div>
      )}
    </div>
  );
}
