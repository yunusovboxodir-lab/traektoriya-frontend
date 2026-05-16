/**
 * Режим проектора. Fullscreen-страница со слайдами + спец-рендерами для дашборда.
 * Polling метрик каждые 6 сек.
 *
 * Маршрут: /activities/sessions/:sessionId/present
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { offlineApi } from '../api/offline';
import { offlineProgramsApi, offlineSessionExtraApi } from '../api/offlinePrograms';
import type {
  OfflineSession,
} from '../api/offline';
import type {
  Program,
  SessionDashboard,
  Slide,
} from '../types/offlineProgram';
import { BlockRenderer } from '../components/offline/blocks/BlockRenderer';

const POLL_INTERVAL_MS = 6000;

export function OfflineSessionPresenterPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<OfflineSession | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [lang, setLang] = useState<'ru' | 'uz'>('ru');
  const [dashboard, setDashboard] = useState<SessionDashboard | null>(null);
  const [qrPayload, setQrPayload] = useState<{ access_code: string; mobile_url: string; phase: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Загрузка
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const sessRes = await offlineApi.getSession(sessionId);
        const sess = sessRes.data as OfflineSession;
        setSession(sess);
        // Программа: сначала через UUID program_id (новый формат),
        // fallback на code (legacy) с приведением к нижнему регистру
        try {
          if (sess.program_id) {
            const progRes = await offlineProgramsApi.getById(sess.program_id);
            setProgram(progRes.data);
          } else if (sess.program) {
            const code = sess.program.toLowerCase().replace(/\s+/g, '');
            const progRes = await offlineProgramsApi.getByCode(code);
            setProgram(progRes.data);
          }
        } catch {
          setProgram(null);
        }
        // QR
        try {
          const qrRes = await offlineSessionExtraApi.getQr(sessionId);
          setQrPayload({
            access_code: qrRes.data.access_code,
            mobile_url: qrRes.data.mobile_url,
            phase: qrRes.data.phase,
          });
        } catch {
          /* QR не критичен */
        }
      } catch (e: unknown) {
        setError((e as Error).message || 'Ошибка загрузки сессии');
      }
    })();
  }, [sessionId]);

  // Polling дашборда (раз в 6 сек)
  const refreshDashboard = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await offlineSessionExtraApi.getDashboard(sessionId, 'both');
      setDashboard(res.data);
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  useEffect(() => {
    refreshDashboard();
    const t = setInterval(refreshDashboard, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [refreshDashboard]);

  // Навигация по клавишам
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPrev();
      if (e.key === 'Escape') exitPresenter();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const slides: Slide[] = program?.slides || [];
  const currentSlide = slides[slideIdx];

  const goNext = () => setSlideIdx((i) => Math.min(i + 1, Math.max(slides.length - 1, 0)));
  const goPrev = () => setSlideIdx((i) => Math.max(i - 1, 0));

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const exitPresenter = () => navigate('/activities');

  if (error) return <div className="p-8 min-h-screen" style={{ color: '#FCA5A5', background: '#0D0F14' }}>{error}</div>;
  if (!session) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center" style={{ background: '#0D0F14' }}>
        <div className="max-w-md w-full bg-gray-700/30 rounded-lg p-6 motion-safe:animate-pulse">
          <div className="h-6 w-1/2 bg-gray-600/50 rounded mb-4"></div>
          <div className="h-4 w-3/4 bg-gray-600/30 rounded mb-2"></div>
          <div className="h-4 w-2/3 bg-gray-600/30 rounded"></div>
        </div>
      </div>
    );
  }

  // Дефолтный фон проектора — dark с лёгким градиентом, в стиле платформы.
  // Отдельные слайды могут переопределить через slide.bg_style.
  const defaultBg = 'radial-gradient(ellipse at top, rgba(200,168,75,0.08) 0%, #0D0F14 50%, #0D0F14 100%)';

  return (
    <div ref={containerRef}
      className="min-h-screen w-full"
      style={{
        background: currentSlide?.bg_style || defaultBg,
        color: '#E8EAF0',
      }}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-3 z-10">
        <div
          style={{ color: '#9CA3AF', letterSpacing: '0.2em' }}
          className="text-xs font-semibold uppercase"
        >
          N'MEDOV ACADEMY • <span style={{ color: '#C8A84B' }}>{program?.code.toUpperCase() || session.program}</span>
          {qrPayload && (
            <span
              style={{ background: '#C8A84B', color: '#0D0F14' }}
              className="ml-3 px-2 py-0.5 rounded font-bold"
            >
              КОД: {qrPayload.access_code}
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <div
            style={{ background: 'rgba(26,31,46,0.7)', border: '1px solid #252B3B' }}
            className="flex gap-1 rounded-lg p-0.5"
          >
            {(['ru', 'uz'] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                style={lang === l
                  ? { background: '#C8A84B', color: '#0D0F14' }
                  : { color: '#9CA3AF' }}
                className="text-xs px-2 py-1 rounded font-bold">
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={toggleFullscreen}
            style={{ background: 'rgba(26,31,46,0.7)', border: '1px solid #252B3B', color: '#E8EAF0' }}
            className="text-xs px-3 py-1.5 rounded-lg"
          >
            ⛶ Fullscreen
          </button>
          <button
            onClick={exitPresenter}
            style={{ background: 'rgba(26,31,46,0.7)', border: '1px solid #252B3B', color: '#E8EAF0' }}
            className="text-xs px-3 py-1.5 rounded-lg"
          >
            ✕ Выход
          </button>
        </div>
      </div>

      {/* Slide content */}
      <div className="px-12 pt-20 pb-24 min-h-screen flex flex-col justify-center">
        {!currentSlide ? (
          <div style={{ color: '#9CA3AF' }} className="text-center text-2xl">
            Нет слайдов в программе. Зайдите в редактор и добавьте.
          </div>
        ) : (
          <SlideRenderer
            slide={currentSlide}
            lang={lang}
            dashboard={dashboard}
            qrPayload={qrPayload}
            categories={program?.categories || []}
            numQuestions={program?.num_questions || 8}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{ background: 'rgba(13,15,20,0.85)', borderTop: '1px solid #252B3B' }}
        className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-6 py-3 z-10"
      >
        <div style={{ color: '#6B7280' }} className="text-xs">
          Стрелки ← → для навигации • Esc для выхода • F для Fullscreen
        </div>
        <div className="flex items-center gap-4">
          <button onClick={goPrev} disabled={slideIdx === 0}
            style={{ background: '#1A1F2E', border: '1px solid #323A50', color: '#E8EAF0' }}
            className="px-4 py-1.5 rounded text-sm disabled:opacity-30">
            ←
          </button>
          <span style={{ color: '#E8EAF0' }} className="text-sm font-bold">
            {slideIdx + 1} / {slides.length}
          </span>
          <button onClick={goNext} disabled={slideIdx >= slides.length - 1}
            style={{ background: '#1A1F2E', border: '1px solid #323A50', color: '#E8EAF0' }}
            className="px-4 py-1.5 rounded text-sm disabled:opacity-30">
            →
          </button>
        </div>
      </div>
    </div>
  );
}

// ===========================================================================
// SLIDE RENDERER (диспетчер по slide_type)
// ===========================================================================

interface SlideRendererProps {
  slide: Slide;
  lang: 'ru' | 'uz';
  dashboard: SessionDashboard | null;
  qrPayload: { access_code: string; mobile_url: string; phase: string } | null;
  categories: Array<{ code: string; label: string; label_uz?: string; color: string }>;
  numQuestions: number;
}

function SlideRenderer({ slide, lang, dashboard, qrPayload, categories, numQuestions }: SlideRendererProps) {
  // Спец-слайды — отдельный рендер с дополнительными виджетами поверх блоков
  switch (slide.slide_type) {
    case 'dashboard_pre':
    case 'dashboard_post': {
      const phase = slide.slide_type === 'dashboard_pre' ? 'pre' : 'post';
      const agg = phase === 'pre' ? dashboard?.pre : dashboard?.post;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left — slide blocks */}
          <div>
            {slide.blocks.map((b, i) => <BlockRenderer key={i} block={b} lang={lang} />)}
            {qrPayload && (
              <div className="mt-6 p-6 bg-white rounded-2xl shadow-lg inline-block">
                <QRCodeSVG value={qrPayload.mobile_url.replace(/\/m\/[^/]+\/[^/]+$/, `/m/${qrPayload.access_code}/${phase}`)} size={280} />
                <div className="mt-3 text-center">
                  <div className="text-xs text-stone-500 uppercase tracking-wider">Код сессии</div>
                  <div className="text-3xl font-bold text-stone-800 tracking-widest">{qrPayload.access_code}</div>
                </div>
              </div>
            )}
          </div>
          {/* Right — live participants */}
          <ParticipantsLiveList agg={agg} phase={phase} />
        </div>
      );
    }

    case 'dashboard_pre_result':
      return <ResultBreakdown dashboard={dashboard} phase="pre" categories={categories} numQuestions={numQuestions} lang={lang} />;

    case 'dashboard_growth':
      return <GrowthDashboard dashboard={dashboard} lang={lang} />;

    default:
      return (
        <div>
          {slide.blocks.map((b, i) => <BlockRenderer key={i} block={b} lang={lang} />)}
        </div>
      );
  }
}

// ===========================================================================
// LIVE PARTICIPANTS (для dashboard_pre / dashboard_post)
// ===========================================================================

function ParticipantsLiveList({ agg, phase }: {
  agg: { count: number; participants: Array<{ name: string; pct: number }>; avgPercent: number } | null | undefined;
  phase: 'pre' | 'post';
}) {
  if (!agg) return <div className="text-stone-400 text-center">Ожидаем подключения...</div>;
  return (
    <div className="bg-white/90 border border-stone-200 rounded-2xl p-6 max-h-[60vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-2xl text-stone-800">
          {phase === 'pre' ? 'Прошли PRE' : 'Прошли POST'}
        </h3>
        <span className="text-3xl font-serif text-amber-700">{agg.count}</span>
      </div>
      <div className="text-sm text-stone-500 mb-3">
        Средний результат: <strong className="text-stone-800">{agg.avgPercent}%</strong>
      </div>
      <div className="space-y-1">
        {agg.participants.length === 0 && (
          <div className="text-stone-400 text-center py-8">Сканируйте QR ↑ и пройдите тест</div>
        )}
        {agg.participants.map((p, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-stone-100">
            <span className="text-base text-stone-800">{p.name}</span>
            <span className="text-base font-bold text-amber-700">{Math.round(p.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// RESULT BREAKDOWN (dashboard_pre_result)
// ===========================================================================

function ResultBreakdown({ dashboard, phase, categories, numQuestions, lang }: {
  dashboard: SessionDashboard | null;
  phase: 'pre' | 'post';
  categories: Array<{ code: string; label: string; label_uz?: string; color: string }>;
  numQuestions: number;
  lang: 'ru' | 'uz';
}) {
  const agg = phase === 'pre' ? dashboard?.pre : dashboard?.post;
  if (!agg || agg.count === 0) {
    return <div className="text-stone-400 text-center text-2xl py-20">Ожидаем результаты...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
        <BigStat title="Участников" value={String(agg.count)} />
        <BigStat title="Средний %" value={`${agg.avgPercent}%`} highlight />
        <BigStat title="Лучший" value={`${Math.max(...agg.scores, 0)}%`} />
      </div>

      <div>
        <h3 className="font-serif text-3xl text-stone-800 mb-4">Распределение по {numQuestions} вопросам</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {agg.questionStats.slice(0, numQuestions).map((qs) => (
            <div key={qs.q} className="bg-white rounded-xl border border-stone-200 p-3 text-center">
              <div className="text-xs text-stone-500">Q{qs.q}</div>
              <div className={`text-2xl font-bold ${qs.correctPct > 70 ? 'text-green-600' : qs.correctPct > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                {qs.correctPct}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <h3 className="font-serif text-2xl text-stone-800 mb-3">Категории</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c.code} className="px-3 py-1.5 rounded-full text-sm font-bold text-white"
                style={{ background: c.color }}>
                {lang === 'uz' && c.label_uz ? c.label_uz : c.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BigStat({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-6 text-center ${highlight ? 'bg-amber-500 text-white' : 'bg-white border border-stone-200'}`}>
      <div className={`text-xs uppercase tracking-wider ${highlight ? 'text-amber-100' : 'text-stone-500'}`}>{title}</div>
      <div className="text-5xl font-serif mt-2">{value}</div>
    </div>
  );
}

// ===========================================================================
// GROWTH DASHBOARD
// ===========================================================================

function GrowthDashboard({ dashboard, lang: _lang }: { dashboard: SessionDashboard | null; lang: 'ru' | 'uz' }) {
  const g = dashboard?.growth;
  if (!g || g.matched === 0) {
    return <div className="text-stone-400 text-center text-2xl py-20">Ожидаем POST-результаты...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-serif text-center text-stone-800">Рост ДО → ПОСЛЕ</h2>
      <div className="grid grid-cols-3 gap-6">
        <BigStat title="Среднее ДО" value={`${g.avgPre}%`} />
        <BigStat title="Среднее ПОСЛЕ" value={`${g.avgPost}%`} highlight />
        <BigStat title="Рост" value={`+${g.avgDelta}%`} />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 max-h-[50vh] overflow-y-auto">
        <table className="w-full text-base">
          <thead className="bg-stone-50 sticky top-0">
            <tr>
              <th className="p-3 text-left font-semibold text-stone-600">Имя</th>
              <th className="p-3 text-center font-semibold text-stone-600">PRE</th>
              <th className="p-3 text-center font-semibold text-stone-600">POST</th>
              <th className="p-3 text-center font-semibold text-stone-600">Δ</th>
            </tr>
          </thead>
          <tbody>
            {g.items.map((it, i) => (
              <tr key={i} className="border-t border-stone-100">
                <td className="p-3 font-bold">{it.name}</td>
                <td className="p-3 text-center text-stone-600">{it.pre !== null ? `${Math.round(it.pre)}%` : '—'}</td>
                <td className="p-3 text-center text-stone-800 font-semibold">{Math.round(it.post)}%</td>
                <td className={`p-3 text-center font-bold ${
                  it.delta === null ? 'text-stone-400' :
                  it.delta > 10 ? 'text-green-600' :
                  it.delta > 0 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {it.delta === null ? '—' : `${it.delta > 0 ? '+' : ''}${Math.round(it.delta)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
