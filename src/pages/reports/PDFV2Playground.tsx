import { useState } from 'react';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomReportPDF, type CustomReportConfig } from './CustomReportPDF';

export function PDFV2Playground() {
    const navigate = useNavigate();

    // Default configuration
    const [config, setConfig] = useState<CustomReportConfig>({
        title: "RAPPORT D'INCIDENT",
        subtitle: "Unité Spéciale d'Intervention",
        classification: "CONFIDENTIEL",
        reference: "NOOSE-2023-001",
        date: new Date().toISOString().split('T')[0],
        logoUrl: "/noose-seal.png",
        warningText: "", // Empty to use default
        officers: [
            { label: "Officier", value: "Sgt. John Doe" },
            { label: "Matricule", value: "42" },
        ],
        suspect: {
            name: "Jane Smith",
            dob: "1990-05-15",
            mugshotUrl: "",
            details: [
                { label: "Taille", value: "1m75" },
                { label: "Poids", value: "65kg" },
                { label: "Yeux", value: "Verts" },
            ]
        },
        facts: "<p>Le 12/05/2023 à 14h30, l'unité a été appelée pour une intervention...</p>",
        reportContent: "<p>Suite à l'appel, nous avons procédé à l'interpellation du suspect...</p>",
        additionalInfo: "<p>Le suspect coopère avec les autorités.</p>",
        signature: "Sgt. John Doe",
    });

    const handleChange = (field: keyof CustomReportConfig, value: any) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSuspectChange = (field: string, value: any) => {
        setConfig(prev => ({
            ...prev,
            suspect: { ...prev.suspect, [field]: value }
        }));
    };

    // Simple handler to update specific suspect details (flat update for demo)
    const updateSuspectDetail = (index: number, value: string) => {
        const newDetails = [...(config.suspect?.details || [])];
        if (newDetails[index]) newDetails[index].value = value;
        setConfig(prev => ({
            ...prev,
            suspect: { ...prev.suspect!, details: newDetails }
        }));
    };

    const handlePrint = () => {
        document.title = "PROJECT_V2_PREVIEW";
        window.print();
        document.title = "NOOSE System";
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">PDF System V2 - Playground</h1>
                        <p className="text-xs text-muted-foreground">Outil de développement et test de templates</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reset
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print / Preview
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden print:overflow-visible">
                {/* Configuration Panel (Left) */}
                <div className="w-[400px] bg-white border-r overflow-y-auto p-6 space-y-8 print:hidden">

                    {/* Header Config */}
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-2">1. En-tête</h3>
                        <div className="grid gap-4">
                            <div>
                                <Label>Titre du Rapport</Label>
                                <Input value={config.title} onChange={e => handleChange('title', e.target.value)} />
                            </div>
                            <div>
                                <Label>Sous-titre</Label>
                                <Input value={config.subtitle} onChange={e => handleChange('subtitle', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label>Classification</Label>
                                    <Input value={config.classification} onChange={e => handleChange('classification', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Référence</Label>
                                    <Input value={config.reference} onChange={e => handleChange('reference', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <Label>Logo URL</Label>
                                <Input value={config.logoUrl} onChange={e => handleChange('logoUrl', e.target.value)} placeholder="/noose-seal.png" />
                            </div>
                        </div>
                    </div>

                    {/* Warning Config */}
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-2">2. Avertissement Légal</h3>
                        <div>
                            <Label>Texte (HTML autorisé)</Label>
                            <textarea
                                className="w-full border rounded p-2 text-xs font-mono h-32"
                                value={config.warningText}
                                onChange={e => handleChange('warningText', e.target.value)}
                                placeholder="Laisser vide pour le texte par défaut..."
                            />
                        </div>
                    </div>

                    {/* Officer Config */}
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-2">3. Officiers</h3>
                        {config.officers?.map((off, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    className="w-1/3"
                                    value={off.label}
                                    onChange={(e) => {
                                        const newOfficers = [...config.officers!];
                                        newOfficers[i].label = e.target.value;
                                        handleChange('officers', newOfficers);
                                    }}
                                />
                                <Input
                                    className="flex-1"
                                    value={off.value}
                                    onChange={(e) => {
                                        const newOfficers = [...config.officers!];
                                        newOfficers[i].value = e.target.value;
                                        handleChange('officers', newOfficers);
                                    }}
                                />
                            </div>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChange('officers', [...(config.officers || []), { label: 'Role', value: 'Nom' }])}
                        >
                            + Ajouter ligne
                        </Button>
                    </div>

                    {/* Suspect Config */}
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-2">4. Suspect</h3>
                        <div className="grid gap-2">
                            <Label>Nom Complet</Label>
                            <Input value={config.suspect?.name} onChange={e => handleSuspectChange('name', e.target.value)} />
                            <Label>Photo URL</Label>
                            <Input value={config.suspect?.mugshotUrl} onChange={e => handleSuspectChange('mugshotUrl', e.target.value)} placeholder="https://..." />

                            <Label className="mt-2">Détails Rapides</Label>
                            {config.suspect?.details?.map((d, i) => (
                                <div key={i} className="flex gap-2 items-center text-sm">
                                    <span className="w-16 font-mono text-xs">{d.label}</span>
                                    <Input
                                        className="h-8"
                                        value={d.value}
                                        onChange={e => updateSuspectDetail(i, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Config */}
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-2">5. Contenu</h3>
                        <div>
                            <Label>Détails des Faits (HTML)</Label>
                            <textarea
                                className="w-full border rounded p-2 h-32 text-sm"
                                value={config.facts}
                                onChange={e => handleChange('facts', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Rapport Complet (HTML)</Label>
                            <textarea
                                className="w-full border rounded p-2 h-48 text-sm"
                                value={config.reportContent}
                                onChange={e => handleChange('reportContent', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Information Complémentaire (HTML)</Label>
                            <textarea
                                className="w-full border rounded p-2 h-24 text-sm"
                                value={config.additionalInfo}
                                onChange={e => handleChange('additionalInfo', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="space-y-4">
                        <h3 className="font-bold border-b pb-2">6. Pied de page</h3>
                        <div>
                            <Label>Signature</Label>
                            <Input value={config.signature} onChange={e => handleChange('signature', e.target.value)} />
                        </div>
                    </div>

                </div>

                {/* Preview Panel (Right) */}
                <div className="flex-1 bg-gray-500 overflow-y-auto p-8 flex justify-center print:p-0 print:bg-white print:overflow-visible">
                    <CustomReportPDF config={config} preview={true} />
                </div>
            </div>
        </div>
    );
}
