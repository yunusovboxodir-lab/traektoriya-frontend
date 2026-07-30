/**
 * Академия ассортимента N'Medov — отдельное обучение по продуктам
 * (самостоятельный вход рядом с Кейсотекой, вне общей карты обучения).
 * Источник уроков: секция tp_assortment (12 уроков, RU+UZ).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { learningApi, type SectionCoursesResponse, type CourseItem } from '../api/learning';
import { useLangStore } from '../stores/langStore';
import { useTenantStore } from '../stores/tenantStore';
import { StatusBar } from '../components/tactical/StatusBar';

const SECTION_SLUG = 'tp_assortment';

function pick(bt: { ru?: string | null; uz?: string | null } | string | undefined, lang: string): string {
  if (!bt) return '';
  if (typeof bt === 'string') return bt;
  return (lang === 'uz' ? bt.uz : bt.ru) || bt.ru || bt.uz || '';
}

export function AssortmentAcademyPage() {
  const navigate = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const tenant = useTenantStore((s) => s.tenant);
  const tenantLoaded = useTenantStore((s) => s.loaded);
  const fetchTenant = useTenantStore((s) => s.fetchTenant);
  // Ассортимент N'Medov — легаси-контент корневой орг, другим не показываем.
  const isRoot = tenant?.is_root === true;
  const [data, setData] = useState<SectionCoursesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchTenant(); }, [fetchTenant]);
  useEffect(() => {
    if (tenantLoaded && !isRoot) navigate('/learning', { replace: true });
  }, [tenantLoaded, isRoot, navigate]);

  useEffect(() => {
    let alive = true;
    learningApi
      .getSectionCourses(SECTION_SLUG)
      .then((res) => { if (alive) setData(res.data); })
      .catch(() => { if (alive) setError(lang === 'uz' ? 'Yuklashda xatolik' : 'Ошибка загрузки'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [lang]);

  const courses: CourseItem[] = (data?.levels || []).flatMap((l) => l.courses || []);
  const completed = courses.filter((c) => c.status === 'completed').length;
  const pct = courses.length ? Math.round((completed / courses.length) * 100) : 0;

  // Не рендерим чужой контент, пока не подтвердили корневую орг.
  if (!tenantLoaded || !isRoot) return null;

  return (
    <div className="tactical-root" style={{ minHeight: '100vh', paddingBottom: 48 }}>
      <StatusBar />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>
        <button
          type="button"
          onClick={() => navigate('/learning')}
          style={{
            background: 'none', border: 'none', color: 'var(--brass)', cursor: 'pointer',
            fontSize: 12, padding: 0, marginBottom: 14,
          }}
        >
          {lang === 'uz' ? "← O'qish xaritasiga" : '← К карте обучения'}
        </button>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(230,126,34,0.16), var(--bg-overlay))',
            border: '1px solid var(--line)', borderRadius: 14, padding: '22px 22px 18px', marginBottom: 18,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24 }}>
            {lang === 'uz' ? "N'Medov assortimenti: mahsulotlarimiz" : "Ассортимент N'Medov: наши продукты"}
          </h1>
          <p style={{ margin: '8px 0 14px', color: 'var(--text-secondary, #9aa3b5)', fontSize: 14, lineHeight: 1.5 }}>
            {lang === 'uz'
              ? "Barcha oʻz brendlarimiz: qadoq faktlari, XAF, narxlar va raqobatchilar bilan batllar. 12 ta darsdan iborat alohida kurs."
              : 'Все собственные бренды холдинга: факты с упаковок, ХПВ, цены и батлы с конкурентами. Отдельный курс из 12 уроков.'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#E67E22', transition: 'width .3s' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--brass)', fontVariantNumeric: 'tabular-nums' }}>
              {completed}/{courses.length} · {pct}%
            </span>
          </div>
        </div>

        {loading && (
          <div style={{ color: 'var(--text-secondary, #9aa3b5)', padding: 24, textAlign: 'center' }}>
            {lang === 'uz' ? 'Yuklanmoqda…' : 'Загрузка…'}
          </div>
        )}
        {error && (
          <div style={{ color: 'var(--danger, #e05656)', padding: 24, textAlign: 'center' }}>{error}</div>
        )}

        {(data?.levels || []).map((lvl) => (
          <div key={lvl.level} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12, fontWeight: 600, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--brass)', margin: '14px 0 8px',
              }}
            >
              {pick(lvl.level_name, lang) || lvl.level}
            </div>
            {(lvl.courses || []).map((c, idx) => {
              const done = c.status === 'completed';
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/learning/course/${c.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
                    background: 'var(--bg-overlay)', border: '1px solid var(--line)', borderRadius: 10,
                    padding: '13px 16px', marginBottom: 8, cursor: 'pointer', color: 'inherit',
                    transition: 'border-color .15s, background .15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#E67E22'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; }}
                >
                  <span
                    style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      background: done ? 'rgba(80,180,120,0.18)' : 'var(--bg-elevated)',
                      color: done ? 'var(--success, #57b884)' : 'var(--brass)',
                      border: `1px solid ${done ? 'var(--success, #57b884)' : 'var(--line)'}`,
                    }}
                  >
                    {done ? 'OK' : idx + 1}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: 1.35 }}>
                      {pick(c.title, lang)}
                    </span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary, #9aa3b5)', marginTop: 2 }}>
                      {c.duration_minutes} {lang === 'uz' ? 'daq' : 'мин'}
                      {done && c.quiz_score != null ? ` · ${lang === 'uz' ? 'natija' : 'результат'} ${c.quiz_score}%` : ''}
                    </span>
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brass)' }}>
                    {done ? (lang === 'uz' ? 'Qayta' : 'Повторить') : (lang === 'uz' ? 'Boshlash' : 'Начать')}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
