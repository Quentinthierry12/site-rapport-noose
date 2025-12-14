import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Shield, Eye, EyeOff } from "lucide-react";
import { redactionService, type RedactionConfig } from "@/features/redaction/redactionService";
import { useAuthStore } from "@/features/auth/AuthStore";

interface RedactionEditorProps {
    reportId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: () => void;
}

export function RedactionEditor({ reportId, open, onOpenChange, onSaved }: RedactionEditorProps) {
    const { user } = useAuthStore();
    const [versionType, setVersionType] = useState<'partial' | 'public'>('partial');
    const [config, setConfig] = useState<RedactionConfig>({});
    const [saving, setSaving] = useState(false);

    const handleToggleField = (field: keyof RedactionConfig) => {
        setConfig(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        try {
            const fields = redactionService.configToFields(config);
            await redactionService.createVersion(reportId, versionType, fields, user.id);
            onOpenChange(false);
            if (onSaved) onSaved();
            // Reset form
            setConfig({});
            setVersionType('partial');
        } catch (error) {
            console.error("Failed to create redacted version:", error);
            alert("Failed to create redacted version");
        } finally {
            setSaving(false);
        }
    };

    const getVersionDescription = () => {
        switch (versionType) {
            case 'partial':
                return "Visible to users with clearance level 2-3. Some sensitive information redacted.";
            case 'public':
                return "Visible to users with clearance level 0-1. Most sensitive information redacted.";
            default:
                return "";
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Manage Document Redaction
                    </DialogTitle>
                    <DialogDescription>
                        Create redacted versions of this report for different clearance levels.
                        Select which fields to redact.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Version Type Selector */}
                    <div className="space-y-2">
                        <Label>Version Type</Label>
                        <Select value={versionType} onValueChange={(v) => setVersionType(v as 'partial' | 'public')}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="partial">
                                    <div className="flex items-center gap-2">
                                        <EyeOff className="h-4 w-4" />
                                        <span>Partial (Clearance 2-3)</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="public">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        <span>Public (Clearance 0-1)</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {getVersionDescription()}
                        </p>
                    </div>

                    {/* Redaction Fields */}
                    <div className="space-y-4">
                        <Label>Fields to Redact</Label>
                        <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="suspect_name"
                                    checked={config.suspect_name || false}
                                    onCheckedChange={() => handleToggleField('suspect_name')}
                                />
                                <label htmlFor="suspect_name" className="text-sm font-medium">
                                    Suspect Name
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="suspect_address"
                                    checked={config.suspect_address || false}
                                    onCheckedChange={() => handleToggleField('suspect_address')}
                                />
                                <label htmlFor="suspect_address" className="text-sm font-medium">
                                    Suspect Address
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="suspect_dob"
                                    checked={config.suspect_dob || false}
                                    onCheckedChange={() => handleToggleField('suspect_dob')}
                                />
                                <label htmlFor="suspect_dob" className="text-sm font-medium">
                                    Suspect Date of Birth
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="officer_name"
                                    checked={config.officer_name || false}
                                    onCheckedChange={() => handleToggleField('officer_name')}
                                />
                                <label htmlFor="officer_name" className="text-sm font-medium">
                                    Officer Name
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="witness_names"
                                    checked={config.witness_names || false}
                                    onCheckedChange={() => handleToggleField('witness_names')}
                                />
                                <label htmlFor="witness_names" className="text-sm font-medium">
                                    Witness Names
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="phone_numbers"
                                    checked={config.phone_numbers || false}
                                    onCheckedChange={() => handleToggleField('phone_numbers')}
                                />
                                <label htmlFor="phone_numbers" className="text-sm font-medium">
                                    Phone Numbers
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-2">Preview:</p>
                        <p className="text-xs text-muted-foreground">
                            {Object.values(config).filter(Boolean).length === 0
                                ? "No fields selected for redaction"
                                : `${Object.values(config).filter(Boolean).length} field(s) will be replaced with [REDACTED]`}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            onClick={handleSave}
                            disabled={saving || Object.values(config).filter(Boolean).length === 0}
                            className="flex-1"
                        >
                            {saving ? "Saving..." : "Create Redacted Version"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
