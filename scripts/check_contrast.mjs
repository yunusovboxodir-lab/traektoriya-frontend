#!/usr/bin/env node
/**
 * Гейт контраста текста (2026-08-02).
 *
 * Зачем: 02.08.2026 на карточке товара (вкладка «Продажи», блок «Работа с
 * возражениями») тело ответа читалось 1.72–1.88:1 при норме WCAG AA 4.5:1.
 * Тот же дефект уже ловили руками 12.07.2026 на формах календаря (stone-*).
 * Ловить глазами — значит ловить третий раз; отсюда этот гейт.
 *
 * Механика дефекта. Платформа переехала на тёмную тему не переписыванием
 * компонентов, а СЛОЯМИ СОВМЕСТИМОСТИ в CSS:
 *   src/index.css                — обычные страницы (:not(.tactical-root))
 *   src/styles/tactical-design.css — тактические (.tactical-root)
 * Слои перехватывают «светлые» Tailwind-классы и подменяют их токенами.
 * Нейтральные палитры (gray/slate/stone) в них были, цветные — нет: фон
 * bg-green-50 затемнялся в --success-bg, а текст text-green-800 оставался
 * тёмно-зелёным. Тёмное на тёмном.
 *
 * Что делает гейт:
 *   1. читает токены обеих тем из index.css (:root = тёмная, [data-theme="light"]);
 *   2. читает из ОБОИХ слоёв правила `.text-<палитра>-<оттенок> { color: var(--токен) }`;
 *   3. собирает text-классы, реально встречающиеся в src/**;
 *   4. считает фактический цвет класса (токен, если перекрашен; иначе палитра
 *      Tailwind) и контраст к поверхностям, на которых он может лежать:
 *      --bg-card, --bg-elevated и одноимённый по тону тинт (зелёный текст →
 *      --success-bg, красный → --danger-bg и т.д. — ровно тот идиом, что сломался);
 *   5. валит сборку, если хоть одно сочетание < 4.5:1.
 *
 * Проверяются ОБЕ темы × ОБА слоя: класс обязан быть читаем в любом сочетании,
 * потому что один и тот же компонент рендерится и внутри .tactical-root, и вне.
 *
 * Границы (важно, чтобы не переоценивать гейт):
 *   • он НЕ разбирает вложенность JSX и не знает фактический фон под текстом —
 *     проверяет типовые поверхности платформы. Этого достаточно, чтобы «тёмное
 *     на тёмном» не проходило, но нестандартные сочетания (текст на сплошной
 *     яркой заливке) остаются на ревью;
 *   • он смотрит только Tailwind-классы вида text-<палитра>-<оттенок>;
 *     инлайновые style и произвольные значения text-[#hex] не покрыты.
 *
 * Базлайн (тот же приём, что у check_i18n_baseline.mjs). На момент включения
 * тёмная тема — база платформы — чиста, а в СВЕТЛОЙ нашлось 28 классов ниже
 * нормы: это отдельная, более старая дыра (светлый слой закрывает оттенки
 * 200–400, но не 100/500/600). Чинить их пачкой вслепую опасно — часть таких
 * классов может стоять на сплошных заливках, где перекраска их сломает.
 * Поэтому долг зафиксирован в scripts/contrast-baseline.json и не может расти:
 * новый провалившийся класс или ухудшение уже известного валят сборку.
 * Обновить после чистки: node scripts/check_contrast.mjs --update
 *
 * Исключения: scripts/contrast-allowlist.json, причина обязательна.
 * Запуск:  node scripts/check_contrast.mjs [--report] [--update]
 *          --report — таблица по всем классам, не только по провалам.
 */
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const require = createRequire(import.meta.url);

const AA_NORMAL = 4.5;          // WCAG 2.1 AA, обычный текст
const SRC_DIR = join(ROOT, 'src');
const CSS_PLAIN = join(ROOT, 'src', 'index.css');
const CSS_TACTICAL = join(ROOT, 'src', 'styles', 'tactical-design.css');
const ALLOWLIST_FILE = join(__dirname, 'contrast-allowlist.json');
const BASELINE_FILE = join(__dirname, 'contrast-baseline.json');
const EPS = 0.02;               // допуск на округление при сверке с базлайном

const PALETTES = [
  'red', 'rose', 'pink', 'green', 'emerald', 'teal', 'lime',
  'blue', 'sky', 'cyan', 'amber', 'yellow', 'orange',
  'purple', 'violet', 'indigo', 'fuchsia',
  'gray', 'slate', 'zinc', 'neutral', 'stone',
];
// Подложки-«тинты», на которых цветной текст лежит по идиоме платформы
// («заметка в рамке»): bg-<тон>-50 / -100. Их фактический цвет вычисляется
// из CSS — часть перекрашена слоями в токены, часть осталась светлой.
const TINT_SHADES = ['50', '100'];

// ============================================================================
// Цвет: парсинг, композит по альфе, контраст
// ============================================================================

function parseColor(str) {
  if (!str) return null;
  const s = String(str).trim();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i);
  if (m) {
    let a = m[4] === undefined ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return [+m[1], +m[2], +m[3], a];
  }
  return null; // oklch/hsl и прочее — сознательно не разбираем, см. «Границы»
}

/** Кладём цвет с альфой на непрозрачную подложку. */
function flatten(color, backdrop) {
  const [r, g, b, a] = color;
  if (a >= 1) return [r, g, b, 1];
  return [
    Math.round(a * r + (1 - a) * backdrop[0]),
    Math.round(a * g + (1 - a) * backdrop[1]),
    Math.round(a * b + (1 - a) * backdrop[2]),
    1,
  ];
}

function luminance([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();

// ============================================================================
// Разбор CSS: правила, токены, ремапы
// ============================================================================

/**
 * Разбор CSS в список { selector, body }.
 *
 * Посимвольный, а не регуляркой: регулярка `([^{}]+)\{([^{}]*)\}` цепляет к
 * первому селектору весь предшествующий преамбул (@import/@tailwind), из-за
 * чего `:root` не опознавался и токены ТЁМНОЙ темы не собирались вообще —
 * гейт молча проверял только светлую. Поймано на приёмочном тесте 02.08.2026.
 * Заодно корректно переживает вложенность (@media/@supports).
 */
function cssRules(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const stack = [];
  let buf = '';
  for (const ch of clean) {
    if (ch === '{') {
      stack.push(buf);
      buf = '';
    } else if (ch === '}') {
      const raw = stack.pop() ?? '';
      // селектор — то, что после последней `;` (отсекает @import/@tailwind/…)
      const selector = raw.slice(raw.lastIndexOf(';') + 1).trim().replace(/\s+/g, ' ');
      if (selector) rules.push({ selector, body: buf });
      buf = '';
    } else {
      buf += ch;
    }
  }
  return rules;
}

function declarations(body) {
  const out = {};
  for (const part of body.split(';')) {
    const i = part.indexOf(':');
    if (i === -1) continue;
    out[part.slice(0, i).trim()] = part.slice(i + 1).replace(/!important/g, '').trim();
  }
  return out;
}

/** Токены темы: :root → тёмная, [data-theme="light"] → светлая. */
function readTokens(cssText) {
  const dark = {};
  const light = {};
  for (const { selector, body } of cssRules(cssText)) {
    const isRoot = /(^|,\s*):root$/.test(selector) || selector === ':root';
    const isLight = /\[data-theme="light"\]$/.test(selector);
    if (!isRoot && !isLight) continue;
    for (const [k, v] of Object.entries(declarations(body))) {
      if (k.startsWith('--')) (isLight ? light : dark)[k] = v;
    }
  }
  return { dark, light };
}

/** Разворачиваем var(--a) → var(--b) → значение. */
function resolveToken(name, table, depth = 0) {
  if (depth > 10) return null;
  const raw = table[name];
  if (!raw) return null;
  const m = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (m) return resolveToken(m[1], table, depth + 1);
  return parseColor(raw);
}

/**
 * Ремапы из слоя совместимости — для текста (prefix 'text', свойство color)
 * или для фона (prefix 'bg', свойства background/background-color).
 *
 * Фоны читаем из CSS, а не додумываем: слои перекрашивают bg-red-50/green-50/
 * blue-50/amber-50/orange-50, но НЕ indigo/purple/violet/teal/cyan. Для
 * неперекрашенных `bg-indigo-50` остаётся светло-сиреневым даже в тёмной теме,
 * и тёмный `text-indigo-600` на нём читается нормально. Допущение «цветной
 * текст лежит на тинте своего тона» дало бы здесь ложную тревогу.
 *
 * Возвращает Map: "text-green-800" → [{ token, literal, layer, theme }]
 *   layer: 'plain' | 'tactical' | 'both'
 *   theme: 'dark' | 'light' | 'both'
 */
function readRemaps(cssText, defaultLayer, prefix) {
  const props = prefix === 'bg' ? ['background-color', 'background'] : ['color'];
  const map = new Map();
  for (const { selector, body } of cssRules(cssText)) {
    const decls = declarations(body);
    const value = props.map((p) => decls[p]).find(Boolean);
    if (!value) continue;
    const tokenMatch = value.match(/var\(\s*(--[\w-]+)\s*\)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    const literal = token ? null : parseColor(value);
    if (!token && !literal) continue;

    // оттенок необязателен: .bg-white тоже надо поймать (он и есть карточка)
    const re = new RegExp(`\\.${prefix}-([a-z]+)(?:-(\\d{2,3}))?\\b`, 'g');
    const classes = [...selector.matchAll(re)];
    if (!classes.length) continue;

    const layer = selector.includes(':not(.tactical-root')
      ? 'plain'
      : selector.includes('.tactical-root')
        ? 'tactical'
        : defaultLayer;
    const theme = selector.includes('[data-theme="light"]')
      ? 'light'
      : selector.includes('[data-theme="dark"]')
        ? 'dark'
        : 'both';

    for (const c of classes) {
      const cls = c[2] ? `${prefix}-${c[1]}-${c[2]}` : `${prefix}-${c[1]}`;
      if (!map.has(cls)) map.set(cls, []);
      map.get(cls).push({ token, literal, layer, theme });
    }
  }
  return map;
}

// ============================================================================
// Скан исходников
// ============================================================================

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(entry)) acc.push(p);
  }
  return acc;
}

/**
 * Пары «текст × фон, на котором он реально лежит» — из настоящего дерева JSX.
 *
 * Фон и текст почти никогда не стоят в одном className: в исходном дефекте
 * `bg-green-50` был на родительском div, а `text-green-800` — на вложенном <p>.
 * Поэтому фоном считается БЛИЖАЙШИЙ ПРЕДОК (или сам элемент), у которого фон
 * объявлен. Если такого предка нет — текст лежит на штатной поверхности.
 *
 * Почему парсер, а не «поиск в соседних строках»: строчная эвристика с окном
 * в 10 строк дала 633 выдуманные пары вроде «text-red-700 на bg-sky-500» —
 * в плотном JSX рядом оказывается что угодно. Гейт с таким шумом просто
 * замьютят.
 *
 * Оговорка: если в одном className несколько фонов (условная вёрстка,
 * `cond ? 'bg-red-500' : 'bg-green-500'`), ветку выбрать нельзя — такой элемент
 * фон НЕ задаёт, и текст сверяется с фоном предка. Иначе гейт ругался бы на
 * заведомо несуществующие сочетания «зелёный текст на красной ветке».
 */
const SURFACE = '__поверхность__';
const CLS_RE = new RegExp(`\\b(text|bg)-(white|${PALETTES.join('|')})(?:-(\\d{2,3}))?\\b`, 'g');

/** Классы из атрибута className — включая строки внутри cn()/тернарников. */
function classesOfAttribute(attr, ts) {
  const found = { text: [], bg: [] };
  if (!attr) return found;
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      for (const m of node.text.matchAll(CLS_RE)) {
        if (m[1] === 'bg') found.bg.push(m[0]);
        else if (m[3]) found.text.push(m[0]);   // text-white не судим
      }
    } else if (ts.isTemplateExpression(node)) {
      for (const span of [node.head, ...node.templateSpans.map((s) => s.literal)]) {
        for (const m of span.text.matchAll(CLS_RE)) {
          if (m[1] === 'bg') found.bg.push(m[0]);
          else if (m[3]) found.text.push(m[0]);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(attr);
  return found;
}

async function collectPairs() {
  const ts = (await import('typescript')).default;
  const pairs = new Map(); // "textCls|bgCls" → { textCls, bgCls, places: [] }

  for (const file of walk(SRC_DIR)) {
    const rel = relative(ROOT, file).replace(/\\/g, '/');
    const text = readFileSync(file, 'utf-8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);

    const walkJsx = (node, inheritedBg) => {
      let bgHere = inheritedBg;
      const opening = ts.isJsxElement(node) ? node.openingElement
        : ts.isJsxSelfClosingElement(node) ? node : null;

      if (opening) {
        const attr = opening.attributes.properties.find(
          (p) => ts.isJsxAttribute(p) && p.name.getText() === 'className'
        );
        const { text: textCls, bg: bgCls } = classesOfAttribute(attr?.initializer, ts);

        // однозначный фон — становится фоном для себя и потомков
        if (bgCls.length === 1) bgHere = bgCls[0];

        for (const cls of textCls) {
          const line = sf.getLineAndCharacterOfPosition(opening.getStart(sf)).line + 1;
          const bg = bgHere ?? SURFACE;
          const key = `${cls}|${bg}`;
          if (!pairs.has(key)) pairs.set(key, { textCls: cls, bgCls: bg, places: [] });
          pairs.get(key).places.push({ file: rel, line });
        }
      }
      ts.forEachChild(node, (child) => walkJsx(child, bgHere));
    };
    walkJsx(sf, null);
  }
  return pairs;
}

// ============================================================================
// Проверка
// ============================================================================

function tailwindPalette() {
  // Внутренний путь не печатает deprecation-варнинги про lightBlue/warmGray.
  try {
    const c = require('tailwindcss/lib/public/colors.js');
    return c.default || c;
  } catch {
    const c = require('tailwindcss/colors.js');
    return c.default || c;
  }
}

function effectiveColor(cls, palette, remaps, tokens, layer, theme) {
  const rules = remaps.get(cls) || [];
  const applicable = rules.filter(
    (r) => (r.layer === 'both' || r.layer === layer) && (r.theme === 'both' || r.theme === theme)
  );
  // побеждает последнее подходящее правило — как в каскаде при равной специфичности
  const win = applicable[applicable.length - 1];
  if (win) {
    if (win.literal) return { color: win.literal, source: 'литерал в слое' };
    const c = resolveToken(win.token, tokens);
    if (c) return { color: c, source: win.token };
    return null; // токен не разрешился (oklch и т.п.) — не судим
  }
  const m = cls.match(/^(?:text|bg)-([a-z]+)(?:-(\d{2,3}))?$/);
  if (!m) return null;
  const entry = palette[m[1]];
  const raw = m[2] ? entry?.[m[2]] : (typeof entry === 'string' ? entry : null);
  const c = parseColor(raw);
  return c ? { color: c, source: 'палитра Tailwind (не перекрашен)' } : null;
}

async function main() {
  const reportAll = process.argv.includes('--report');

  const indexCss = readFileSync(CSS_PLAIN, 'utf-8');
  const tacticalCss = readFileSync(CSS_TACTICAL, 'utf-8');
  const tokens = readTokens(indexCss);

  const merge = (prefix) => {
    const out = new Map();
    for (const [cls, rules] of readRemaps(indexCss, 'both', prefix)) out.set(cls, rules);
    for (const [cls, rules] of readRemaps(tacticalCss, 'tactical', prefix)) {
      out.set(cls, [...(out.get(cls) || []), ...rules]);
    }
    return out;
  };
  const remaps = merge('text');
  const bgRemaps = merge('bg');

  const allowlist = existsSync(ALLOWLIST_FILE)
    ? JSON.parse(readFileSync(ALLOWLIST_FILE, 'utf-8'))
    : {};
  const palette = tailwindPalette();
  const pairs = await collectPairs();

  const failures = [];
  const rows = [];

  for (const { textCls, bgCls, places } of [...pairs.values()]
    .sort((a, b) => (a.textCls + a.bgCls).localeCompare(b.textCls + b.bgCls))) {
    let worst = null;

    for (const theme of ['dark', 'light']) {
      const table = theme === 'light'
        ? { ...tokens.dark, ...tokens.light }   // светлая тема доопределяет тёмную
        : tokens.dark;
      const card = resolveToken('--bg-card', table);
      const elevated = resolveToken('--bg-elevated', table);
      if (!card) continue;

      for (const layer of ['plain', 'tactical']) {
        const eff = effectiveColor(textCls, palette, remaps, table, layer, theme);
        if (!eff) continue;
        const fg = flatten(eff.color, card);

        // Фон: либо конкретный класс рядом в разметке, либо штатная поверхность.
        let surfaces;
        if (bgCls === SURFACE) {
          surfaces = [
            ['--bg-card', flatten(card, card)],
            ...(elevated ? [['--bg-elevated', flatten(elevated, card)]] : []),
          ];
        } else {
          const effBg = effectiveColor(bgCls, palette, bgRemaps, table, layer, theme);
          if (!effBg) continue;
          surfaces = [[bgCls, flatten(effBg.color, card)]];
        }

        for (const [surfName, bg] of surfaces) {
          const cr = contrast(fg, bg);
          const rec = {
            cls: textCls, bgCls, theme, layer, surface: surfName, ratio: cr,
            fg: hex(fg), bg: hex(bg), source: eff.source, places,
          };
          rows.push(rec);
          if (!worst || cr < worst.ratio) worst = rec;
        }
      }
    }

    if (!worst) continue;
    if (worst.ratio < AA_NORMAL && !allowlist[textCls] && !allowlist[`${textCls}|${bgCls}`]) {
      failures.push(worst);
    }
  }

  const pairKey = (r) => `${r.cls} на ${r.bgCls === SURFACE ? 'поверхности' : r.bgCls}`;

  // ---- вывод ----
  if (reportAll) {
    const byPair = new Map();
    for (const r of rows) {
      const k = pairKey(r);
      const cur = byPair.get(k);
      if (!cur || r.ratio < cur.ratio) byPair.set(k, r);
    }
    console.log('\nХудший контраст по каждой паре «текст × фон» (по обеим темам и слоям):\n');
    for (const [k, r] of [...byPair].sort((a, b) => a[1].ratio - b[1].ratio)) {
      const mark = r.ratio >= AA_NORMAL ? 'OK    ' : 'ПРОВАЛ';
      console.log(
        `  ${mark} ${r.ratio.toFixed(2).padStart(6)}:1  ${k.padEnd(44)} ` +
        `${r.theme}/${r.layer}  ${r.fg} → ${r.bg}  [${r.source}]`
      );
    }
  }

  const allowed = Object.keys(allowlist).length;
  console.log(
    `\n[contrast] пар «текст × фон» в коде: ${pairs.size} · сочетаний проверено: ${rows.length}` +
    (allowed ? ` · в allowlist: ${allowed}` : '')
  );

  // ---- сверка с базлайном ----
  if (process.argv.includes('--update')) {
    const пары = {};
    for (const f of failures.sort((a, b) => pairKey(a).localeCompare(pairKey(b)))) {
      пары[pairKey(f)] = {
        контраст: +f.ratio.toFixed(2),
        тема: f.theme, слой: f.layer,
        встречается: f.places.length,
        пример: `${f.places[0].file}:${f.places[0].line}`,
      };
    }
    writeFileSync(BASELINE_FILE, JSON.stringify({
      _что: 'Унаследованный долг по контрасту. Гейт не даёт ему расти: новая ' +
            'провалившаяся пара «текст × фон» или ухудшение известной валят сборку.',
      _как_чинить: 'Перекрасить класс в слое совместимости (см. шапку check_contrast.mjs), ' +
                   'затем node scripts/check_contrast.mjs --update',
      _обновлён: new Date().toISOString().slice(0, 10),
      пары,
    }, null, 2) + '\n', 'utf-8');
    console.log(`[contrast] базлайн перезаписан: ${Object.keys(пары).length} пар(ы).\n`);
    return 0;
  }

  const baseline = existsSync(BASELINE_FILE)
    ? (JSON.parse(readFileSync(BASELINE_FILE, 'utf-8')).пары || {})
    : {};

  const newOnes = [];      // не было в базлайне — регресс
  const worse = [];        // было, но стало хуже
  for (const f of failures) {
    const known = baseline[pairKey(f)];
    if (!known) newOnes.push(f);
    else if (f.ratio < known.контраст - EPS) worse.push({ ...f, было: known.контраст });
  }
  const fixed = Object.keys(baseline).filter((k) => !failures.some((f) => pairKey(f) === k));

  if (Object.keys(baseline).length) {
    console.log(
      `[contrast] унаследованный долг: ${Object.keys(baseline).length} пар(ы) в базлайне` +
      (fixed.length ? ` · починено с прошлого прогона: ${fixed.length}` : '')
    );
  }
  if (fixed.length) {
    console.log(`[contrast] стало чисто: ${fixed.join('; ')}`);
    console.log('[contrast] зафиксировать прогресс: node scripts/check_contrast.mjs --update');
  }

  if (!newOnes.length && !worse.length) {
    console.log(
      failures.length
        ? `[contrast] OK — новых нарушений нет, долг не вырос (норма AA ${AA_NORMAL}:1).\n`
        : `[contrast] OK — весь цветной текст читается на поверхностях платформы (норма AA ${AA_NORMAL}:1).\n`
    );
    return 0;
  }

  console.error(`\n[contrast] ПРОВАЛ — контрастный долг вырос:\n`);
  const show = (f, prefix) => console.error(
    `  ${prefix} ${pairKey(f)}  —  ${f.ratio.toFixed(2)}:1  (норма ${AA_NORMAL}` +
    (f.было ? `, в базлайне было ${f.было}` : '') + ')\n' +
    `     тема: ${f.theme}, слой: ${f.layer}\n` +
    `     цвет текста ${f.fg} ← ${f.source}, фон ${f.bg}\n` +
    `     встречается: ${f.places.slice(0, 3).map((p) => `${p.file}:${p.line}`).join(', ')}` +
    (f.places.length > 3 ? ` и ещё ${f.places.length - 3}` : '') + '\n'
  );
  newOnes.sort((a, b) => a.ratio - b.ratio).forEach((f) => show(f, 'НОВЫЙ  '));
  worse.sort((a, b) => a.ratio - b.ratio).forEach((f) => show(f, 'ХУЖЕ   '));

  console.error(
    'Как чинить: добавить класс в ремап слоя совместимости —\n' +
    '  обычные страницы  → src/index.css, блок «ЦВЕТНЫЕ палитры 700/800/900»\n' +
    '  .tactical-root    → src/styles/tactical-design.css, тот же блок\n' +
    'и указать семантический токен (--danger / --success / --warning / --info / --color-tp).\n' +
    'Если сочетание осознанно и безопасно — scripts/contrast-allowlist.json с причиной.\n'
  );
  return 1;
}

process.exit(await main());
