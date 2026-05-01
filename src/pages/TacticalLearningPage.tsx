/**
 * TacticalLearningPage — Карта обучения в стиле Tactical HUD.
 * Адаптировано из handoff Claude Design (Traektoriya.zip 2026-05-01).
 *
 * Использует оригинальные классы из tactical-design.css:
 * .statusbar, .title-row, .grid (3-column layout 320|1fr|320), .glass-panel.
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { TacticalMap } from '../components/tactical/TacticalMap';
import { HeroPanel } from '../components/tactical/HeroPanel';
import { RecsPanel } from '../components/tactical/RecsPanel';
import { AwardsPanel } from '../components/tactical/AwardsPanel';
import { StatusBar } from '../components/tactical/StatusBar';
import { TacticalMobile } from '../components/tactical/TacticalMobile';
import type { MapNode, TerritoryMode } from '../components/tactical/types';
import { STATE_STYLES, NODES, ZONES } from '../components/tactical/data';
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
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [focusZone, setFocusZone] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [territoryMode] = useState<TerritoryMode>('biome');

  useEffect(() => {
    injectFonts();
  }, []);

  const handleSelect = (node: MapNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  const operatorName = user?.full_name || user?.employee_id || 'Оператор';
  const operatorRole = user?.role
    ? `${roleLabel(user.role)} · TASHKENT`
    : 'ОПЕРАТОР';

  // На мобильном — отдельный UX (sticky top, hero strip, pinch map, territory list,
  // friends strip, bottom tabs + sheet)
  if (isMobile) {
    return <TacticalMobile operatorName={operatorName} />;
  }

  // Подсчёт для title-meta (desktop)
  const totalSections = NODES.reduce((s, n) => s + (n.sections ?? 0), 0);
  const doneSections = NODES.reduce((s, n) => s + (n.done ?? 0), 0);
  const territoriesCount = ZONES.length;

  return (
    <div className="tactical-root">
      <StatusBar />

      <div className="title-row">
        <h1>Моя карта обучения</h1>
        <span className="tactical-tag" />
        <div className="title-meta">
          <span><b>{totalSections}</b> РАЗДЕЛОВ</span>
          <span><b>{territoriesCount}</b> ТЕРРИТОРИИ</span>
          <span><b>{doneSections}</b> ПРОЙДЕНО</span>
        </div>
      </div>

      <div className="grid">
        {/* Левая колонка: HeroPanel */}
        <HeroPanel
          onZoneFocus={setFocusZone}
          focusZone={focusZone}
          operatorName={operatorName}
          operatorRole={operatorRole}
        />

        {/* Центр: карта + детальная панель при выборе */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <TacticalMap
              focusZone={focusZone}
              selectedId={selectedNode?.id ?? null}
              onSelect={handleSelect}
              territoryMode={territoryMode}
            />
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
                {selectedNode.houses.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      border: '1px solid var(--line-soft)',
                      borderRadius: 6,
                      background: 'oklch(0.20 0.03 240 / 0.4)',
                    }}
                  >
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.15em' }}>
                      Раздел {i + 1}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: STATE_STYLES[h.s].stroke }}>
                      {STATE_STYLES[h.s].glyph} {STATE_STYLES[h.s].label}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-2)', letterSpacing: '0.12em', textAlign: 'right', paddingTop: 8, borderTop: '1px solid var(--line-soft)' }}>
                Прогресс: <strong style={{ color: 'var(--brass)', fontWeight: 700, fontSize: 14 }}>{selectedNode.done} / {selectedNode.sections}</strong>
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
