/**
 * PowerBadge — компактный индикатор «Мощь игрока» для верхней полосы (StatusBar).
 *
 * Переехал сюда из большого виджета на Главной (решение PO 2026-06-25): одна строка
 * между логотипом и переключателем языка, видна всегда. По клику → /kpi.
 *
 * Данные кэшируются на уровне модуля (TTL 60с), чтобы не дёргать API при каждой
 * навигации (StatusBar ремонтируется на каждой странице).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { powerApi, type PowerResponse } from '../../api/power';
import { useLangStore } from '../../stores/langStore';

const TIER_LABEL: Record<string, { ru: string; uz: string; color: string }> = {
  bronze:   { ru: 'Бронза',  uz: 'Bronza',  color: 'var(--color-rm, #c08a4a)' },
  silver:   { ru: 'Серебро', uz: 'Kumush',  color: 'var(--text-1, #b8c0cf)' },
  gold:     { ru: 'Золото',  uz: 'Oltin',   color: 'var(--warning, #f2c660)' },
  platinum: { ru: 'Платина', uz: 'Platina', color: 'var(--color-tp, #6cc6ff)' },
};

// Модульный кэш — один запрос на сессию (TTL), общий для всех маунтов StatusBar.
let cache: { data: PowerResponse; ts: number } | null = null;
let inflight: Promise<PowerResponse> | null = null;
const TTL = 60_000;

function loadPower(): Promise<PowerResponse> {
  if (cache && Date.now() - cache.ts < TTL) return Promise.resolve(cache.data);
  if (inflight) return inflight;
  inflight = powerApi
    .getMyPower()
    .then((res) => {
      cache = { data: res.data, ts: Date.now() };
      inflight = null;
      return res.data;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
}

/** Сбросить кэш мощи (например, после действий, меняющих счёт). */
export function invalidatePowerBadge() {
  cache = null;
}

export function PowerBadge() {
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();
  const [data, setData] = useState<PowerResponse | null>(cache?.data ?? null);

  useEffect(() => {
    let alive = true;
    loadPower()
      .then((d) => { if (alive) setData(d); })
      .catch(() => { /* тихо — бейдж просто не показываем */ });
    return () => { alive = false; };
  }, []);

  if (!data) return null;

  const tier = TIER_LABEL[data.tier] || TIER_LABEL.bronze;
  const isUz = lang === 'uz';

  return (
    <button
      type="button"
      onClick={() => navigate('/kpi')}
      title={isUz ? 'Mening kuchim — batafsil' : 'Моя мощь — подробнее'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 30,
        padding: '0 10px',
        marginRight: 12,
        background: 'oklch(0.20 0.03 240 / 0.45)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
        whiteSpace: 'nowrap',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brass)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>⚡</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)', letterSpacing: '0.02em' }}>
        {data.power.toLocaleString('ru-RU')}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: tier.color,
          padding: '2px 7px',
          borderRadius: 5,
          border: `1px solid ${tier.color}`,
          opacity: 0.95,
        }}
        // Скрываем подпись тира на узких экранах — остаётся ⚡ + число.
        className="power-badge-tier"
      >
        {isUz ? tier.uz : tier.ru}
      </span>
    </button>
  );
}
