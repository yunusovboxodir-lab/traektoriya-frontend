/**
 * DrillList — секция «список текущего уровня»: города → дилеры → команды СВ →
 * таблица сотрудников → карточка сотрудника. Вынесено из OverviewTab.tsx.
 */
import type { ReactNode } from 'react';
import { useT, type Lang } from '../../../stores/langStore';
import type { LearningPulseData, LearningPulsePerson } from '../../../api/analytics';
import { EntityCard } from './EntityCard';
import { PeopleTable } from './PeopleTable';
import { PersonCard } from './PersonCard';
import {
  aggregateAxes, avgOf, rmZones, scopedPeople, type DrillState,
} from './helpers';

interface DrillListProps {
  data: LearningPulseData;
  drill: DrillState;
  scoped: LearningPulsePerson[];
  lang: Lang;
  onPatch: (p: Partial<DrillState>) => void;
  onSetDrill: (s: DrillState) => void;
}

export function DrillList({ data, drill, scoped, lang, onPatch, onSetDrill }: DrillListProps) {
  const t = useT();

  const emptyCut = (
    <p className="text-sm py-3" style={{ color: 'var(--text-muted)' }}>
      {t('analytics.pulseDash.noEmployeesInCut')}
    </p>
  );

  let listTitle: string;
  let listBody: ReactNode;

  if (drill.person) {
    listTitle = t('analytics.pulseDash.listTitlePersonCard');
    const zones = rmZones(data);
    const zoneCities = drill.person.role === 'regional_manager' ? zones[drill.person.full_name] : undefined;
    listBody = (
      <PersonCard
        person={drill.person}
        zoneCities={zoneCities}
        onJumpToCity={(city) => onSetDrill({ role: 'supervisor', city, dealer: null, team: null, person: null })}
      />
    );
  } else if (drill.team) {
    listTitle = t('analytics.pulseDash.listTitleEmployees');
    listBody = <PeopleTable people={scoped} onSelect={(p: LearningPulsePerson) => onPatch({ person: p })} />;
  } else if (drill.dealer) {
    listTitle = t('analytics.pulseDash.listTitleTeams');
    const cityObj = data.hierarchy.cities.find((c) => c.name === drill.city);
    const dealerObj = cityObj?.dealers.find((d) => d.name === drill.dealer);
    const teams = dealerObj?.teams ?? [];
    listBody = teams.length === 0 ? emptyCut : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => {
          const teamPeople = scopedPeople(data, {
            role: drill.role, city: drill.city, dealer: drill.dealer, team: team.name,
          });
          return (
            <EntityCard
              key={team.name}
              title={team.name}
              subtitle={`${t('common.roles.abbreviations.sv')}: ${team.supervisor_name} · ${t('analytics.pulseDash.peopleCount', { n: teamPeople.length })}`}
              pulse={avgOf(teamPeople.map((p) => p.pulse * 100))}
              axes={aggregateAxes(teamPeople)}
              lang={lang}
              onSelect={() => onPatch({ team: team.name })}
            />
          );
        })}
      </div>
    );
  } else if (drill.city) {
    listTitle = t('analytics.pulseDash.listTitleDealers');
    const cityObj = data.hierarchy.cities.find((c) => c.name === drill.city);
    const dealers = cityObj?.dealers ?? [];
    listBody = dealers.length === 0 ? emptyCut : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dealers.map((dealer) => {
          const dealerPeople = scopedPeople(data, { role: drill.role, city: drill.city, dealer: dealer.name });
          return (
            <EntityCard
              key={dealer.name}
              title={dealer.name}
              subtitle={`${t('analytics.pulseDash.dealersCount', { n: dealer.teams.length })} · ${t('analytics.pulseDash.peopleCount', { n: dealerPeople.length })}`}
              pulse={avgOf(dealerPeople.map((p) => p.pulse * 100))}
              axes={aggregateAxes(dealerPeople)}
              lang={lang}
              onSelect={() => onPatch({ dealer: dealer.name })}
            />
          );
        })}
      </div>
    );
  } else if (drill.role === 'regional_manager') {
    listTitle = t('analytics.pulseDash.listTitleRmZones');
    const zones = rmZones(data);
    const rms = data.people.filter((p) => p.role === 'regional_manager');
    listBody = rms.length === 0 ? emptyCut : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rms.map((rm) => {
          const zoneCities = zones[rm.full_name];
          const under = zoneCities
            ? data.people.filter((p) => p.role !== 'regional_manager' && zoneCities.includes(p.city)).length
            : 0;
          const subtitle = zoneCities && zoneCities.length > 0
            ? `${zoneCities.join(' · ')} · ${t('analytics.pulseDash.underCount', { n: under })}`
            : t('analytics.pulseDash.noZoneAssigned');
          return (
            <EntityCard
              key={rm.user_id}
              title={rm.full_name || rm.employee_id}
              subtitle={subtitle}
              pulse={rm.pulse * 100}
              axes={aggregateAxes([rm])}
              lang={lang}
              onSelect={() => onPatch({ person: rm })}
            />
          );
        })}
      </div>
    );
  } else {
    listTitle = t('analytics.pulseDash.listTitleCities');
    listBody = data.hierarchy.cities.length === 0 ? emptyCut : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.hierarchy.cities.map((city) => {
          const cityPeople = scopedPeople(data, { role: drill.role, city: city.name });
          return (
            <EntityCard
              key={city.name}
              title={city.name}
              subtitle={`${t('analytics.pulseDash.dealersCount', { n: city.dealers.length })} · ${t('analytics.pulseDash.peopleCount', { n: cityPeople.length })}`}
              pulse={avgOf(cityPeople.map((p) => p.pulse * 100))}
              axes={aggregateAxes(cityPeople)}
              lang={lang}
              onSelect={() => onPatch({ city: city.name })}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="pt-6">
      <span className="block text-xs uppercase tracking-wide font-semibold mb-4" style={{ color: 'var(--text-muted)' }}>
        {listTitle}
      </span>
      {listBody}
    </div>
  );
}
