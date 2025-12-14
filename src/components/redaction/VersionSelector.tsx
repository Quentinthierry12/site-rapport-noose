import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2 } from "lucide-react";
import { redactionService, type ReportVersion } from "@/features/redaction/redactionService";
import { useAuthStore } from "@/features/auth/AuthStore";

interface VersionSelectorProps {
    reportId: string;
    onVersionSelect: (version: ReportVersion | null) => void;
    onRefresh?: () => void;
}

export function VersionSelector({ reportId, onVersionSelect, onRefresh }: VersionSelectorProps) {
    const { user } = useAuthStore();
    const [versions, setVersions] = useState<ReportVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>('full');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadVersions();
    }, [reportId]);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const data = await redactionService.getVersions(reportId);
            setVersions(data);
        } catch (error) {
            console.error("Failed to load versions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVersionChange = async (versionType: string) => {
        setSelectedVersion(versionType);

        if (versionType === 'full') {
            onVersionSelect(null); // No redaction
            return;
        }

        const version = versions.find(v => v.version_type === versionType);
        if (version) {
            onVersionSelect(version);
        }
    };

    const handleDeleteVersion = async (versionId: string) => {
        if (!confirm("Delete this redacted version?")) return;

        try {
            await redactionService.deleteVersion(versionId);
            loadVersions();
            if (onRefresh) onRefresh();
            // Reset to full if deleted version was selected
            const deletedVersion = versions.find(v => v.id === versionId);
            if (deletedVersion && selectedVersion === deletedVersion.version_type) {
                setSelectedVersion('full');
                onVersionSelect(null);
            }
        } catch (error) {
            console.error("Failed to delete version:", error);
            alert("Failed to delete version");
        }
    };

    const getVersionBadge = (type: string) => {
        switch (type) {
            case 'full':
                return <Badge variant="default">Full (No Redaction)</Badge>;
            case 'partial':
                return <Badge variant="secondary">Partial (Clearance 2-3)</Badge>;
            case 'public':
                return <Badge variant="outline">Public (Clearance 0-1)</Badge>;
            default:
                return null;
        }
    };

    const canSeeVersion = (versionType: string) => {
        const clearance = user?.clearance || 0;
        if (clearance >= 4) return true; // Can see all
        if (clearance >= 2 && versionType !== 'full') return true;
        if (clearance < 2 && versionType === 'public') return true;
        return false;
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Document Version</Label>
                <Select value={selectedVersion} onValueChange={handleVersionChange}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {canSeeVersion('full') && (
                            <SelectItem value="full">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>Full Version (No Redaction)</span>
                                </div>
                            </SelectItem>
                        )}
                        {versions.filter(v => canSeeVersion(v.version_type)).map(version => (
                            <SelectItem key={version.id} value={version.version_type}>
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>
                                        {version.version_type === 'partial' ? 'Partial' : 'Public'} Version
                                        {version.redacted_fields.length > 0 && ` (${version.redacted_fields.length} fields redacted)`}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    {getVersionBadge(selectedVersion)}
                    {user?.clearance && user.clearance >= 4 && (
                        <span className="text-xs text-muted-foreground">
                            Your clearance: Level {user.clearance}
                        </span>
                    )}
                </div>
            </div>

            {/* Version Management (Admin only) */}
            {user?.permissions.includes('admin.access') && versions.length > 0 && (
                <div className="space-y-2 p-4 border rounded-md">
                    <Label className="text-xs">Manage Versions</Label>
                    <div className="space-y-2">
                        {versions.map(version => (
                            <div key={version.id} className="flex items-center justify-between text-sm">
                                <div>
                                    <span className="font-medium capitalize">{version.version_type}</span>
                                    <span className="text-muted-foreground ml-2">
                                        ({version.redacted_fields.length} fields)
                                    </span>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleDeleteVersion(version.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <p className="text-xs text-muted-foreground text-center">Loading versions...</p>
            )}
        </div>
    );
}
