import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { civiliansService, type Civilian } from "@/features/civilians/civiliansService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Search } from "lucide-react";

export function CivilianList() {
    const [civilians, setCivilians] = useState<Civilian[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchCivilians = async () => {
        setLoading(true);
        try {
            const data = searchQuery
                ? await civiliansService.search(searchQuery)
                : await civiliansService.getAll();
            setCivilians(data);
        } catch (error) {
            console.error("Error fetching civilians:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCivilians();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Base de données civile</h1>
                    <p className="text-muted-foreground">Gérer les dossiers et profils civils.</p>
                </div>
                <Button asChild>
                    <Link to="/civilians/new">
                        <UserPlus className="mr-2 h-4 w-4" /> Nouveau civil
                    </Link>
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par nom..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Civils enregistrés</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Date de naissance</TableHead>
                                <TableHead>Genre</TableHead>
                                <TableHead>Signalements</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">Chargement...</TableCell>
                                </TableRow>
                            ) : civilians.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">Aucun civil trouvé.</TableCell>
                                </TableRow>
                            ) : (
                                civilians.map((civilian) => (
                                    <TableRow key={civilian.id}>
                                        <TableCell className="font-medium">
                                            <Link to={`/civilians/${civilian.id}`} className="hover:underline">
                                                {civilian.full_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{civilian.dob || 'Inconnu'}</TableCell>
                                        <TableCell>{civilian.gender || 'Inconnu'}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {civilian.flags && civilian.flags.map((flag) => (
                                                    <Badge key={flag} variant="destructive" className="text-xs">
                                                        {flag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link to={`/civilians/${civilian.id}`}>Voir le dossier</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
