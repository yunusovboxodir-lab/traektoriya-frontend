/**
 * Страница «Структура» — управление регионами, дилерами и супервайзерами.
 * Доступна admin+ (рендерится как вкладка в TeamHubPage).
 *
 * Иерархия: Регион → Дилер → Супервайзер (команда).
 * Бэкенд: /api/v1/teams/regions, /api/v1/teams/dealers, /api/v1/teams, /api/v1/users.
 */
import { useState, useEffect, useCallback } from 'react';
import { teamApi } from '../api/team';
import { usersApi } from '../api/users';
import type { Region, Dealer, Team } from '../api/team';
import { toast } from '../stores/toastStore';
import { Button, EmptyState } from '@/components/ui';
import { MapPin, Building2, UserCog, Plus, Pencil, Power, X as XIcon } from 'lucide-react';

type Section = 'regions' | 'dealers' | 'supervisors';

// ---------------------------------------------------------------------------
// Общий каркас модалки
// ---------------------------------------------------------------------------

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XIcon size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

// ---------------------------------------------------------------------------
// Секция «Регионы»
// ---------------------------------------------------------------------------

function RegionsSection() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Region | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teamApi.getRegions(true);
      setRegions(res.data?.items ?? []);
    } catch {
      toast.error('Ошибка загрузки регионов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (r: Region) => {
    try {
      await teamApi.updateRegion(r.id, { is_active: !r.is_active });
      toast.success(r.is_active ? 'Регион выключен' : 'Регион включён');
      load();
    } catch {
      toast.error('Не удалось изменить статус');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{regions.length} регион(ов)</p>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          Добавить регион
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : regions.length === 0 ? (
        <EmptyState icon={<MapPin size={48} />} title="Регионов пока нет" description="Добавьте первый регион." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="text-left px-4 py-2">Название</th>
                <th className="text-left px-4 py-2">Страна</th>
                <th className="text-center px-4 py-2">Статус</th>
                <th className="text-right px-4 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-gray-600">{r.country}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_active ? 'Активен' : 'Выключен'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(r)} className="text-gray-500 hover:text-blue-600" title="Переименовать">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => toggleActive(r)} className="text-gray-500 hover:text-amber-600" title={r.is_active ? 'Выключить' : 'Включить'}>
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <RegionForm onClose={() => setShowCreate(false)} onSaved={load} />}
      {editing && <RegionForm region={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}

function RegionForm({ region, onClose, onSaved }: { region?: Region; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(region?.name ?? '');
  const [country, setCountry] = useState(region?.country ?? 'Uzbekistan');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (region) {
        await teamApi.updateRegion(region.id, { name: name.trim(), country: country.trim() });
        toast.success('Регион обновлён');
      } else {
        await teamApi.createRegion({ name: name.trim(), country: country.trim() });
        toast.success('Регион создан');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Не удалось сохранить регион');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={region ? 'Редактировать регион' : 'Новый регион'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Навои" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Страна</label>
          <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Отмена</button>
          <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Секция «Дилеры»
// ---------------------------------------------------------------------------

function DealersSection() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Dealer | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, rRes] = await Promise.all([
        teamApi.getDealers(undefined, true),
        teamApi.getRegions(true),
      ]);
      setDealers(dRes.data?.items ?? []);
      setRegions(rRes.data?.items ?? []);
    } catch {
      toast.error('Ошибка загрузки дилеров');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (d: Dealer) => {
    try {
      await teamApi.updateDealer(d.id, { is_active: !d.is_active });
      toast.success(d.is_active ? 'Дилер выключен' : 'Дилер включён');
      load();
    } catch {
      toast.error('Не удалось изменить статус');
    }
  };

  // Группировка дилеров по регионам
  const byRegion = new Map<string, Dealer[]>();
  for (const d of dealers) {
    const key = d.region_name ?? 'Без региона';
    if (!byRegion.has(key)) byRegion.set(key, []);
    byRegion.get(key)!.push(d);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{dealers.length} дилер(ов)</p>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)} disabled={regions.length === 0}>
          Добавить дилера
        </Button>
      </div>

      {regions.length === 0 && !loading && (
        <p className="text-xs text-amber-600">Сначала добавьте хотя бы один регион в соседней вкладке.</p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : dealers.length === 0 ? (
        <EmptyState icon={<Building2 size={48} />} title="Дилеров пока нет" description="Добавьте первого дилера." />
      ) : (
        <div className="space-y-4">
          {Array.from(byRegion.entries()).map(([regionName, list]) => (
            <div key={regionName} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {regionName} · {list.length}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {list.map((d) => (
                    <tr key={d.id} className="border-t border-gray-100 first:border-t-0">
                      <td className="px-4 py-2 text-gray-900 font-medium">{d.name}</td>
                      <td className="px-4 py-2 text-center w-32">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {d.is_active ? 'Активен' : 'Выключен'}
                        </span>
                      </td>
                      <td className="px-4 py-2 w-24">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditing(d)} className="text-gray-500 hover:text-blue-600" title="Редактировать">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => toggleActive(d)} className="text-gray-500 hover:text-amber-600" title={d.is_active ? 'Выключить' : 'Включить'}>
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {showCreate && <DealerForm regions={regions} onClose={() => setShowCreate(false)} onSaved={load} />}
      {editing && <DealerForm dealer={editing} regions={regions} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}

function DealerForm({ dealer, regions, onClose, onSaved }: { dealer?: Dealer; regions: Region[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(dealer?.name ?? '');
  const [regionId, setRegionId] = useState(dealer?.region_id ?? (regions[0]?.id ?? ''));
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regionId) return;
    setSaving(true);
    try {
      if (dealer) {
        await teamApi.updateDealer(dealer.id, { name: name.trim(), region_id: regionId });
        toast.success('Дилер обновлён');
      } else {
        await teamApi.createDealer({ name: name.trim(), region_id: regionId });
        toast.success('Дилер создан');
      }
      onSaved();
      onClose();
    } catch {
      toast.error('Не удалось сохранить дилера');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={dealer ? 'Редактировать дилера' : 'Новый дилер'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Алишер" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Регион *</label>
          <select className={inputCls} value={regionId} onChange={(e) => setRegionId(e.target.value)} required>
            <option value="">— Выберите регион —</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Отмена</button>
          <button type="submit" disabled={saving || !name.trim() || !regionId} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Секция «Супервайзеры» (учётная запись + команда под дилером)
// ---------------------------------------------------------------------------

function SupervisorsSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, rRes] = await Promise.all([
        teamApi.getTeams(),
        teamApi.getRegions(true),
      ]);
      setTeams(tRes.data?.items ?? []);
      setRegions(rRes.data?.items ?? []);
    } catch {
      toast.error('Ошибка загрузки супервайзеров');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (t: Team) => {
    try {
      await teamApi.updateTeam(t.id, { is_active: !t.is_active });
      toast.success(t.is_active ? 'Супервайзер выключен' : 'Супервайзер включён');
      load();
    } catch {
      toast.error('Не удалось изменить статус');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{teams.length} супервайзер(ов)</p>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)} disabled={regions.length === 0}>
          Добавить супервайзера
        </Button>
      </div>

      {regions.length === 0 && !loading && (
        <p className="text-xs text-amber-600">Сначала добавьте регионы и дилеров.</p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState icon={<UserCog size={48} />} title="Супервайзеров пока нет" description="Добавьте первого супервайзера." />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="text-left px-4 py-2">Супервайзер</th>
                <th className="text-left px-4 py-2">Дилер</th>
                <th className="text-left px-4 py-2">Регион</th>
                <th className="text-center px-4 py-2">ТП</th>
                <th className="text-center px-4 py-2">Статус</th>
                <th className="text-right px-4 py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900 font-medium">{t.supervisor_name || t.name}</td>
                  <td className="px-4 py-2 text-gray-600">{t.dealer_name || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{t.region_name || '—'}</td>
                  <td className="px-4 py-2 text-center text-gray-600">{t.member_count ?? 0}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.is_active ? 'Активен' : 'Выключен'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggleActive(t)} className="text-gray-500 hover:text-amber-600" title={t.is_active ? 'Выключить' : 'Включить'}>
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <SupervisorForm regions={regions} onClose={() => setShowCreate(false)} onSaved={load} />}
    </div>
  );
}

function SupervisorForm({ regions, onClose, onSaved }: { regions: Region[]; onClose: () => void; onSaved: () => void }) {
  const [regionId, setRegionId] = useState(regions[0]?.id ?? '');
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dealerId, setDealerId] = useState('');
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [fullName, setFullName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Грузим дилеров при смене региона
  useEffect(() => {
    setDealerId('');
    setDealers([]);
    if (!regionId) return;
    setLoadingDealers(true);
    teamApi.getDealers(regionId)
      .then((res) => setDealers(res.data?.items ?? []))
      .catch(() => setDealers([]))
      .finally(() => setLoadingDealers(false));
  }, [regionId]);

  const region = regions.find((r) => r.id === regionId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionId || !dealerId || !fullName.trim() || !login.trim() || password.length < 8) return;
    setSaving(true);
    try {
      // 1. Создаём пользователя-супервайзера
      const userRes = await usersApi.create({
        employee_id: login.trim(),
        password,
        full_name: fullName.trim(),
        role: 'supervisor',
        region: region?.name,
        phone: phone.trim() || undefined,
      });
      const supervisorId = userRes.data?.id;
      // 2. Создаём команду с привязкой к дилеру
      await teamApi.createTeam({
        name: fullName.trim(),
        dealer_id: dealerId,
        region_id: regionId,
        supervisor_id: supervisorId,
      });
      toast.success('Супервайзер создан');
      onSaved();
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail === 'User with this employee ID already exists' ? 'Логин уже занят' : 'Не удалось создать супервайзера');
    } finally {
      setSaving(false);
    }
  };

  const valid = regionId && dealerId && fullName.trim() && login.trim() && password.length >= 8;

  return (
    <Modal title="Новый супервайзер" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Регион *</label>
          <select className={inputCls} value={regionId} onChange={(e) => setRegionId(e.target.value)} required>
            <option value="">— Выберите регион —</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Дилер *</label>
          <select
            className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
            value={dealerId}
            onChange={(e) => setDealerId(e.target.value)}
            disabled={!regionId || loadingDealers}
            required
          >
            <option value="">
              {!regionId ? 'Сначала выберите регион' : loadingDealers ? 'Загрузка...' : dealers.length === 0 ? 'В регионе нет дилеров' : '— Выберите дилера —'}
            </option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ФИО супервайзера *</label>
          <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Холматов Мухаммадюсуф" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин (ID) *</label>
            <input className={inputCls} value={login} onChange={(e) => setLogin(e.target.value)} placeholder="sv_kholmatov" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
            <input className={inputCls} type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="мин. 8 символов" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998..." />
        </div>
        {password.length > 0 && password.length < 8 && (
          <p className="text-xs text-red-500">Пароль должен быть не короче 8 символов.</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Отмена</button>
          <button type="submit" disabled={saving || !valid} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Главный компонент страницы
// ---------------------------------------------------------------------------

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'regions', label: 'Регионы', icon: <MapPin size={16} /> },
  { id: 'dealers', label: 'Дилеры', icon: <Building2 size={16} /> },
  { id: 'supervisors', label: 'Супервайзеры', icon: <UserCog size={16} /> },
];

export function OrgStructurePage() {
  const [section, setSection] = useState<Section>('regions');

  return (
    <div className="space-y-6">
      {/* Под-навигация секций */}
      <div className="flex gap-2 border-b border-gray-200">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              section === s.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {section === 'regions' && <RegionsSection />}
      {section === 'dealers' && <DealersSection />}
      {section === 'supervisors' && <SupervisorsSection />}
    </div>
  );
}
