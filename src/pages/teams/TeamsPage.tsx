import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Trash2, UserPlus, UserMinus } from "lucide-react";
import { teamsService, type Team, type TeamWithMembers } from "@/features/teams/teamsService";
import { useAuthStore } from "@/features/auth/AuthStore";
import { TeamBadge } from "@/components/teams/TeamBadge";
import { supabase } from "@/lib/supabase";

export function TeamsPage() {
    const { user } = useAuthStore();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

    // New team form
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamDivision, setNewTeamDivision] = useState("");
    const [newTeamDescription, setNewTeamDescription] = useState("");

    // Add member form
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState("");

    useEffect(() => {
        loadTeams();
        loadUsers();
    }, []);

    const loadTeams = async () => {
        setLoading(true);
        try {
            // Load teams based on user's division (or all if admin)
            const hasAdminAccess = user?.permissions.includes('admin.access');
            const data = await teamsService.getAll(hasAdminAccess ? undefined : user?.division);
            setTeams(data);
        } catch (error) {
            console.error("Failed to load teams:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('noose_user')
                .select('id, username, rank, division')
                .order('username');
            if (error) throw error;
            setAvailableUsers(data || []);
        } catch (error) {
            console.error("Failed to load users:", error);
        }
    };

    const handleCreateTeam = async () => {
        if (!newTeamName || !newTeamDivision) {
            alert("Please fill in team name and division");
            return;
        }

        try {
            await teamsService.create({
                name: newTeamName,
                division: newTeamDivision,
                description: newTeamDescription,
                created_by: user?.id
            });

            setCreateDialogOpen(false);
            setNewTeamName("");
            setNewTeamDivision("");
            setNewTeamDescription("");
            loadTeams();
        } catch (error) {
            console.error("Failed to create team:", error);
            alert("Failed to create team");
        }
    };

    const handleViewTeam = async (teamId: string) => {
        try {
            const team = await teamsService.getById(teamId);
            setSelectedTeam(team);
            setDetailsDialogOpen(true);
        } catch (error) {
            console.error("Failed to load team details:", error);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm("Are you sure you want to delete this team?")) return;

        try {
            await teamsService.delete(teamId);
            loadTeams();
            setDetailsDialogOpen(false);
        } catch (error) {
            console.error("Failed to delete team:", error);
            alert("Failed to delete team");
        }
    };

    const handleAddMember = async () => {
        if (!selectedTeam || !selectedUserId) return;

        try {
            await teamsService.addMember(selectedTeam.id, selectedUserId);
            const updatedTeam = await teamsService.getById(selectedTeam.id);
            setSelectedTeam(updatedTeam);
            setAddMemberDialogOpen(false);
            setSelectedUserId("");
        } catch (error) {
            console.error("Failed to add member:", error);
            alert("Failed to add member");
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedTeam) return;
        if (!confirm("Remove this member from the team?")) return;

        try {
            await teamsService.removeMember(selectedTeam.id, userId);
            const updatedTeam = await teamsService.getById(selectedTeam.id);
            setSelectedTeam(updatedTeam);
        } catch (error) {
            console.error("Failed to remove member:", error);
            alert("Failed to remove member");
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading teams...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Teams & Divisions</h1>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Team
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Team</DialogTitle>
                            <DialogDescription>
                                Create a team within your division to collaborate on cases.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="teamName">Team Name</Label>
                                <Input
                                    id="teamName"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="e.g., Homicide Unit"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="division">Division</Label>
                                <Select value={newTeamDivision} onValueChange={setNewTeamDivision}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select division" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Investigation">Investigation</SelectItem>
                                        <SelectItem value="Patrol">Patrol</SelectItem>
                                        <SelectItem value="Tactical">Tactical</SelectItem>
                                        <SelectItem value="Intelligence">Intelligence</SelectItem>
                                        <SelectItem value="Cybersecurity">Cybersecurity</SelectItem>
                                        <SelectItem value="General">General</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={newTeamDescription}
                                    onChange={(e) => setNewTeamDescription(e.target.value)}
                                    placeholder="Brief description of the team's purpose..."
                                    className="h-20"
                                />
                            </div>
                            <Button onClick={handleCreateTeam} className="w-full">
                                Create Team
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No teams found. Create your first team to get started.</p>
                        </CardContent>
                    </Card>
                ) : (
                    teams.map((team) => (
                        <Card
                            key={team.id}
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => handleViewTeam(team.id)}
                        >
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{team.name}</span>
                                    <TeamBadge team={team} />
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {team.description || "No description"}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Team Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>{selectedTeam?.name}</span>
                            <TeamBadge team={selectedTeam!} />
                        </DialogTitle>
                        <DialogDescription>
                            {selectedTeam?.description || "No description"}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Members ({selectedTeam?.member_count || 0})</h3>
                            <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <UserPlus className="h-4 w-4 mr-2" /> Add Member
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Team Member</DialogTitle>
                                        <DialogDescription>
                                            Select a user to add to this team.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select user" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableUsers.map((u) => (
                                                    <SelectItem key={u.id} value={u.id}>
                                                        {u.username} - {u.rank} ({u.division})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={handleAddMember} className="w-full">
                                            Add Member
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedTeam?.members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 border rounded-md"
                                >
                                    <div>
                                        <p className="font-medium">{member.user?.username}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {member.user?.rank} • {member.user?.division}
                                        </p>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleRemoveMember(member.user_id)}
                                    >
                                        <UserMinus className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                            <Button
                                variant="destructive"
                                onClick={() => handleDeleteTeam(selectedTeam!.id)}
                                className="flex-1"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Team
                            </Button>
                            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)} className="flex-1">
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
