import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { investigationsService, type Investigation } from "@/features/investigations/investigationsService";

export function ActiveInvestigationsWidget() {
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInvestigations() {
            try {
                const data = await investigationsService.getAll();
                setInvestigations(data.slice(0, 5));
            } catch (error) {
                console.error("Failed to fetch investigations:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchInvestigations();
    }, []);

    if (loading) {
        return <Card className="col-span-1"><CardContent className="p-6">Loading cases...</CardContent></Card>;
    }

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Investigations</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {investigations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active investigations.</p>
                    ) : (
                        investigations.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{inv.title}</p>
                                    <p className="text-xs text-muted-foreground">{inv.case_number} • Lead: {inv.lead_agent_id}</p>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-full">
                                    {inv.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
