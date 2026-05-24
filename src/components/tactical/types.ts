/**
 * Tactical Dashboard types — карта обучения в стиле Tactical HUD.
 * Адаптировано из Claude Design handoff (Traektoriya.zip 2026-05-01).
 *
 * TRJ-046 (2026-05-18): MapZone.label/sub стали BiText — рендер
 * локализуется через `bl()` helper из utils/bilingual.ts. Это закрывает
 * критический баг: ранее zone-названия всегда показывались на RU, даже
 * при UZ-режиме, потому что приходили из констант фронта (не из API).
 */

import type { BiText } from '../../utils/bilingual';

export type NodeState = 'done' | 'active' | 'new' | 'locked' | 'mastered';

export interface MapHouse {
  s: NodeState;
  /** ID реального курса (когда узлы построены из learning API) */
  course_id?: string;
  /** Название курса для tooltip */
  course_title?: string;
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
  /** Имя зоны — bilingual. Рендер через `bl(zone.label, lang)`. */
  label: BiText;
  /** Подзаголовок зоны (напр. «ТЕРРИТОРИЯ 1» / «HUDUD 1»). */
  sub: BiText;
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
  /** Подпись статуса — bilingual. Рендер через `bl(s.label, lang)`. TRJ-046 (2026-05-18). */
  label: BiText;
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
