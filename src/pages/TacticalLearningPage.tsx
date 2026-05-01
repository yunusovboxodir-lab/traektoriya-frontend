/**
 * TacticalLearningPage — Карта обучения в стиле Tactical HUD.
 * Адаптировано из handoff Claude Design (Traektoriya.zip 2026-05-01).
 *
 * Layout (1480px reference):
 *   StatusBar (top)
 *   ┌────────────┬──────────────────────────┬──────────────┐
 *   │ HeroPanel  │   TacticalMap (центр)    │ RecsPanel    │
 *   │ (left)     │                          │ + AwardsPanel│
 *   └────────────┴──────────────────────────┴──────────────┘
 *
 * Сейчас работает в demo-режиме с захардкоженными NODES/ZONES/EDGES
 * из прототипа. Подключение к реальным курсам — следующая итерация
 * (mapSectionsToNodes из learning API).
 */
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { TacticalMap } from '../components/tactical/TacticalMap';
import { HeroPanel } from '../components/tactical/HeroPanel';
import { RecsPanel } from '../components/tactical/RecsPanel';
import { AwardsPanel } from '../components/tactical/AwardsPanel';
import { StatusBar } from '../components/tactical/StatusBar';
import type { MapNode, TerritoryMode } from '../components/tactical/types';
import { STATE_STYLES } from '../components/tactical/data';
import '../styles/tactical-design.css';

export function TacticalLearningPage() {
  const user = useAuthStore((s) => s.user);
  const [focusZone, setFocusZone] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [territoryMode] = useState<TerritoryMode>('biome');

  const handleSelect = (node: MapNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
  };

  const operatorName = user?.full_name || user?.employee_id || 'Оператор';
  const operatorRole = user?.role
    ? `${roleLabel(user.role)} · TASHKENT`
    : 'ОПЕРАТОР';

  return (
    <div className="tactical-root">
      <StatusBar />
      <main className="tactical-main">
        <aside className="tactical-left">
          <HeroPanel
            onZoneFocus={setFocusZone}
            focusZone={focusZone}
            operatorName={operatorName}
            operatorRole={operatorRole}
          />
        </aside>

        <section className="tactical-center">
          <div className="tactical-map-wrap">
            <TacticalMap
              focusZone={focusZone}
              selectedId={selectedNode?.id ?? null}
              onSelect={handleSelect}
              territoryMode={territoryMode}
            />
          </div>

          {/* Detail panel — показывается при выборе узла */}
          {selectedNode && (
            <div className="tactical-detail">
              <div className="detail-head">
                <span className="detail-code">{selectedNode.code}</span>
                <span
                  className="detail-state"
                  style={{ color: STATE_STYLES[selectedNode.state].stroke }}
                >
                  {STATE_STYLES[selectedNode.state].glyph} {STATE_STYLES[selectedNode.state].label}
                </span>
                <button
                  className="detail-close"
                  onClick={() => setSelectedNode(null)}
                  aria-label="Закрыть"
                >
                  ✕
                </button>
              </div>
              <div className="detail-title">{selectedNode.title}</div>
              <div className="detail-houses">
                {selectedNode.houses.map((h, i) => (
                  <div
                    key={i}
                    className={`house-row house-${h.s}`}
                  >
                    <span className="house-num">Раздел {i + 1}</span>
                    <span
                      className="house-state"
                      style={{ color: STATE_STYLES[h.s].stroke }}
                    >
                      {STATE_STYLES[h.s].glyph} {STATE_STYLES[h.s].label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="detail-progress">
                Прогресс: <strong>{selectedNode.done} / {selectedNode.sections}</strong>
              </div>
            </div>
          )}
        </section>

        <aside className="tactical-right">
          <RecsPanel />
          <AwardsPanel />
        </aside>
      </main>
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
