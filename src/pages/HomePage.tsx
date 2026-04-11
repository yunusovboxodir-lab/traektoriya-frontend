import { KPIPage } from './KPIPage';
import { NudgesWidget } from '../components/dashboard/NudgesWidget';
import { ShelfScanHistoryWidget } from '../components/dashboard/ShelfScanHistoryWidget';
import { StreakAchievementWidget } from '../components/dashboard/StreakAchievementWidget';

// ---------------------------------------------------------------------------
// HomePage — KPI + виджеты (ShelfScan, Достижения, Уведомления)
// ---------------------------------------------------------------------------

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* KPI — основной контент */}
      <KPIPage />

      {/* Виджеты внизу */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NudgesWidget />
        <ShelfScanHistoryWidget />
      </div>
      <StreakAchievementWidget />
    </div>
  );
}
