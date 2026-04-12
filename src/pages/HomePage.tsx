import { KPIPage } from './KPIPage';
import { PulseWidget } from '../components/dashboard/PulseWidget';
import { TranslateWidget } from '../components/dashboard/TranslateWidget';
import { NudgesWidget } from '../components/dashboard/NudgesWidget';
import { ShelfScanHistoryWidget } from '../components/dashboard/ShelfScanHistoryWidget';
import { StreakAchievementWidget } from '../components/dashboard/StreakAchievementWidget';

// ---------------------------------------------------------------------------
// HomePage — KPI + Pulse мини-радар + виджеты
// ---------------------------------------------------------------------------

export function HomePage() {
  return (
    <div className="space-y-6">
      {/* KPI — основной контент */}
      <KPIPage />

      {/* Pulse мини-радар + Уведомления */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PulseWidget />
        <NudgesWidget />
      </div>

      {/* Перевод + ShelfScan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TranslateWidget />
        <ShelfScanHistoryWidget />
      </div>
      <StreakAchievementWidget />
    </div>
  );
}
