import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type Team } from "@/features/teams/teamsService";

interface TeamBadgeProps {
    team: Team;
    onClick?: () => void;
    onRemove?: () => void;
    className?: string;
}

// Color mapping for divisions
const divisionColors: Record<string, string> = {
    "Investigation": "bg-blue-100 text-blue-800 border-blue-300",
    "Patrol": "bg-green-100 text-green-800 border-green-300",
    "Tactical": "bg-red-100 text-red-800 border-red-300",
    "Intelligence": "bg-purple-100 text-purple-800 border-purple-300",
    "Cybersecurity": "bg-cyan-100 text-cyan-800 border-cyan-300",
    "General": "bg-gray-100 text-gray-800 border-gray-300",
};

export function TeamBadge({ team, onClick, onRemove, className }: TeamBadgeProps) {
    const colorClass = divisionColors[team.division] || divisionColors["General"];

    return (
        <Badge
            variant="outline"
            className={cn(
                "cursor-pointer transition-all hover:shadow-sm",
                colorClass,
                className
            )}
            onClick={onClick}
        >
            <span className="font-medium">{team.name}</span>
            <span className="ml-1 text-xs opacity-70">({team.division})</span>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="ml-2 hover:text-destructive"
                >
                    ×
                </button>
            )}
        </Badge>
    );
}
