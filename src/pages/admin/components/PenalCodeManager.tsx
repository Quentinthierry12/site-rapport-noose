import { useState, useEffect } from "react";
import { penalCodeService } from "@/features/penal-code/penalCodeService";
import type { PenalCharge } from "@/features/penal-code/penalCodeService";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Gavel } from "lucide-react";

const CATEGORIES = ["Crime", "Délit", "Infraction", "Contravention", "Code de la route"];

export function PenalCodeManager() {
    const [charges, setCharges] = useState<PenalCharge[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCharge, setEditingCharge] = useState<Partial<PenalCharge> | null>(null);

    const fetchCharges = async () => {
        try {
            const data = await penalCodeService.getAll();
            setCharges(data);
        } catch (error) {
            console.error("Error fetching penal code:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCharges();
    }, []);

    const handleSubmit = async () => {
        if (!editingCharge?.title || !editingCharge?.category) {
            alert("Veuillez remplir les champs obligatoires (Titre et Catégorie)");
            return;
        }

        try {
            if (editingCharge.id) {
                await penalCodeService.update(editingCharge.id, editingCharge);
            } else {
                await penalCodeService.create(editingCharge);
            }
            setIsDialogOpen(false);
            setEditingCharge(null);
            fetchCharges();
        } catch (error) {
            console.error("Error saving charge:", error);
            alert("Erreur lors de l'enregistrement de la charge");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette charge ?")) return;
        try {
            await penalCodeService.delete(id);
            fetchCharges();
        } catch (error) {
            console.error("Error deleting charge:", error);
        }
    };

    const openCreate = () => {
        setEditingCharge({
            title: "",
            category: "Délit",
            fine: 0,
            prison_time: 0,
            description: ""
        });
        setIsDialogOpen(true);
    };

    const openEdit = (charge: PenalCharge) => {
        setEditingCharge(charge);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={openCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une charge
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gavel className="h-5 w-5" /> Code Pénal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Titre</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Amende</TableHead>
                                <TableHead>Peine</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">Chargement...</TableCell>
                                </TableRow>
                            ) : charges.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Aucune charge définie.</TableCell>
                                </TableRow>
                            ) : (
                                charges.map((charge) => (
                                    <TableRow key={charge.id}>
                                        <TableCell className="font-medium">{charge.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{charge.category}</Badge>
                                        </TableCell>
                                        <TableCell>{charge.fine.toLocaleString()} $</TableCell>
                                        <TableCell>{charge.prison_time} min</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(charge)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(charge.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCharge?.id ? "Modifier" : "Ajouter"} une charge</DialogTitle>
                        <DialogDescription>
                            Définissez les détails de l'infraction et les sanctions associées.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre de l'infraction</Label>
                            <Input
                                id="title"
                                value={editingCharge?.title || ""}
                                onChange={(e) => setEditingCharge({ ...editingCharge, title: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Select
                                    value={editingCharge?.category}
                                    onValueChange={(val) => setEditingCharge({ ...editingCharge, category: val })}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fine">Amende ($)</Label>
                                <Input
                                    id="fine"
                                    type="number"
                                    value={editingCharge?.fine || 0}
                                    onChange={(e) => setEditingCharge({ ...editingCharge, fine: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prison">Temps de prison (minutes)</Label>
                            <Input
                                id="prison"
                                type="number"
                                value={editingCharge?.prison_time || 0}
                                onChange={(e) => setEditingCharge({ ...editingCharge, prison_time: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={editingCharge?.description || ""}
                                onChange={(e) => setEditingCharge({ ...editingCharge, description: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleSubmit}>Enregistrer</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
