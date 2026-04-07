/**
 * RadarChart — SVG-радар для визуализации Пульса по 8 компетенциям.
 *
 * Рисует октагон с осями, заливкой прогресса и метками.
 * Не зависит от внешних библиотек — чистый SVG.
 */
import { useMemo } from 'react';

export interface RadarDataPoint {
  label: string;
  value: number;   // 0-100
  level?: string;  // trainee/practitioner/expert/master
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
}

// Цвета уровней
const LEVEL_COLORS: Record<string, string> = {
  trainee: '#EF4444',      // красный
  practitioner: '#F59E0B',  // жёлтый
  expert: '#3B82F6',        // синий
  master: '#10B981',        // зелёный
};

export function RadarChart({
  data,
  size = 320,
  showValues = true,
  fillColor = 'rgba(59, 130, 246, 0.25)',
  strokeColor = '#3B82F6',
}: RadarChartProps) {
  const n = data.length;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.35; // радиус октагона
  const labelR = size * 0.47; // радиус для меток

  // Углы для каждой оси (начинаем сверху, по часовой)
  const angles = useMemo(
    () => data.map((_, i) => (i * 2 * Math.PI) / n - Math.PI / 2),
    [n],
  );

  // Точка на окружности
  const polarToXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  // Контурные линии (сетка) для 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.50, 0.75, 1.0];

  // Полигон данных
  const dataPoints = data.map((d, i) => {
    const r = (d.value / 100) * maxR;
    return polarToXY(angles[i], r);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="mx-auto"
    >
      {/* Фон */}
      <circle cx={cx} cy={cy} r={maxR + 2} fill="#f9fafb" stroke="none" />

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
            stroke="#e5e7eb"
            strokeWidth={level === 1 ? 1.5 : 0.5}
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
            stroke="#d1d5db"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Заливка данных */}
      <path d={dataPath} fill={fillColor} stroke={strokeColor} strokeWidth={2} />

      {/* Точки данных */}
      {dataPoints.map((p, i) => {
        const levelColor = data[i].level ? LEVEL_COLORS[data[i].level!] || strokeColor : strokeColor;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={levelColor}
            stroke="white"
            strokeWidth={2}
          />
        );
      })}

      {/* Метки компетенций */}
      {data.map((d, i) => {
        const pos = polarToXY(angles[i], labelR);
        // Определяем выравнивание текста
        let anchor: 'start' | 'end' | 'middle' = 'middle';
        if (Math.cos(angles[i]) > 0.3) anchor = 'start';
        if (Math.cos(angles[i]) < -0.3) anchor = 'end';

        // Сокращаем длинные названия
        const shortLabel = d.label.length > 16 ? d.label.slice(0, 14) + '...' : d.label;
        const levelColor = d.level ? LEVEL_COLORS[d.level] || '#6b7280' : '#6b7280';

        return (
          <g key={i}>
            <text
              x={pos.x}
              y={pos.y - (showValues ? 6 : 0)}
              textAnchor={anchor}
              dominantBaseline="central"
              className="text-[10px] fill-gray-600 font-medium"
              style={{ fontSize: '10px' }}
            >
              {shortLabel}
            </text>
            {showValues && (
              <text
                x={pos.x}
                y={pos.y + 8}
                textAnchor={anchor}
                dominantBaseline="central"
                className="font-bold"
                style={{ fontSize: '11px', fill: levelColor }}
              >
                {Math.round(d.value)}%
              </text>
            )}
          </g>
        );
      })}

      {/* Центральный текст — убрано, будет отдельно */}
    </svg>
  );
}
