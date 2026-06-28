/**
 * SectionUnlockChest — «призовой сундук» разблокировки разделов (онбординг, пункт 2 фаза B).
 *
 * Когда у полевого сотрудника (ТП/СВ/РМ) растёт тир Мощи и открываются новые
 * разделы, показываем анимацию сундука + пояснение «зачем раздел и как им
 * пользоваться» (PAGE_UNLOCKS). Срабатывает один раз на каждый рост тира
 * (запоминаем последний «отпразднованный» тир в localStorage по пользователю).
 *
 * Активно только при включённом прогрессивном раскрытии (флаг/оверрайд) и для
 * гейтящихся ролей. Монтируется глобально в App.tsx.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScopeStore } from '../../stores/scopeStore';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore } from '../../stores/langStore';
import { NAV_REGISTRY } from '../../config/navigation';
import { powerApi } from '../../api/power';
import {
  PROGRESSIVE_DISCLOSURE_ENABLED,
  GATING_ROLES,
  TIER_RANK,
  TIER_LABELS,
  PAGE_UNLOCKS,
  pagesUnlockedAtTier,
  type Tier,
} from '../../config/progressiveDisclosure';

const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'platinum'];

function pathFor(pageKey: string): string {
  return NAV_REGISTRY.find((d) => d.pageKey === pageKey)?.path ?? '/dashboard';
}

export function SectionUnlockChest() {
  const navigate = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);
  const userTier = useScopeStore((s) => s.userTier);

  const [pages, setPages] = useState<string[]>([]); // разделы для показа
  const [opened, setOpened] = useState(false);      // сундук открыт (анимация)
  const [bonus, setBonus] = useState(0);            // начисленный бонус Мощи

  // Открыть сундук: начисляем бонус Мощи за тир (идемпотентно на бэке).
  const openChest = () => {
    setOpened(true);
    powerApi.claimTierBonus()
      .then((r) => setBonus(r.data?.granted ?? 0))
      .catch(() => { /* бонус необязателен для показа сундука */ });
  };

  const role = user?.role;
  const userId = user?.id ?? user?.employee_id ?? 'anon';
  const seenKey = `trj-unlock-tier-${userId}`;

  useEffect(() => {
    if (!PROGRESSIVE_DISCLOSURE_ENABLED) return;
    if (!role || !GATING_ROLES.includes(role)) return;
    if (!userTier) return;

    let lastSeen: Tier | null = null;
    try {
      const v = localStorage.getItem(seenKey);
      if (v === 'bronze' || v === 'silver' || v === 'gold' || v === 'platinum') lastSeen = v;
    } catch { /* ignore */ }

    // Первый вход: фиксируем базовый тир без празднования.
    if (lastSeen == null) {
      try { localStorage.setItem(seenKey, userTier); } catch { /* ignore */ }
      return;
    }

    if (TIER_RANK[userTier] > TIER_RANK[lastSeen]) {
      const newly = TIER_ORDER
        .filter((t) => TIER_RANK[t] > TIER_RANK[lastSeen!] && TIER_RANK[t] <= TIER_RANK[userTier])
        .flatMap(pagesUnlockedAtTier)
        .filter((p) => PAGE_UNLOCKS[p]); // на всякий случай
      try { localStorage.setItem(seenKey, userTier); } catch { /* ignore */ }
      if (newly.length) {
        setOpened(false);
        setPages(newly);
      }
    }
  }, [userTier, role, seenKey]);

  const tierLabel = useMemo(
    () => (userTier ? TIER_LABELS[userTier][lang] : ''),
    [userTier, lang],
  );

  if (!pages.length) return null;

  const close = () => { setPages([]); setOpened(false); setBonus(0); };
  const go = (pageKey: string) => {
    close();
    navigate(pathFor(pageKey));
  };

  return (
    <div
      data-screenshot-ignore="true"
      onClick={close}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <style>{`
        @keyframes chestShake { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-7deg)} 40%{transform:rotate(7deg)} 60%{transform:rotate(-5deg)} 80%{transform:rotate(5deg)} }
        @keyframes chestPop { 0%{transform:scale(0.4);opacity:0} 60%{transform:scale(1.12)} 100%{transform:scale(1);opacity:1} }
        @keyframes cardRise { 0%{transform:translateY(14px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes glowPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        .chest-shake { animation: chestShake 1.1s ease-in-out infinite; }
        .chest-pop { animation: chestPop 0.5s cubic-bezier(0.2,0.7,0.2,1.3) both; }
        .chest-card { animation: cardRise 0.45s ease both; }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        className="chest-pop"
        style={{
          width: '100%', maxWidth: 380,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '24px 22px 20px',
          boxShadow: 'var(--shadow-md)', textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Золотой ореол сверху */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle, var(--color-rm-bg), transparent 70%)',
          animation: 'glowPulse 2s ease-in-out infinite', pointerEvents: 'none',
        }} />

        {!opened ? (
          <>
            <div className="chest-shake" style={{ fontSize: 72, lineHeight: 1, margin: '6px 0 4px' }} aria-hidden="true">🎁</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 19,
              color: 'var(--text-primary)', marginBottom: 6,
            }}>
              {lang === 'uz' ? 'Yangi daraja!' : 'Новый уровень!'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>
              {lang === 'uz'
                ? `«${tierLabel}» darajasiga yetding — sovg‘a seni kutmoqda`
                : `Ты достиг уровня «${tierLabel}» — тебя ждёт награда`}
            </div>
            <button
              onClick={openChest}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)',
                border: 'none', cursor: 'pointer',
                background: 'var(--color-rm)', color: 'var(--text-inverse)',
                fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15,
              }}
            >
              {lang === 'uz' ? 'Sandiqni ochish' : 'Открыть сундук'}
            </button>
          </>
        ) : (
          <>
            <div className="chest-pop" style={{ fontSize: 60, lineHeight: 1, margin: '2px 0 6px' }} aria-hidden="true">✨</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
              color: 'var(--text-primary)', marginBottom: 4,
            }}>
              {pages.length > 1
                ? (lang === 'uz' ? 'Yangi bo‘limlar ochildi!' : 'Открылись новые разделы!')
                : (lang === 'uz' ? 'Yangi bo‘lim ochildi!' : 'Открылся новый раздел!')}
            </div>
            {bonus > 0 && (
              <div
                className="chest-pop"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 'var(--radius-full)',
                  background: 'var(--color-rm-bg)', border: '1px solid var(--color-rm-border)',
                  color: 'var(--color-rm)', fontWeight: 700, fontSize: 14, marginBottom: 4,
                }}
              >
                <span aria-hidden="true">⚡</span>
                +{bonus} {lang === 'uz' ? 'Kuch' : 'Мощи'}
              </div>
            )}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
              margin: '14px 0 18px', textAlign: 'left',
            }}>
              {pages.map((p, i) => {
                const info = PAGE_UNLOCKS[p];
                return (
                  <div
                    key={p}
                    className="chest-card"
                    style={{
                      animationDelay: `${i * 0.08}s`,
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)', padding: '12px 14px',
                    }}
                  >
                    <div style={{ fontSize: 26, lineHeight: 1.1 }} aria-hidden="true">{info.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {info.label[lang]}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        {info.desc[lang]}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => go(pages[0])}
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: 'pointer',
                  background: 'var(--color-rm)', color: 'var(--text-inverse)',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14,
                }}
              >
                {lang === 'uz' ? 'Ochish' : 'Перейти'}
              </button>
              <button
                onClick={close}
                style={{
                  padding: '11px 16px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)', cursor: 'pointer',
                  background: 'transparent', color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14,
                }}
              >
                {lang === 'uz' ? 'Keyinroq' : 'Позже'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
