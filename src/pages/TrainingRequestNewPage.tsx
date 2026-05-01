/**
 * Module 15: Форма подачи заявки на тренинг.
 *
 * Pulse-check выполняется заранее (на blur полей) — сразу видно проходит/нет.
 * Если не проходит И rule.urgency_override=true — кнопка «Подать как срочную».
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlanApi } from '../api/trainingPlan';
import { offlineProgramsApi } from '../api/offlinePrograms';
import { useAuthStore } from '../stores/authStore';
import type { Program } from '../types/offlineProgram';
import type { PulseCheckOut, TargetRole, Urgency } from '../types/trainingPlan';

const TARGET_ROLE_OPTIONS: Array<{ value: TargetRole; label: string }> = [
  { value: 'sales_rep', label: 'ТП — Торговые представители' },
  { value: 'supervisor', label: 'СВ — Супервайзеры' },
  { value: 'regional_manager', label: 'РМ — Региональные менеджеры' },
];

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(0)}%`;
}

export function TrainingRequestNewPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [targetRole, setTargetRole] = useState<TargetRole>('sales_rep');
  const [targetRegion, setTargetRegion] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [urgency, setUrgency] = useState<Urgency>('normal');
  const [proposedDate, setProposedDate] = useState<string>('');

  const [pulse, setPulse] = useState<PulseCheckOut | null>(null);
  const [pulseLoading, setPulseLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка программ
  useEffect(() => {
    offlineProgramsApi
      .list({ is_active: true })
      .then((res) => setPrograms(res.data.programs || []))
      .catch(() => setPrograms([]));
  }, []);

  // Превью Pulse-check каждый раз при смене role/program/urgency
  useEffect(() => {
    setPulseLoading(true);
    trainingPlanApi
      .pulseCheck({
        target_role: targetRole,
        program_id: programId || undefined,
        urgency,
      })
      .then((res) => setPulse(res.data))
      .catch(() => setPulse(null))
      .finally(() => setPulseLoading(false));
  }, [targetRole, programId, urgency]);

  if (!user || !['supervisor', 'regional_manager', 'commercial_dir'].includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          Подача заявок доступна только СВ / РМ / КД.
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError('Укажи причину (минимум 10 символов)');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Причина слишком короткая. Опиши почему нужен тренинг.');
      return;
    }

    setSubmitting(true);
    try {
      await trainingPlanApi.createRequest({
        program_id: programId || null,
        custom_topic: customTopic || null,
        target_role: targetRole,
        target_region: targetRegion || null,
        reason: reason.trim(),
        urgency,
        proposed_dates: proposedDate
          ? [{ date: proposedDate, preference: 1 }]
          : null,
      });
      navigate('/training-plan');
    } catch (e) {
      const msg = (e as { response?: { data?: { detail?: string } }; message?: string }).response?.data?.detail
        || (e as Error).message;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = pulse?.passed === true || urgency === 'urgent';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/training-plan')}
          className="text-sm text-stone-500 hover:text-stone-800"
        >
          ← К плану обучения
        </button>
        <h1 className="text-3xl font-serif text-stone-800 mt-2">Подать заявку на тренинг</h1>
        <p className="text-stone-500 mt-1">
          Заявка пройдёт через утверждение и попадёт к тренеру для постановки в календарь.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Программа из каталога ИЛИ свободная тема */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Программа из каталога
          </label>
          <select
            value={programId}
            onChange={(e) => {
              setProgramId(e.target.value);
              if (e.target.value) setCustomTopic('');
            }}
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
          >
            <option value="">— Выбери программу или укажи свою тему ниже —</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.target_role})
              </option>
            ))}
          </select>
        </div>

        {!programId && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Своя тема (если нет в каталоге)
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder="Например: Работа с просроченной дебиторкой у дилера"
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
            />
          </div>
        )}

        {/* Целевая роль */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Целевая аудитория
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as TargetRole)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
            >
              {TARGET_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Регион (необязательно)
            </label>
            <input
              type="text"
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              placeholder="Например: Самарканд"
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Причина */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Причина / контекст <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Что произошло? Какой пробел в команде? Какой ожидаешь эффект?"
            className="w-full border border-stone-300 rounded-lg px-3 py-2"
            required
          />
          <div className="text-xs text-stone-500 mt-1">{reason.length} символов</div>
        </div>

        {/* Urgency и дата */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Срочность
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as Urgency)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
            >
              <option value="low">Низкая</option>
              <option value="normal">Обычная</option>
              <option value="high">Высокая</option>
              <option value="urgent">Срочная (override Pulse)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Желаемая дата
            </label>
            <input
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Pulse-check блок */}
        <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
          <h3 className="font-medium text-stone-800 mb-2">Pulse-проверка</h3>
          {pulseLoading && <div className="text-sm text-stone-500">Проверяю…</div>}
          {pulse && !pulseLoading && (
            <div>
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <div className="text-stone-500">Свой Pulse</div>
                  <div className="font-medium text-lg">
                    {formatPct(pulse.snapshot.self_pulse)}
                  </div>
                </div>
                <div>
                  <div className="text-stone-500">Команда</div>
                  <div className="font-medium text-lg">
                    {formatPct(pulse.snapshot.team_avg_pulse)}
                  </div>
                </div>
                <div>
                  <div className="text-stone-500">Размер команды</div>
                  <div className="font-medium text-lg">
                    {pulse.snapshot.team_size ?? 0}
                  </div>
                </div>
              </div>

              {pulse.passed ? (
                <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
                  Pulse-проверка пройдена. Можно подавать заявку.
                </div>
              ) : (
                <div className="text-sm">
                  <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    <div className="font-medium">Pulse-проверка не пройдена:</div>
                    <ul className="list-disc list-inside mt-1">
                      {pulse.missing.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  {pulse.can_override_with_urgency && urgency !== 'urgent' && (
                    <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                      Можно подать как «Срочную» (override). Изменить срочность выше.
                    </div>
                  )}
                </div>
              )}

              {pulse.snapshot.weakest_competencies?.length ? (
                <div className="mt-3 text-xs text-stone-600">
                  <span className="font-medium">Слабые компетенции команды: </span>
                  {pulse.snapshot.weakest_competencies.join(', ')}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="px-5 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Отправляю…' : 'Подать заявку'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/training-plan')}
            className="px-5 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
