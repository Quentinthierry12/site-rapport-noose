import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    FileText,
    Users,
    Briefcase,
    Settings,
    LogOut,
    ChevronRight,
    ChevronDown,
    Folder
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/features/auth/AuthStore";
import { Button } from "@/components/ui/button";
import { teamsService, type Team } from "@/features/teams/teamsService";

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    to?: string;
    children?: React.ReactNode;
}

function SidebarItem({ icon: Icon, label, to, children }: SidebarItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = !!children;

    const content = (
        <div
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                "hover:bg-primary/10 hover:text-primary",
                to && "hover:bg-primary/10"
            )}
            onClick={() => hasChildren && setIsOpen(!isOpen)}
        >
            {hasChildren ? (
                isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
                <span className="w-4" />
            )}
            <Icon className="h-4 w-4 text-primary" />
            <span className="flex-1">{label}</span>
        </div>
    );

    return (
        <div>
            {to ? (
                <NavLink
                    to={to}
                    className={({ isActive }) => cn(
                        "block rounded-md transition-colors",
                        isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
                    )}
                >
                    {content}
                </NavLink>
            ) : (
                content
            )}
            {hasChildren && isOpen && (
                <div className="ml-6 mt-1 border-l pl-2 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
}

export function Sidebar() {
    const { user, logout } = useAuthStore();
    const [userTeams, setUserTeams] = useState<Team[]>([]);

    useEffect(() => {
        if (user?.id) {
            teamsService.getUserTeams(user.id).then(setUserTeams).catch(console.error);
        }
    }, [user?.id]);

    return (
        <aside className="w-64 border-r bg-background flex flex-col h-screen sticky top-0">
            <div className="p-4 border-b bg-primary/5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                        {user?.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.username}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.rank} - {user?.division}</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                <SidebarItem icon={LayoutDashboard} label="Tableau de bord" to="/" />

                <SidebarItem icon={Folder} label="Rapports">
                    <SidebarItem icon={FileText} label="Tous les rapports" to="/reports" />
                    <SidebarItem icon={FileText} label="Mes rapports" to="/reports?filter=mine" />
                    <SidebarItem icon={FileText} label="Brouillons" to="/reports?filter=drafts" />
                </SidebarItem>

                <SidebarItem icon={Folder} label="Arrestations">
                    <SidebarItem icon={Users} label="Toutes les arrestations" to="/arrests" />
                    <SidebarItem icon={Users} label="Mes arrestations" to="/arrests?filter=mine" />
                </SidebarItem>

                <SidebarItem icon={Folder} label="Enquêtes">
                    <SidebarItem icon={Briefcase} label="Dossiers actifs" to="/investigations" />
                    <SidebarItem icon={Briefcase} label="Archivés" to="/investigations?filter=archived" />
                </SidebarItem>

                <SidebarItem icon={Folder} label="Équipes">
                    <SidebarItem icon={LogOut} label="Boite de réception" to="/teams/inbox" />
                    <SidebarItem icon={Folder} label="Mes Équipes">
                        {userTeams.length > 0 ? (
                            userTeams.map(team => (
                                <SidebarItem
                                    key={team.id}
                                    icon={Users}
                                    label={team.name}
                                    to={`/teams/${team.id}`}
                                />
                            ))
                        ) : (
                            <p className="text-[10px] text-muted-foreground p-2 px-4 italic">Rejoignez une équipe</p>
                        )}
                        <SidebarItem icon={Settings} label="Gérer les équipes" to="/teams" />
                    </SidebarItem>
                </SidebarItem>

                {user?.permissions.includes('reports.create') && (
                    <SidebarItem icon={Folder} label="Administration Équipes">
                        <SidebarItem icon={Settings} label="Toutes les équipes" to="/teams?filter=all" />
                    </SidebarItem>
                )}

                <div className="pt-4 mt-4 border-t">
                    <SidebarItem icon={Settings} label="Administration" to="/admin" />
                </div>
            </nav>

            <div className="p-4 border-t bg-muted/20">
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                </Button>
            </div>
        </aside>
    );
}
