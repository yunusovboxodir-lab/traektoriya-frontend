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
import { RecsPanel } from '../components/tactical/RecsPanel';
import { AwardsPanel } from '../components/tactical/AwardsPanel';
import { StatusBar } from '../components/tactical/StatusBar';
import { TacticalMobile } from '../components/tactical/TacticalMobile';
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

export function TacticalLearningPage() {
  const user = useAuthStore((s) => s.user);
  const lang = useLangStore((s) => s.lang);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [focusZone, setFocusZone] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [territoryMode] = useState<TerritoryMode>('biome');

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

  // Загружаем данные при монтировании / смене роли пользователя / языка
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const role = user?.role || 'sales_rep';
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
  }, [user?.role, lang]);

  const handleSelect = (node: MapNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  // Открыть курс по ID (передаётся из bottom-sheet или нажатием на дом)
  const openCourse = (courseId: string) => {
    navigate(`/learning/course/${courseId}`);
  };

  const operatorName = user?.full_name || user?.employee_id || 'Оператор';
  const operatorRole = user?.role
    ? `${roleLabel(user.role)} · TASHKENT`
    : 'ОПЕРАТОР';

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
        <div className="title-meta">
          <span><b>{totalCourses}</b> {lang === 'uz' ? 'KURSLAR' : 'КУРСОВ'}</span>
          <span><b>{territoriesCount}</b> {lang === 'uz' ? 'HUDUDLAR' : 'ТЕРРИТОРИИ'}</span>
          <span><b>{doneCourses}</b> {lang === 'uz' ? "O'TILDI" : 'ПРОЙДЕНО'}</span>
        </div>
      </div>

      <div className="grid">
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
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em' }}>
                {lang === 'uz' ? 'XARITA YUKLANMOQDA...' : 'ЗАГРУЗКА КАРТЫ...'}
              </div>
            ) : nodes.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-2)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.18em' }}>
                {lang === 'uz' ? 'KURSLAR TOPILMADI' : 'КУРСЫ НЕ НАЙДЕНЫ'}
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
            <div className="glass-panel" style={{ position: 'relative' }}>
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
                        background: 'oklch(0.20 0.03 240 / 0.4)',
                        cursor: clickable ? 'pointer' : 'not-allowed',
                        textAlign: 'left',
                        font: 'inherit',
                        color: 'inherit',
                        opacity: clickable ? 1 : 0.6,
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (clickable) e.currentTarget.style.background = 'oklch(0.25 0.04 240 / 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        if (clickable) e.currentTarget.style.background = 'oklch(0.20 0.03 240 / 0.4)';
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
          )}
        </div>

        {/* Правая колонка: RecsPanel + AwardsPanel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <RecsPanel />
          <AwardsPanel />
        </div>
      </div>
    </div>
  );
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    superadmin: 'СУПЕРАДМИН',
    admin: 'АДМИН',
    commercial_dir: 'КОМ. ДИРЕКТОР',
    regional_manager: 'РЕГ. МЕНЕДЖЕР',
    supervisor: 'СУПЕРВАЙЗЕР',
    sales_rep: 'ТП',
  };
  return map[role] || role.toUpperCase();
}
