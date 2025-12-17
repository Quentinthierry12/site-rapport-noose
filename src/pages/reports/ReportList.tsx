import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { reportsService, type Report } from "@/features/reports/reportsService";

export function ReportList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReports() {
            try {
                const data = await reportsService.getAll();
                setReports(data);
            } catch (error) {
                console.error("Failed to fetch reports:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    }, []);

    const filteredReports = reports.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Rapports</h1>
                <Button onClick={() => navigate("/reports/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Nouveau rapport
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher des rapports..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead>Auteur</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Classification</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Chargement des rapports...</TableCell>
                            </TableRow>
                        ) : filteredReports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Aucun rapport trouvé.</TableCell>
                            </TableRow>
                        ) : (
                            filteredReports.map((report) => (
                                <TableRow key={report.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/reports/${report.id}`)}>
                                    <TableCell className="font-medium">{report.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{report.title}</TableCell>
                                    <TableCell>
                                        {report.author ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{report.author.username}</span>
                                                <span className="text-xs text-muted-foreground">{report.author.rank}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">{report.author_id}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={report.classification === 'Unclassified' ? 'secondary' : 'destructive'}>
                                            {report.classification}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={report.status === 'Validated' ? 'default' : 'secondary'}>
                                            {report.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">Voir</Button>
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
