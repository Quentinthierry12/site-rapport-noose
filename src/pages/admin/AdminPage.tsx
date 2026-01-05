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
import { UserPlus, Edit, Key, FileDown, Archive, Loader2, Database } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { AccountAssignmentPDF } from "@/components/pdf/AccountAssignmentPDF";
import { generateBackup } from "@/utils/backupSystem";
import { renderAndCapture } from "@/utils/pdfGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { templatesService } from "@/features/reports/templatesService";
import type { DocumentTemplate, TemplateField } from "@/features/reports/templatesService";
import { Plus, Trash2, FileJson, Settings2, Users, PlusCircle, Eye, EyeOff, Gavel } from "lucide-react";
import JSZip from "jszip";
import { DynamicReportPDF } from "../reports/DynamicReportPDF";
import { PenalCodeManager } from "./components/PenalCodeManager";

interface User {
    id: string;
    username: string;
    matricule: string;
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
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Backup State
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupStatus, setBackupStatus] = useState("");

    const handleBackup = async () => {
        if (isBackingUp) return;

        setIsBackingUp(true);
        setBackupStatus("Starting backup...");

        try {
            await generateBackup((status) => setBackupStatus(status));
            setBackupStatus("Downloaded!");
            setTimeout(() => setBackupStatus(""), 3000);
        } catch (error) {
            console.error(error);
            alert("Backup failed. See console for details.");
            setBackupStatus("");
        } finally {
            setIsBackingUp(false);
        }
    };

    // PDF Generation State
    const [showPDFSuccess, setShowPDFSuccess] = useState(false);
    const [pdfCredentials, setPdfCredentials] = useState<{
        username: string;
        password: string;
        matricule: string;
        rank: string;
        division: string;
        clearance: number;
        isPasswordReset: boolean;
    } | null>(null);

    const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);
    const [batchProgress, setBatchProgress] = useState("");

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
                .select('id, username, matricule, rank, division, clearance, last_login, permissions')
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
                alert("Veuillez remplir tous les champs obligatoires");
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

            // Store credentials for PDF generation
            setPdfCredentials({
                username: newUser.username,
                password: newUser.password,
                matricule: newUser.matricule,
                rank: newUser.rank || "Agent",
                division: newUser.division || "Terrain",
                clearance: parseInt(newUser.clearance),
                isPasswordReset: false
            });

            setIsCreateOpen(false);
            setNewUser({ username: "", password: "", matricule: "", rank: "", division: "", clearance: "1" });
            setShowPDFSuccess(true);
            fetchUsers();
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Échec de la création de l'utilisateur.");
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
            alert("Échec de la mise à jour de l'utilisateur.");
        }
    };

    const handleResetPassword = async () => {
        if (!resetPasswordUser) return;

        if (newPassword !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas.");
            return;
        }

        if (newPassword.length < 4) {
            alert("Le mot de passe doit contenir au moins 4 caractères.");
            return;
        }

        try {
            const { error } = await supabase
                .from('noose_user')
                .update({ password: newPassword })
                .eq('id', resetPasswordUser.id);

            if (error) throw error;

            // Store credentials for PDF generation
            setPdfCredentials({
                username: resetPasswordUser.username,
                password: newPassword,
                matricule: resetPasswordUser.matricule || "N/A",
                rank: resetPasswordUser.rank,
                division: resetPasswordUser.division,
                clearance: resetPasswordUser.clearance,
                isPasswordReset: true
            });

            setIsResetPasswordOpen(false);
            setResetPasswordUser(null);
            setNewPassword("");
            setConfirmPassword("");
            setShowPDFSuccess(true);
            fetchUsers();
        } catch (error) {
            console.error("Error resetting password:", error);
            alert("Échec de la réinitialisation du mot de passe.");
        }
    };

    const generateRandomPassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0, n = charset.length; i < 8; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    };

    const handleGenerateMissingAccess = async () => {
        setIsGeneratingBatch(true);
        setBatchProgress("Analysing users...");
        try {
            // 1. Fetch users with no password (null or empty)
            const { data: usersToUpdate, error: fetchError } = await supabase
                .from('noose_user')
                .select('*')
                .or('password.is.null,password.eq.""');

            if (fetchError) throw fetchError;

            if (!usersToUpdate || usersToUpdate.length === 0) {
                alert("Tous les utilisateurs ont déjà un mot de passe configuré.");
                setIsGeneratingBatch(false);
                return;
            }

            if (!confirm(`Voulez-vous générer les accès pour ${usersToUpdate.length} utilisateurs ?\n\nCeci réinitialisera leurs mots de passe.`)) {
                setIsGeneratingBatch(false);
                return;
            }

            const zip = new JSZip();
            let processedCount = 0;

            // 2. Update each user with a new password and generate PDF
            for (const user of usersToUpdate) {
                processedCount++;
                setBatchProgress(`Processing ${processedCount}/${usersToUpdate.length}: ${user.username}`);

                const newPassword = generateRandomPassword();

                const { error: updateError } = await supabase
                    .from('noose_user')
                    .update({ password: newPassword }) // In a real app, hash this!
                    .eq('id', user.id);

                if (updateError) {
                    console.error(`Failed to update user ${user.username}`, updateError);
                    continue;
                }

                // Generate PDF BLOB
                const blob = await renderAndCapture(
                    <AccountAssignmentPDF
                        username={user.username}
                        password={newPassword}
                        matricule={user.matricule}
                        rank={user.rank}
                        division={user.division}
                        clearance={user.clearance}
                        isPasswordReset={true}
                    />
                );

                // Add to ZIP: grade_username.pdf
                const filename = `${user.rank}_${user.username}.pdf`.replace(/[^a-z0-9._-]/gi, '_');
                zip.file(filename, blob);
            }

            // 3. Generate and Download ZIP
            setBatchProgress("Compressing...");
            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Initial_Access_${new Date().toISOString().slice(0, 10)}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert(`Accès générés et téléchargés pour ${processedCount} utilisateurs.`);
            fetchUsers();

        } catch (error) {
            console.error("Error generating batch access:", error);
            alert("Une erreur est survenue lors de la génération en masse.");
        } finally {
            setIsGeneratingBatch(false);
            setBatchProgress("");
        }
    };

    const handleDownloadPDF = () => {
        window.print();
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
                <h1 className="text-2xl font-bold">Accès refusé</h1>
                <p>Vous n'avez pas la permission de voir cette page.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
            </div>

            <Tabs defaultValue="users" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="users" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Utilisateurs
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" /> Templates de Document
                    </TabsTrigger>
                    <TabsTrigger value="penal_code" className="flex items-center gap-2">
                        <Gavel className="h-4 w-4" /> Code Pénal
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="users" className="space-y-6">
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleBackup}
                            disabled={isBackingUp}
                        >
                            {isBackingUp ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {backupStatus}
                                </>
                            ) : (
                                <>
                                    <Archive className="mr-2 h-4 w-4" />
                                    {backupStatus || "System Backup"}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={handleGenerateMissingAccess}
                            disabled={isGeneratingBatch}
                        >
                            {isGeneratingBatch ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {batchProgress || "Processing..."}
                                </>
                            ) : (
                                <>
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Générer accès initiaux
                                </>
                            )}
                        </Button>

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <UserPlus className="mr-2 h-4 w-4" /> Créer un utilisateur
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
                                    <DialogDescription>
                                        Créez un nouveau compte utilisateur avec des identifiants et des permissions.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Nom d'utilisateur</Label>
                                            <Input id="username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Mot de passe</Label>
                                            <Input id="password" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="matricule">Matricule (ID)</Label>
                                        <Input id="matricule" value={newUser.matricule} onChange={(e) => setNewUser({ ...newUser, matricule: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="rank">Grade</Label>
                                            <Input id="rank" value={newUser.rank} onChange={(e) => setNewUser({ ...newUser, rank: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="division">Division</Label>
                                            <Input id="division" value={newUser.division} onChange={(e) => setNewUser({ ...newUser, division: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="clearance">Niveau d'habilitation</Label>
                                        <Select value={newUser.clearance} onValueChange={(val) => setNewUser({ ...newUser, clearance: val })}>
                                            <SelectTrigger><SelectValue placeholder="Sélectionnez l'habilitation" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Niveau 1 (Habilitation Limité)</SelectItem>
                                                <SelectItem value="2">Niveau 2 (Confidentiel)</SelectItem>
                                                <SelectItem value="3">Niveau 3 (Secret)</SelectItem>
                                                <SelectItem value="4">Niveau 4 (Top Secret)</SelectItem>
                                                <SelectItem value="5">Niveau 5 (Direction)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleCreateUser}>Créer le compte</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Modifier l'utilisateur : {editingUser?.username}</DialogTitle>
                                <DialogDescription>
                                    Modifiez les détails de l'utilisateur, le niveau d'habilitation et les permissions.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nom d'utilisateur</Label>
                                        <Input
                                            value={editingUser?.username || ''}
                                            onChange={(e) => editingUser && setEditingUser({ ...editingUser, username: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Grade</Label>
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
                                        <Label>Niveau d'habilitation</Label>
                                        <Select
                                            value={editingUser?.clearance.toString()}
                                            onValueChange={(val) => editingUser && setEditingUser({ ...editingUser, clearance: parseInt(val) })}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1">Niveau 1 (Habilitation Limité)</SelectItem>
                                                <SelectItem value="2">Niveau 2 (Confidentiel)</SelectItem>
                                                <SelectItem value="3">Niveau 3 (Secret)</SelectItem>
                                                <SelectItem value="4">Niveau 4 (Top Secret)</SelectItem>
                                                <SelectItem value="5">Niveau 5 (Direction)</SelectItem>
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
                                <Button onClick={handleUpdateUser}>Enregistrer les modifications</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Card>
                        <CardHeader>
                            <CardTitle>Gestion des utilisateurs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom d'utilisateur</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Division</TableHead>
                                        <TableHead>Habilitation</TableHead>
                                        <TableHead>Dernière connexion</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-4">Chargement des utilisateurs...</TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">{user.username}</TableCell>
                                                <TableCell>{user.rank}</TableCell>
                                                <TableCell>{user.division}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.clearance >= 4 ? "destructive" : "secondary"}>
                                                        Niveau {user.clearance}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Jamais'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-green-600 border-green-600">Actif</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => { setEditingUser(user); setIsEditOpen(true); }}
                                                            title="Modifier l'utilisateur"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => { setResetPasswordUser(user); setIsResetPasswordOpen(true); }}
                                                            title="Réinitialiser le mot de passe"
                                                        >
                                                            <Key className="h-4 w-4" />
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
                    {/* Password Reset Dialog */}
                    <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                                <DialogDescription>
                                    Définir un nouveau mot de passe pour {resetPasswordUser?.username}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Nouveau mot de passe</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Entrez le nouveau mot de passe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirmez le mot de passe"
                                    />
                                </div>
                                <Button onClick={handleResetPassword}>Réinitialiser le mot de passe</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* PDF Success Dialog */}
                    <Dialog open={showPDFSuccess} onOpenChange={setShowPDFSuccess}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {pdfCredentials?.isPasswordReset ? 'Mot de passe réinitialisé' : 'Utilisateur créé avec succès'}
                                </DialogTitle>
                                <DialogDescription>
                                    {pdfCredentials?.isPasswordReset
                                        ? 'Le mot de passe a été réinitialisé. Téléchargez le PDF contenant les nouvelles informations de connexion.'
                                        : 'Le compte utilisateur a été créé. Téléchargez le PDF contenant les informations de connexion et le guide d\'utilisation.'}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Button onClick={handleDownloadPDF} className="w-full">
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Télécharger le PDF d'assignation
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Printed PDF Component (Hidden until print) */}
                    {pdfCredentials && (
                        <div className="print-only hidden print:block fixed inset-0 bg-white z-[9999]">
                            <AccountAssignmentPDF
                                username={pdfCredentials.username}
                                password={pdfCredentials.password}
                                matricule={pdfCredentials.matricule}
                                rank={pdfCredentials.rank}
                                division={pdfCredentials.division}
                                clearance={pdfCredentials.clearance}
                                isPasswordReset={pdfCredentials.isPasswordReset}
                            />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="templates" className="space-y-6">
                    <TemplateManager />
                </TabsContent>

                <TabsContent value="penal_code" className="space-y-6">
                    <PenalCodeManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function TemplateManager() {
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);

    const fetchTemplates = async () => {
        try {
            const data = await templatesService.getAll();
            setTemplates(data);
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;
        try {
            await templatesService.delete(id);
            fetchTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
        }
    };

    const handleExportJSON = (template: DocumentTemplate) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `template_${template.name.toLowerCase().replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Créer un Template
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Templates de Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Catégorie</TableHead>
                                <TableHead>Format</TableHead>
                                <TableHead>Champs</TableHead>
                                <TableHead>Habilitation Min.</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4">Chargement...</TableCell>
                                </TableRow>
                            ) : templates.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Aucun template créé.</TableCell>
                                </TableRow>
                            ) : (
                                templates.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium text-primary">{t.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{t.category || "N/A"}</Badge>
                                        </TableCell>
                                        <TableCell className="capitalize">{t.layout_settings?.layout_type?.replace('_', ' ') || "standard"}</TableCell>
                                        <TableCell>{t.schema?.length || 0} champs</TableCell>
                                        <TableCell>Niveau {t.min_clearance}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" title="Modifier" onClick={() => { setEditingTemplate(t); setIsCreateOpen(true); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Exporter JSON" onClick={() => handleExportJSON(t)}>
                                                    <FileJson className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(t.id)}>
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

            <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setEditingTemplate(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingTemplate ? 'Modifier le Template' : 'Créer un Nouveau Template'}</DialogTitle>
                        <DialogDescription>
                            Définissez la structure de votre document en ajoutant des champs personnalisés.
                        </DialogDescription>
                    </DialogHeader>
                    <TemplateBuilder
                        template={editingTemplate || undefined}
                        onSave={() => { setIsCreateOpen(false); setEditingTemplate(null); fetchTemplates(); }}
                        onCancel={() => { setIsCreateOpen(false); setEditingTemplate(null); }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TemplateBuilder({ template, onSave, onCancel }: { template?: DocumentTemplate, onSave: () => void, onCancel: () => void }) {
    const { user } = useAuthStore();
    const [name, setName] = useState(template?.name || "");
    const [category, setCategory] = useState(template?.category || "Report");
    const [minClearance, setMinClearance] = useState(template?.min_clearance?.toString() || "1");
    const [fields, setFields] = useState<TemplateField[]>(template?.schema || []);

    // Layout settings
    const [layoutType, setLayoutType] = useState<'report' | 'card' | 'arrest_warrant' | 'badge'>(template?.layout_settings?.layout_type || 'report');
    const [headerTitle, setHeaderTitle] = useState(template?.layout_settings?.header_title || "");
    const [headerSubtitle, setHeaderSubtitle] = useState(template?.layout_settings?.header_subtitle || "");
    const [showLogo, setShowLogo] = useState(template?.layout_settings?.show_logo ?? true);
    const [footerText, setFooterText] = useState(template?.layout_settings?.footer_text || "");
    const [themeColor, setThemeColor] = useState(template?.layout_settings?.theme_color || "#1e3a8a");
    const [staticContent, setStaticContent] = useState(template?.layout_settings?.static_content || "");

    const [showPreview, setShowPreview] = useState(false); // Added showPreview state
    const [saving, setSaving] = useState(false);

    const addField = () => {
        const newField: TemplateField = {
            id: Math.random().toString(36).substr(2, 9),
            label: "",
            type: "text",
            required: false
        };
        setFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<TemplateField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleSave = async () => {
        if (!name) return alert("Le nom du template est obligatoire.");
        if (fields.length === 0) return alert("Ajoutez au moins un champ.");
        if (fields.some(f => !f.label)) return alert("Tous les champs doivent avoir un libellé.");

        setSaving(true);
        try {
            const templateData: Partial<DocumentTemplate> = {
                name,
                category,
                min_clearance: parseInt(minClearance),
                schema: fields,
                created_by: template?.created_by || user?.id,
                content: template?.content || "",
                layout_settings: {
                    layout_type: layoutType,
                    header_title: headerTitle || undefined,
                    header_subtitle: headerSubtitle || undefined,
                    show_logo: showLogo,
                    footer_text: footerText || undefined,
                    theme_color: themeColor,
                    static_content: staticContent || undefined
                }
            };

            if (template?.id) {
                await templatesService.update(template.id, templateData);
            } else {
                await templatesService.create(templateData);
            }
            onSave();
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Erreur lors de la sauvegarde du template.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 py-4">
            <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div>
                    <h2 className="text-xl font-bold text-primary">Configuration du Template</h2>
                    <p className="text-sm text-muted-foreground">Personnalisez l'apparence et les données de votre document officiel.</p>
                </div>
                <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
                    {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showPreview ? "Masquer Aperçu" : "Aperçu en Direct"}
                </Button>
            </div>

            <div className={`grid gap-8 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* Editor Column */}
                <div className="space-y-8">
                    {/* Configuration de Base */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-primary font-bold">Nom du Template</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Rapport de Fouille" className="border-primary/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="font-bold">Catégorie</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Report">Rapport</SelectItem>
                                    <SelectItem value="Arrest">Arrestation</SelectItem>
                                    <SelectItem value="Investigation">Enquête</SelectItem>
                                    <SelectItem value="Other">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Settings2 className="h-5 w-5 text-primary" /> Mise en Page du PDF
                        </h3>
                        <div className="grid grid-cols-2 gap-6 bg-muted/20 p-4 rounded-lg border border-primary/10">
                            <div className="space-y-2">
                                <Label className="font-semibold">Type de Layout</Label>
                                <Select value={layoutType} onValueChange={(val: any) => setLayoutType(val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="report">Rapport Standard (A4)</SelectItem>
                                        <SelectItem value="arrest_warrant">Mandat / Arrestation</SelectItem>
                                        <SelectItem value="card">Fiche Compacte</SelectItem>
                                        <SelectItem value="badge">Badge d'Identité</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Habilitation Minimum requise</Label>
                                <Select value={minClearance} onValueChange={setMinClearance}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Niveau 1</SelectItem>
                                        <SelectItem value="2">Niveau 2</SelectItem>
                                        <SelectItem value="3">Niveau 3</SelectItem>
                                        <SelectItem value="4">Niveau 4</SelectItem>
                                        <SelectItem value="5">Niveau 5</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Titre de l'En-tête (Optionnel)</Label>
                                <Input value={headerTitle} onChange={(e) => setHeaderTitle(e.target.value)} placeholder="Par défaut: Nom du Template" />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-semibold">Sous-titre (Optionnel)</Label>
                                <Input value={headerSubtitle} onChange={(e) => setHeaderSubtitle(e.target.value)} placeholder="ex: Département Administratif" />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="font-semibold">Texte de Pied de Page / Mentions Légales</Label>
                                <Textarea
                                    value={footerText}
                                    onChange={(e) => setFooterText(e.target.value)}
                                    placeholder="Mentions légales, signatures, avertissements..."
                                    className="min-h-[80px]"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <Checkbox id="showLogo" checked={showLogo} onCheckedChange={(val) => setShowLogo(!!val)} />
                                <Label htmlFor="showLogo" className="cursor-pointer">Afficher le sceau officiel du NOOSE</Label>
                            </div>
                            <div className="col-span-2 space-y-4 pt-4 border-t border-primary/10">
                                <Label className="font-bold flex items-center gap-2">
                                    <Key className="h-4 w-4 text-primary" /> Couleur de Thème du Document
                                </Label>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { name: "NOOSE Blue", color: "#1e3a8a" },
                                        { name: "Police Blue", color: "#003366" },
                                        { name: "Tactical Black", color: "#111827" },
                                        { name: "Warning Red", color: "#991b1b" },
                                        { name: "Emergency Orange", color: "#c2410c" },
                                        { name: "Investigation Purple", color: "#581c87" },
                                        { name: "Secret Green", color: "#064e3b" },
                                    ].map((c) => (
                                        <button
                                            key={c.color}
                                            type="button"
                                            onClick={() => setThemeColor(c.color)}
                                            className={`group relative w-10 h-10 rounded-full border-4 transition-all hover:scale-110 ${themeColor === c.color ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: c.color }}
                                            title={c.name}
                                        >
                                            {themeColor === c.color && <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</div>}
                                        </button>
                                    ))}
                                    <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border shadow-sm">
                                        <Input
                                            type="color"
                                            value={themeColor}
                                            onChange={(e) => setThemeColor(e.target.value)}
                                            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                                        />
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{themeColor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 space-y-2 pt-2 border-t border-primary/10">
                                <Label className="font-bold">Contenu Fixe / Instructions (Sous l'en-tête)</Label>
                                <Textarea
                                    value={staticContent}
                                    onChange={(e) => setStaticContent(e.target.value)}
                                    placeholder="ex: En vertu de la loi 44-B, tout individu doit coopérer..."
                                    className="min-h-[100px] bg-white border-primary/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Database className="h-5 w-5 text-primary" /> Champs du Document
                            </h3>
                            <Button type="button" variant="outline" size="sm" onClick={addField} className="border-primary/50 text-primary hover:bg-primary/5">
                                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un champ
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field) => (
                                <div key={field.id} className="group relative flex gap-3 items-end p-4 border rounded-xl bg-white shadow-sm hover:border-primary/30 transition-all">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Libellé du champ</Label>
                                        <Input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} placeholder="ex: Couleur du véhicule" className="border-transparent bg-muted/30 focus:border-primary/20" />
                                    </div>
                                    <div className="w-48 space-y-2">
                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type de donnée</Label>
                                        <Select value={field.type} onValueChange={(val: any) => updateField(field.id, { type: val })}>
                                            <SelectTrigger className="bg-muted/30 border-transparent"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Texte Court</SelectItem>
                                                <SelectItem value="textarea">Description Longue</SelectItem>
                                                <SelectItem value="number">Valeur Numérique</SelectItem>
                                                <SelectItem value="date">Date</SelectItem>
                                                <SelectItem value="boolean">Case à cocher</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2 pb-2 px-2">
                                        <Checkbox id={`req-${field.id}`} checked={field.required} onCheckedChange={(val) => updateField(field.id, { required: !!val })} />
                                        <Label htmlFor={`req-${field.id}`} className="text-xs font-medium cursor-pointer">Requis</Label>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeField(field.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {fields.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed rounded-xl bg-muted/10 text-muted-foreground italic">
                                    Aucun champ défini. Utilisez le bouton ci-dessus pour construire votre formulaire.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Column */}
                {showPreview && (
                    <div className="border rounded-xl overflow-hidden bg-white shadow-lg sticky top-0 h-[800px] flex flex-col">
                        <div className="bg-primary text-white p-3 flex justify-between items-center shrink-0">
                            <span className="font-bold flex items-center gap-2">
                                <Eye className="h-4 w-4" /> Aperçu du Rendu PDF
                            </span>
                            <Badge variant="secondary" className="bg-white/20 text-white border-none uppercase text-[10px]">Simulation</Badge>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-200">
                            <div className="scale-75 origin-top transform-gpu">
                                <DynamicReportPDF
                                    preview={true}
                                    report={{
                                        id: "SIM-001",
                                        title: name || "Titre du Document",
                                        content: "Ceci est une simulation du contenu principal du document. Les données affichées ci-dessous correspondent aux champs dynamiques que vous avez définis."
                                    }}
                                    template={{
                                        id: "sim",
                                        name: name || "Nouveau Template",
                                        category,
                                        min_clearance: parseInt(minClearance),
                                        created_by: user?.id || "",
                                        created_at: new Date().toISOString(),
                                        content: "",
                                        schema: fields,
                                        layout_settings: {
                                            layout_type: layoutType,
                                            header_title: headerTitle,
                                            header_subtitle: headerSubtitle,
                                            show_logo: showLogo,
                                            footer_text: footerText,
                                            theme_color: themeColor,
                                            static_content: staticContent
                                        }
                                    }}
                                    templateData={Object.fromEntries(fields.map(f => [f.id, `Exemple ${f.label}`]))}
                                    author={user}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t font-semibold">
                <Button variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 shadow-md transition-all hover:scale-105">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {template?.id ? "Mettre à jour le Template" : "Générer le Template de Document"}
                </Button>
            </div>
        </div>
    );
}
