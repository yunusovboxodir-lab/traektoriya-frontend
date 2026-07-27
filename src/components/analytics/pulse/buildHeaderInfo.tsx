/**
 * buildHeaderInfo — эйброу/заголовок/подзаголовок шапки для текущего уровня
 * drill-down (компания / город / дилер / команда / сотрудник).
 * Вынесено из OverviewTab.tsx, чтобы удержать файл в разумном размере.
 */
import type { ReactNode } from 'react';
import type { LearningPulseData } from '../../../api/analytics';
import { levelDictKey, rmNameOfCity, roleAbbrevKey, type DrillState } from './helpers';

type TFn = (key: string, params?: Record<string, string | number>) => string;

export interface HeaderInfo {
  eyebrow: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}

export function buildHeaderInfo(
  t: TFn,
  data: LearningPulseData,
  drill: DrillState,
  scopedCount: number,
  summaryCount: number,
  roleFullLabel: string,
): HeaderInfo {
  if (drill.person) {
    const p = drill.person;
    const levelKey = levelDictKey(p.level_ru);
    const levelLabel = levelKey ? t(levelKey) : p.level_ru;
    return {
      eyebrow: <>{t(`common.roles.abbreviations.${roleAbbrevKey(p.role)}`)} · {p.city}</>,
      title: p.full_name || p.employee_id,
      subtitle: t('analytics.pulseDash.subtitlePerson', { id: p.employee_id, level: levelLabel }),
    };
  }

  if (drill.team) {
    const cityObj = data.hierarchy.cities.find((c) => c.name === drill.city);
    const dealerObj = cityObj?.dealers.find((d) => d.name === drill.dealer);
    const teamObj = dealerObj?.teams.find((tm) => tm.name === drill.team);
    return {
      eyebrow: (
        <>{t('analytics.pulseDash.eyebrow.team')} · {t('common.roles.abbreviations.sv')} {teamObj?.supervisor_name ?? '—'}</>
      ),
      title: drill.team,
      subtitle: t('analytics.pulseDash.subtitleTeam', {
        city: drill.city ?? '', dealer: drill.dealer ?? '', count: scopedCount,
      }),
    };
  }

  if (drill.dealer) {
    return {
      eyebrow: <>{t('analytics.pulseDash.eyebrow.dealer')} · {drill.city}</>,
      title: drill.dealer,
      subtitle: t('analytics.pulseDash.subtitleDealer', { count: scopedCount, role: roleFullLabel }),
    };
  }

  if (drill.city) {
    const rm = rmNameOfCity(data, drill.city);
    return {
      eyebrow: (
        <>
          {t('analytics.pulseDash.eyebrow.city')}
          {rm && <> · {t('common.roles.abbreviations.rm')} {rm}</>}
        </>
      ),
      title: drill.city,
      subtitle: (
        <>
          {t('analytics.pulseDash.subtitleCity', { count: scopedCount, role: roleFullLabel })}
          {rm && <> · {t('analytics.pulseDash.subtitleCityRmSuffix', { name: rm })}</>}
        </>
      ),
    };
  }

  return {
    eyebrow: t('analytics.pulseDash.eyebrow.company'),
    title: t('analytics.pulseDash.companyName'),
    subtitle: t('analytics.pulseDash.subtitleCompany', { count: summaryCount, role: roleFullLabel }),
  };
}
