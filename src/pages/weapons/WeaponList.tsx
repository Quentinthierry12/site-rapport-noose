import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { weaponsService, type Weapon } from "@/features/weapons/weaponsService";
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
import { Search, Plus } from "lucide-react";

export function WeaponList() {
    const [weapons, setWeapons] = useState<Weapon[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchWeapons = async () => {
        setLoading(true);
        try {
            const data = searchQuery
                ? await weaponsService.search(searchQuery)
                : await weaponsService.getAll();
            setWeapons(data);
        } catch (error) {
            console.error("Error fetching weapons:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchWeapons();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Weapon Registry</h1>
                    <p className="text-muted-foreground">Manage registered weapons and status.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Register Weapon
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by serial number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Weapons</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Serial Number</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
                                </TableRow>
                            ) : weapons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">No weapons found.</TableCell>
                                </TableRow>
                            ) : (
                                weapons.map((weapon) => (
                                    <TableRow key={weapon.serial_number}>
                                        <TableCell className="font-mono font-bold">{weapon.serial_number}</TableCell>
                                        <TableCell>{weapon.model}</TableCell>
                                        <TableCell>{weapon.type}</TableCell>
                                        <TableCell>
                                            {weapon.owner ? (
                                                <Link to={`/civilians/${weapon.owner_id}`} className="hover:underline">
                                                    {weapon.owner.full_name}
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground">Unknown</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={weapon.status === 'Valid' ? 'default' : 'destructive'}>
                                                {weapon.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                Edit
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
