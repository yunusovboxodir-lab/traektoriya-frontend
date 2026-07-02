/**
 * PowerBadge — компактный индикатор «Мощь игрока» для верхней полосы (StatusBar).
 *
 * Переехал сюда из большого виджета на Главной (решение PO 2026-06-25): одна строка
 * между логотипом и переключателем языка, видна всегда. Бейдж минимальный
 * (⚡ число + тир); по наведению (десктоп) или тапу (мобайл) открывается поповер
 * с разбивкой мощи (Бизнес/Обучение/Достижения/Серия) и прогрессом до след. тира.
 *
 * Разбивка приходит в том же запросе getMyPower (поле breakdown) — лишней нагрузки
 * на сервер нет. Данные кэшируются на уровне модуля (TTL 60с).
 */
import { useEffect, useRef, useState } from 'react';
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
  const isUz = lang === 'uz';
  const [data, setData] = useState<PowerResponse | null>(cache?.data ?? null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    loadPower()
      .then((d) => { if (alive) setData(d); })
      .catch(() => { /* тихо — бейдж просто не показываем */ });
    return () => { alive = false; };
  }, []);

  // Закрытие поповера: клик вне / Escape
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!data) return null;

  const tier = TIER_LABEL[data.tier] || TIER_LABEL.bronze;
  const next = data.next_tier ? TIER_LABEL[data.next_tier] : null;
  const span = data.to_next_tier > 0
    ? Math.round((data.power / (data.power + data.to_next_tier)) * 100)
    : 100;

  const b = data.breakdown;
  const rows = [
    { icon: '💼', label: isUz ? 'Biznes' : 'Бизнес',      value: b.business,     color: 'var(--color-tp, #6cc6ff)' },
    { icon: '📚', label: isUz ? "O'qish" : 'Обучение',    value: b.learning,     color: 'var(--info, #60a5fa)' },
    { icon: '🏅', label: isUz ? 'Yutuqlar' : 'Достижения', value: b.achievements, color: 'var(--warning, #f2c660)' },
    { icon: '🔥', label: isUz ? 'Seriya' : 'Серия',        value: b.streak,       color: 'var(--success, #4ade80)' },
  ];

  return (
    <div
      ref={wrapRef}
      className="power-badge-wrap"
      style={{ position: 'relative', marginRight: 12, minWidth: 0, flexShrink: 1 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={isUz ? 'Mening kuchim' : 'Моя мощь'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 30,
          padding: '0 8px 0 10px',
          background: open ? 'var(--bg-elevated)' : 'var(--bg-card)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: open ? 'var(--brass)' : 'var(--line)',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
          whiteSpace: 'nowrap',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>⚡</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)', letterSpacing: '0.02em' }}>
          {data.power.toLocaleString('ru-RU')}
        </span>
        <span
          className="power-badge-tier"
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: tier.color, padding: '2px 7px', borderRadius: 5,
            border: `1px solid ${tier.color}`, opacity: 0.95,
          }}
        >
          {isUz ? tier.uz : tier.ru}
        </span>
        {/* Affordance-сигнал кликабельности (Кодекс 11_accessibility): шеврон,
            поворачивается при раскрытом поповере — намёк, что бейдж раскрывает разбивку. */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            flexShrink: 0,
            color: 'var(--text-2, #8a93a3)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
          aria-hidden="true"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 200,
            width: 240,
            background: 'var(--bg-1, #11161f)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            boxShadow: '0 12px 32px -8px rgba(0,0,0,0.6)',
            padding: 12,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {/* Заголовок: итог + тир */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-0)' }}>
              ⚡ {data.power.toLocaleString('ru-RU')}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tier.color }}>
              {isUz ? tier.uz : tier.ru}
            </span>
          </div>

          {/* Прогресс до следующего тира */}
          <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ height: '100%', width: `${span}%`, background: next ? next.color : tier.color, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-2, #8a93a3)', marginBottom: 12 }}>
            {next
              ? (isUz
                  ? `${next.uz}gacha: ${data.to_next_tier.toLocaleString('ru-RU')} ⚡`
                  : `До «${next.ru}»: ${data.to_next_tier.toLocaleString('ru-RU')} ⚡`)
              : (isUz ? 'Eng yuqori daraja!' : 'Максимальный ранг!')}
          </div>

          {/* Разбивка */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map((r) => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, width: 18, textAlign: 'center' }}>{r.icon}</span>
                <span style={{ fontSize: 11, color: 'var(--text-1, #aeb4c2)', flex: 1 }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>
                  {r.value.toLocaleString('ru-RU')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
