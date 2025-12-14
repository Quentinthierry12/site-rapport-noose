import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { CivilianSelect } from "@/components/civilians/CivilianSelect";
import { arrestsService, type Arrest } from "@/features/arrests/arrestsService";
import { useAuthStore } from "@/features/auth/AuthStore";

export function ArrestPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isNew = !id || id === 'new';

    const [suspectName, setSuspectName] = useState("");
    const [civilianId, setCivilianId] = useState<string | undefined>(undefined);
    const [alias, setAlias] = useState("");
    const [charges, setCharges] = useState("");
    const [location, setLocation] = useState("");
    const [status, setStatus] = useState<Arrest['status']>("Pending");
    const [loading, setLoading] = useState(!isNew);

    useEffect(() => {
        if (!isNew && id) {
            async function fetchArrest() {
                try {
                    const data = await arrestsService.getById(id!);
                    setSuspectName(data.suspect_name);
                    setCivilianId(data.civilian_id);
                    setAlias(data.suspect_alias || "");
                    setCharges(data.charges.join(", "));
                    setLocation(data.location);
                    setStatus(data.status);
                } catch (error) {
                    console.error("Failed to fetch arrest:", error);
                } finally {
                    setLoading(false);
                }
            }
            fetchArrest();
        }
    }, [id, isNew]);

    const handleSave = async () => {
        try {
            const arrestData = {
                suspect_name: suspectName,
                suspect_alias: alias,
                civilian_id: civilianId,
                charges: charges.split(",").map(c => c.trim()).filter(Boolean),
                location,
                status,
                arresting_officer_id: user?.id,
                date_of_arrest: new Date().toISOString()
            };

            if (isNew) {
                await arrestsService.create(arrestData);
            } else {
                await arrestsService.update(id!, arrestData);
            }
            navigate('/arrests');
        } catch (error) {
            console.error("Failed to save arrest:", error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading arrest record...</div>;
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/arrests')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isNew ? 'New Arrest Record' : `Arrest Record ${id}`}
                    </h1>
                </div>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Save Record
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="suspectName">Suspect Name</Label>
                            <CivilianSelect
                                value={suspectName}
                                onSelect={(civilian) => {
                                    setSuspectName(civilian.full_name);
                                    setCivilianId(civilian.id);
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="alias">Alias (AKA)</Label>
                            <Input
                                id="alias"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                                placeholder="Nickname / Street Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="charges">Charges (comma separated)</Label>
                        <Textarea
                            id="charges"
                            value={charges}
                            onChange={(e) => setCharges(e.target.value)}
                            placeholder="e.g. Grand Theft Auto, Evading Arrest, Possession"
                            className="h-24"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location of Arrest</Label>
                        <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Street Address or Coordinates"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Mugshot</Label>
                        <div className="border-2 border-dashed rounded-md h-48 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="text-xs">Click to upload</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(val) => setStatus(val as Arrest['status'])}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending Processing</SelectItem>
                                <SelectItem value="Processed">Processed</SelectItem>
                                <SelectItem value="In Custody">In Custody</SelectItem>
                                <SelectItem value="Released">Released</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
