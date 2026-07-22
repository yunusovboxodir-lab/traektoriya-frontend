/**
 * OrganizationsPage — мультиорг-консоль платформенного superadmin.
 * Список организаций + онбординг новой (орг + её первый админ одним вызовом,
 * бэк POST /organizations). Обычный admin сюда не попадает: пункт меню гейтится
 * superadminStrictOnly, а бэк отвечает 403.
 */
import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  organizationsApi,
  type OrgListItem,
  type CreateOrgResponse,
} from '../api/organizations';
import { useLangStore } from '../stores/langStore';

const inputCls = 'w-full py-2 px-3 text-sm outline-none rounded-lg';
const inputStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
};

export function OrganizationsPage() {
  const lang = useLangStore((s) => s.lang);
  const t = (ru: string, uz: string) => (lang === 'uz' ? uz : ru);

  const [orgs, setOrgs] = useState<OrgListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Форма создания
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateOrgResponse | null>(null);

  const load = () => {
    setLoading(true);
    setLoadError(null);
    organizationsApi
      .list()
      .then((res) => setOrgs(res.data))
      .catch((e: unknown) => {
        setLoadError(
          isAxiosError(e) && e.response?.status === 403
            ? t('Доступно только платформенному суперадмину.', 'Faqat platforma superadmini uchun.')
            : t('Не удалось загрузить список организаций.', 'Tashkilotlar roʻyxatini yuklab boʻlmadi.'),
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreated(null);
    try {
      const res = await organizationsApi.create({
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        admin_employee_id: adminId.trim(),
        admin_password: adminPassword,
        admin_full_name: adminFullName.trim() || undefined,
      });
      setCreated(res.data);
      setName(''); setSlug(''); setAdminId(''); setAdminPassword(''); setAdminFullName('');
      load();
    } catch (err: unknown) {
      const detail = isAxiosError(err)
        ? (err.response?.data as { detail?: string } | undefined)?.detail
        : undefined;
      setCreateError(
        typeof detail === 'string'
          ? detail
          : t('Не удалось создать организацию.', 'Tashkilotni yaratib boʻlmadi.'),
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        {t('Организации', 'Tashkilotlar')}
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        {t(
          'Подключение новых организаций к платформе: организация + её первый администратор.',
          'Yangi tashkilotlarni platformaga ulash: tashkilot + uning birinchi administratori.',
        )}
      </p>

      {/* Форма онбординга */}
      <form
        onSubmit={handleCreate}
        className="rounded-xl p-5 mb-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          {t('Новая организация', 'Yangi tashkilot')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('Название', 'Nomi')}
            <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </label>
          <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('Слаг (a-z, 0-9, дефис)', 'Slug (a-z, 0-9, defis)')}
            <input className={inputCls} style={inputStyle} value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="acme-corp" />
          </label>
          <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('Логин первого админа', 'Birinchi admin logini')}
            <input className={inputCls} style={inputStyle} value={adminId} onChange={(e) => setAdminId(e.target.value)} required />
          </label>
          <label className="block text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('Пароль админа (мин. 8)', 'Admin paroli (kamida 8)')}
            <input className={inputCls} style={inputStyle} type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={8} />
          </label>
          <label className="block text-xs sm:col-span-2" style={{ color: 'var(--text-secondary)' }}>
            {t('Имя админа (опц.)', 'Admin ismi (ixtiyoriy)')}
            <input className={inputCls} style={inputStyle} value={adminFullName} onChange={(e) => setAdminFullName(e.target.value)} />
          </label>
        </div>

        {createError && (
          <p className="text-sm mt-3" style={{ color: 'var(--danger)' }}>{createError}</p>
        )}
        {created && (
          <div className="text-sm mt-3 rounded-lg p-3" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            {t('Организация создана.', 'Tashkilot yaratildi.')}{' '}
            {t('Логин админа', 'Admin logini')}: <b>{created.login_hint.employee_id}</b>,{' '}
            {t('слаг для входа', 'kirish uchun slug')}: <b>{created.login_hint.tenant_slug}</b>
          </div>
        )}

        <button
          type="submit"
          disabled={creating}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--info)', color: 'var(--text-inverse)' }}
        >
          {creating ? t('Создаю...', 'Yaratilmoqda...') : t('Создать организацию', 'Tashkilot yaratish')}
        </button>
      </form>

      {/* Список организаций */}
      {loading ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('Загрузка...', 'Yuklanmoqda...')}</p>
      ) : loadError ? (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>{loadError}</p>
      ) : (
        <div className="rounded-xl overflow-x-auto px-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('Название', 'Nomi')}</th>
                <th className="text-left py-2 pr-4 font-medium" style={{ color: 'var(--text-muted)' }}>{t('Слаг', 'Slug')}</th>
                <th className="text-right py-2 font-medium" style={{ color: 'var(--text-muted)' }}>{t('Статус', 'Holat')}</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="last:border-0" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2.5 pr-4" style={{ color: 'var(--text-primary)' }}>{o.name}</td>
                  <td className="py-2.5 pr-4" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{o.slug}</td>
                  <td className="py-2.5 text-right">
                    <span style={{ color: o.is_active ? 'var(--success)' : 'var(--text-muted)' }}>
                      {o.is_active ? t('активна', 'faol') : t('выключена', 'oʻchirilgan')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
