import { useDivisionStore, type Division } from '../../stores/divisionStore';
import { useLangStore } from '../../stores/langStore';

/**
 * Переключатель стороны платформы: Продажи ⟂ Производство.
 *
 * Видят только роли над доменами (владелец, ген. директор, HR-директор) —
 * у остальных сторона одна, и переключать нечего.
 *
 * Смысл именно в переключении, а не в объединении: цифры двух сторон никогда
 * не складываются в один отчёт. Смена стороны перезагружает данные страницы,
 * потому что все агрегаты считаются внутри выбранной стороны.
 */
export function DivisionSwitcher() {
  const { division, available, canSwitch, setDivision } = useDivisionStore();
  const lang = useLangStore((s) => s.lang);

  if (!canSwitch) return null;

  const label = (d: Division) =>
    d === 'production'
      ? (lang === 'uz' ? 'Ishlab chiqarish' : 'Производство')
      : (lang === 'uz' ? 'Savdo' : 'Продажи');

  const icon = (d: Division) => (d === 'production' ? '🏭' : '🛒');

  const handle = (d: Division) => {
    if (d === division) return;
    setDivision(d);
    // Полная перезагрузка: страницы держат агрегаты в своём состоянии, и
    // частичная инвалидация оставила бы на экране цифры прошлой стороны —
    // ровно то смешение, которого разделение и не допускает.
    window.location.reload();
  };

  return (
    <div
      className="lang-toggle"
      role="group"
      aria-label={lang === 'uz' ? 'Platforma tomoni' : 'Сторона платформы'}
      style={{ flexShrink: 0, marginRight: 6 }}
    >
      {available.map((d) => (
        <button
          key={d}
          className={'lang-opt' + (division === d ? ' on' : '')}
          onClick={() => handle(d)}
          title={label(d)}
          aria-pressed={division === d}
        >
          <span aria-hidden="true">{icon(d)}</span>
          <span className="division-label" style={{ marginLeft: 4 }}>{label(d)}</span>
        </button>
      ))}
    </div>
  );
}
