import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportsService, type Report } from "@/features/reports/reportsService";
import { teamsService } from "@/features/teams/teamsService";
import { useAuthStore } from "@/features/auth/AuthStore";

export function InboxPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInbox() {
            if (!user?.id) return;
            try {
                // Get user's teams
                const userTeams = await teamsService.getUserTeams(user.id);
                const teamIds = userTeams.map(t => t.id);

                if (teamIds.length === 0) {
                    setReports([]);
                    setLoading(false);
                    return;
                }

                // Fetch reports shared with these teams
                const data = await reportsService.getAll();
                const sharedReports = data.filter(r =>
                    r.shared_with_teams && r.shared_with_teams.some(tid => teamIds.includes(tid))
                );

                setReports(sharedReports);
            } catch (error) {
                console.error("Failed to fetch inbox:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchInbox();
    }, [user?.id]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Boite de réception</h1>
                <p className="text-muted-foreground">
                    Rapports et documents partagés avec vos équipes.
                </p>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Équipe(s)</TableHead>
                            <TableHead>Auteur</TableHead>
                            <TableHead>Date de partage</TableHead>
                            <TableHead>Classification</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Chargement de la boite de réception...</TableCell>
                            </TableRow>
                        ) : reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <FileText className="h-8 w-8 opacity-20" />
                                        <p>Aucun document partagé pour le moment.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report: Report) => (
                                <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/reports/${report.id}`)}>
                                    <TableCell className="font-medium">{report.title}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {report.shared_with_teams?.map((tid: string) => (
                                                <Badge key={tid} variant="secondary" className="text-[10px]">
                                                    Équipe
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{report.author?.username || 'Inconnu'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={report.classification === 'Publicly Releasable Information' ? 'outline' : 'destructive'}>
                                            {report.classification}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            Consulter <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
