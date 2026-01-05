import { useState, useEffect } from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Search, FileText, Users, Briefcase, User, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { searchService, type SearchResult } from "@/features/search/searchService";

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await searchService.search(query, filter);
                setResults(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [query, filter]);

    const handleSelect = (result: SearchResult) => {
        setOpen(false);
        if (result.type === 'report') navigate(`/reports/${result.id}`);
        if (result.type === 'arrest') navigate(`/arrests/${result.id}`);
        if (result.type === 'investigation') navigate(`/investigations/${result.id}`);
        if (result.type === 'civilian') navigate(`/civilians/${result.id}`);
        if (result.type === 'vehicle') navigate(`/vehicles`);
        if (result.type === 'weapon') navigate(`/weapons`);
    };

    return (
        <>
            <div
                className="relative w-full max-w-sm cursor-pointer"
                onClick={() => setOpen(true)}
            >
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <div className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm text-muted-foreground shadow-sm ring-offset-background">
                    Rechercher... (Cmd+K)
                </div>
            </div>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <CommandInput
                        placeholder="Rechercher dans la base de données..."
                        value={query}
                        onValueChange={setQuery}
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0"
                    />
                </div>
                <div className="flex gap-2 p-2 border-b overflow-x-auto">
                    {[
                        { key: 'all', label: 'Tout' },
                        { key: 'civilian', label: 'Civils' },
                        { key: 'vehicle', label: 'Véhicules' },
                        { key: 'report', label: 'Rapports' },
                        { key: 'arrest', label: 'Arrestations' }
                    ].map((type) => (
                        <button
                            key={type.key}
                            onClick={() => setFilter(type.key)}
                            className={`px-3 py-1 text-xs rounded-full border ${filter === type.key
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-input hover:bg-accent'
                                }`}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
                <CommandList>
                    <CommandEmpty>{loading ? 'Recherche en cours...' : 'Aucun résultat trouvé.'}</CommandEmpty>
                    {results.length > 0 && (
                        <CommandGroup heading="Résultats">
                            {results.map((result) => (
                                <CommandItem
                                    key={`${result.type}-${result.id}`}
                                    onSelect={() => handleSelect(result)}
                                >
                                    {result.type === 'report' && <FileText className="mr-2 h-4 w-4" />}
                                    {result.type === 'arrest' && <Users className="mr-2 h-4 w-4" />}
                                    {result.type === 'investigation' && <Briefcase className="mr-2 h-4 w-4" />}
                                    {result.type === 'civilian' && <User className="mr-2 h-4 w-4" />}
                                    {result.type === 'vehicle' && <Car className="mr-2 h-4 w-4" />}
                                    <div className="flex flex-col">
                                        <span>{result.title}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                                            {result.summary}
                                        </span>
                                    </div>
                                    {result.classification !== 'Publicly Releasable Information' && (
                                        <span className="ml-auto text-xs font-bold text-red-500">
                                            {result.classification.toUpperCase()}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
