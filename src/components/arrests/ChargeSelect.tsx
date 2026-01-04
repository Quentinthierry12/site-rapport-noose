import { useState, useEffect } from "react";
import { penalCodeService } from "@/features/penal-code/penalCodeService";
import type { PenalCharge } from "@/features/penal-code/penalCodeService";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChargeSelectProps {
    selectedCharges: string[];
    onChargesChange: (charges: string[]) => void;
}

export function ChargeSelect({ selectedCharges, onChargesChange }: ChargeSelectProps) {
    const [open, setOpen] = useState(false);
    const [charges, setCharges] = useState<PenalCharge[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState("");

    useEffect(() => {
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
        fetchCharges();
    }, []);

    const toggleCharge = (title: string) => {
        const updated = selectedCharges.includes(title)
            ? selectedCharges.filter(c => c !== title)
            : [...selectedCharges, title];
        onChargesChange(updated);
    };

    const removeCharge = (title: string) => {
        onChargesChange(selectedCharges.filter(c => c !== title));
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-muted/20">
                {selectedCharges.length === 0 ? (
                    <span className="text-sm text-muted-foreground py-1 px-2">Aucune charge sélectionnée</span>
                ) : (
                    selectedCharges.map(charge => (
                        <Badge key={charge} variant="secondary" className="gap-1 px-2 py-1">
                            {charge}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeCharge(charge)}
                            />
                        </Badge>
                    ))
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={loading}
                    >
                        {loading ? "Chargement du Code Pénal..." : "Sélectionner des charges..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Rechercher une infraction..."
                            value={inputValue}
                            onValueChange={setInputValue}
                        />
                        <CommandList>
                            <CommandGroup className="max-h-[300px] overflow-auto">
                                {charges
                                    .filter(c => c.title.toLowerCase().includes(inputValue.toLowerCase()))
                                    .map((charge) => (
                                        <CommandItem
                                            key={charge.id}
                                            value={charge.title}
                                            onSelect={() => {
                                                toggleCharge(charge.title);
                                                setInputValue("");
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedCharges.includes(charge.title) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{charge.title}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {charge.category} • {charge.fine}$ • {charge.prison_time}min
                                                </span>
                                            </div>
                                        </CommandItem>
                                    ))}

                                {inputValue && !charges.some(c => c.title.toLowerCase() === inputValue.toLowerCase()) && (
                                    <CommandItem
                                        value={inputValue}
                                        onSelect={() => {
                                            toggleCharge(inputValue);
                                            setInputValue("");
                                            setOpen(false);
                                        }}
                                        className="text-primary font-medium"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Ajouter "{inputValue}" comme charge personnalisée
                                    </CommandItem>
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
