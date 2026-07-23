#!/usr/bin/env node
/**
 * Гейты качества по ESLint-выхлопу (2026-07-23). Один прогон — три проверки:
 *
 * 1. Пол читабельности 12px (local-readability/no-text-below-floor) — 0 нарушений.
 * 2. Tactical-шрифты вне игрового слоя (local-tactical/...) — 0 нарушений.
 * 3. i18n-долг (i18next/no-literal-string, стоит на warn из-за исторических
 *    хардкодов) — число НЕ ВЫШЕ базлайна (долг невозрастающий).
 *
 * Прочие error-правила (react-hooks и т.п.) — пред-существующий долг, здесь
 * сознательно НЕ проверяются (иначе гейт вечно красный; чистятся отдельно).
 *
 * Обновить базлайн после чистки: node scripts/check_i18n_baseline.mjs --update
 * Базлайн: scripts/i18n-baseline.json
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASELINE_FILE = join(__dirname, 'i18n-baseline.json');
const I18N_RULE = 'i18next/no-literal-string';
const ZERO_TOLERANCE_RULES = [
  'local-readability/no-text-below-floor',
  'local-tactical/no-tactical-font-outside-overlay',
];

function runEslintJson() {
  let out;
  try {
    out = execFileSync('npx', ['eslint', 'src', '--format', 'json'], {
      cwd: join(__dirname, '..'),
      encoding: 'utf-8',
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === 'win32',
    });
  } catch (e) {
    // eslint выходит с кодом 1 при error-нарушениях — JSON всё равно в stdout
    out = e.stdout;
    if (!out) throw e;
  }
  return JSON.parse(out);
}

const results = runEslintJson();

let fail = false;

// 1-2. Нулевая терпимость: пол 12px + tactical-шрифты
for (const rule of ZERO_TOLERANCE_RULES) {
  const hits = [];
  for (const f of results) {
    for (const m of f.messages) {
      if (m.ruleId === rule) hits.push(`${f.filePath}:${m.line}`);
    }
  }
  if (hits.length > 0) {
    fail = true;
    console.error(`[gates] ПРОВАЛ ${rule}: ${hits.length} нарушений`);
    hits.slice(0, 10).forEach((h) => console.error(`  ${h}`));
  } else {
    console.log(`[gates] OK ${rule}: 0`);
  }
}

// 3. i18n-долг не выше базлайна
let i18nCount = 0;
const byFile = {};
for (const f of results) {
  const n = f.messages.filter((m) => m.ruleId === I18N_RULE).length;
  if (n > 0) {
    i18nCount += n;
    byFile[f.filePath] = n;
  }
}

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE_FILE, JSON.stringify({ rule: I18N_RULE, count: i18nCount, updated: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
  console.log(`[gates] i18n-базлайн обновлён: ${i18nCount}`);
  process.exit(fail ? 1 : 0);
}

const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'));
if (i18nCount > baseline.count) {
  fail = true;
  console.error(`[gates] ПРОВАЛ i18n: русских хардкодов стало ${i18nCount} (базлайн ${baseline.count}, +${i18nCount - baseline.count}).`);
  console.error('Новые строки в JSX — только через словарь src/i18n/*.json + useT(). См. _docs/codex/10_bilingual.md. Топ файлов:');
  Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .forEach(([f, n]) => console.error(`  ${n}\t${f}`));
} else if (i18nCount < baseline.count) {
  console.log(`[gates] i18n-долг снизился: ${i18nCount} (базлайн ${baseline.count}). Обнови: node scripts/check_i18n_baseline.mjs --update`);
} else {
  console.log(`[gates] OK i18n: ${i18nCount} (не выше базлайна).`);
}

process.exit(fail ? 1 : 0);
