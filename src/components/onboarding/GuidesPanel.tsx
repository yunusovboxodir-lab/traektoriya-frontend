/**
 * GuidesPanel — «Гид по платформе»: ряд золотых бонусных узлов-инструктажей
 * (онбординг, пункт 2 фаза C). Появляются на Карте обучения по мере роста тира
 * Мощи; клик открывает лёгкий тур-карточки (GuideTour).
 *
 * Активно только при включённом прогрессивном раскрытии и для полевых ролей.
 * Пройденные гиды помечаются галочкой (localStorage по пользователю).
 */
import { useState } from 'react';
import { useScopeStore } from '../../stores/scopeStore';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore } from '../../stores/langStore';
import {
  PROGRESSIVE_DISCLOSURE_ENABLED,
  GATING_ROLES,
} from '../../config/progressiveDisclosure';
import { guidesUpToTier, type PlatformGuide } from '../../config/platformGuides';
import { GuideTour } from './GuideTour';

export function GuidesPanel() {
  const lang = useLangStore((s) => s.lang);
  const role = useAuthStore((s) => s.user?.role);
  const userId = useAuthStore((s) => s.user?.id ?? s.user?.employee_id ?? 'anon');
  const userTier = useScopeStore((s) => s.userTier);
  const [active, setActive] = useState<PlatformGuide | null>(null);
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`trj-guides-seen-${userId}`);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch { return new Set(); }
  });

  if (!PROGRESSIVE_DISCLOSURE_ENABLED) return null;
  if (!role || !GATING_ROLES.includes(role)) return null;

  const guides = guidesUpToTier(userTier);
  if (!guides.length) return null;

  const markSeen = (id: string) => {
    setSeen((prev) => {
      const next = new Set(prev).add(id);
      try { localStorage.setItem(`trj-guides-seen-${userId}`, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const unseenCount = guides.filter((g) => !seen.has(g.id)).length;

  return (
    // Разгрузка экрана (UX 2026-07-11): ряд чипов свёрнут в нативный <details>.
    // Пока есть непройденные гиды — открыт по умолчанию; все пройдены — одна строка.
    // expanded===null → дефолт от unseenCount; после ручного клика — выбор юзера
    // (иначе управляемый open захлопывал бы блок при ре-рендере markSeen).
    <details
      open={expanded ?? unseenCount > 0}
      onToggle={(e) => setExpanded((e.target as HTMLDetailsElement).open)}
      style={{ padding: '0 14px', marginBottom: 6 }}
    >
      <summary className="guides-summary" style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        fontSize: 12, fontWeight: 600, letterSpacing: '0.12em',
        color: 'var(--text-muted)', textTransform: 'uppercase',
        cursor: 'pointer', listStyle: 'none', width: 'fit-content',
        minHeight: 24,
      }}>
        <span aria-hidden="true">🎁</span>
        {lang === 'uz' ? 'Platforma bo‘yicha gid' : 'Гид по платформе'}
        <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.02em', textTransform: 'none' }}>
          {unseenCount > 0
            ? `· ${guides.length - unseenCount}/${guides.length}`
            : `· ${guides.length} ✓`}
        </span>
        <span aria-hidden="true" style={{ fontSize: 12 }}>{'▾'}</span>
      </summary>

      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {guides.map((g) => {
          const done = seen.has(g.id);
          return (
            <button
              key={g.id}
              onClick={() => setActive(g)}
              style={{
                flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 13px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: 'var(--color-rm-bg)',
                border: `1px solid ${done ? 'var(--border)' : 'var(--color-rm-border)'}`,
                // opacity на тексте запрещён — «пройдено» показываем токеном цвета
                color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: 17, lineHeight: 1 }} aria-hidden="true">{g.icon}</span>
              {g.label[lang]}
              {done && <span style={{ color: 'var(--success)', fontSize: 12 }} aria-hidden="true">{'✓'}</span>}
            </button>
          );
        })}
      </div>

      {active && (
        <GuideTour
          guide={active}
          onClose={() => { markSeen(active.id); setActive(null); }}
        />
      )}
    </details>
  );
}
