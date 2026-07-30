import { useState } from 'react';
import type { BlockImageData } from '../../../api/learning';
import { bl } from '../../../utils/bilingual';
import { useLangStore } from '../../../stores/langStore';
import { BlockCard } from './BlockCard';

interface Props {
  data: BlockImageData;
  accent: string;
  accentSoft: string;
  onReady: () => void;
}

/**
 * Блок иллюстрации: схема, планограмма, фото продукции.
 * Действий от сотрудника не требует — «Далее» доступно сразу, как у key_point.
 * Если картинка не загрузилась (нет сети в поле), блок не ломает урок:
 * вместо разорванного изображения показываем подпись.
 */
export function BlockImage({ data, accent, accentSoft, onReady }: Props) {
  const lang = useLangStore(s => s.lang);
  const [failed, setFailed] = useState(false);

  onReady();

  const caption = data.caption ? bl(data.caption, lang) : '';
  const alt = data.alt ? bl(data.alt, lang) : caption;

  return (
    <BlockCard
      accent={accent}
      accentSoft={accentSoft}
      label={<>{'\u{1F5BC}'} {lang === 'uz' ? 'Sxema' : 'Схема'}</>}
    >
      {failed ? (
        <div
          className="rounded-xl p-6 text-center text-sm"
          style={{ background: accentSoft, color: 'var(--text-muted)' }}
        >
          {caption || (lang === 'uz' ? 'Rasm yuklanmadi' : 'Изображение не загрузилось')}
        </div>
      ) : (
        <img
          src={data.url}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-auto rounded-xl"
          style={{ background: accentSoft }}
        />
      )}

      {caption && !failed && (
        <div className="text-sm leading-relaxed text-fg-muted text-center mt-2.5">{caption}</div>
      )}
    </BlockCard>
  );
}
