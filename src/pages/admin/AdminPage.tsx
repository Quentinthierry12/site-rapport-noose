import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/features/auth/AuthStore";
import { UserPlus, Edit } from "lucide-react";

interface User {
    id: string;
    username: string;
    rank: string;
    division: string;
    clearance: number;
    last_login: string;
    permissions: string[];
}

const AVAILABLE_PERMISSIONS = [
    "admin.access",
    "reports.view", "reports.create", "reports.edit", "reports.delete", "reports.validate",
    "arrests.view", "arrests.create", "arrests.edit", "arrests.delete",
    "investigations.view", "investigations.create", "investigations.edit", "investigations.delete",
    "search.global"
];

export function AdminPage() {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // New User Form State
    const [newUser, setNewUser] = useState({
        username: "",
        password: "",
        matricule: "",
        rank: "",
        division: "",
        clearance: "1",
    });

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('noose_user')
                .select('id, username, rank, division, clearance, last_login, permissions')
                .order('username');

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.permissions.includes('admin.access')) {
            fetchUsers();
        }
    }, [currentUser]);

    const handleCreateUser = async () => {
        try {
            if (!newUser.username || !newUser.password || !newUser.matricule) {
                alert("Please fill in all required fields");
                return;
            }

            const { error } = await supabase.from('noose_user').insert({
                username: newUser.username,
                password: newUser.password, // TODO: Hash password
                matricule: newUser.matricule,
                rank: newUser.rank || "Agent",
                division: newUser.division || "General",
                clearance: parseInt(newUser.clearance),
                permissions: []
            });

            if (error) throw error;

            setIsCreateOpen(false);
            setNewUser({ username: "", password: "", matricule: "", rank: "", division: "", clearance: "1" });
            fetchUsers();
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Failed to create user.");
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        try {
            const { error } = await supabase
                .from('noose_user')
                .update({
                    username: editingUser.username,
                    rank: editingUser.rank,
                    division: editingUser.division,
                    permissions: editingUser.permissions,
                    clearance: editingUser.clearance
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setIsEditOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user.");
        }
    };

    const togglePermission = (permission: string) => {
        if (!editingUser) return;
        const current = editingUser.permissions || [];
        const updated = current.includes(permission)
            ? current.filter(p => p !== permission)
            : [...current, permission];
        setEditingUser({ ...editingUser, permissions: updated });
    };

    if (!currentUser?.permissions.includes('admin.access')) {
        return (
            <div className="p-8 text-center text-destructive">
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="mr-2 h-4 w-4" /> Create User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Create a new user account with credentials and permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="matricule">Matricule (ID)</Label>
                                <Input id="matricule" value={newUser.matricule} onChange={(e) => setNewUser({ ...newUser, matricule: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rank">Rank</Label>
                                    <Input id="rank" value={newUser.rank} onChange={(e) => setNewUser({ ...newUser, rank: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="division">Division</Label>
                                    <Input id="division" value={newUser.division} onChange={(e) => setNewUser({ ...newUser, division: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="clearance">Clearance Level</Label>
                                <Select value={newUser.clearance} onValueChange={(val) => setNewUser({ ...newUser, clearance: val })}>
                                    <SelectTrigger><SelectValue placeholder="Select clearance" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Level 1 (Confidential)</SelectItem>
                                        <SelectItem value="2">Level 2 (Secret)</SelectItem>
                                        <SelectItem value="3">Level 3 (Top Secret)</SelectItem>
                                        <SelectItem value="4">Level 4 (Black Ops)</SelectItem>
                                        <SelectItem value="5">Level 5 (Director)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleCreateUser}>Create Account</Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
                            <DialogDescription>
                                Modify user details, clearance level, and permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input
                                        value={editingUser?.username || ''}
                                        onChange={(e) => editingUser && setEditingUser({ ...editingUser, username: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Rank</Label>
                                    <Input
                                        value={editingUser?.rank || ''}
                                        onChange={(e) => editingUser && setEditingUser({ ...editingUser, rank: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Division</Label>
                                    <Input
                                        value={editingUser?.division || ''}
                                        onChange={(e) => editingUser && setEditingUser({ ...editingUser, division: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Clearance Level</Label>
                                    <Select
                                        value={editingUser?.clearance.toString()}
                                        onValueChange={(val) => editingUser && setEditingUser({ ...editingUser, clearance: parseInt(val) })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Level 1 (Confidential)</SelectItem>
                                            <SelectItem value="2">Level 2 (Secret)</SelectItem>
                                            <SelectItem value="3">Level 3 (Top Secret)</SelectItem>
                                            <SelectItem value="4">Level 4 (Black Ops)</SelectItem>
                                            <SelectItem value="5">Level 5 (Director)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Permissions</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    {AVAILABLE_PERMISSIONS.map((perm) => (
                                        <div key={perm} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={perm}
                                                checked={editingUser?.permissions?.includes(perm)}
                                                onCheckedChange={() => togglePermission(perm)}
                                            />
                                            <label htmlFor={perm} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {perm}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <Button onClick={handleUpdateUser}>Save Changes</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Username</TableHead>
                                <TableHead>Rank</TableHead>
                                <TableHead>Division</TableHead>
                                <TableHead>Clearance</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-4">Loading users...</TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.username}</TableCell>
                                        <TableCell>{user.rank}</TableCell>
                                        <TableCell>{user.division}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.clearance >= 4 ? "destructive" : "secondary"}>
                                                Level {user.clearance}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsEditOpen(true); }}>
                                                <Edit className="h-4 w-4" />
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
