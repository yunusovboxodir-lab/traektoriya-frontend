/**
 * PulsePipelinePage — 5-шаговый wizard создания Pulse для роли.
 *
 * Шаги:
 *   1. StartStep              — выбор роли + ДИ → POST /start
 *   2. CompetenciesReviewStep — review + edit + approve компетенций
 *   3. CoursesReviewStep      — generate + review + approve курсов
 *   4. ContentGenerationStep  — фоновая генерация (Opus 4.6) + polling
 *   5. DoneStep               — summary + retry failed + narration
 *
 * jobId хранится в URL `/admin/pulse-pipeline/:jobId?` и в localStorage.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  pulsePipelineApi,
  type DraftCompetency,
  type DraftCourse,
  type PulsePipelineStatus,
} from '../api/pulsePipeline';
import { PageHeader, Button } from '@/components/ui';
import { useT } from '../stores/langStore';
import { Trash2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Константы (labelKey → перевод через t() в рендере)
// ---------------------------------------------------------------------------

const ROLE_OPTIONS = [
  { value: 'sales_rep', labelKey: 'pipeline.roles.salesRep' },
  { value: 'supervisor', labelKey: 'pipeline.roles.supervisor' },
  { value: 'regional_manager', labelKey: 'pipeline.roles.regionalManager' },
  { value: 'commercial_dir', labelKey: 'pipeline.roles.commercialDir' },
  { value: 'dealer', labelKey: 'pipeline.roles.dealer' },
];

const LEVEL_LABEL_KEYS: Record<string, string> = {
  trainee: 'pulse.trainee',
  practitioner: 'pulse.practitioner',
  expert: 'pulse.expert',
  master: 'pulse.master',
};

const LEVEL_COLORS: Record<string, string> = {
  trainee: 'bg-status-danger-bg text-status-danger-fg border-status-danger-fg',
  practitioner: 'bg-status-warning-bg text-status-warning-fg border-status-warning-fg',
  expert: 'bg-status-info-bg text-status-info-fg border-status-info-fg',
  master: 'bg-status-success-bg text-status-success-fg border-status-success-fg',
};

const STAGE_TO_STEP: Record<string, number> = {
  draft_competencies: 2,
  approved_competencies: 3,
  draft_courses: 3,
  approved_courses: 4,
  generating_content: 4,
  done: 5,
};

const COURSE_TYPES = [
  { value: 'work_standard', labelKey: 'pipeline.courseTypes.workStandard' },
  { value: 'product_knowledge', labelKey: 'pipeline.courseTypes.productKnowledge' },
  { value: 'merchandising', labelKey: 'pipeline.courseTypes.merchandising' },
  { value: 'objection_handling', labelKey: 'pipeline.courseTypes.objectionHandling' },
  { value: 'soft_skill', labelKey: 'pipeline.courseTypes.softSkill' },
];

// ---------------------------------------------------------------------------
// Главный компонент
// ---------------------------------------------------------------------------

export function PulsePipelinePage() {
  const { jobId: urlJobId } = useParams<{ jobId?: string }>();
  const navigate = useNavigate();
  const t = useT();

  const [jobId, setJobId] = useState<string | null>(urlJobId || localStorage.getItem('pulse_pipeline_job_id'));
  const [status, setStatus] = useState<PulsePipelineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Загрузка статуса при наличии jobId
  const loadStatus = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await pulsePipelineApi.getStatus(jobId);
      setStatus(res.data);
      const stage = res.data.output_data?.current_stage;
      if (stage && STAGE_TO_STEP[stage]) {
        setCurrentStep(STAGE_TO_STEP[stage]);
      }
    } catch (e: unknown) {
      const err = e as { response?: { status: number; data?: { detail?: string } } };
      if (err.response?.status === 404) {
        // Job не найден — очищаем
        localStorage.removeItem('pulse_pipeline_job_id');
        setJobId(null);
        setStatus(null);
        setCurrentStep(1);
      } else {
        setError(err.response?.data?.detail || t('pipeline.errors.loadStatus'));
      }
    }
  }, [jobId, t]);

  useEffect(() => {
    if (jobId) {
      localStorage.setItem('pulse_pipeline_job_id', jobId);
      loadStatus();
    }
  }, [jobId, loadStatus]);

  // Polling прогресса для шага 4 (generating_content)
  useEffect(() => {
    if (currentStep !== 4 || !jobId) return;
    const stage = status?.output_data?.current_stage;
    if (stage !== 'generating_content') return;

    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, [currentStep, jobId, status, loadStatus]);

  const startNewPipeline = () => {
    localStorage.removeItem('pulse_pipeline_job_id');
    setJobId(null);
    setStatus(null);
    setCurrentStep(1);
    setError(null);
    navigate('/admin/pulse-pipeline');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <PageHeader
        title="Pulse Pipeline"
        subtitle={t('pipeline.subtitle')}
        actions={jobId && (
          <button
            onClick={startNewPipeline}
            className="px-3 py-1.5 text-sm border border-border-strong rounded-md hover:bg-bg-muted"
          >
            {t('pipeline.newPipeline')}
          </button>
        )}
      />

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Error banner */}
      {error && (
        <div className="bg-status-danger-bg border border-status-danger-fg text-status-danger-fg px-4 py-3 rounded-lg mb-4">
          <strong>{t('common.error')}:</strong> {error}
          <button onClick={() => setError(null)} className="ml-3 underline">{t('common.close')}</button>
        </div>
      )}

      {/* Step content */}
      <div className="bg-bg-surface rounded-2xl shadow-sm border border-border-default p-6">
        {currentStep === 1 && (
          <Step1Start
            onCreated={(newJobId) => {
              setJobId(newJobId);
              setCurrentStep(2);
            }}
            setError={setError}
            setLoading={setLoading}
            loading={loading}
          />
        )}

        {currentStep === 2 && status && (
          <Step2Competencies
            jobId={jobId!}
            status={status}
            onApproved={() => {
              loadStatus();
              setCurrentStep(3);
            }}
            setError={setError}
            reload={loadStatus}
          />
        )}

        {currentStep === 3 && status && (
          <Step3Courses
            jobId={jobId!}
            status={status}
            onApproved={() => {
              loadStatus();
              setCurrentStep(4);
            }}
            setError={setError}
            reload={loadStatus}
          />
        )}

        {currentStep === 4 && status && (
          <Step4Generation
            jobId={jobId!}
            status={status}
            onDone={() => {
              loadStatus();
              setCurrentStep(5);
            }}
            setError={setError}
          />
        )}

        {currentStep === 5 && status && (
          <Step5Done
            jobId={jobId!}
            status={status}
            onNewPipeline={startNewPipeline}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep }: { currentStep: number }) {
  const t = useT();
  const steps = [
    { num: 1, label: t('pipeline.steps.start') },
    { num: 2, label: t('pipeline.steps.competencies') },
    { num: 3, label: t('pulse.courses') },
    { num: 4, label: t('pipeline.steps.content') },
    { num: 5, label: t('pipeline.steps.done') },
  ];

  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, idx) => (
        <div key={step.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                currentStep > step.num
                  ? 'bg-status-success-fg border-status-success-fg text-bg-canvas'
                  : currentStep === step.num
                  ? 'bg-bg-accent border-border-accent text-fg-on-accent'
                  : 'bg-bg-surface border-border-strong text-fg-subtle'
              }`}
            >
              {currentStep > step.num ? '✓' : step.num}
            </div>
            <span
              className={`text-xs mt-1 ${
                currentStep >= step.num ? 'text-fg-default font-medium' : 'text-fg-subtle'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${
                currentStep > step.num ? 'bg-status-success-fg' : 'bg-bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Start
// ---------------------------------------------------------------------------

function Step1Start({
  onCreated,
  setError,
  setLoading,
  loading,
}: {
  onCreated: (jobId: string) => void;
  setError: (e: string | null) => void;
  setLoading: (l: boolean) => void;
  loading: boolean;
}) {
  const t = useT();
  const [documentId, setDocumentId] = useState('');
  const [targetRole, setTargetRole] = useState('supervisor');
  const [standardsIds, setStandardsIds] = useState('');

  const handleStart = async () => {
    if (!documentId.trim()) {
      setError(t('pipeline.step1.uuidRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const standards = standardsIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await pulsePipelineApi.start({
        document_id: documentId.trim(),
        target_role: targetRole,
        standards_document_ids: standards,
        language: 'ru',
      });
      onCreated(res.data.job_id);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || t('pipeline.errors.start'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-fg-default">{t('pipeline.step1.title')}</h2>
      <p className="text-sm text-fg-muted">
        {t('pipeline.step1.hint')}
      </p>

      <div>
        <label className="block text-sm font-medium text-fg-muted mb-1">
          {t('pipeline.step1.targetRole')}
        </label>
        <select
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full px-3 py-2 border border-border-strong rounded-md"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {t(r.labelKey)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-fg-muted mb-1">
          {t('pipeline.step1.documentUuid')}
        </label>
        <input
          type="text"
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
          placeholder="00000000-0000-0000-0000-000000000000"
          className="w-full px-3 py-2 border border-border-strong rounded-md font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-fg-muted mb-1">
          {t('pipeline.step1.standardsUuid')}
        </label>
        <input
          type="text"
          value={standardsIds}
          onChange={(e) => setStandardsIds(e.target.value)}
          placeholder="uuid1, uuid2, uuid3"
          className="w-full px-3 py-2 border border-border-strong rounded-md font-mono text-sm"
        />
        <p className="text-xs text-fg-subtle mt-1">
          {t('pipeline.step1.standardsHint')}
        </p>
      </div>

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full bg-bg-accent hover:bg-bg-accent-hover disabled:opacity-50 text-fg-on-accent font-medium py-2.5 rounded-md transition-colors"
      >
        {loading ? t('pipeline.step1.extracting') : t('pipeline.step1.startButton')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Competencies Review
// ---------------------------------------------------------------------------

function Step2Competencies({
  jobId,
  status,
  onApproved,
  setError,
  reload,
}: {
  jobId: string;
  status: PulsePipelineStatus;
  onApproved: () => void;
  setError: (e: string | null) => void;
  reload: () => void;
}) {
  const t = useT();
  const initialComps = status.output_data?.draft_competencies || [];
  const [competencies, setCompetencies] = useState<DraftCompetency[]>(initialComps);
  const [saving, setSaving] = useState(false);

  // Sync local state with server status
  useEffect(() => {
    setCompetencies(status.output_data?.draft_competencies || []);
  }, [status.output_data?.draft_competencies]);

  const updateField = (idx: number, field: keyof DraftCompetency, value: unknown) => {
    setCompetencies((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addRow = () => {
    setCompetencies((prev) => [
      ...prev,
      {
        tmp_id: `new-${Date.now()}`,
        name: '',
        name_uz: '',
        description: '',
        category: 'professional',
        bloom_level: 'understand',
        ksa_type: 'skill',
        suggested_difficulty: 2,
        keywords: [],
      },
    ]);
  };

  const removeRow = (idx: number) => {
    setCompetencies((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await pulsePipelineApi.updateCompetencies(jobId, competencies);
      reload();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || t('pipeline.errors.save'));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (competencies.length < 4 || competencies.length > 12) {
      setError(t('pipeline.step2.countError', { count: competencies.length }));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Сначала сохраняем правки
      await pulsePipelineApi.updateCompetencies(jobId, competencies);
      // Потом утверждаем
      await pulsePipelineApi.approveCompetencies(jobId);
      onApproved();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || t('pipeline.errors.approve'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-fg-default">
          {t('pipeline.step2.title', { count: competencies.length })}
        </h2>
        <span className="text-sm text-fg-subtle">
          {status.output_data?.role_name_extracted && t('pipeline.step2.role', { role: status.output_data.role_name_extracted })}
        </span>
      </div>
      <p className="text-sm text-fg-muted">
        {t('pipeline.step2.hint', { count: initialComps.length })}
      </p>

      {/* Desktop: таблица (sm+) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-bg-muted text-left text-xs text-fg-subtle uppercase">
              <th className="px-3 py-2 border-b border-border-default">{t('pipeline.nameRu')}</th>
              <th className="px-3 py-2 border-b border-border-default">{t('pipeline.nameUz')}</th>
              <th className="px-3 py-2 border-b border-border-default">{t('pipeline.description')}</th>
              <th className="px-3 py-2 border-b border-border-default w-20">{t('pipeline.difficulty')}</th>
              <th className="px-3 py-2 border-b border-border-default w-12"></th>
            </tr>
          </thead>
          <tbody>
            {competencies.map((c, idx) => (
              <tr key={c.tmp_id || idx} className="border-b border-border-default">
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateField(idx, 'name', e.target.value)}
                    className="w-full px-2 py-1 border border-border-default rounded"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="text"
                    value={c.name_uz || ''}
                    onChange={(e) => updateField(idx, 'name_uz', e.target.value)}
                    className="w-full px-2 py-1 border border-border-default rounded"
                  />
                </td>
                <td className="px-2 py-1">
                  <textarea
                    value={c.description}
                    onChange={(e) => updateField(idx, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-2 py-1 border border-border-default rounded text-sm"
                  />
                </td>
                <td className="px-2 py-1">
                  <select
                    value={c.suggested_difficulty || 2}
                    onChange={(e) => updateField(idx, 'suggested_difficulty', parseInt(e.target.value))}
                    className="w-full px-2 py-1 border border-border-default rounded"
                  >
                    <option value={1}>{`1 - ${t('pulse.trainee')}`}</option>
                    <option value={2}>{`2 - ${t('pulse.practitioner')}`}</option>
                    <option value={3}>{`3 - ${t('pulse.expert')}`}</option>
                    <option value={4}>{`4 - ${t('pulse.master')}`}</option>
                  </select>
                </td>
                <td className="px-2 py-1 text-center">
                  <button
                    onClick={() => removeRow(idx)}
                    className="text-status-danger-fg hover:opacity-80 text-lg"
                    title={t('common.actions.delete')}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card-layout (<sm) */}
      <div className="block sm:hidden space-y-3">
        {competencies.map((c, idx) => (
          <div
            key={c.tmp_id || idx}
            className="rounded-md border border-border-default p-3 space-y-2 bg-bg-surface"
          >
            <div>
              <label className="block text-sm font-medium text-fg-subtle mb-1">{t('pipeline.nameRu')}</label>
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateField(idx, 'name', e.target.value)}
                className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fg-subtle mb-1">{t('pipeline.nameUz')}</label>
              <input
                type="text"
                value={c.name_uz || ''}
                onChange={(e) => updateField(idx, 'name_uz', e.target.value)}
                className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fg-subtle mb-1">{t('pipeline.description')}</label>
              <textarea
                value={c.description}
                onChange={(e) => updateField(idx, 'description', e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-fg-subtle mb-1">{t('pipeline.difficulty')}</label>
              <select
                value={c.suggested_difficulty || 2}
                onChange={(e) => updateField(idx, 'suggested_difficulty', parseInt(e.target.value))}
                className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
              >
                <option value={1}>{`1 - ${t('pulse.trainee')}`}</option>
                <option value={2}>{`2 - ${t('pulse.practitioner')}`}</option>
                <option value={3}>{`3 - ${t('pulse.expert')}`}</option>
                <option value={4}>{`4 - ${t('pulse.master')}`}</option>
              </select>
            </div>
            <div className="pt-1">
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                onClick={() => removeRow(idx)}
              >
                {t('common.actions.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={addRow}
          className="px-3 py-1.5 text-sm border border-border-strong rounded-md hover:bg-bg-muted"
        >
          {t('pipeline.step2.addCompetency')}
        </button>
        <button
          onClick={saveDraft}
          disabled={saving}
          className="px-3 py-1.5 text-sm border border-border-strong rounded-md hover:bg-bg-muted disabled:opacity-50"
        >
          {t('pipeline.step2.saveDraft')}
        </button>
      </div>

      <button
        onClick={handleApprove}
        disabled={saving || competencies.length < 4}
        className="w-full bg-status-success-fg hover:opacity-90 disabled:opacity-50 text-bg-canvas font-medium py-2.5 rounded-md"
      >
        {saving ? t('pipeline.saving') : t('pipeline.step2.approveButton')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Courses Review
// ---------------------------------------------------------------------------

function Step3Courses({
  jobId,
  status,
  onApproved,
  setError,
  reload,
}: {
  jobId: string;
  status: PulsePipelineStatus;
  onApproved: () => void;
  setError: (e: string | null) => void;
  reload: () => void;
}) {
  const t = useT();
  const draftCourses = status.output_data?.draft_courses || [];
  const [courses, setCourses] = useState<DraftCourse[]>(draftCourses);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [minPerTerritory, setMinPerTerritory] = useState(15);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  useEffect(() => {
    setCourses(status.output_data?.draft_courses || []);
  }, [status.output_data?.draft_courses]);

  const approvedCompetencyIds = status.output_data?.approved_competency_ids || [];

  // Загружаем имена компетенций для отображения
  // (для упрощения пока показываем UUID)

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await pulsePipelineApi.generateCourses(jobId, minPerTerritory);
      setCourses(res.data.draft_courses);
      setEstimatedCost(res.data.estimated_cost_usd);
      reload();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || t('pipeline.errors.generateCourses'));
    } finally {
      setGenerating(false);
    }
  };

  const territoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      trainee: 0,
      practitioner: 0,
      expert: 0,
      master: 0,
    };
    courses.forEach((c) => {
      counts[c.level] = (counts[c.level] || 0) + 1;
    });
    return counts;
  }, [courses]);

  const updateCourse = (idx: number, field: keyof DraftCourse, value: unknown) => {
    setCourses((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const removeCourse = (idx: number) => {
    setCourses((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCourse = (level: string) => {
    setCourses((prev) => [
      ...prev,
      {
        tmp_id: `new-${Date.now()}`,
        title_ru: '',
        title_uz: '',
        level: level as DraftCourse['level'],
        weight: 2,
        competency_ids: approvedCompetencyIds.slice(0, 1),
        short_description_ru: '',
        course_type: 'work_standard',
      },
    ]);
  };

  const handleApprove = async () => {
    // Минимум 15 на территорию
    const shortage = Object.entries(territoryCounts).filter(([, count]) => count < 15);
    if (shortage.length > 0) {
      const msg = shortage.map(([level, c]) => `${t(LEVEL_LABEL_KEYS[level])}: ${c}/15`).join(', ');
      if (!confirm(t('pipeline.step3.confirmShortage', { list: msg }))) {
        return;
      }
    }

    if (!confirm(t('pipeline.step3.confirmStart', {
      count: courses.length,
      cost: estimatedCost?.toFixed(2) || '?',
    }))) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // Сохраняем правки
      await pulsePipelineApi.updateCourses(jobId, courses);
      // Утверждаем (создание LearningCourse shells)
      await pulsePipelineApi.approveCourses(jobId);
      // Запускаем генерацию контента
      await pulsePipelineApi.generateContent(jobId);
      onApproved();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || t('pipeline.errors.approve'));
    } finally {
      setSaving(false);
    }
  };

  // Если courses пусто — показываем кнопку генерации
  if (courses.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-fg-default">{t('pipeline.step3.titleGenerate')}</h2>
        <p className="text-sm text-fg-muted">
          {t('pipeline.step3.generateHint', { count: status.output_data?.approved_competency_ids?.length || 0 })}
        </p>

        <div>
          <label className="block text-sm font-medium text-fg-muted mb-1">
            {t('pipeline.step3.minPerTerritory')}
          </label>
          <input
            type="number"
            min={5}
            max={30}
            value={minPerTerritory}
            onChange={(e) => setMinPerTerritory(parseInt(e.target.value) || 15)}
            className="w-32 px-3 py-2 border border-border-strong rounded-md"
          />
          <p className="text-xs text-fg-subtle mt-1">
            {t('pipeline.step3.totalMin', { count: minPerTerritory * 4 })}
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full bg-bg-accent hover:bg-bg-accent-hover disabled:opacity-50 text-fg-on-accent font-medium py-2.5 rounded-md"
        >
          {generating ? t('pipeline.step3.generating') : t('pipeline.step3.generateButton')}
        </button>
      </div>
    );
  }

  // Группировка по level
  const grouped: Record<string, DraftCourse[]> = {
    trainee: [],
    practitioner: [],
    expert: [],
    master: [],
  };
  courses.forEach((c) => grouped[c.level]?.push(c));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-fg-default">
          {t('pipeline.step3.title', { count: courses.length })}
        </h2>
        {estimatedCost && (
          <span className="text-sm text-fg-muted">
            {t('pipeline.step3.costEstimate')} <strong>${estimatedCost.toFixed(2)}</strong>
          </span>
        )}
      </div>

      {/* Territory counts */}
      <div className="grid grid-cols-4 gap-2">
        {(['trainee', 'practitioner', 'expert', 'master'] as const).map((level) => {
          const count = territoryCounts[level];
          const ok = count >= 15;
          return (
            <div
              key={level}
              className={`p-3 rounded-lg border-2 ${ok ? 'border-status-success-fg bg-status-success-bg' : 'border-status-danger-fg bg-status-danger-bg'}`}
            >
              <div className="text-xs text-fg-muted">{t(LEVEL_LABEL_KEYS[level])}</div>
              <div className={`text-lg font-bold ${ok ? 'text-status-success-fg' : 'text-status-danger-fg'}`}>
                {`${count} / 15`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Курсы по группам */}
      {(['trainee', 'practitioner', 'expert', 'master'] as const).map((level) => (
        <details key={level} open className="border border-border-default rounded-lg">
          <summary className={`px-3 py-2 cursor-pointer font-medium ${LEVEL_COLORS[level]}`}>
            {t(LEVEL_LABEL_KEYS[level])} ({grouped[level].length})
          </summary>
          <div className="p-2 space-y-1">
            {grouped[level].map((course) => {
              const idx = courses.indexOf(course);
              return (
                <div key={course.tmp_id || idx} className="p-2 border border-border-default rounded">
                  {/* Desktop: inline-layout с маленьким × (sm+) */}
                  <div className="hidden sm:flex items-start gap-2">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={course.title_ru}
                        onChange={(e) => updateCourse(idx, 'title_ru', e.target.value)}
                        placeholder={t('pipeline.nameRu')}
                        className="px-2 py-1 border border-border-default rounded text-sm"
                      />
                      <input
                        type="text"
                        value={course.title_uz || ''}
                        onChange={(e) => updateCourse(idx, 'title_uz', e.target.value)}
                        placeholder="Nomi UZ"
                        className="px-2 py-1 border border-border-default rounded text-sm"
                      />
                      <select
                        value={course.course_type}
                        onChange={(e) => updateCourse(idx, 'course_type', e.target.value)}
                        className="px-2 py-1 border border-border-default rounded text-sm"
                      >
                        {COURSE_TYPES.map((ct) => (
                          <option key={ct.value} value={ct.value}>{t(ct.labelKey)}</option>
                        ))}
                      </select>
                      <select
                        value={course.weight}
                        onChange={(e) => updateCourse(idx, 'weight', parseInt(e.target.value))}
                        className="px-2 py-1 border border-border-default rounded text-sm"
                      >
                        <option value={1}>{t('pipeline.weight1')}</option>
                        <option value={2}>{t('pipeline.weight2')}</option>
                        <option value={3}>{t('pipeline.weight3')}</option>
                        <option value={4}>{t('pipeline.weight4')}</option>
                      </select>
                      <textarea
                        value={course.short_description_ru || ''}
                        onChange={(e) => updateCourse(idx, 'short_description_ru', e.target.value)}
                        placeholder={t('pipeline.shortDescription')}
                        rows={1}
                        className="md:col-span-2 px-2 py-1 border border-border-default rounded text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeCourse(idx)}
                      className="text-status-danger-fg hover:opacity-80 text-lg"
                      title={t('common.actions.delete')}
                    >
                      ×
                    </button>
                  </div>

                  {/* Mobile: card-layout с явной кнопкой "Удалить" (<sm) */}
                  <div className="block sm:hidden space-y-2">
                    <div>
                      <label className="block text-sm font-medium text-fg-subtle mb-1">{t('pipeline.nameRu')}</label>
                      <input
                        type="text"
                        value={course.title_ru}
                        onChange={(e) => updateCourse(idx, 'title_ru', e.target.value)}
                        placeholder={t('pipeline.nameRu')}
                        className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fg-subtle mb-1">{'Nomi UZ'}</label>
                      <input
                        type="text"
                        value={course.title_uz || ''}
                        onChange={(e) => updateCourse(idx, 'title_uz', e.target.value)}
                        placeholder="Nomi UZ"
                        className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fg-subtle mb-1">{t('pipeline.courseType')}</label>
                      <select
                        value={course.course_type}
                        onChange={(e) => updateCourse(idx, 'course_type', e.target.value)}
                        className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
                      >
                        {COURSE_TYPES.map((ct) => (
                          <option key={ct.value} value={ct.value}>{t(ct.labelKey)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fg-subtle mb-1">{t('pipeline.weightLabel')}</label>
                      <select
                        value={course.weight}
                        onChange={(e) => updateCourse(idx, 'weight', parseInt(e.target.value))}
                        className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
                      >
                        <option value={1}>{t('pipeline.weight1')}</option>
                        <option value={2}>{t('pipeline.weight2')}</option>
                        <option value={3}>{t('pipeline.weight3')}</option>
                        <option value={4}>{t('pipeline.weight4')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fg-subtle mb-1">{t('pipeline.shortDescription')}</label>
                      <textarea
                        value={course.short_description_ru || ''}
                        onChange={(e) => updateCourse(idx, 'short_description_ru', e.target.value)}
                        placeholder={t('pipeline.shortDescription')}
                        rows={2}
                        className="w-full px-2 py-1.5 border border-border-default rounded text-sm"
                      />
                    </div>
                    <div className="pt-1">
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => removeCourse(idx)}
                      >
                        {t('common.actions.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => addCourse(level)}
              className="w-full px-3 py-1.5 text-sm border border-dashed border-border-strong rounded hover:bg-bg-muted"
            >
              {t('pipeline.step3.addCourse', { level: t(LEVEL_LABEL_KEYS[level]) })}
            </button>
          </div>
        </details>
      ))}

      <button
        onClick={handleApprove}
        disabled={saving || courses.length === 0}
        className="w-full bg-status-success-fg hover:opacity-90 disabled:opacity-50 text-bg-canvas font-medium py-3 rounded-md"
      >
        {saving
          ? t('pipeline.step3.creating')
          : t('pipeline.step3.approveButton', { count: courses.length })}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Content Generation Progress
// ---------------------------------------------------------------------------

function Step4Generation({
  jobId,
  status,
  onDone,
  setError,
}: {
  jobId: string;
  status: PulsePipelineStatus;
  onDone: () => void;
  setError: (e: string | null) => void;
}) {
  const t = useT();
  const generation = status.output_data?.generation;
  const total = generation?.items_total || 0;
  const completed = generation?.items_completed || 0;
  const failed = generation?.failed || [];
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const isDone = status.status === 'completed' || status.output_data?.current_stage === 'done';

  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(onDone, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDone, onDone]);

  const handleRetry = async (courseId: string) => {
    try {
      await pulsePipelineApi.retryCourse(jobId, courseId);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err.response?.data?.detail || t('pipeline.errors.retry'));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-fg-default">{t('pipeline.step4.title')}</h2>
      <p className="text-sm text-fg-muted">
        {t('pipeline.step4.hint')}
      </p>

      {/* Big progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-fg-muted">{status.current_step || t('pipeline.step4.processing')}</span>
          <span className="text-fg-muted">{completed} / {total}</span>
        </div>
        <div className="w-full bg-bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-fg-subtle mt-1">{t('pipeline.step4.percentDone', { percent: Math.round(progress) })}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-muted rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-fg-default">{total}</div>
          <div className="text-xs text-fg-subtle">{t('pipeline.step4.total')}</div>
        </div>
        <div className="bg-status-success-bg rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-status-success-fg">{completed - failed.length}</div>
          <div className="text-xs text-fg-subtle">{t('pipeline.step4.success')}</div>
        </div>
        <div className="bg-status-danger-bg rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-status-danger-fg">{failed.length}</div>
          <div className="text-xs text-fg-subtle">{t('pipeline.step4.failed')}</div>
        </div>
      </div>

      {/* Failed courses */}
      {failed.length > 0 && (
        <div className="border border-border-default rounded-lg p-3">
          <h3 className="text-sm font-medium text-status-danger-fg mb-2">
            {t('pipeline.step4.failedTitle', { count: failed.length })}
          </h3>
          <ul className="space-y-1 text-xs">
            {failed.slice(0, 10).map((f, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="font-mono text-fg-muted">
                  {`${f.course_id.slice(0, 8)}... (${f.language})`}
                </span>
                <button
                  onClick={() => handleRetry(f.course_id)}
                  className="text-bg-accent hover:underline"
                >
                  {t('common.retry')}
                </button>
              </li>
            ))}
            {failed.length > 10 && (
              <li className="text-fg-subtle italic">{t('pipeline.step4.andMore', { count: failed.length - 10 })}</li>
            )}
          </ul>
        </div>
      )}

      {isDone && (
        <div className="bg-status-success-bg border border-status-success-fg rounded-lg p-4 text-center">
          <p className="text-status-success-fg font-medium">{t('pipeline.step4.doneTitle')}</p>
          <p className="text-sm text-fg-muted mt-1">{t('pipeline.step4.doneHint')}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Done
// ---------------------------------------------------------------------------

function Step5Done({
  jobId: _jobId,
  status,
  onNewPipeline,
}: {
  jobId: string;
  status: PulsePipelineStatus;
  onNewPipeline: () => void;
}) {
  const t = useT();
  const targetRole = status.output_data?.target_role;
  const competencies = status.output_data?.approved_competency_ids?.length || 0;
  const courses = status.output_data?.created_course_ids?.length || 0;
  const generation = status.output_data?.generation;
  const failed = generation?.failed?.length || 0;
  const success = (generation?.items_completed || 0) - failed;
  const sectionId = status.output_data?.section_id;

  return (
    <div className="space-y-4">
      <div className="text-center py-6">
        <div className="text-5xl mb-3">{'✓'}</div>
        <h2 className="text-2xl font-bold text-fg-default">{t('pipeline.step5.title')}</h2>
        <p className="text-fg-muted mt-1">{t('pipeline.step5.rolePrefix')} <strong>{targetRole}</strong> {t('pipeline.step5.roleReady')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-status-info-bg rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-status-info-fg">{competencies}</div>
          <div className="text-sm text-fg-muted">{t('pipeline.step5.competencies')}</div>
        </div>
        <div className="bg-status-success-bg rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-status-success-fg">{courses}</div>
          <div className="text-sm text-fg-muted">{t('pipeline.step5.coursesCreated')}</div>
        </div>
        <div className="bg-bg-muted rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-role-sales">{success}</div>
          <div className="text-sm text-fg-muted">{t('pipeline.step5.contentReady')}</div>
        </div>
      </div>

      {failed > 0 && (
        <div className="bg-status-warning-bg border border-status-warning-fg text-status-warning-fg px-4 py-3 rounded-lg text-sm">
          <strong>{failed}</strong> {t('pipeline.step5.failedNote')}
        </div>
      )}

      <div className="flex gap-2">
        {sectionId && (
          <a
            href={`/learning?section=${sectionId}`}
            className="flex-1 bg-bg-accent hover:bg-bg-accent-hover text-fg-on-accent text-center font-medium py-2.5 rounded-md"
          >
            {t('pipeline.step5.goToCourses')}
          </a>
        )}
        <button
          onClick={onNewPipeline}
          className="flex-1 border border-border-strong hover:bg-bg-muted text-fg-muted font-medium py-2.5 rounded-md"
        >
          {t('pipeline.newPipeline')}
        </button>
      </div>
    </div>
  );
}
