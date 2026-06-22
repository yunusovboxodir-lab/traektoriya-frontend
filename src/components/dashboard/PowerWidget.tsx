import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { powerApi, type PowerResponse } from '../../api/power';
import { useLangStore } from '../../stores/langStore';
import { nextUnlocks } from '../../config/progressiveDisclosure';

// Тиры — на дизайн-токенах (как в StreakAchievementWidget).
const TIER_STYLES: Record<string, { bg: string; text: string; ring: string; label: { ru: string; uz: string } }> = {
  bronze:   { bg: 'var(--color-rm-bg)', text: 'var(--color-rm)',     ring: 'var(--color-rm-border)', label: { ru: 'Бронза', uz: 'Bronza' } },
  silver:   { bg: 'var(--bg-elevated)', text: 'var(--text-primary)', ring: 'var(--border-strong)',   label: { ru: 'Серебро', uz: 'Kumush' } },
  gold:     { bg: 'var(--warning-bg)',  text: 'var(--warning)',      ring: 'rgba(251,191,36,0.3)',   label: { ru: 'Золото', uz: 'Oltin' } },
  platinum: { bg: 'var(--color-tp-bg)', text: 'var(--color-tp)',     ring: 'var(--color-tp-border)', label: { ru: 'Платина', uz: 'Platina' } },
};

interface Component { icon: string; label: { ru: string; uz: string }; value: number; bg: string; text: string; ring: string; }

export function PowerWidget() {
  const lang = useLangStore((s) => s.lang);
  const [data, setData] = useState<PowerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    powerApi.getMyPower()
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] p-6 animate-pulse space-y-4">
        <div className="h-16 w-40 rounded-xl bg-[var(--bg-elevated)]" />
        <div className="h-2 rounded-full bg-[var(--bg-elevated)]" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-lg bg-[var(--bg-elevated)]" />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-5 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {lang === 'uz' ? 'Kuch yuklanmadi' : 'Мощь не загружена'}
      </div>
    );
  }

  const tier = TIER_STYLES[data.tier] || TIER_STYLES.bronze;
  // Прогресс до следующего тира (визуально): доля «дошли» в текущем интервале.
  const span = data.power + data.to_next_tier > 0 && data.to_next_tier > 0
    ? Math.round(((data.power) / (data.power + data.to_next_tier)) * 100)
    : 100;

  const b = data.breakdown;
  // Бизнес — доминанта (первый, акцент ТП). Остальные — усилители.
  const components: Component[] = [
    { icon: '\u{1F4BC}', label: { ru: 'Бизнес', uz: 'Biznes' },      value: b.business,     bg: 'var(--color-tp-bg)', text: 'var(--color-tp)', ring: 'var(--color-tp-border)' },
    { icon: '\u{1F4DA}', label: { ru: 'Обучение', uz: "O'qish" },    value: b.learning,     bg: 'var(--info-bg)',     text: 'var(--info)',     ring: 'rgba(96,165,250,0.3)' },
    { icon: '\u{1F3C5}', label: { ru: 'Достижения', uz: 'Yutuqlar' }, value: b.achievements, bg: 'var(--warning-bg)',  text: 'var(--warning)',  ring: 'rgba(251,191,36,0.3)' },
    { icon: '\u{1F525}', label: { ru: 'Серия', uz: 'Seriya' },        value: b.streak,       bg: 'var(--success-bg)',  text: 'var(--success)',  ring: 'rgba(74,222,128,0.3)' },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 sm:px-6 border-b border-[var(--border)] flex items-center justify-between">
        <h2
          className="text-sm font-semibold flex items-center gap-2 uppercase"
          style={{ color: 'var(--color-tp)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em' }}
        >
          <span className="text-base">{'⚡'}</span>
          {lang === 'uz' ? 'Mening kuchim' : 'Моя мощь'}
        </h2>
        <Link
          to="/kpi"
          className="text-xs font-medium hover:opacity-80 transition-opacity"
          style={{ color: 'var(--color-tp)' }}
        >
          {lang === 'uz' ? 'Batafsil' : 'Подробнее'} &rarr;
        </Link>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {/* Большое число + тир */}
        <div className="flex items-end justify-between gap-4 mb-3 animate-fadeIn">
          <div>
            <div
              className="font-bold leading-none"
              style={{ fontSize: '2.75rem', color: 'var(--color-tp)', fontFamily: 'var(--font-display, var(--font-body))' }}
            >
              {data.power.toLocaleString('ru-RU')} <span className="text-2xl">{'⚡'}</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {lang === 'uz' ? 'Umumiy kuch' : 'Суммарная мощь'}
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1"
            style={{ background: tier.bg, color: tier.text, borderColor: tier.ring }}
          >
            {tier.label[lang === 'uz' ? 'uz' : 'ru']}
          </span>
        </div>

        {/* Прогресс до следующего тира */}
        <div className="w-full h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--bg-elevated)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${span}%`, background: 'var(--color-tp)', transition: 'width 0.8s ease' }}
          />
        </div>
        <p className="mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          {data.next_tier
            ? (lang === 'uz'
                ? `${TIER_STYLES[data.next_tier].label.uz}gacha: ${data.to_next_tier.toLocaleString('ru-RU')} ⚡`
                : `До ранга «${TIER_STYLES[data.next_tier].label.ru}»: ${data.to_next_tier.toLocaleString('ru-RU')} ⚡`)
            : (lang === 'uz' ? 'Eng yuqori daraja!' : 'Максимальный ранг!')}
        </p>

        {/* Скоро откроется (curiosity-gap, под флагом прогрессивного раскрытия) */}
        {(() => {
          const upcoming = nextUnlocks(data.tier, lang === 'uz' ? 'uz' : 'ru').slice(0, 2);
          if (upcoming.length === 0) return null;
          return (
            <div
              className="mb-3 rounded-lg px-3 py-2 text-xs ring-1"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{lang === 'uz' ? 'Tez orada: ' : 'Скоро откроется: '}</span>
              {upcoming.map((u, i) => (
                <span key={u.page}>
                  {i > 0 && ' · '}
                  <span style={{ color: 'var(--color-tp)' }}>🔒 {u.page}</span>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>({u.tier})</span>
                </span>
              ))}
            </div>
          );
        })()}

        {/* Разбивка (бизнес-доминанта первой) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {components.map((c) => (
            <div
              key={c.label.ru}
              className="rounded-xl p-2.5 text-center ring-1"
              style={{ background: c.bg, borderColor: c.ring }}
            >
              <span className="text-lg">{c.icon}</span>
              <p className="text-base font-bold mt-0.5" style={{ color: c.text }}>
                {c.value.toLocaleString('ru-RU')}
              </p>
              <p className="text-[10px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
                {c.label[lang === 'uz' ? 'uz' : 'ru']}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
