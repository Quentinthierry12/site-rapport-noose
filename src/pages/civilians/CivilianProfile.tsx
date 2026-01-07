import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { civiliansService, type Civilian } from "@/features/civilians/civiliansService";
import { arrestsService, type Arrest } from "@/features/arrests/arrestsService";
import { vehiclesService, type Vehicle } from "@/features/vehicles/vehiclesService";
import { weaponsService, type Weapon } from "@/features/weapons/weaponsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, Shield, Car, Save, Edit2, X, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { SuspectPDF } from "@/pages/reports/SuspectPDF";

export function CivilianProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [civilian, setCivilian] = useState<Partial<Civilian>>({});
    const [arrests, setArrests] = useState<Arrest[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [weapons, setWeapons] = useState<Weapon[]>([]);
    const [loading, setLoading] = useState(!isNew);
    const [isEditing, setIsEditing] = useState(isNew);

    // Export State
    const [showExportDialog, setShowExportDialog] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        arrests: true,
        investigations: true,
        vehicles: true
    });
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        setShowExportDialog(false);
        // Small delay to allow dialog to close and state to settle before printing
        setTimeout(() => {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const sanitizedName = (formData.full_name || 'unknown').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const fileName = `${year}_${month}_${day}_profile_${sanitizedName}`;

            const originalTitle = document.title;
            document.title = fileName;
            window.print();
            document.title = originalTitle;
        }, 300);
    };

    // Form State
    const [formData, setFormData] = useState<Partial<Civilian>>({});

    useEffect(() => {
        if (isNew) {
            setFormData({
                full_name: '',
                dob: '',
                gender: '',
                race: '',
                hair_color: '',
                eye_color: '',
                height: '',
                weight: '',
                pob: '',
                address: '',
                mugshot_url: ''
            });
            return;
        }

        async function fetchData() {
            try {
                const [civData, arrestData, vehicleData, weaponData] = await Promise.all([
                    civiliansService.getById(id!),
                    arrestsService.getByCivilianId(id!),
                    vehiclesService.getByOwnerId(id!),
                    weaponsService.getByOwnerId(id!)
                ]);
                setCivilian(civData);
                setFormData(civData);
                setArrests(arrestData);
                setVehicles(vehicleData);
                setWeapons(weaponData);
            } catch (error) {
                console.error("Failed to fetch civilian data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, isNew]);

    const handleSave = async () => {
        try {
            if (isNew) {
                await civiliansService.create(formData);
                navigate('/civilians');
            } else {
                await civiliansService.update(id!, formData);
                setCivilian(formData);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Failed to save civilian:", error);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement du dossier...</div>;
    if (!isNew && !civilian.id) return <div className="p-8 text-center">Dossier civil non trouvé.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/civilians')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {isNew ? 'New Civilian' : formData.full_name}
                        </h1>
                        <p className="text-muted-foreground">Dossier civil</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" onClick={() => !isNew && setIsEditing(false)}>
                                <X className="mr-2 h-4 w-4" /> Annuler
                            </Button>
                            <Button onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" /> Enregistrer le dossier
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setShowExportDialog(true)}>
                                <Printer className="mr-2 h-4 w-4" /> Export vers PDF
                            </Button>
                            <Button onClick={() => setIsEditing(true)}>
                                <Edit2 className="mr-2 h-4 w-4" /> Modifier le dossier
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="print:hidden grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar / Mugshot Area */}
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
                        <div className="h-40 w-40 rounded-full bg-muted flex items-center justify-center overflow-hidden border-4 border-background shadow-sm">
                            {formData.mugshot_url ? (
                                <img src={formData.mugshot_url} alt="Mugshot" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-20 w-20 text-muted-foreground" />
                            )}
                        </div>
                        {isEditing && (
                            <Input
                                placeholder="Mugshot URL"
                                value={formData.mugshot_url || ''}
                                onChange={e => setFormData({ ...formData, mugshot_url: e.target.value })}
                            />
                        )}
                        <div>
                            <h3 className="font-semibold text-lg">{formData.full_name}</h3>
                            <p className="text-sm text-muted-foreground">Date de naissance: {formData.dob || 'Unknown'}</p>
                        </div>

                        <div className="w-full pt-4 border-t space-y-3 text-left text-sm">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Nom Complet</Label>
                                {isEditing ? (
                                    <Input value={formData.full_name || ''} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                                ) : (
                                    <p>{formData.full_name}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Date de naissance</Label>
                                {isEditing ? (
                                    <Input value={formData.dob || ''} onChange={e => setFormData({ ...formData, dob: e.target.value })} placeholder="YYYY-MM-DD" />
                                ) : (
                                    <p>{formData.dob || 'N/A'}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Genre</Label>
                                {isEditing ? (
                                    <Input value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })} />
                                ) : (
                                    <p>{formData.gender || 'N/A'}</p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">ethnicité</Label>
                                {isEditing ? (
                                    <Input value={formData.race || ''} onChange={e => setFormData({ ...formData, race: e.target.value })} />
                                ) : (
                                    <p>{formData.race || 'N/A'}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content Tabs */}
                <div className="md:col-span-3">
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="info">Personal Info</TabsTrigger>
                            <TabsTrigger value="history">History & Records</TabsTrigger>
                            <TabsTrigger value="assets">Assets</TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Physical Description & Origin</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Hair Color</Label>
                                            {isEditing ? (
                                                <Input value={formData.hair_color || ''} onChange={e => setFormData({ ...formData, hair_color: e.target.value })} />
                                            ) : <p className="p-2 bg-muted/50 rounded">{formData.hair_color || 'N/A'}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Eye Color</Label>
                                            {isEditing ? (
                                                <Input value={formData.eye_color || ''} onChange={e => setFormData({ ...formData, eye_color: e.target.value })} />
                                            ) : <p className="p-2 bg-muted/50 rounded">{formData.eye_color || 'N/A'}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Height</Label>
                                            {isEditing ? (
                                                <Input value={formData.height || ''} onChange={e => setFormData({ ...formData, height: e.target.value })} placeholder="e.g. 6'1" />
                                            ) : <p className="p-2 bg-muted/50 rounded">{formData.height || 'N/A'}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Weight</Label>
                                            {isEditing ? (
                                                <Input value={formData.weight || ''} onChange={e => setFormData({ ...formData, weight: e.target.value })} placeholder="e.g. 180 lbs" />
                                            ) : <p className="p-2 bg-muted/50 rounded">{formData.weight || 'N/A'}</p>}
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Place of Birth</Label>
                                            {isEditing ? (
                                                <Input value={formData.pob || ''} onChange={e => setFormData({ ...formData, pob: e.target.value })} />
                                            ) : <p className="p-2 bg-muted/50 rounded">{formData.pob || 'N/A'}</p>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact & Address</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label>Address</Label>
                                        {isEditing ? (
                                            <Input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                        ) : <p className="p-2 bg-muted/50 rounded">{formData.address || 'No fixed address'}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Arrest Record</CardTitle>
                                    <CardDescription>Criminal history and charges.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {arrests.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No arrest records found.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {arrests.map(arrest => (
                                                <div key={arrest.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                                    <div>
                                                        <h4 className="font-semibold flex items-center gap-2">
                                                            {arrest.charges.join(", ")}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(arrest.date_of_arrest).toLocaleDateString()} • Officer: {arrest.officer?.username || 'Unknown'}
                                                        </p>
                                                    </div>
                                                    <Badge variant={arrest.status === 'Released' ? 'outline' : 'destructive'}>
                                                        {arrest.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="assets" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Registered Vehicles</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {vehicles.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                            <Car className="h-10 w-10 mb-2 opacity-20" />
                                            <p>No vehicles registered.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {vehicles.map(vehicle => (
                                                <div key={vehicle.plate} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                            <Car className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold font-mono">{vehicle.plate}</h4>
                                                            <p className="text-sm text-muted-foreground">{vehicle.color} {vehicle.model}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={vehicle.status === 'Valid' ? 'default' : 'destructive'}>
                                                        {vehicle.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Registered Weapons</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {weapons.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                            <Shield className="h-10 w-10 mb-2 opacity-20" />
                                            <p>No weapons registered.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {weapons.map(weapon => (
                                                <div key={weapon.serial_number} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                                            <Shield className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold font-mono">{weapon.serial_number}</h4>
                                                            <p className="text-sm text-muted-foreground">{weapon.type} {weapon.model}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant={weapon.status === 'Valid' ? 'default' : 'destructive'}>
                                                        {weapon.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Export Dialog */}
            <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Options</DialogTitle>
                        <DialogDescription>
                            Select the information you want to include in the PDF dossier.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="inc-arrests"
                                checked={exportOptions.arrests}
                                onCheckedChange={(c) => setExportOptions(prev => ({ ...prev, arrests: !!c }))}
                            />
                            <Label htmlFor="inc-arrests">Include Arrest History</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="inc-inv"
                                checked={exportOptions.investigations}
                                onCheckedChange={(c) => setExportOptions(prev => ({ ...prev, investigations: !!c }))}
                            />
                            <Label htmlFor="inc-inv">Include Investigations</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="inc-veh"
                                checked={exportOptions.vehicles}
                                onCheckedChange={(c) => setExportOptions(prev => ({ ...prev, vehicles: !!c }))}
                            />
                            <Label htmlFor="inc-veh">Include Vehicles & Weapons</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
                        <Button onClick={handlePrint}>Generate PDF</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hidden Printable Component with Global Styles */}
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #suspect-pdf-root, #suspect-pdf-root * {
                            visibility: visible;
                        }
                        #suspect-pdf-root {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            height: auto;
                            z-index: 9999;
                            background: white;
                        }
                        /* Hide the main scrollbar to prevent extra pages */
                        html, body {
                            height: 100vh;
                            overflow: hidden;
                            background: white;
                        }
                    }
                `}
            </style>
            <div id="suspect-pdf-root" className="hidden print:block fixed top-0 left-0 w-full min-h-screen bg-white">
                <SuspectPDF
                    ref={componentRef}
                    suspect={civilian as Civilian}
                    arrests={arrests}
                    includeArrests={exportOptions.arrests}
                    includeInvestigations={exportOptions.investigations}
                    includeVehicles={exportOptions.vehicles}
                />
            </div>
        </div>
    );
}
