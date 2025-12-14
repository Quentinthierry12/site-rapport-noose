import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { teamsService, type Team } from "@/features/teams/teamsService";
import { TeamBadge } from "./TeamBadge";

interface TeamSelectorProps {
    selectedTeams: string[]; // Array of team IDs
    onTeamsChange: (teamIds: string[]) => void;
    userDivision?: string; // Optional: filter teams by user's division
}

export function TeamSelector({ selectedTeams, onTeamsChange, userDivision }: TeamSelectorProps) {
    const [open, setOpen] = useState(false);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamObjects, setSelectedTeamObjects] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);

    // Load teams
    useEffect(() => {
        const loadTeams = async () => {
            setLoading(true);
            try {
                const data = await teamsService.getAll(userDivision);
                setTeams(data);
            } catch (error) {
                console.error("Failed to load teams:", error);
            } finally {
                setLoading(false);
            }
        };
        loadTeams();
    }, [userDivision]);

    // Load selected team objects
    useEffect(() => {
        const loadSelectedTeams = async () => {
            if (selectedTeams.length === 0) {
                setSelectedTeamObjects([]);
                return;
            }
            const teamObjs = teams.filter(t => selectedTeams.includes(t.id));
            setSelectedTeamObjects(teamObjs);
        };
        loadSelectedTeams();
    }, [selectedTeams, teams]);

    const handleToggleTeam = (teamId: string) => {
        const newSelection = selectedTeams.includes(teamId)
            ? selectedTeams.filter(id => id !== teamId)
            : [...selectedTeams, teamId];
        onTeamsChange(newSelection);
    };

    const handleRemoveTeam = (teamId: string) => {
        onTeamsChange(selectedTeams.filter(id => id !== teamId));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedTeams.length > 0
                            ? `${selectedTeams.length} team(s) selected`
                            : "Select teams to share with..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                    <Command>
                        <CommandInput placeholder="Search teams..." />
                        <CommandList>
                            <CommandEmpty>
                                {loading ? "Loading teams..." : "No teams found."}
                            </CommandEmpty>
                            <CommandGroup heading="Available Teams">
                                {teams.map((team) => (
                                    <CommandItem
                                        key={team.id}
                                        value={team.name}
                                        onSelect={() => handleToggleTeam(team.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedTeams.includes(team.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{team.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {team.division}
                                                {team.description && ` • ${team.description}`}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Display selected teams as badges */}
            {selectedTeamObjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTeamObjects.map((team) => (
                        <TeamBadge
                            key={team.id}
                            team={team}
                            onRemove={() => handleRemoveTeam(team.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
