/**
 * Редактор программы — 4 вкладки: Метаданные / Слайды / Вопросы / Категории.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { offlineProgramsApi } from '../api/offlinePrograms';
import type { Block, Category, Program, Question, Slide, SlideType } from '../types/offlineProgram';
import { emptyBlock, emptySlide } from '../types/offlineProgram';
import { SkeletonCard } from '@/components/ui';
import { BlockRenderer } from '../components/offline/blocks/BlockRenderer';
import { BlockEditor } from '../components/offline/blocks/BlockEditor';

type Tab = 'meta' | 'slides' | 'questions' | 'categories';

const SLIDE_TYPES: Array<{ v: SlideType; t: string }> = [
  { v: 'intro', t: 'Интро' },
  { v: 'content', t: 'Контент' },
  { v: 'test_pre', t: 'Перед PRE' },
  { v: 'dashboard_pre', t: 'Дашборд PRE (QR)' },
  { v: 'dashboard_pre_result', t: 'Результаты PRE' },
  { v: 'test_post', t: 'Перед POST' },
  { v: 'dashboard_post', t: 'Дашборд POST (QR)' },
  { v: 'dashboard_growth', t: 'Рост ДО/ПОСЛЕ' },
  { v: 'closing', t: 'Закрытие' },
];

const BLOCK_TYPES: Array<{ v: Block['type']; t: string; icon: string }> = [
  { v: 'heading_h1', t: 'H1', icon: '🅗' },
  { v: 'heading_h2', t: 'H2', icon: '🅗' },
  { v: 'paragraph', t: 'Параграф', icon: '¶' },
  { v: 'cards_grid', t: 'Карточки', icon: '🃏' },
  { v: 'numbered_list', t: 'Шаги', icon: '①' },
  { v: 'callout', t: 'Выноска', icon: '💡' },
  { v: 'comparison', t: 'Сравнение', icon: '⚖️' },
  { v: 'quote', t: 'Цитата', icon: '❝' },
  { v: 'image', t: 'Изображение', icon: '🖼' },
];

export function OfflineProgramEditPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('meta');
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const load = async () => {
    if (!programId) return;
    setLoading(true);
    try {
      const res = await offlineProgramsApi.getById(programId);
      setProgram(res.data);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [programId]);

  if (loading) return <div className="p-8"><SkeletonCard lines={4} /></div>;
  if (error || !program) return <div className="p-8 text-red-700">{error || 'Программа не найдена'}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button onClick={() => navigate('/activities/programs')}
            className="text-sm text-stone-500 hover:text-stone-700 mb-2">
            ← К списку программ
          </button>
          <h1 className="text-3xl font-serif text-stone-800 flex items-center gap-3">
            <span>{program.icon}</span>
            <span>{program.title}</span>
          </h1>
          <code className="text-sm text-stone-500">code: {program.code}</code>
        </div>
        {savedAt && (
          <div className="text-xs text-green-700">
            ✓ Сохранено {savedAt.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 mb-6">
        <nav className="flex gap-1">
          {(['meta', 'slides', 'questions', 'categories'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${
                tab === t ? 'border-amber-500 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}>
              {tabLabel(t)} {tabBadge(t, program)}
            </button>
          ))}
        </nav>
      </div>

      {/* Body */}
      {tab === 'meta' && (
        <MetaTab program={program} onSaved={(p) => { setProgram(p); setSavedAt(new Date()); }} saving={saving} setSaving={setSaving} />
      )}
      {tab === 'slides' && (
        <SlidesTab program={program} onSaved={(slides) => { setProgram({ ...program, slides }); setSavedAt(new Date()); }} saving={saving} setSaving={setSaving} />
      )}
      {tab === 'questions' && (
        <QuestionsTab program={program} onSaved={(qs) => { setProgram({ ...program, questions: qs }); setSavedAt(new Date()); }} saving={saving} setSaving={setSaving} />
      )}
      {tab === 'categories' && (
        <CategoriesTab program={program} onSaved={(cats) => { setProgram({ ...program, categories: cats }); setSavedAt(new Date()); }} saving={saving} setSaving={setSaving} />
      )}
    </div>
  );
}

function tabLabel(t: Tab): string {
  return { meta: 'Метаданные', slides: 'Слайды', questions: 'Вопросы', categories: 'Категории' }[t];
}

function tabBadge(t: Tab, p: Program): string {
  if (t === 'slides') return `(${p.slides?.length ?? 0})`;
  if (t === 'questions') return `(${p.questions?.length ?? 0})`;
  if (t === 'categories') return `(${p.categories?.length ?? 0})`;
  return '';
}

// ==========================================================================
// META TAB
// ==========================================================================

function MetaTab({ program, onSaved, saving, setSaving }: {
  program: Program; onSaved: (p: Program) => void; saving: boolean; setSaving: (v: boolean) => void;
}) {
  const [form, setForm] = useState<Partial<Program>>({
    title: program.title,
    title_uz: program.title_uz || '',
    description: program.description || '',
    description_uz: program.description_uz || '',
    target_role: program.target_role,
    duration_minutes: program.duration_minutes,
    max_score: program.max_score,
    num_questions: program.num_questions,
    theme_color: program.theme_color,
    icon: program.icon || '',
    is_active: program.is_active,
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await offlineProgramsApi.update(program.id, form);
      onSaved({ ...program, ...res.data });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <FieldText label="Название (RU)" value={form.title || ''} onChange={(title) => setForm({ ...form, title })} />
        <FieldText label="Название (UZ)" value={form.title_uz || ''} onChange={(title_uz) => setForm({ ...form, title_uz })} />
      </div>
      <FieldTextArea label="Описание (RU)" value={form.description || ''} onChange={(description) => setForm({ ...form, description })} />
      <FieldTextArea label="Описание (UZ)" value={form.description_uz || ''} onChange={(description_uz) => setForm({ ...form, description_uz })} />
      <div className="grid grid-cols-3 gap-4">
        <FieldNumber label="Длительность (мин)" value={form.duration_minutes ?? 90} onChange={(v) => setForm({ ...form, duration_minutes: v })} />
        <FieldNumber label="Кол-во вопросов" value={form.num_questions ?? 8} onChange={(v) => setForm({ ...form, num_questions: v })} />
        <FieldNumber label="Макс. балл" value={form.max_score ?? 24} onChange={(v) => setForm({ ...form, max_score: v })} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FieldText label="Иконка" value={form.icon || ''} onChange={(icon) => setForm({ ...form, icon })} placeholder="🎯" />
        <FieldText label="Цвет темы" value={form.theme_color || ''} onChange={(theme_color) => setForm({ ...form, theme_color })} placeholder="#c9a961" />
        <div>
          <label className="text-xs font-semibold text-stone-500 uppercase">Целевая роль</label>
          <select className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            value={form.target_role}
            onChange={(e) => setForm({ ...form, target_role: e.target.value })}>
            <option value="sales_rep">Торговый представитель</option>
            <option value="supervisor">Супервайзер</option>
            <option value="regional_manager">Региональный менеджер</option>
            <option value="all">Все роли</option>
          </select>
        </div>
      </div>
      <button onClick={save} disabled={saving}
        className="px-6 py-2 bg-stone-800 text-white rounded-lg disabled:bg-stone-400">
        {saving ? 'Сохранение...' : 'Сохранить'}
      </button>
    </div>
  );
}

// ==========================================================================
// SLIDES TAB
// ==========================================================================

function SlidesTab({ program, onSaved, saving, setSaving }: {
  program: Program; onSaved: (slides: Slide[]) => void; saving: boolean; setSaving: (v: boolean) => void;
}) {
  const [slides, setSlides] = useState<Slide[]>(program.slides || []);
  const [activeIdx, setActiveIdx] = useState(0);
  const [previewLang, setPreviewLang] = useState<'ru' | 'uz'>('ru');

  const active = slides[activeIdx];

  const updateActive = (changes: Partial<Slide>) => {
    const next = [...slides];
    next[activeIdx] = { ...next[activeIdx], ...changes };
    setSlides(next);
  };

  const addSlide = () => {
    const next = [...slides, emptySlide(slides.length, 'content')];
    setSlides(next);
    setActiveIdx(next.length - 1);
  };

  const removeSlide = (idx: number) => {
    if (!confirm('Удалить слайд?')) return;
    const next = slides.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order_index: i }));
    setSlides(next);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
  };

  const moveSlide = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    next.forEach((s, i) => (s.order_index = i));
    setSlides(next);
    setActiveIdx(to);
  };

  const addBlock = (type: Block['type']) => {
    if (!active) return;
    updateActive({ blocks: [...(active.blocks || []), emptyBlock(type)] });
  };

  const updateBlock = (i: number, b: Block) => {
    if (!active) return;
    const next = [...active.blocks];
    next[i] = b;
    updateActive({ blocks: next });
  };

  const moveBlock = (i: number, dir: -1 | 1) => {
    if (!active) return;
    const target = i + dir;
    if (target < 0 || target >= active.blocks.length) return;
    const next = [...active.blocks];
    [next[i], next[target]] = [next[target], next[i]];
    updateActive({ blocks: next });
  };

  const removeBlock = (i: number) => {
    if (!active) return;
    updateActive({ blocks: active.blocks.filter((_, k) => k !== i) });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = slides.map((s) => ({
        order_index: s.order_index,
        slide_type: s.slide_type,
        blocks: s.blocks,
        bg_style: s.bg_style ?? null,
        note: s.note ?? null,
      })) as Slide[];
      const res = await offlineProgramsApi.replaceSlides(program.id, payload);
      setSlides(res.data.slides);
      onSaved(res.data.slides);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* Left: slide list */}
      <div className="col-span-3 border border-stone-200 rounded-xl bg-stone-50 p-3 max-h-[70vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <span className="font-semibold text-sm text-stone-700">Слайды</span>
          <button onClick={addSlide} className="text-xs px-2 py-1 bg-amber-500 text-white rounded">+ Добавить</button>
        </div>
        {slides.map((s, i) => (
          <div key={i} className={`flex items-center gap-1 mb-1 px-2 py-2 rounded-lg cursor-pointer ${
            i === activeIdx ? 'bg-stone-800 text-white' : 'bg-white border border-stone-200 hover:border-amber-300'
          }`} onClick={() => setActiveIdx(i)}>
            <span className="text-xs font-bold w-6">{i + 1}</span>
            <span className="text-xs flex-1 truncate">{slideShortLabel(s)}</span>
            <button onClick={(e) => { e.stopPropagation(); moveSlide(i, i - 1); }} className="opacity-50 hover:opacity-100 px-1">↑</button>
            <button onClick={(e) => { e.stopPropagation(); moveSlide(i, i + 1); }} className="opacity-50 hover:opacity-100 px-1">↓</button>
            <button onClick={(e) => { e.stopPropagation(); removeSlide(i); }} className="opacity-50 hover:opacity-100 text-red-400 px-1">×</button>
          </div>
        ))}
        <button onClick={save} disabled={saving}
          className="w-full mt-3 px-3 py-2 bg-stone-800 text-white rounded-lg text-sm disabled:bg-stone-400">
          {saving ? 'Сохранение...' : '💾 Сохранить все слайды'}
        </button>
      </div>

      {/* Middle: editor */}
      <div className="col-span-5">
        {active ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase">Тип слайда</label>
                <select className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  value={active.slide_type}
                  onChange={(e) => updateActive({ slide_type: e.target.value as SlideType })}>
                  {SLIDE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase">Стиль фона (CSS)</label>
                <input className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  value={active.bg_style || ''}
                  onChange={(e) => updateActive({ bg_style: e.target.value })}
                  placeholder="linear-gradient(...)" />
              </div>
            </div>

            {/* Block editor list */}
            <div className="border border-stone-200 rounded-xl bg-stone-50 p-3 max-h-[55vh] overflow-y-auto">
              {active.blocks.map((b, i) => (
                <BlockEditor
                  key={i}
                  block={b}
                  onChange={(nb) => updateBlock(i, nb)}
                  onRemove={() => removeBlock(i)}
                  onMoveUp={i > 0 ? () => moveBlock(i, -1) : undefined}
                  onMoveDown={i < active.blocks.length - 1 ? () => moveBlock(i, 1) : undefined}
                />
              ))}

              <div className="mt-2 pt-3 border-t border-stone-200">
                <div className="text-xs font-semibold text-stone-500 mb-2">Добавить блок:</div>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_TYPES.map((b) => (
                    <button key={b.v} onClick={() => addBlock(b.v)}
                      className="text-xs px-3 py-1.5 bg-white border border-stone-300 rounded hover:border-amber-400 hover:bg-amber-50">
                      {b.icon} {b.t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-stone-400 text-center py-12">Выберите или добавьте слайд</div>
        )}
      </div>

      {/* Right: preview */}
      <div className="col-span-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-stone-500">Превью</span>
          <div className="flex gap-1 bg-stone-100 rounded p-0.5">
            {(['ru', 'uz'] as const).map((l) => (
              <button key={l} onClick={() => setPreviewLang(l)}
                className={`text-xs px-2 py-1 rounded ${previewLang === l ? 'bg-stone-800 text-white' : 'text-stone-500'}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="border border-stone-200 rounded-xl bg-white p-4 max-h-[65vh] overflow-y-auto"
          style={active?.bg_style ? { background: active.bg_style } : undefined}>
          {active?.blocks.map((b, i) => (
            <BlockRenderer key={i} block={b} lang={previewLang} size="preview" />
          ))}
          {active && active.blocks.length === 0 && (
            <div className="text-stone-400 text-center py-12 text-sm">Нет блоков. Добавьте слева.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function slideShortLabel(s: Slide): string {
  const first = s.blocks?.[0];
  if (first && 'text' in first && first.text) return first.text.slice(0, 30);
  return s.slide_type;
}

// ==========================================================================
// QUESTIONS TAB
// ==========================================================================

function QuestionsTab({ program, onSaved, saving, setSaving }: {
  program: Program; onSaved: (qs: Question[]) => void; saving: boolean; setSaving: (v: boolean) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>(program.questions || []);
  const categories = program.categories || [];

  const update = (idx: number, q: Question) => {
    const next = [...questions];
    next[idx] = q;
    setQuestions(next);
  };

  const updateOpt = (qi: number, oi: number, field: 'text' | 'text_uz' | 'score', value: string | number) => {
    const q = questions[qi];
    const opts = [...q.options];
    opts[oi] = { ...opts[oi], [field]: value };
    update(qi, { ...q, options: opts });
  };

  const add = () => {
    const next: Question = {
      order_index: questions.length, question: '', question_uz: '', category: null,
      max_score: 3, options: [
        { text: '', text_uz: '', score: 3 },
        { text: '', text_uz: '', score: 1 },
        { text: '', text_uz: '', score: 0 },
        { text: '', text_uz: '', score: 0 },
      ],
    };
    setQuestions([...questions, next]);
  };

  const remove = (idx: number) => {
    if (!confirm('Удалить вопрос?')) return;
    setQuestions(questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_index: i })));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await offlineProgramsApi.replaceQuestions(program.id, questions);
      setQuestions(res.data.questions);
      onSaved(res.data.questions);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-stone-600">Один тест проходит и в PRE и в POST. {questions.length} из {program.num_questions} в банке.</p>
        <div className="flex gap-2">
          <button onClick={add} className="text-xs px-3 py-1.5 border border-stone-300 rounded hover:border-amber-400">+ Вопрос</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm disabled:bg-stone-400">
            {saving ? 'Сохранение...' : '💾 Сохранить вопросы'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="border border-stone-200 rounded-xl p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold text-stone-500">ВОПРОС #{qi + 1}</span>
              <button onClick={() => remove(qi)} className="text-xs text-red-600">Удалить</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <FieldTextArea label="Вопрос (RU)" value={q.question} onChange={(question) => update(qi, { ...q, question })} />
              <FieldTextArea label="Вопрос (UZ)" value={q.question_uz || ''} onChange={(question_uz) => update(qi, { ...q, question_uz })} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-stone-500 uppercase">Категория</label>
                <select className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  value={q.category || ''}
                  onChange={(e) => update(qi, { ...q, category: e.target.value || null })}>
                  <option value="">— без категории —</option>
                  {categories.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                </select>
              </div>
              <FieldNumber label="Макс. балл" value={q.max_score} onChange={(max_score) => update(qi, { ...q, max_score })} />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-500 uppercase">Опции (4 варианта, балл = 0..max)</span>
              {q.options.map((o, oi) => (
                <div key={oi} className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-1 text-xs text-stone-400 text-center">{String.fromCharCode(65 + oi)}</span>
                  <input className="col-span-5 px-2 py-1.5 border border-stone-300 rounded text-sm"
                    value={o.text} onChange={(e) => updateOpt(qi, oi, 'text', e.target.value)} placeholder="RU" />
                  <input className="col-span-5 px-2 py-1.5 border border-stone-300 rounded text-sm"
                    value={o.text_uz || ''} onChange={(e) => updateOpt(qi, oi, 'text_uz', e.target.value)} placeholder="UZ" />
                  <input type="number" className="col-span-1 px-2 py-1.5 border border-stone-300 rounded text-sm text-center"
                    value={o.score} onChange={(e) => updateOpt(qi, oi, 'score', Number(e.target.value))} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================================================
// CATEGORIES TAB
// ==========================================================================

function CategoriesTab({ program, onSaved, saving, setSaving }: {
  program: Program; onSaved: (cats: Category[]) => void; saving: boolean; setSaving: (v: boolean) => void;
}) {
  const [cats, setCats] = useState<Category[]>(program.categories || []);

  const update = (idx: number, c: Category) => {
    const next = [...cats];
    next[idx] = c;
    setCats(next);
  };

  const add = () => setCats([...cats, {
    code: '', label: '', label_uz: '', color: '#7a716a', order_index: cats.length,
  }]);

  const remove = (idx: number) => {
    if (!confirm('Удалить категорию?')) return;
    setCats(cats.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await offlineProgramsApi.replaceCategories(program.id, cats);
      setCats(res.data.categories);
      onSaved(res.data.categories);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <p className="text-sm text-stone-600">Категории — для радар-диаграммы и breakdown (привязка через `Question.category`)</p>
        <div className="flex gap-2">
          <button onClick={add} className="text-xs px-3 py-1.5 border border-stone-300 rounded">+ Категория</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 bg-stone-800 text-white rounded-lg text-sm disabled:bg-stone-400">
            {saving ? 'Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {cats.map((c, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white border border-stone-200 rounded-lg p-3">
            <input className="col-span-2 px-2 py-1.5 border border-stone-300 rounded text-sm"
              value={c.code} onChange={(e) => update(i, { ...c, code: e.target.value })} placeholder="код" />
            <input className="col-span-3 px-2 py-1.5 border border-stone-300 rounded text-sm"
              value={c.label} onChange={(e) => update(i, { ...c, label: e.target.value })} placeholder="Название (RU)" />
            <input className="col-span-3 px-2 py-1.5 border border-stone-300 rounded text-sm"
              value={c.label_uz || ''} onChange={(e) => update(i, { ...c, label_uz: e.target.value })} placeholder="Название (UZ)" />
            <input type="color" className="col-span-1 h-9 border border-stone-300 rounded"
              value={c.color} onChange={(e) => update(i, { ...c, color: e.target.value })} />
            <input type="number" className="col-span-2 px-2 py-1.5 border border-stone-300 rounded text-sm"
              value={c.order_index} onChange={(e) => update(i, { ...c, order_index: Number(e.target.value) })} />
            <button onClick={() => remove(i)} className="col-span-1 text-red-600 text-sm">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================================================
// Shared form fields
// ==========================================================================

function FieldText({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-stone-500 uppercase">{label}</label>
      <input className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function FieldTextArea({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-stone-500 uppercase">{label}</label>
      <textarea className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm min-h-[60px]"
        value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FieldNumber({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-stone-500 uppercase">{label}</label>
      <input type="number" className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
