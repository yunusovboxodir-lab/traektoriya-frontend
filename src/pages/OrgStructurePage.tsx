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
import { toast } from '@/components/ui';
import { Button, EmptyState, FormField, Input, Select, Switch } from '@/components/ui';
import { useT } from '../stores/langStore';
import { MapPin, Building2, UserCog, Plus, Pencil, X as XIcon } from 'lucide-react';

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

// ---------------------------------------------------------------------------
// Секция «Регионы»
// ---------------------------------------------------------------------------

function RegionsSection() {
  const t = useT();
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
      toast.error(t('org.errors.loadRegions') || 'Ошибка загрузки регионов');
    } finally {
      setLoading(false);
    }
    // t из useT() нестабильна (новая функция каждый рендер) → в deps даёт бесконечный цикл запросов
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (r: Region) => {
    try {
      await teamApi.updateRegion(r.id, { is_active: !r.is_active });
      toast.success(r.is_active ? (t('org.status.deactivated') || 'Регион выключен') : (t('org.status.activated') || 'Регион включён'));
      load();
    } catch {
      toast.error(t('org.errors.changeStatus') || 'Не удалось изменить статус');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{regions.length} {t('org.regions.count') || 'регион(ов)'}</p>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          {t('org.regions.add') || 'Добавить регион'}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : regions.length === 0 ? (
        <EmptyState icon={<MapPin size={48} />} title={t('org.regions.empty') || 'Регионов пока нет'} description={t('org.regions.emptyDesc') || 'Добавьте первый регион.'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="text-left px-4 py-2">{t('org.col.name') || 'Название'}</th>
                <th className="text-left px-4 py-2">{t('org.col.country') || 'Страна'}</th>
                <th className="text-center px-4 py-2">{t('org.col.status') || 'Статус'}</th>
                <th className="text-right px-4 py-2">{t('org.col.actions') || 'Действия'}</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-gray-600">{r.country}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {r.is_active ? (t('org.status.active') || 'Активен') : (t('org.status.inactive') || 'Выключен')}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(r)} className="text-gray-500 hover:text-blue-600" title="Переименовать">
                        <Pencil size={16} />
                      </button>
                      <Switch
                        size="sm"
                        checked={r.is_active}
                        onCheckedChange={() => toggleActive(r)}
                        aria-label={r.is_active ? `Выключить регион ${r.name}` : `Включить регион ${r.name}`}
                      />
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
        <FormField label="Название" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Навои" required autoFocus />
        </FormField>
        <FormField label="Страна">
          <Input value={country} onChange={(e) => setCountry(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
          <Button type="submit" loading={saving} disabled={!name.trim()}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Секция «Дилеры»
// ---------------------------------------------------------------------------

function DealersSection() {
  const t = useT();
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
      toast.error(t('org.errors.loadDealers') || 'Ошибка загрузки дилеров');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t нестабильна, см. RegionsSection
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (d: Dealer) => {
    try {
      await teamApi.updateDealer(d.id, { is_active: !d.is_active });
      toast.success(d.is_active ? (t('org.status.deactivated') || 'Дилер выключен') : (t('org.status.activated') || 'Дилер включён'));
      load();
    } catch {
      toast.error(t('org.errors.changeStatus') || 'Не удалось изменить статус');
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
        <p className="text-sm text-gray-500">{dealers.length} {t('org.dealers.count') || 'дилер(ов)'}</p>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)} disabled={regions.length === 0}>
          {t('org.dealers.add') || 'Добавить дилера'}
        </Button>
      </div>

      {regions.length === 0 && !loading && (
        <p className="text-xs text-amber-600">{t('org.dealers.noRegion') || 'Сначала добавьте хотя бы один регион в соседней вкладке.'}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : dealers.length === 0 ? (
        <EmptyState icon={<Building2 size={48} />} title={t('org.dealers.empty') || 'Дилеров пока нет'} description={t('org.dealers.emptyDesc') || 'Добавьте первого дилера.'} />
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
                          {d.is_active ? (t('org.status.active') || 'Активен') : (t('org.status.inactive') || 'Выключен')}
                        </span>
                      </td>
                      <td className="px-4 py-2 w-24">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditing(d)} className="text-gray-500 hover:text-blue-600" title="Редактировать">
                            <Pencil size={16} />
                          </button>
                          <Switch
                            size="sm"
                            checked={d.is_active}
                            onCheckedChange={() => toggleActive(d)}
                            aria-label={d.is_active ? `Выключить дилера ${d.name}` : `Включить дилера ${d.name}`}
                          />
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
        <FormField label="Название" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Алишер" required autoFocus />
        </FormField>
        <FormField label="Регион" required>
          <Select
            value={regionId}
            onValueChange={setRegionId}
            placeholder="— Выберите регион —"
            options={regions.map((r) => ({ value: r.id, label: r.name }))}
          />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
          <Button type="submit" loading={saving} disabled={!name.trim() || !regionId}>
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Секция «Супервайзеры» (учётная запись + команда под дилером)
// ---------------------------------------------------------------------------

function SupervisorsSection() {
  const t = useT();
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
      toast.error(t('org.errors.loadSupervisors') || 'Ошибка загрузки супервайзеров');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t нестабильна, см. RegionsSection
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (team: Team) => {
    try {
      await teamApi.updateTeam(team.id, { is_active: !team.is_active });
      toast.success(team.is_active ? (t('org.status.deactivated') || 'Супервайзер выключен') : (t('org.status.activated') || 'Супервайзер включён'));
      load();
    } catch {
      toast.error(t('org.errors.changeStatus') || 'Не удалось изменить статус');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{teams.length} {t('org.supervisors.count') || 'супервайзер(ов)'}</p>
        <Button size="sm" leftIcon={<Plus size={16} />} onClick={() => setShowCreate(true)} disabled={regions.length === 0}>
          {t('org.supervisors.add') || 'Добавить супервайзера'}
        </Button>
      </div>

      {regions.length === 0 && !loading && (
        <p className="text-xs text-amber-600">{t('org.supervisors.noRegion') || 'Сначала добавьте регионы и дилеров.'}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState icon={<UserCog size={48} />} title={t('org.supervisors.empty') || 'Супервайзеров пока нет'} description={t('org.supervisors.emptyDesc') || 'Добавьте первого супервайзера.'} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs">
                <th className="text-left px-4 py-2">{t('org.col.supervisor') || 'Супервайзер'}</th>
                <th className="text-left px-4 py-2">{t('org.col.dealer') || 'Дилер'}</th>
                <th className="text-left px-4 py-2">{t('org.col.region') || 'Регион'}</th>
                <th className="text-center px-4 py-2">{t('org.col.salesReps') || 'ТП'}</th>
                <th className="text-center px-4 py-2">{t('org.col.status') || 'Статус'}</th>
                <th className="text-right px-4 py-2">{t('org.col.actions') || 'Действия'}</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-900 font-medium">{team.supervisor_name || team.name}</td>
                  <td className="px-4 py-2 text-gray-600">{team.dealer_name || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{team.region_name || '—'}</td>
                  <td className="px-4 py-2 text-center text-gray-600">{team.member_count ?? 0}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${team.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {team.is_active ? (t('org.status.active') || 'Активен') : (t('org.status.inactive') || 'Выключен')}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Switch
                        size="sm"
                        checked={team.is_active}
                        onCheckedChange={() => toggleActive(team)}
                        aria-label={team.is_active ? `Выключить супервайзера ${team.supervisor_name || team.name}` : `Включить супервайзера ${team.supervisor_name || team.name}`}
                      />
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
    let createdEmployeeId: string | undefined;
    let createdUserId: string | undefined;
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
      createdEmployeeId = userRes.data?.employee_id;
      createdUserId = userRes.data?.id;
      // 2. Создаём команду с привязкой к дилеру
      try {
        await teamApi.createTeam({
          name: fullName.trim(),
          dealer_id: dealerId,
          region_id: regionId,
          supervisor_id: createdUserId,
        });
      } catch (teamErr: unknown) {
        // Rollback best-effort: деактивируем созданного пользователя чтобы не плодить сирот
        if (createdEmployeeId) {
          try {
            await usersApi.updateProfile(createdEmployeeId, { is_active: false });
          } catch {
            // rollback best-effort
          }
        }
        const detail = (teamErr as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        toast.error(detail || 'Не удалось создать команду. Пользователь деактивирован.');
        setSaving(false);
        return;
      }
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
        <FormField label="Регион" required>
          <Select
            value={regionId}
            onValueChange={setRegionId}
            placeholder="— Выберите регион —"
            options={regions.map((r) => ({ value: r.id, label: r.name }))}
          />
        </FormField>
        <FormField label="Дилер" required>
          <Select
            value={dealerId}
            onValueChange={setDealerId}
            disabled={!regionId || loadingDealers}
            placeholder={!regionId ? 'Сначала выберите регион' : loadingDealers ? 'Загрузка...' : dealers.length === 0 ? 'В регионе нет дилеров' : '— Выберите дилера —'}
            options={dealers.map((d) => ({ value: d.id, label: d.name }))}
          />
        </FormField>
        <FormField label="ФИО супервайзера" required>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Холматов Мухаммадюсуф" required />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Логин (ID)" required>
            <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="sv_kholmatov" required />
          </FormField>
          <FormField
            label="Пароль"
            required
            errorText={password.length > 0 && password.length < 8 ? 'Пароль должен быть не короче 8 символов.' : undefined}
          >
            <Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="мин. 8 символов" required />
          </FormField>
        </div>
        <FormField label="Телефон">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998..." />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Отмена</Button>
          <Button type="submit" loading={saving} disabled={!valid}>
            {saving ? 'Создание...' : 'Создать'}
          </Button>
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
