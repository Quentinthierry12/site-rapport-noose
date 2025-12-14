import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { investigationsService, type Investigation } from "@/features/investigations/investigationsService";

export function InvestigationList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchInvestigations() {
            try {
                const data = await investigationsService.getAll();
                setInvestigations(data);
            } catch (error) {
                console.error("Failed to fetch investigations:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchInvestigations();
    }, []);

    const filteredInvestigations = investigations.filter(i =>
        i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.case_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Investigations</h1>
                <Button onClick={() => navigate("/investigations/new")}>
                    <Plus className="mr-2 h-4 w-4" /> New Case
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search cases..."
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
                            <TableHead>Case Number</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Lead Agent</TableHead>
                            <TableHead>Classification</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Loading investigations...</TableCell>
                            </TableRow>
                        ) : filteredInvestigations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">No investigations found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredInvestigations.map((inv) => (
                                <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/investigations/${inv.id}`)}>
                                    <TableCell className="font-medium">{inv.case_number}</TableCell>
                                    <TableCell>{inv.title}</TableCell>
                                    <TableCell>{inv.lead_agent_id}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{inv.classification}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={inv.status === 'Open' ? 'default' : 'secondary'}>
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">View</Button>
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
