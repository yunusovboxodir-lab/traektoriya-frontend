/**
 * Мобильная страница теста (БЕЗ авторизации, как в adkar-test.html).
 * Порт adkar-test.html на React + Tailwind. RU/UZ переключение.
 *
 * Маршрут: /activities/m/:accessCode/:phase
 *   accessCode — 6-значный код сессии
 *   phase      — pre | post
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { offlineGuestApi, type MobileSessionInfo } from '../api/offlinePrograms';

type Screen = 'name' | 'test' | 'sending' | 'result' | 'error';

const I18N = {
  ru: {
    pre: '📝 PRE-ТЕСТ',
    post: '✅ POST-ТЕСТ',
    title: 'N\'MEDOV ACADEMY',
    nameLabel: 'Имя и фамилия',
    namePh: 'Например: Алишер Каримов',
    startBtn: 'Начать тест →',
    progress: 'Ответы',
    submit: 'Отправить →',
    sending: 'Отправка...',
    saved: '✓ Результаты сохранены',
    info: 'В POST-тесте впишите то же имя — результаты свяжутся',
    errorNoSession: 'Сессия не найдена. Проверьте код или отсканируйте QR заново.',
    errorClosed: 'Сессия закрыта для этой фазы.',
    msg: {
      top: '🏆 Отличный результат!',
      good: '👍 Хорошая база. Тренинг закрепит концепции.',
      mid: '📚 Средне. Слушайте теорию внимательно — будет рост в POST-тесте.',
      low: '🌱 Материал новый. Сейчас увидите всё в действии.',
    },
  },
  uz: {
    pre: '📝 PRE-TEST',
    post: '✅ POST-TEST',
    title: 'N\'MEDOV ACADEMY',
    nameLabel: 'Ism va familiya',
    namePh: 'Masalan: Alisher Karimov',
    startBtn: 'Testni boshlash →',
    progress: 'Javob',
    submit: 'Yuborish →',
    sending: 'Yuborilmoqda...',
    saved: '✓ Natijalar saqlandi',
    info: 'POST-testda xuddi shu ismni yozing — natijalar bog\'lanadi',
    errorNoSession: 'Sessiya topilmadi. Kodni tekshiring yoki QR-kodni qayta skanerlang.',
    errorClosed: 'Sessiya bu faza uchun yopiq.',
    msg: {
      top: '🏆 Ajoyib natija!',
      good: '👍 Yaxshi asos. Trening tushunchani mustahkamlaydi.',
      mid: '📚 O\'rtacha. Nazariyani diqqat bilan tinglang — POST-testda o\'sasiz.',
      low: '🌱 Material yangi. Hozir hammasini amalda ko\'rasiz.',
    },
  },
};

export function OfflineMobileTestPage() {
  const { accessCode, phase: phaseParam } = useParams();
  const phase = (phaseParam === 'post' ? 'post' : 'pre') as 'pre' | 'post';
  const [lang, setLang] = useState<'ru' | 'uz'>('ru');
  const [info, setInfo] = useState<MobileSessionInfo | null>(null);
  const [screen, setScreen] = useState<Screen>('name');
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<Record<number, { opt: number; score: number }>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultPct, setResultPct] = useState<number>(0);

  const t = I18N[lang];

  useEffect(() => {
    if (!accessCode) {
      setScreen('error');
      setErrorMsg(t.errorNoSession);
      return;
    }
    (async () => {
      try {
        const res = await offlineGuestApi.getMobileSession(accessCode);
        if (!res.data.session) {
          setScreen('error');
          setErrorMsg(t.errorNoSession);
          return;
        }
        if (!res.data.program) {
          setScreen('error');
          setErrorMsg('Программа не привязана к сессии. Свяжитесь с тренером.');
          return;
        }
        setInfo(res.data);
      } catch {
        setScreen('error');
        setErrorMsg(t.errorNoSession);
      }
    })();
  }, [accessCode, t.errorNoSession]);

  const program = info?.program;
  const session = info?.session;
  const questions = program?.questions || [];
  const numQuestions = questions.length;

  const totalScore = useMemo(
    () => Object.values(answers).reduce((sum, a) => sum + a.score, 0),
    [answers],
  );
  const maxScore = program?.max_score || 1;
  const percentage = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
  const allAnswered = Object.keys(answers).length === numQuestions && numQuestions > 0;

  const startTest = () => {
    if (!name.trim()) return;
    setScreen('test');
  };

  const pick = (qi: number, oi: number, score: number) => {
    setAnswers({ ...answers, [qi]: { opt: oi, score } });
  };

  const submit = async () => {
    if (!session || !program) return;
    setScreen('sending');
    try {
      const answersObj: Record<string, { opt: number; score: number }> = {};
      Object.entries(answers).forEach(([qi, a]) => {
        answersObj[`q${Number(qi) + 1}`] = a;
      });

      await offlineGuestApi.submitGuestTest({
        access_code: session.access_code,
        test_type: phase,
        participant_name: name.trim(),
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        answers: answersObj,
      });
      setResultPct(percentage);
      setScreen('result');
    } catch (e: unknown) {
      setScreen('error');
      const err = e as { response?: { data?: { detail?: string } } };
      setErrorMsg(err.response?.data?.detail || t.errorClosed);
    }
  };

  const phaseColor = phase === 'pre' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-green-100 text-green-700 border-green-300';
  const phaseLabel = phase === 'pre' ? t.pre : t.post;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100 px-4 py-4 max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: program?.theme_color || '#c9a961' }}>
            {program?.icon || 'N\''}
          </div>
          <span className="text-xs text-stone-500 font-bold tracking-widest">{t.title}</span>
        </div>
        <div className="flex bg-white/60 rounded-lg p-0.5 border border-stone-200">
          {(['ru', 'uz'] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1 text-xs font-bold rounded ${lang === l ? 'bg-stone-800 text-white' : 'text-stone-500'}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Phase + session badge */}
      {info && (
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`text-xs font-bold px-3 py-1 rounded-lg border tracking-wider ${phaseColor}`}>
            {phaseLabel}
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-lg bg-purple-100 text-purple-700 border border-purple-300 tracking-widest">
            🔑 {session?.access_code}
          </span>
        </div>
      )}

      {/* Screens */}
      {screen === 'error' && (
        <div className="bg-white border border-red-200 rounded-2xl p-5">
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">⚠️ {errorMsg}</div>
        </div>
      )}

      {screen === 'name' && info && program && (
        <>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-4">
            <h1 className="text-3xl font-serif text-stone-800 mb-2">
              {lang === 'uz' && program.title_uz ? program.title_uz : program.title}
            </h1>
            <p className="text-sm text-stone-500 mb-4">
              {lang === 'uz' && program.description_uz ? program.description_uz : program.description}
            </p>
            <div className="mb-3">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 block">
                {t.nameLabel}
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t.namePh}
                className="w-full px-4 py-3 border border-stone-300 rounded-xl bg-stone-50 text-base focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div className="bg-blue-50 text-blue-800 text-sm rounded-lg p-3 flex gap-2">
              <span>💡</span>
              <span>{t.info}</span>
            </div>
          </div>
          <button onClick={startTest} disabled={!name.trim()}
            className="w-full py-4 rounded-xl font-bold text-white text-base disabled:bg-stone-300 bg-gradient-to-r from-amber-500 to-amber-700 active:scale-95 transition-transform">
            {t.startBtn}
          </button>
        </>
      )}

      {screen === 'test' && info && program && (
        <>
          {/* Progress */}
          <div className="sticky top-2 z-10 mb-3 bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-700 rounded-full transition-all"
                style={{ width: `${(Object.keys(answers).length / numQuestions) * 100}%` }}
              />
            </div>
            <span className={`text-xs font-bold whitespace-nowrap ${allAnswered ? 'text-green-600' : 'text-stone-500'}`}>
              {t.progress}: {Object.keys(answers).length}/{numQuestions}
            </span>
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="bg-white border border-stone-200 rounded-2xl p-4 mb-3">
              <div className="flex gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-stone-100 text-stone-500 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {qi + 1}
                </span>
                <h3 className="text-base font-bold text-stone-800 leading-tight">
                  {lang === 'uz' && q.question_uz ? q.question_uz : q.question}
                </h3>
              </div>
              <div className="space-y-2">
                {q.options.map((o, oi) => {
                  const selected = answers[qi]?.opt === oi;
                  return (
                    <button key={oi} onClick={() => pick(qi, oi, o.score)}
                      className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-all ${
                        selected
                          ? 'bg-stone-800 text-white border-stone-800'
                          : 'bg-stone-50 text-stone-700 border-stone-200 active:scale-98'
                      }`}>
                      {lang === 'uz' && o.text_uz ? o.text_uz : o.text}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button onClick={submit} disabled={!allAnswered}
            className="w-full py-4 rounded-xl font-bold text-white bg-stone-800 disabled:bg-stone-300 active:scale-95 transition-transform">
            {t.submit}
          </button>
        </>
      )}

      {screen === 'sending' && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-3">⏳</div>
          <h3 className="text-xl font-bold text-stone-800">{t.sending}</h3>
        </div>
      )}

      {screen === 'result' && (
        <>
          <div className="bg-gradient-to-br from-white to-stone-50 border border-stone-200 rounded-3xl p-8 text-center mb-3">
            <div className="text-6xl mb-2">
              {resultPct >= 85 ? '🏆' : resultPct >= 65 ? '👍' : resultPct >= 40 ? '📚' : '🌱'}
            </div>
            <div className="text-7xl font-serif bg-gradient-to-br from-amber-700 to-stone-800 bg-clip-text text-transparent leading-none">
              {resultPct}%
            </div>
            <div className="text-sm text-stone-500 mt-2 mb-3">
              {totalScore} / {maxScore}
            </div>
            <div className="text-sm font-semibold text-stone-700">
              {resultPct >= 85 ? t.msg.top : resultPct >= 65 ? t.msg.good : resultPct >= 40 ? t.msg.mid : t.msg.low}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            {t.saved}
          </div>
        </>
      )}

      <div className="text-center text-xs text-stone-400 tracking-widest font-semibold mt-6">
        N'MEDOV SALES ACADEMY • 2026
      </div>
    </div>
  );
}
