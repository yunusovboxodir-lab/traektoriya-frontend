/**
 * Изолированная preview-страница для проверки рендера блоков офлайн-программ
 * без зависимости от API/авторизации. Только для разработки.
 *
 * Маршрут: /__block_preview (виден только в dev)
 */
import { useState } from 'react';
import { BlockRenderer } from '../components/offline/blocks/BlockRenderer';
import type { Block } from '../types/offlineProgram';

const SAMPLE_SLIDES: Array<{ name: string; blocks: Block[] }> = [
  {
    name: 'Intro (hero + cards)',
    blocks: [
      {
        type: 'hero',
        icon: '🔍',
        title: 'РМ-ДЕТЕКТИВ',
        title_uz: 'RM-DETEKTIV',
        subtitle: 'Анализ причин снижения продаж + правильный отчёт',
        subtitle_uz: 'Sotuvlar pasayishi sabablari + To\'g\'ri hisobot',
        caption: 'Программа для региональных менеджеров • 60 минут',
        caption_uz: 'Mintaqaviy menejerlar uchun • 60 daqiqa',
      },
      {
        type: 'cards_grid',
        columns: 4,
        cards: [
          { icon: '🌳', title: 'Декомпозиция', title_uz: 'Dekompozitsiya' },
          { icon: '❓', title: '5 Whys', title_uz: '5 Whys' },
          { icon: '🔺', title: 'Pyramid', title_uz: 'Pyramid' },
          { icon: '🚀', title: 'Игра + Тест', title_uz: 'O\'yin + Test' },
        ],
      },
    ],
  },
  {
    name: 'Декомпозиция (stat_grid)',
    blocks: [
      { type: 'heading_h2', text: '🌳 ПРИМЕР: БУХАРА −23% — диагноз за 30 секунд', text_uz: '🌳 MISOL: −23%' },
      { type: 'paragraph', text: 'Падение в Бухаре: −23%. Но в какой именно ветви?', text_uz: 'Buxoroda: −23%' },
      {
        type: 'stat_grid',
        columns: 4,
        items: [
          { value: '−4%', label: 'АКБ', hint: 'OK — небольшое', variant: 'success' },
          { value: '−8%', label: 'Средний чек', hint: 'Средне — посмотреть', variant: 'warning' },
          { value: '−19%', label: 'Частота', hint: '🔴 Главная причина', variant: 'danger' },
          { value: '−10%', label: 'SKU/чек', hint: 'Средне — 2-й приоритет', variant: 'warning' },
        ],
      },
      { type: 'callout', variant: 'warning', text: '🎯 Диагноз: ТП реже посещают точки. Теперь спрашиваем WHY?' },
    ],
  },
  {
    name: 'Игра/раунд (divider + numbered_list)',
    blocks: [
      { type: 'divider', label: 'РАУНД 1 / 3' },
      { type: 'heading_h2', text: '🥇 ДЕКОМПОЗИЦИЯ — 7 минут' },
      {
        type: 'paragraph',
        text: 'Задание: разложите падение −23% по 4 ветвям. Найдите главного виновника.',
      },
      {
        type: 'numbered_list',
        items: [
          { title: '5 минут — работа в команде', body: 'Команды разбирают данные кейса, считают %, заполняют 4 ветви' },
          { title: '2 минуты — обсуждение тренером', body: 'Каждая команда называет диагноз. Тренер ставит баллы.' },
        ],
      },
    ],
  },
  {
    name: 'Сравнение (comparison)',
    blocks: [
      { type: 'heading_h2', text: '❓ 5 WHYS — От симптома к корню' },
      {
        type: 'comparison',
        left_title: '✅ Когда дошли до корня',
        left_items: [
          '4 «Почему?»: системная причина',
          '5 «Почему?»: есть рычаг влияния',
          '«Конкурент −7%, мы 2 мес. молчали» — корень.',
        ],
        right_title: '❌ Когда останавливаются',
        right_items: [
          '1 «Почему?»: симптом',
          '2 «Почему?»: явный факт',
          'Тут останавливаются! Но это не корень.',
        ],
      },
    ],
  },
  {
    name: 'Big number',
    blocks: [
      { type: 'heading_h2', text: 'Результат тренинга' },
      {
        type: 'big_number',
        value: '+24%',
        label: 'Рост среднего балла команды',
        hint: 'PRE 47% → POST 71%',
        variant: 'success',
      },
    ],
  },
  {
    name: 'Closing (hero)',
    blocks: [
      {
        type: 'hero',
        icon: '🙏',
        title: 'СПАСИБО!',
        title_uz: 'RAHMAT!',
        subtitle: 'Теперь вы — РМ-Детектив. «Упало» больше не ответ.',
        caption: 'N\'MEDOV SALES ACADEMY • 2026',
      },
      {
        type: 'numbered_list',
        items: [
          { title: '🌳 «Упало» → разложите на 4 ветви' },
          { title: '❓ Симптом → 5 Why → корень → действие' },
          { title: '🔺 Отчёт: вывод сверху, действия снизу' },
          { title: '📊 Каждое предложение — КТО/КОГДА/СКОЛЬКО' },
        ],
      },
    ],
  },
];

export function BlockPreviewPage() {
  const [idx, setIdx] = useState(0);
  const [lang, setLang] = useState<'ru' | 'uz'>('ru');
  const slide = SAMPLE_SLIDES[idx];

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(200,168,75,0.08) 0%, #0D0F14 50%, #0D0F14 100%)',
        color: '#E8EAF0',
      }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-6 py-3 z-10">
        <div
          style={{ color: '#9CA3AF', letterSpacing: '0.2em' }}
          className="text-xs font-semibold uppercase"
        >
          BLOCK PREVIEW • <span style={{ color: '#C8A84B' }}>{slide.name}</span>
        </div>
        <div className="flex gap-2 items-center">
          <div
            style={{ background: 'rgba(26,31,46,0.7)', border: '1px solid #252B3B' }}
            className="flex gap-1 rounded-lg p-0.5"
          >
            {(['ru', 'uz'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={
                  lang === l
                    ? { background: '#C8A84B', color: '#0D0F14' }
                    : { color: '#9CA3AF' }
                }
                className="text-xs px-2 py-1 rounded font-bold"
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slide content */}
      <div className="px-12 pt-20 pb-24 min-h-screen flex flex-col justify-center">
        {slide.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} lang={lang} />
        ))}
      </div>

      {/* Bottom nav */}
      <div
        style={{ background: 'rgba(13,15,20,0.85)', borderTop: '1px solid #252B3B' }}
        className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-6 py-3 z-10"
      >
        <div style={{ color: '#6B7280' }} className="text-xs">
          ← / → для навигации между слайдами
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            style={{ background: '#1A1F2E', border: '1px solid #323A50', color: '#E8EAF0' }}
            className="px-4 py-1.5 rounded text-sm disabled:opacity-30"
          >
            ←
          </button>
          <span style={{ color: '#E8EAF0' }} className="text-sm font-bold">
            {idx + 1} / {SAMPLE_SLIDES.length}
          </span>
          <button
            onClick={() => setIdx((i) => Math.min(SAMPLE_SLIDES.length - 1, i + 1))}
            disabled={idx >= SAMPLE_SLIDES.length - 1}
            style={{ background: '#1A1F2E', border: '1px solid #323A50', color: '#E8EAF0' }}
            className="px-4 py-1.5 rounded text-sm disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
