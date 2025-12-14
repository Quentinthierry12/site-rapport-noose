import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { vehiclesService, type Vehicle } from "@/features/vehicles/vehiclesService";
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

export function VehicleList() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const data = searchQuery
                ? await vehiclesService.search(searchQuery)
                : await vehiclesService.getAll();
            setVehicles(data);
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchVehicles();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vehicle Registry</h1>
                    <p className="text-muted-foreground">Manage registered vehicles and status.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Register Vehicle
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by plate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Vehicles</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Plate</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Color</TableHead>
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
                            ) : vehicles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">No vehicles found.</TableCell>
                                </TableRow>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <TableRow key={vehicle.plate}>
                                        <TableCell className="font-mono font-bold">{vehicle.plate}</TableCell>
                                        <TableCell>{vehicle.model}</TableCell>
                                        <TableCell>{vehicle.color}</TableCell>
                                        <TableCell>
                                            {vehicle.owner ? (
                                                <Link to={`/civilians/${vehicle.owner_id}`} className="hover:underline">
                                                    {vehicle.owner.full_name}
                                                </Link>
                                            ) : (
                                                <span className="text-muted-foreground">Unknown</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={vehicle.status === 'Valid' ? 'default' : 'destructive'}>
                                                {vehicle.status}
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
