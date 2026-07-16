/**
 * useLearningHero — единый источник РЕАЛЬНЫХ данных для hero-карточки карты
 * обучения (мобильный HeroStrip + десктопный HeroPanel).
 *
 * Раньше эти карточки показывали захардкоженные фейковые цифры (xp=2480,
 * streak=17, лига «ЗОЛОТО II», ранг #7/142) с мелкой меткой «демо» — это
 * подрывало доверие к платформе, чья миссия — честная связь обучение→KPI.
 * Теперь всё берётся из API:
 *   - Мощь + тир + серия ← GET /power/my
 *   - Ранг ученика       ← GET /learning/leaderboard (позиция my_rank)
 *
 * Правила честности:
 *   - Пока грузится — visible=true, но loading=true (потребитель рисует скелетон).
 *   - Ошибка запроса Мощи — hidden=true (карточка целиком не показывается).
 *   - Юзера нет в лидерборде (my_rank ≤ 0) — rank=null (потребитель рисует «—»,
 *     НЕ выдумывает число).
 *   - Роли без личного учебного прогресса (admin/superadmin/commercial_dir) —
 *     hidden=true.
 *
 * Демо-аккаунт seller1: интерцептор подменяет /power/my (Мощь 4850/gold) —
 * это штатно, хук просто использует API и у seller1 покажет мок.
 */
import { useEffect, useState } from 'react';
import { powerApi } from '../api/power';
import type { PowerResponse } from '../api/power';
import { learningApi } from '../api/learning';
import { useAuthStore } from '../stores/authStore';

// Роли, у которых есть собственный учебный прогресс (для остальных — hero скрыт).
const SELF_LEARNING_ROLES = new Set(['sales_rep', 'supervisor', 'regional_manager']);

export interface LearningHeroData {
  /** Идёт первичная загрузка — потребитель рисует скелетон/пусто, не фейк. */
  loading: boolean;
  /** Карточку показывать не нужно (роль без прогресса или ошибка Мощи). */
  hidden: boolean;
  /** Накопительная Мощь (0..∞). null пока грузится. */
  power: number | null;
  /** Тир: bronze/silver/gold/platinum. null пока грузится. */
  tier: PowerResponse['tier'] | null;
  /** Текущая серия активности, дней. null пока грузится. */
  streakDays: number | null;
  /** Место в рейтинге обучения. null = юзера нет в лидерборде (показать «—»). */
  rank: number | null;
  /** Всего в группе рейтинга (для отображения «#N из M»). null если неизвестно. */
  totalInGroup: number | null;
}

export function useLearningHero(): LearningHeroData {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const hasSelfLearning = !!role && SELF_LEARNING_ROLES.has(role);

  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [power, setPower] = useState<number | null>(null);
  const [tier, setTier] = useState<PowerResponse['tier'] | null>(null);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [totalInGroup, setTotalInGroup] = useState<number | null>(null);

  useEffect(() => {
    // Для ролей без собственного прогресса не грузим ничего.
    if (!hasSelfLearning) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrored(false);

    // Мощь — обязательна (её ошибка скрывает карточку). Рейтинг — best-effort
    // (его отсутствие просто даёт rank=null, «—», без скрытия карточки).
    Promise.allSettled([powerApi.getMyPower(), learningApi.getLeaderboard(20)])
      .then(([powerRes, lbRes]) => {
        if (cancelled) return;
        if (powerRes.status === 'fulfilled') {
          const p = powerRes.value.data;
          setPower(p.power);
          setTier(p.tier);
          setStreakDays(p.current_streak_days);
        } else {
          setErrored(true);
        }
        if (lbRes.status === 'fulfilled') {
          const lb = lbRes.value.data;
          // my_rank ≤ 0 → юзера нет в зачёте → показываем «—», не выдумываем.
          setRank(lb.my_rank && lb.my_rank > 0 ? lb.my_rank : null);
          setTotalInGroup(lb.total_in_group ?? null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasSelfLearning]);

  return {
    loading,
    hidden: !hasSelfLearning || errored,
    power,
    tier,
    streakDays,
    rank,
    totalInGroup,
  };
}

/** Локализованная подпись тира Мощи (RU/UZ). */
export function tierLabel(tier: PowerResponse['tier'] | null, lang: 'ru' | 'uz'): string {
  const ru: Record<string, string> = {
    bronze: 'Бронза',
    silver: 'Серебро',
    gold: 'Золото',
    platinum: 'Платина',
  };
  const uz: Record<string, string> = {
    bronze: 'Bronza',
    silver: 'Kumush',
    gold: 'Oltin',
    platinum: 'Platina',
  };
  if (!tier) return '';
  return (lang === 'uz' ? uz : ru)[tier] || tier;
}
