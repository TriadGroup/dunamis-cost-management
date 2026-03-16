import { PinGate } from '@/features/auth/PinGate';
import { DashboardPanel } from '@/features/dashboard/DashboardPanel';
import { InvestmentsPanel } from '@/features/investments/InvestmentsPanel';
import { PlanningPanel } from '@/features/planning/PlanningPanel';
import { useAppStore } from './store/useAppStore';

export const App = () => {
  const unlocked = useAppStore((state) => state.auth.unlocked);

  if (!unlocked) {
    return <PinGate />;
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1480px] space-y-5">
        <DashboardPanel />
        <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <PlanningPanel />
          <div className="space-y-4">
            <InvestmentsPanel />
          </div>
        </section>
      </div>
    </main>
  );
};
