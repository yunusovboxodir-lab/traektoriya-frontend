/**
 * PulseWidget — мини-радар Пульса для Главной страницы.
 *
 * Показывает компактный радар + общий % + уровень.
 * Кликабельный — переходит на /competencies (полный Pulse).
 * Для админов: показывает dropdown выбора роли.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useLangStore, useT } from '../../stores/langStore';
import { pulseApi, type UserPulse } from '../../api/competencies';
import { RadarChart, type RadarDataPoint } from '../competencies/RadarChart';

const LEVEL_STYLES: Record<string, string> = {
  trainee: 'bg-red-100 text-red-700',
  practitioner: 'bg-yellow-100 text-yellow-700',
  expert: 'bg-blue-100 text-blue-700',
  master: 'bg-green-100 text-green-700',
};

const PULSE_ROLES = [
  { value: 'regional_manager', label: { ru: 'РМ', uz: 'RM' } },
  { value: 'supervisor', label: { ru: 'СВ', uz: 'SV' } },
  { value: 'sales_rep', label: { ru: 'ТП', uz: 'TP' } },
];

const ADMIN_ROLES = ['superadmin', 'admin', 'commercial_dir'];

export function PulseWidget() {
  const navigate = useNavigate();
  const t = useT();
  const lang = useLangStore((s) => s.lang);
  const user = useAuthStore((s) => s.user);

  const [pulse, setPulse] = useState<UserPulse | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = ADMIN_ROLES.includes(user?.role || '');
  const [selectedRole, setSelectedRole] = useState<string>(
    isAdmin ? 'regional_manager' : (user?.role || 'sales_rep')
  );

  const userId = user?.id ? String(user.id) : null;

  const loadPulse = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const roleParam = isAdmin ? selectedRole : undefined;
      const res = await pulseApi.getUserPulse(userId, roleParam);
      setPulse(res.data);
    } catch {
      setPulse(null);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin, selectedRole]);

  useEffect(() => {
    loadPulse();
  }, [loadPulse]);

  const radarData: RadarDataPoint[] = pulse?.competencies.map((c) => ({
    label: lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name,
    value: c.pulse_pct,
    level: c.pulse_level,
  })) || [];

  const overallLevelName = pulse
    ? lang === 'uz' ? pulse.overall_level_uz : pulse.overall_level_ru
    : '';

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!pulse || pulse.competencies.length === 0) {
    return null; // Не показываем виджет если Pulse не настроен
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/competencies')}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-800">
          {t('pulse.overallPulse') || 'Пульс компетенций'}
        </h3>
        {isAdmin && (
          <select
            value={selectedRole}
            onChange={(e) => { e.stopPropagation(); setSelectedRole(e.target.value); }}
            onClick={(e) => e.stopPropagation()}
            className="px-2 py-1 border rounded text-xs bg-white"
          >
            {PULSE_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {lang === 'uz' ? r.label.uz : r.label.ru}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Радар + Общий Пульс */}
      <div className="flex items-center gap-4">
        {/* Мини-радар */}
        <div className="flex-shrink-0">
          <RadarChart data={radarData} size={180} showValues={false} />
        </div>

        {/* Общий Пульс */}
        <div className="flex-1 text-center">
          <p className={`text-4xl font-bold ${
            pulse.overall_pulse >= 76 ? 'text-green-600' :
            pulse.overall_pulse >= 51 ? 'text-blue-600' :
            pulse.overall_pulse >= 26 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {Math.round(pulse.overall_pulse)}%
          </p>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            LEVEL_STYLES[pulse.overall_level] || 'bg-gray-100 text-gray-700'
          }`}>
            {overallLevelName}
          </span>

          {/* Топ-3 слабых компетенции */}
          <div className="mt-3 space-y-1">
            {pulse.competencies
              .filter(c => c.pulse_pct < 50)
              .slice(0, 3)
              .map((c) => (
                <div key={c.competency_id} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        c.pulse_pct < 25 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.max(c.pulse_pct, 3)}%` }}
                    />
                  </div>
                  <span className="truncate max-w-[100px]">
                    {lang === 'uz' && c.competency_name_uz ? c.competency_name_uz : c.competency_name}
                  </span>
                </div>
              ))}
          </div>

          <p className="mt-2 text-[10px] text-blue-500 font-medium">
            {t('pulse.viewDetails') || 'Подробнее →'}
          </p>
        </div>
      </div>
    </div>
  );
}
