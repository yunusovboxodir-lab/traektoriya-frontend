/**
 * Кубок NMEDOV 2026 — Виджет лидерборда верификации продуктов.
 *
 * Видим только для admin/superadmin/commercial_dir/regional_manager.
 * Показывает:
 *  • Top-3 РМ за текущий месяц с медалями
 *  • Свой ранг отдельной строкой (если не в top-3)
 *  • Прогресс по верификации (сколько ещё осталось)
 *
 * Клик на виджет → /products?unverified=1 (открыть unverified-фильтр).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, type CupLeaderboardResponse } from '../../api/products';
import { useAuthStore } from '../../stores/authStore';

const VERIFY_ROLES = new Set(['superadmin', 'admin', 'commercial_dir', 'regional_manager']);

function rankBadge(rank: number): { text: string; className: string } {
  if (rank === 1) return { text: '🥇', className: 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md' };
  if (rank === 2) return { text: '🥈', className: 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-sm' };
  if (rank === 3) return { text: '🥉', className: 'bg-gradient-to-br from-orange-300 to-orange-400 text-white shadow-sm' };
  return { text: `#${rank}`, className: 'bg-gray-100 text-gray-600' };
}

export function CupVerifyLeaderboardWidget() {
  const user = useAuthStore((s) => s.user);
  const visible = !!user && VERIFY_ROLES.has(user.role);

  const [data, setData] = useState<CupLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(false);
    productsApi
      .getCupLeaderboard()
      .then((res) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [visible]);

  if (!visible) return null;

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-base font-semibold text-gray-900 mb-2">🏆 Кубок NMEDOV 2026</h3>
        <p className="text-sm text-gray-500">Лидерборд временно недоступен.</p>
      </div>
    );
  }

  const top3 = data.entries.slice(0, 3);
  const myRank = data.current_user_rank;
  const myPoints = data.current_user_points ?? 0;
  const myEntry = data.entries.find((e) => e.user_id === user?.id);
  const myInTop3 = myRank != null && myRank <= 3;

  const monthLabel = new Date(data.period_year, data.period_month - 1, 1).toLocaleDateString(
    'ru-RU',
    { month: 'long', year: 'numeric' },
  );

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Header — золотой gradient */}
      <Link
        to="/products?unverified=1"
        className="block bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-5 py-4 hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              🏆 Кубок NMEDOV 2026
            </h2>
            <p className="text-xs text-white/80 mt-0.5 capitalize">
              Верификация продуктов · {monthLabel}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{data.total_unverified}</div>
            <div className="text-[10px] text-white/80 uppercase tracking-wide">осталось</div>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Свой ранг — top-bar */}
        {myRank ? (
          <div
            className={`rounded-xl p-3 border ${
              myInTop3
                ? 'bg-amber-50 border-amber-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Ваше место</p>
                <p className="text-lg font-bold text-gray-900">
                  #{myRank} <span className="text-sm font-normal text-gray-500">из {data.entries.length || '—'}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Баллы</p>
                <p className="text-lg font-bold text-amber-600">⭐ {myPoints}</p>
              </div>
            </div>
            {myEntry && (
              <p className="mt-1 text-xs text-gray-600">
                Подтверждено: <span className="font-semibold">{myEntry.verifications_count}</span>{' '}
                {myEntry.verifications_count === 1 ? 'продукт' : 'продуктов'} в этом месяце
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-3 bg-blue-50 border border-blue-200 text-center">
            <p className="text-sm font-medium text-blue-900">Ещё не подтвердили ни одного продукта</p>
            <Link
              to="/products?unverified=1"
              className="inline-flex items-center gap-1 mt-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Начать верификацию →
            </Link>
          </div>
        )}

        {/* Top-3 */}
        {top3.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Топ-3 за месяц
            </p>
            <div className="space-y-2">
              {top3.map((entry) => {
                const isMe = entry.user_id === user?.id;
                const badge = rankBadge(entry.rank);
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      isMe
                        ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200'
                        : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold ${badge.className}`}
                    >
                      {badge.text}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {entry.user_name}
                        {isMe && <span className="ml-1.5 text-xs text-amber-600">(вы)</span>}
                      </p>
                      <p className="text-xs text-gray-500">
                        {entry.verifications_count}{' '}
                        {entry.verifications_count === 1 ? 'верификация' : 'верификаций'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-amber-600">⭐ {entry.total_points}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            Никто ещё не подтвердил ни одного продукта в этом месяце
          </div>
        )}

        {/* Footer CTA */}
        <Link
          to="/products?unverified=1"
          className="block w-full text-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all"
        >
          Подтвердить продукты (+5 за каждый)
        </Link>
      </div>
    </div>
  );
}
