import { StatsWidget } from "./widgets/StatsWidget";
import { RecentReportsWidget } from "./widgets/RecentReportsWidget";
import { ActiveInvestigationsWidget } from "./widgets/ActiveInvestigationsWidget";
import { QuickActionsWidget } from "./widgets/QuickActionsWidget";

export function Dashboard() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            </div>

            <StatsWidget />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <QuickActionsWidget />
                <RecentReportsWidget />
                <ActiveInvestigationsWidget />
            </div>
        </div>
    );
}
