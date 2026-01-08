import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type Team } from "@/features/teams/teamsService";
import { type SpecialtyKey } from "@/components/pdf/PDFStamp";
import { FileDown, ShieldCheck } from "lucide-react";

interface PDFExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userTeams: Team[];
    selectedSpecialty: SpecialtyKey | undefined;
    onSpecialtyChange: (specialty: SpecialtyKey | undefined) => void;
    onConfirm: () => void;
    title?: string;
}

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
    open,
    onOpenChange,
    userTeams,
    selectedSpecialty,
    onSpecialtyChange,
    onConfirm,
    title = "Exporter en PDF"
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-primary" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        Choisissez le tampon officiel à apposer sur le document avant l'exportation.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="specialty-selector" className="text-sm font-medium">
                            Sélection du Tampon
                        </Label>
                        <Select
                            value={selectedSpecialty || "default"}
                            onValueChange={(val) => onSpecialtyChange(val === "default" ? undefined : val as SpecialtyKey)}
                        >
                            <SelectTrigger id="specialty-selector" className="w-full">
                                <SelectValue placeholder="Choisir un tampon..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>Tampon Officier Standard</span>
                                    </div>
                                </SelectItem>
                                {userTeams.length > 0 && (
                                    <>
                                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            Vos Équipes / Divisions
                                        </div>
                                        {userTeams.map(team => (
                                            <SelectItem key={team.id} value={team.division?.toLowerCase() || "none"}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                    <span>Tampon {team.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </>
                                )}
                                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Spécialités Directes
                                </div>
                                <SelectItem value="pia">PIA / Border Patrol</SelectItem>
                                <SelectItem value="tru">Tactical Response Unit</SelectItem>
                                <SelectItem value="tss">Transportation Security</SelectItem>
                                <SelectItem value="ics">Intelligence Compliance Section</SelectItem>
                                <SelectItem value="nletp">Training Program (NLETP)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Le tampon sera généré avec vos informations (Nom, Rank, Matricule).
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={() => {
                        onConfirm();
                        onOpenChange(false);
                    }}>
                        Générer le PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
