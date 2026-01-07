import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { reportsService, type Report } from "@/features/reports/reportsService";

export function RecentReportsWidget() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReports() {
            try {
                const data = await reportsService.getAll();
                setReports(data.slice(0, 5)); // Show only recent 5
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    }, []);

    if (loading) {
        return <Card className="col-span-1"><CardContent className="p-6">Loading reports...</CardContent></Card>;
    }

    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rapports récents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {reports.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun rapport récent.</p>
                    ) : (
                        reports.map((report) => (
                            <div key={report.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{report.title}</p>
                                    <p className="text-xs text-muted-foreground">{report.id} • {new Date(report.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${report.status === 'Validé' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                                        }`}>
                                        {report.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
