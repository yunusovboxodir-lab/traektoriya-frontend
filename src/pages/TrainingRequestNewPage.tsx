/**
 * Module 15: Форма подачи заявки на тренинг.
 *
 * Pulse-check выполняется заранее (на blur полей) — сразу видно проходит/нет.
 * Если не проходит И rule.urgency_override=true — кнопка «Подать как срочную».
 *
 * UX 2026-05-13: dark TacticalLayout, bilingual, late-submission warning.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlanApi } from '../api/trainingPlan';
import { offlineProgramsApi } from '../api/offlinePrograms';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import type { Program } from '../types/offlineProgram';
import type { PulseCheckOut, TargetRole, Urgency } from '../types/trainingPlan';

function formatPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return `${(v * 100).toFixed(0)}%`;
}

function isInSubmissionWindow(today: Date = new Date()): boolean {
  const d = today.getDate();
  return d >= 25 || d <= 5;
}

export function TrainingRequestNewPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const lang = useLangStore((s) => s.lang);

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

  const TARGET_ROLE_OPTIONS = useMemo(
    () => [
      { value: 'sales_rep' as TargetRole, label: lang === 'uz' ? 'TP — Savdo vakili' : 'ТП — Торговые представители' },
      { value: 'supervisor' as TargetRole, label: lang === 'uz' ? 'SV — Supervayzer' : 'СВ — Супервайзеры' },
      { value: 'regional_manager' as TargetRole, label: lang === 'uz' ? 'RM — Mintaqaviy menejer' : 'РМ — Региональные менеджеры' },
    ],
    [lang],
  );

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
        <div className="bg-amber-900/40 border border-amber-700/50 rounded-lg p-4 text-amber-200">
          {lang === 'uz'
            ? "Ariza berishga faqat SV / RM / TD ega"
            : 'Подача заявок доступна только СВ / РМ / КД.'}
        </div>
      </div>
    );
  }

  const inWindow = isInSubmissionWindow();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason.trim()) {
      setError(lang === 'uz' ? "Sababni ko'rsating (kamida 10 belgi)" : 'Укажи причину (минимум 10 символов)');
      return;
    }
    if (reason.trim().length < 10) {
      setError(lang === 'uz' ? "Sabab juda qisqa" : 'Причина слишком короткая. Опиши почему нужен тренинг.');
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
        proposed_dates: proposedDate ? [{ date: proposedDate, preference: 1 }] : null,
      });
      navigate('/training-plan');
    } catch (e) {
      const msg =
        (e as { response?: { data?: { detail?: string } }; message?: string }).response?.data?.detail ||
        (e as Error).message;
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
          className="text-sm text-zinc-400 hover:text-yellow-100"
        >
          ← {lang === 'uz' ? "O'qish rejasiga" : 'К плану обучения'}
        </button>
        <div
          role="heading"
          aria-level={1}
          className="text-3xl font-semibold text-yellow-100 mt-2"
        >
          {lang === 'uz' ? 'Trening uchun ariza berish' : 'Подать заявку на тренинг'}
        </div>
        <p className="text-zinc-400 mt-1 text-sm">
          {lang === 'uz'
            ? "Ariza tasdiqlash bosqichidan o'tib, kalendarga qo'yish uchun trenerga yuboriladi."
            : 'Заявка пройдёт через утверждение и попадёт к тренеру для постановки в календарь.'}
        </p>
      </div>

      {/* Late submission banner — frontend hint, реальная логика в backend (urgent_by_window) */}
      {!inWindow && (
        <div className="mb-5 bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 text-amber-200 text-sm">
          <div className="font-semibold mb-1 flex items-center gap-2">
            ⚠️ {lang === 'uz' ? "Oyna tashqarisida" : 'Подача вне окна (25→05)'}
          </div>
          <div className="text-amber-300/90">
            {lang === 'uz'
              ? "Ariza avtomatik tarzda «shoshilinch» deb belgilanadi va Trener + TD ikki tomonlama tasdiqlashni talab qiladi."
              : 'Заявка автоматически становится срочной (urgent) и требует двойного утверждения: Тренер + КД.'}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        {/* Программа из каталога ИЛИ свободная тема */}
        <div>
          <label className="block text-sm font-medium text-zinc-200 mb-1">
            {lang === 'uz' ? 'Katalogdan dastur' : 'Программа из каталога'}
          </label>
          <select
            value={programId}
            onChange={(e) => {
              setProgramId(e.target.value);
              if (e.target.value) setCustomTopic('');
            }}
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2"
          >
            <option value="">
              {lang === 'uz'
                ? "— Dasturni tanlang yoki pastda mavzu kiriting —"
                : '— Выбери программу или укажи свою тему ниже —'}
            </option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.target_role})
              </option>
            ))}
          </select>
        </div>

        {!programId && (
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              {lang === 'uz' ? "O'z mavzungiz" : 'Своя тема (если нет в каталоге)'}
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              placeholder={
                lang === 'uz'
                  ? "Masalan: Diler bilan muddati o'tgan qarz bo'yicha ishlash"
                  : 'Например: Работа с просроченной дебиторкой у дилера'
              }
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 placeholder:text-zinc-500"
            />
          </div>
        )}

        {/* Целевая роль + регион */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              {lang === 'uz' ? "Maqsadli auditoriya" : 'Целевая аудитория'}
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as TargetRole)}
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2"
            >
              {TARGET_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              {lang === 'uz' ? "Mintaqa (ixtiyoriy)" : 'Регион (необязательно)'}
            </label>
            <input
              type="text"
              value={targetRegion}
              onChange={(e) => setTargetRegion(e.target.value)}
              placeholder={lang === 'uz' ? 'Masalan: Samarqand' : 'Например: Самарканд'}
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Причина */}
        <div>
          <label className="block text-sm font-medium text-zinc-200 mb-1">
            {lang === 'uz' ? 'Sabab / kontekst' : 'Причина / контекст'} <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder={
              lang === 'uz'
                ? "Nima yuz berdi? Jamoada qanday muammo bor? Qanday natija kutyapsiz?"
                : 'Что произошло? Какой пробел в команде? Какой ожидаешь эффект?'
            }
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2 placeholder:text-zinc-500"
            required
          />
          <div className="text-xs text-zinc-500 mt-1">
            {reason.length} {lang === 'uz' ? 'belgi' : 'символов'}
          </div>
        </div>

        {/* Urgency + дата */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              {lang === 'uz' ? "Shoshilinchlik" : 'Срочность'}
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as Urgency)}
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2"
            >
              <option value="low">{lang === 'uz' ? 'Past' : 'Низкая'}</option>
              <option value="normal">{lang === 'uz' ? 'Oddiy' : 'Обычная'}</option>
              <option value="high">{lang === 'uz' ? "Yuqori" : 'Высокая'}</option>
              <option value="urgent">
                {lang === 'uz' ? "Shoshilinch (Pulse override)" : 'Срочная (override Pulse)'}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-200 mb-1">
              {lang === 'uz' ? "Istalgan sana" : 'Желаемая дата'}
            </label>
            <input
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {/* Pulse-check блок */}
        <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900/60">
          <h3 className="font-semibold text-yellow-100 mb-2">
            {lang === 'uz' ? "Pulse-tekshiruv" : 'Pulse-проверка'}
          </h3>
          {pulseLoading && (
            <div className="text-sm text-zinc-500 font-mono uppercase tracking-wider">
              {lang === 'uz' ? "Tekshirilmoqda..." : 'Проверяю...'}
            </div>
          )}
          {pulse && !pulseLoading && (
            <div>
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <div className="text-zinc-500 text-xs uppercase tracking-wider font-mono">
                    {lang === 'uz' ? "O'z Pulse" : 'Свой Pulse'}
                  </div>
                  <div className="font-bold text-lg text-yellow-100 font-mono">
                    {formatPct(pulse.snapshot.self_pulse)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase tracking-wider font-mono">
                    {lang === 'uz' ? "Jamoa" : 'Команда'}
                  </div>
                  <div className="font-bold text-lg text-yellow-100 font-mono">
                    {formatPct(pulse.snapshot.team_avg_pulse)}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs uppercase tracking-wider font-mono">
                    {lang === 'uz' ? "Jamoa hajmi" : 'Размер команды'}
                  </div>
                  <div className="font-bold text-lg text-yellow-100 font-mono">
                    {pulse.snapshot.team_size ?? 0}
                  </div>
                </div>
              </div>

              {pulse.passed ? (
                <div className="text-sm text-emerald-200 bg-emerald-900/40 border border-emerald-700/50 rounded p-2">
                  {lang === 'uz'
                    ? "Pulse-tekshiruv o'tdi. Ariza berishingiz mumkin."
                    : 'Pulse-проверка пройдена. Можно подавать заявку.'}
                </div>
              ) : (
                <div className="text-sm">
                  <div className="text-red-200 bg-red-900/40 border border-red-700/50 rounded p-2">
                    <div className="font-semibold">
                      {lang === 'uz' ? "Pulse-tekshiruv o'tmadi:" : 'Pulse-проверка не пройдена:'}
                    </div>
                    <ul className="list-disc list-inside mt-1">
                      {pulse.missing.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  {pulse.can_override_with_urgency && urgency !== 'urgent' && (
                    <div className="text-amber-200 bg-amber-900/40 border border-amber-700/50 rounded p-2 mt-2">
                      {lang === 'uz'
                        ? "«Shoshilinch» sifatida yuborish mumkin (override). Yuqorida shoshilinchlikni o'zgartiring."
                        : 'Можно подать как «Срочную» (override). Изменить срочность выше.'}
                    </div>
                  )}
                </div>
              )}

              {pulse.snapshot.weakest_competencies?.length ? (
                <div className="mt-3 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">
                    {lang === 'uz' ? "Zaif kompetensiyalar:" : 'Слабые компетенции команды:'}
                  </span>{' '}
                  {pulse.snapshot.weakest_competencies.join(', ')}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-200 bg-red-900/40 border border-red-700/50 rounded p-3">{error}</div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="px-5 py-2 bg-yellow-600 text-zinc-950 font-semibold rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? lang === 'uz' ? "Yuborilmoqda..." : 'Отправляю…'
              : lang === 'uz' ? "Ariza berish" : 'Подать заявку'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/training-plan')}
            className="px-5 py-2 border border-zinc-600 text-zinc-200 rounded-lg hover:bg-zinc-800"
          >
            {lang === 'uz' ? 'Bekor' : 'Отмена'}
          </button>
        </div>
      </form>
    </div>
  );
}
