import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { arrestsService, type Arrest } from "@/features/arrests/arrestsService";

export function ArrestList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [arrests, setArrests] = useState<Arrest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchArrests() {
            try {
                const data = await arrestsService.getAll();
                setArrests(data);
            } catch (error) {
                console.error("Failed to fetch arrests:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchArrests();
    }, []);

    const filteredArrests = arrests.filter(a =>
        a.suspect_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Arrests</h1>
                <Button onClick={() => navigate("/arrests/new")}>
                    <Plus className="mr-2 h-4 w-4" /> New Arrest Record
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search arrests..."
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
                            <TableHead>Suspect</TableHead>
                            <TableHead>Charges</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Officer</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Loading arrests...</TableCell>
                            </TableRow>
                        ) : filteredArrests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">No arrests found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredArrests.map((arrest) => (
                                <TableRow key={arrest.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/arrests/${arrest.id}`)}>
                                    <TableCell className="font-medium">{arrest.id.substring(0, 8)}...</TableCell>
                                    <TableCell>{arrest.suspect_name}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{arrest.charges.join(", ")}</TableCell>
                                    <TableCell>{new Date(arrest.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {arrest.officer ? (
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{arrest.officer.username}</span>
                                                <span className="text-xs text-muted-foreground">{arrest.officer.rank}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">{arrest.arresting_officer_id}</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={arrest.status === 'Processed' ? 'default' : 'secondary'}>
                                            {arrest.status}
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
