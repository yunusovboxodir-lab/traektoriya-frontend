/**
 * KpiChip — маленький бейдж с KPI-тэгом курса (DSPM / Sell-out / АКБ / Питч).
 *
 * compass_artifact L&D 2026 §2.5 — обучение должно явно показывать связь
 * с конкретным бизнес-метриком. Использует токены из новой палитры
 * (--color-rm / --success / --color-sv / --color-tp) для смысловой
 * дифференциации без яркой раскраски.
 */
import { useLangStore } from '../../stores/langStore';
import { KPI_META, inferKpiTags, type KpiTag } from '../../utils/inferKpiTags';
import type { BiText } from '../../utils/bilingual';

interface KpiChipProps {
  tag: KpiTag;
  size?: 'sm' | 'md';
}

const COLOR_VARS: Record<string, { bg: string; fg: string; border: string }> = {
  rm:      { bg: 'var(--color-rm-bg)',  fg: 'var(--color-rm)',  border: 'var(--color-rm-border)' },
  success: { bg: 'var(--success-bg)',   fg: 'var(--success)',   border: 'rgba(74,222,128,0.3)' },
  sv:      { bg: 'var(--color-sv-bg)',  fg: 'var(--color-sv)',  border: 'var(--color-sv-border)' },
  tp:      { bg: 'var(--color-tp-bg)',  fg: 'var(--color-tp)',  border: 'var(--color-tp-border)' },
};

export function KpiChip({ tag, size = 'sm' }: KpiChipProps) {
  const lang = useLangStore((s) => s.lang);
  const meta = KPI_META[tag];
  const colors = COLOR_VARS[meta.color] ?? COLOR_VARS.rm;
  const fontSize = size === 'sm' ? 10 : 12;
  const padX = size === 'sm' ? 6 : 8;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide"
      style={{
        background: colors.bg,
        color: colors.fg,
        border: `1px solid ${colors.border}`,
        padding: `1px ${padX}px`,
        fontSize,
        letterSpacing: '0.04em',
      }}
      title={lang === 'uz' ? meta.label.uz : meta.label.ru}
    >
      <span aria-hidden="true">{meta.icon}</span>
      <span>{lang === 'uz' ? meta.label.uz : meta.label.ru}</span>
    </span>
  );
}

/** Хелпер: выводит 0–2 KpiChip из title курса. */
export function KpiChipsFromTitle({ title }: { title: BiText | string | null | undefined }) {
  const tags = inferKpiTags(title);
  if (tags.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {tags.map((tag) => <KpiChip key={tag} tag={tag} />)}
    </span>
  );
}
