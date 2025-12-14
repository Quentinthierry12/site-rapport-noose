import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { civiliansService, type Civilian } from "@/features/civilians/civiliansService";
import { arrestsService } from "@/features/arrests/arrestsService";

interface CivilianSelectProps {
    value?: string;
    onSelect: (civilian: Civilian) => void;
}

export function CivilianSelect({ value, onSelect }: CivilianSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [civilians, setCivilians] = useState<Civilian[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCivilian, setSelectedCivilian] = useState<Civilian | null>(null);
    const [arrestedCivilianIds, setArrestedCivilianIds] = useState<Set<string>>(new Set());

    // Reset query when popover opens to fix search bug
    useEffect(() => {
        if (open) {
            setQuery("");
            setCivilians([]);
        }
    }, [open]);

    // Load all arrested civilian IDs to show them in gray
    useEffect(() => {
        const loadArrestedCivilians = async () => {
            try {
                const arrests = await arrestsService.getAll();
                const ids = new Set(arrests.map(a => a.civilian_id).filter(Boolean) as string[]);
                setArrestedCivilianIds(ids);
            } catch (error) {
                console.error("Failed to load arrests:", error);
            }
        };
        loadArrestedCivilians();
    }, []);

    useEffect(() => {
        if (query.length < 2) {
            setCivilians([]);
            return;
        }

        const search = async () => {
            setLoading(true);
            try {
                const results = await civiliansService.search(query);
                setCivilians(results);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [query]);

    const handleCreate = async () => {
        try {
            const newCivilian = await civiliansService.create({
                full_name: query,
                flags: [],
                licenses: {}
            });
            onSelect(newCivilian);
            setSelectedCivilian(newCivilian);
            setOpen(false);
            // Notify user
            alert(`Profile created for ${newCivilian.full_name}`);
        } catch (error) {
            console.error("Create error:", error);
            alert("Failed to create profile");
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedCivilian ? selectedCivilian.full_name : (value || "Select or enter name...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search name..." value={query} onValueChange={setQuery} />
                    <CommandList>
                        <CommandEmpty>
                            <div className="p-2 text-center">
                                <p className="text-sm text-muted-foreground mb-2">
                                    {loading ? "Searching..." : "No person found."}
                                </p>
                                {!loading && (
                                    <Button size="sm" className="w-full" onClick={handleCreate}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Create "{query}"
                                    </Button>
                                )}
                            </div>
                        </CommandEmpty>
                        <CommandGroup heading="Civilians">
                            {civilians.map((civilian) => {
                                const hasBeenArrested = arrestedCivilianIds.has(civilian.id);
                                return (
                                    <CommandItem
                                        key={civilian.id}
                                        value={civilian.full_name}
                                        onSelect={() => {
                                            onSelect(civilian);
                                            setSelectedCivilian(civilian);
                                            setOpen(false);
                                        }}
                                        className={cn(hasBeenArrested && "text-muted-foreground")}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedCivilian?.id === civilian.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex-1">
                                                {civilian.full_name}
                                                {civilian.dob && <span className="ml-2 text-xs text-muted-foreground">({civilian.dob})</span>}
                                            </div>
                                            {hasBeenArrested && (
                                                <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded pointer-events-none shrink-0">
                                                    Previously Arrested
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
