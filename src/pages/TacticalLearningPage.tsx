/**
 * TacticalLearningPage — Карта обучения в стиле Tactical HUD.
 * Адаптировано из handoff Claude Design (Traektoriya.zip 2026-05-01).
 *
 * Использует оригинальные классы из tactical-design.css:
 * .statusbar, .title-row, .grid (3-column layout 320|1fr|320), .glass-panel.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { TacticalMap } from '../components/tactical/TacticalMap';
import { HeroPanel } from '../components/tactical/HeroPanel';
// RecsPanel + AwardsPanel убраны UX-аудит 2026-05-03 (mock-данные).
// Вернуть когда будет реальная интеграция AI-рекомендаций и achievements.
import { StatusBar } from '../components/tactical/StatusBar';
import { TacticalMobile } from '../components/tactical/TacticalMobile';
import { GuidesPanel } from '../components/onboarding/GuidesPanel';
import type { MapNode, MapEdge, MapZone, TerritoryMode } from '../components/tactical/types';
import { STATE_STYLES } from '../components/tactical/data';
import { loadLearningMapData } from '../utils/mapLearningToNodes';
import '../styles/tactical-design.css';

const FONT_LINK_ID = 'tactical-fonts';

function injectFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FONT_LINK_ID)) return;
  const l = document.createElement('link');
  l.id = FONT_LINK_ID;
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap';
  document.head.appendChild(l);
}

// Роли, для которых есть курсы в БД (определяет селектор для admin/superadmin)
const ROLES_WITH_COURSES = [
  { value: 'sales_rep', label_ru: 'ТП — Торговый представитель', label_uz: 'TP — Savdo vakili' },
  { value: 'supervisor', label_ru: 'СВ — Супервайзер', label_uz: 'SV — Supervayzer' },
  { value: 'regional_manager', label_ru: 'РМ — Региональный менеджер', label_uz: 'RM — Mintaqaviy menejer' },
];

// Роли, у которых СВОЯ карта обучения (берётся напрямую user.role).
// Для остальных (admin/superadmin/trainer/commercial_dir/dealer и т.д.) — нет своих курсов,
// поэтому показываем селектор ролей и дефолтим на 'sales_rep'.
const SELF_LEARNING_ROLES = new Set(['sales_rep', 'supervisor', 'regional_manager']);

export function TacticalLearningPage() {
  const user = useAuthStore((s) => s.user);
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [focusZone, setFocusZone] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [territoryMode] = useState<TerritoryMode>('biome');

  // Для admin/superadmin/КД — селектор ролей. Для обычных юзеров — их собственная роль.
  const userRole = user?.role || 'sales_rep';
  const showRoleSelector = !SELF_LEARNING_ROLES.has(userRole);
  const [viewAsRole, setViewAsRole] = useState<string>(
    showRoleSelector ? 'sales_rep' : userRole,
  );

  // Реальные данные из learning API
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [zones, setZones] = useState<MapZone[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [doneCourses, setDoneCourses] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectFonts();
  }, []);

  // Загружаем данные при монтировании / смене viewAsRole / языка
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const role = viewAsRole || 'sales_rep';
    loadLearningMapData(role, lang)
      .then((data) => {
        if (cancelled) return;
        setNodes(data.nodes);
        setEdges(data.edges);
        setZones(data.zones);
        setTotalCourses(data.totalCourses);
        setDoneCourses(data.doneCourses);
      })
      .catch(() => {
        if (cancelled) return;
        // На ошибке оставляем пустую карту (fallback на mock не делаем)
        setNodes([]);
        setEdges([]);
        setZones([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [viewAsRole, lang]);

  const handleSelect = (node: MapNode) => {
    // Каждый узел = один курс → 1 клик открывает урок. Заблокированный — показываем инфо.
    const h = node.houses?.[0];
    if (h?.course_id && h.s !== 'locked') {
      openCourse(h.course_id);
    } else {
      setSelectedNode((prev) => (prev?.id === node.id ? null : node));
    }
  };

  // Открыть курс по ID (передаётся из bottom-sheet или нажатием на дом)
  const openCourse = (courseId: string) => {
    navigate(`/learning/course/${courseId}`);
  };

  const operatorName = user?.full_name || user?.employee_id || (lang === 'uz' ? 'Operator' : 'Оператор');
  const operatorRole = user?.role
    ? `${roleLabel(user.role, lang)} · TASHKENT`
    : (lang === 'uz' ? 'OPERATOR' : 'ОПЕРАТОР');

  // На мобильном — отдельный UX
  if (isMobile) {
    return (
      <TacticalMobile
        operatorName={operatorName}
        nodes={nodes}
        edges={edges}
        zones={zones}
        totalCourses={totalCourses}
        doneCourses={doneCourses}
        loading={loading}
        onOpenCourse={openCourse}
        roleSelector={
          showRoleSelector ? (
            <RoleSelector value={viewAsRole} onChange={setViewAsRole} lang={lang} />
          ) : null
        }
      />
    );
  }

  // Title-meta из реальных данных
  const territoriesCount = zones.length;

  return (
    <div className="tactical-root">
      <StatusBar />

      <div className="title-row">
        <h1>{lang === 'uz' ? "Mening o'qish xaritam" : 'Моя карта обучения'}</h1>
        <span className="tactical-tag" />
        {showRoleSelector && (
          <div style={{ marginLeft: 16 }}>
            <RoleSelector value={viewAsRole} onChange={setViewAsRole} lang={lang} />
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate('/case-studio')}
          style={{
            marginLeft: 16,
            background: 'var(--bg-overlay)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '6px 12px',
            color: 'var(--brass)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brass)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.background = 'var(--bg-overlay)';
          }}
          title={lang === 'uz' ? 'Keyslar bazasi' : 'Кейсотека'}
        >
          {lang === 'uz' ? 'Keyslar bazasi' : 'Кейсотека'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/learning/hall-of-fame')}
          style={{
            marginLeft: 12,
            background: 'var(--bg-overlay)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            padding: '6px 12px',
            color: 'var(--brass)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--brass)';
            e.currentTarget.style.background = 'var(--bg-elevated)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--line)';
            e.currentTarget.style.background = 'var(--bg-overlay)';
          }}
          title={lang === 'uz' ? "Shon-shuhrat zali · Kubok 2025" : 'Зал славы · Кубок 2025'}
        >
          {lang === 'uz' ? 'Tarix 2025' : 'История 2025'}
        </button>
        <div className="title-meta">
          <span><b>{totalCourses}</b> {lang === 'uz' ? 'KURSLAR' : 'КУРСОВ'}</span>
          <span><b>{territoriesCount}</b> {lang === 'uz' ? 'HUDUDLAR' : 'ТЕРРИТОРИИ'}</span>
          <span><b>{doneCourses}</b> {lang === 'uz' ? "O'TILDI" : 'ПРОЙДЕНО'}</span>
        </div>
      </div>

      <div className="tactical-grid">
        {/* Левая колонка: HeroPanel */}
        <HeroPanel
          onZoneFocus={setFocusZone}
          focusZone={focusZone}
          operatorName={operatorName}
          operatorRole={operatorRole}
          zones={zones}
          totalCourses={totalCourses}
          doneCourses={doneCourses}
        />

        {/* Центр: карта + детальная панель при выборе */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GuidesPanel />
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em' }}>
                {lang === 'uz' ? 'XARITA YUKLANMOQDA...' : 'ЗАГРУЗКА КАРТЫ...'}
              </div>
            ) : nodes.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em' }}>
                <div>{lang === 'uz' ? 'KURSLAR TOPILMADI' : 'КУРСЫ НЕ НАЙДЕНЫ'}</div>
                {showRoleSelector && (
                  <div style={{ marginTop: 16, fontSize: 13, letterSpacing: '0.05em', textTransform: 'none', opacity: 0.7 }}>
                    {lang === 'uz'
                      ? 'Yuqoridagi rol tanlovchi orqali boshqa rolni tanlang.'
                      : 'Выберите другую роль через переключатель в шапке.'}
                  </div>
                )}
              </div>
            ) : (
              <TacticalMap
                focusZone={focusZone}
                selectedId={selectedNode?.id ?? null}
                onSelect={handleSelect}
                territoryMode={territoryMode}
                nodes={nodes}
                edges={edges}
                zones={zones}
              />
            )}
          </div>

          {selectedNode && (
            <div
              onClick={() => setSelectedNode(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'oklch(0 0 0 / 0.6)', backdropFilter: 'blur(2px)', padding: 24 }}
            >
            <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div className="panel-header">
                <span className="panel-label">УЗЕЛ · {selectedNode.code}</span>
                <span
                  className="panel-code"
                  style={{ color: STATE_STYLES[selectedNode.state].stroke }}
                >
                  {STATE_STYLES[selectedNode.state].glyph} {STATE_STYLES[selectedNode.state].label.toUpperCase()}
                </span>
                <button
                  onClick={() => setSelectedNode(null)}
                  aria-label="Закрыть"
                  style={{
                    marginLeft: 'auto',
                    background: 'transparent',
                    border: '1px solid var(--line)',
                    color: 'var(--text-2)',
                    borderRadius: 4,
                    width: 24,
                    height: 24,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 14, color: 'var(--text-0)' }}>
                {selectedNode.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {selectedNode.houses.map((h, i) => {
                  const clickable = !!h.course_id && h.s !== 'locked';
                  return (
                    <button
                      key={i}
                      onClick={() => h.course_id && clickable && openCourse(h.course_id)}
                      disabled={!clickable}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        border: '1px solid var(--line-soft)',
                        borderRadius: 6,
                        background: 'var(--bg-overlay)',
                        cursor: clickable ? 'pointer' : 'not-allowed',
                        textAlign: 'left',
                        font: 'inherit',
                        color: 'inherit',
                        opacity: clickable ? 1 : 0.6,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (clickable) e.currentTarget.style.background = 'var(--bg-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        if (clickable) e.currentTarget.style.background = 'var(--bg-overlay)';
                      }}
                    >
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--text-2)', letterSpacing: '0.15em' }}>
                          {lang === 'uz' ? `KURS ${i + 1}` : `КУРС ${i + 1}`}
                        </span>
                        {h.course_title && (
                          <span style={{ fontSize: 13, color: 'var(--text-0)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {h.course_title}
                          </span>
                        )}
                      </span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: STATE_STYLES[h.s].stroke, flexShrink: 0, marginLeft: 12 }}>
                        {STATE_STYLES[h.s].glyph} {STATE_STYLES[h.s].label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.12em', textAlign: 'right', paddingTop: 8, borderTop: '1px solid var(--line-soft)' }}>
                {lang === 'uz' ? 'Jarayon' : 'Прогресс'}: <strong style={{ color: 'var(--brass)', fontWeight: 700, fontSize: 14 }}>{selectedNode.done} / {selectedNode.sections}</strong>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Правая колонка скрыта (UX-аудит 2026-05-03):
            RecsPanel и AwardsPanel были на mock-данных без реальной интеграции.
            Вернуть когда будет: AI-рекомендации курсов по KPI gap + реальная
            система achievements. Пока освобождаем место для карты. */}
      </div>
    </div>
  );
}

function roleLabel(role: string, lang: 'ru' | 'uz' = 'ru'): string {
  const ru: Record<string, string> = {
    superadmin: 'СУПЕРАДМИН',
    admin: 'АДМИН',
    commercial_dir: 'КОМ. ДИРЕКТОР',
    regional_manager: 'РЕГ. МЕНЕДЖЕР',
    supervisor: 'СУПЕРВАЙЗЕР',
    sales_rep: 'ТП',
    trainer: 'ТРЕНЕР',
  };
  const uz: Record<string, string> = {
    superadmin: 'SUPERADMIN',
    admin: 'ADMIN',
    commercial_dir: 'KOM. DIREKTOR',
    regional_manager: 'REG. MENEJER',
    supervisor: 'SUPERVAYZER',
    sales_rep: 'TP',
    trainer: 'TRENER',
  };
  const map = lang === 'uz' ? uz : ru;
  return map[role] || role.toUpperCase();
}

/**
 * Селектор «Просматриваю карту как…» для admin/superadmin/КД/тренера.
 * Видим в шапке только когда у юзера нет своих курсов (admin/cd/trainer).
 */
function RoleSelector({
  value,
  onChange,
  lang,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: 'ru' | 'uz';
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        padding: '6px 10px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 12,
        letterSpacing: '0.08em',
        color: 'var(--text-1)',
      }}
    >
      <span style={{ color: 'var(--text-2)', textTransform: 'uppercase' }}>
        {lang === 'uz' ? 'Koʻrish:' : 'Смотрю как:'}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'transparent',
          color: 'var(--text-0)',
          border: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {ROLES_WITH_COURSES.map((r) => (
          <option key={r.value} value={r.value} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
            {lang === 'uz' ? r.label_uz : r.label_ru}
          </option>
        ))}
      </select>
    </label>
  );
}
