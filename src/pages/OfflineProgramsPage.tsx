/**
 * Список офлайн-программ (ADKAR / DSPM / 7 Qadam) + создание новой.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { offlineProgramsApi } from '../api/offlinePrograms';
import { useT } from '../stores/langStore';
import type { Program } from '../types/offlineProgram';
import { PageHeader, SkeletonCard, EmptyState, Button } from '@/components/ui';
import { toast } from '@/components/ui';
import { FileText, Plus, Trash2 } from 'lucide-react';

export function OfflineProgramsPage() {
  const t = useT();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await offlineProgramsApi.list({ is_active: true });
      setPrograms(res.data.programs || []);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deletingProgram) return;
    setDeleting(true);
    try {
      await offlineProgramsApi.remove(deletingProgram.id);
      toast.success('Программа удалена');
      setDeletingProgram(null);
      load();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Не удалось удалить программу');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <PageHeader
        title={t('offlinePrograms.title')}
        subtitle={t('offlinePrograms.subtitle')}
        breadcrumbs={
          <a
            href="/activities"
            onClick={(e) => { e.preventDefault(); navigate('/activities'); }}
            className="hover:underline"
          >
            {t('offlinePrograms.backToSessions')}
          </a>
        }
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={() => setShowCreate(true)}
          >
            {t('offlinePrograms.createProgram')}
          </Button>
        }
      />

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      )}
      {error && <div className="rounded-lg p-4" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              onClick={() => navigate(`/activities/programs/${p.id}/edit`)}
              onDelete={() => setDeletingProgram(p)}
            />
          ))}
          {programs.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<FileText size={48} />}
                title={t('offlinePrograms.empty.title')}
                description={t('offlinePrograms.empty.desc')}
                cta={
                  <Button leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
                    {t('offlinePrograms.empty.ctaCreate')}
                  </Button>
                }
              />
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <CreateProgramModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {/* Модалка подтверждения удаления */}
      {deletingProgram && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !deleting && setDeletingProgram(null)}>
          <div className="rounded-2xl max-w-sm w-full p-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Удалить программу?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
              «{deletingProgram.title}» будет удалена безвозвратно.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingProgram(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--danger)', color: '#fff' }}
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program, onClick, onDelete }: { program: Program; onClick: () => void; onDelete: () => void }) {
  return (
    <div
      className="rounded-2xl p-5 hover:border-amber-400 hover:shadow-md transition-all relative"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderTopColor: program.theme_color, borderTopWidth: 4 }}
    >
      {/* Кнопка удаления */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--danger-bg)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        title="Удалить программу"
      >
        <Trash2 size={14} />
      </button>

      <button
        onClick={onClick}
        className="text-left w-full"
      >
        <div className="flex items-start gap-3 mb-3 pr-6">
          <span className="text-4xl">{program.icon || '?'}</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{program.title}</h3>
            {program.title_uz && <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{program.title_uz}</p>}
          </div>
        </div>
        {program.description && (
          <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{program.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          <Tag label={program.target_role.toUpperCase()} />
          <Tag label={`${program.duration_minutes} мин`} />
          <Tag label={`${program.num_questions} вопросов`} />
          <Tag label={`max ${program.max_score} б`} />
        </div>
        <div className="mt-3 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Код: <code className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)' }}>{program.code}</code>
        </div>
      </button>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
      {label}
    </span>
  );
}

function CreateProgramModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [titleUz, setTitleUz] = useState('');
  const [targetRole, setTargetRole] = useState('sales_rep');
  const [duration, setDuration] = useState(90);
  const [numQuestions, setNumQuestions] = useState(8);
  const [maxScore, setMaxScore] = useState(24);
  const [themeColor, setThemeColor] = useState('#c9a961');
  const [icon, setIcon] = useState('🎯');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await offlineProgramsApi.create({
        code, title, title_uz: titleUz, target_role: targetRole,
        duration_minutes: duration, num_questions: numQuestions, max_score: maxScore,
        theme_color: themeColor, icon,
      });
      onCreated();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || 'Ошибка создания');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <h2 className="text-2xl font-serif mb-4" style={{ color: 'var(--text-primary)' }}>Создать программу</h2>
        {error && <div className="rounded p-2 text-sm mb-3" style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>{error}</div>}

        <div className="space-y-3">
          <Field label="Код (уникальный, латиницей)" value={code} onChange={setCode} placeholder="adkar | my_program" />
          <Field label="Название (RU)" value={title} onChange={setTitle} />
          <Field label="Название (UZ)" value={titleUz} onChange={setTitleUz} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Иконка" value={icon} onChange={setIcon} placeholder="🎯" />
            <Field label="Цвет (hex)" value={themeColor} onChange={setThemeColor} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Целевая роль</label>
            <select className="w-full px-3 py-2 rounded-lg text-sm" value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}>
              <option value="sales_rep">Торговый представитель</option>
              <option value="supervisor">Супервайзер</option>
              <option value="regional_manager">Региональный менеджер</option>
              <option value="all">Все роли</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Длительность (мин)" value={duration} onChange={setDuration} />
            <NumberField label="Кол-во вопросов" value={numQuestions} onChange={setNumQuestions} />
            <NumberField label="Макс. балл" value={maxScore} onChange={setMaxScore} />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>Отмена</button>
          <button onClick={submit} disabled={busy || !code || !title}
            className="flex-1 px-4 py-2 rounded-lg disabled:opacity-40"
            style={{ background: 'var(--color-rm)', color: 'var(--text-inverse)' }}>
            {busy ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input className="w-full px-3 py-2 rounded-lg text-sm"
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function NumberField({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input type="number" className="w-full px-3 py-2 rounded-lg text-sm"
        value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}
