/**
 * Tactical Dashboard types — карта обучения в стиле Tactical HUD.
 * Адаптировано из Claude Design handoff (Traektoriya.zip 2026-05-01).
 */

export type NodeState = 'done' | 'active' | 'new' | 'locked' | 'mastered';

export interface MapHouse {
  s: NodeState;
}

export interface MapNode {
  id: string;
  code: string;
  title: string;
  state: NodeState;
  houses: MapHouse[];
  zone: number;
  /** Нормализованная позиция [0..1] на ширине карты */
  x: number;
  /** Нормализованная позиция [0..1] на высоте карты */
  y: number;
  /** Вычисленные пиксельные координаты после layout */
  _px?: number;
  _py?: number;
  /** Кол-во пройденных домов (computed) */
  done?: number;
  /** Всего домов (computed) */
  sections?: number;
}

export interface MapZone {
  id: string;
  label: string;
  sub: string;
  count: number;
  x: number;
  w: number;
  cx: number;
  cy: number;
  accent: string;
}

export type MapEdge = [string, string];

export type TerritoryMode = 'biome' | 'flag' | 'topo' | 'forcefield';

export interface StateStyle {
  stroke: string;
  fill: string;
  glyph: string;
  label: string;
}

export interface Recommendation {
  code: string;
  title: string;
  sub: string;
  tag: string;
  tagC: string;
  xp: number;
}

export interface TeamMember {
  n: string;
  r: string;
  p: number;
  s: string;
}

export interface Award {
  code: string;
  glyph: string;
  name: string;
  sub: string;
  color: string;
  locked?: boolean;
}
