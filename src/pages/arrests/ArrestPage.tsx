import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Upload, FileDown } from "lucide-react";
import { CivilianSelect } from "@/components/civilians/CivilianSelect";
import { arrestsService, type Arrest } from "@/features/arrests/arrestsService";
import { ChargeSelect } from "@/components/arrests/ChargeSelect";
import { useAuthStore } from "@/features/auth/AuthStore";
import { civiliansService, type Civilian } from "@/features/civilians/civiliansService";
import ReactDOMServer from "react-dom/server";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ArrestPDF } from "@/pages/reports/ArrestPDF";
import { ReportEditor } from "@/components/editor/ReportEditor";
import { reportsService } from "@/features/reports/reportsService";
import { teamsService, type Team } from "@/features/teams/teamsService";
import { type SpecialtyKey } from "@/components/pdf/PDFStamp";
import { PDFExportDialog } from "@/components/pdf/PDFExportDialog";

export function ArrestPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isNew = !id || id === 'new';

    const [suspectName, setSuspectName] = useState("");
    const [civilianId, setCivilianId] = useState<string | undefined>(undefined);
    const [alias, setAlias] = useState("");
    const [charges, setCharges] = useState<string[]>([]);
    const [location, setLocation] = useState("");
    const [status, setStatus] = useState<Arrest['status']>("Pending");
    const [mugshotUrl, setMugshotUrl] = useState("");
    const [loading, setLoading] = useState(!isNew);
    const [exporting, setExporting] = useState(false);
    const [factsDetails, setFactsDetails] = useState("");
    const [reportId, setReportId] = useState<string | undefined>(undefined);
    const [userTeams, setUserTeams] = useState<Team[]>([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyKey | undefined>(undefined);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);

    // Keep track of the full civilian object for PDF export if needed
    const [selectedCivilian, setSelectedCivilian] = useState<Civilian | undefined>(undefined);

    useEffect(() => {
        if (!isNew && id) {
            async function fetchArrest() {
                try {
                    const data = await arrestsService.getById(id!);
                    setSuspectName(data.suspect_name);
                    setCivilianId(data.civilian_id);
                    setAlias(data.suspect_alias || "");
                    setCharges(data.charges || []);
                    setLocation(data.location);
                    setStatus(data.status);
                    setMugshotUrl(data.mugshot_url || "");
                    setReportId(data.report_id);

                    if (data.report_id) {
                        try {
                            const report = await reportsService.getById(data.report_id);
                            setFactsDetails(report.content);
                        } catch (e) {
                            console.warn("Could not fetch linked report", e);
                        }
                    }

                    if (data.civilian_id) {
                        try {
                            const civ = await civiliansService.getById(data.civilian_id);
                            setSelectedCivilian(civ);
                        } catch (e) {
                            console.warn("Could not fetch linked civilian", e);
                        }
                    }

                } catch (error) {
                    console.error("Failed to fetch arrest:", error);
                } finally {
                    setLoading(false);
                }
            }
            fetchArrest();
        }
        if (user?.id) {
            teamsService.getUserTeams(user.id).then(setUserTeams).catch(console.error);
        }
    }, [id, isNew, user?.id]);

    const handleSave = async () => {
        try {
            let currentReportId = reportId;

            if (isNew && factsDetails) {
                const date = new Date();
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const sanitizedName = suspectName.toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');

                const reportTitle = `${year}_${month}_${day}_${sanitizedName}`;

                const newReport = await reportsService.create({
                    title: reportTitle,
                    content: factsDetails,
                    author_id: user?.id,
                    suspect_id: civilianId,
                    classification: 'Law Enforcement Sensitive',
                    status: 'En Attente de validation'
                });
                currentReportId = newReport.id;
            } else if (!isNew && reportId && factsDetails) {
                // Update existing report
                await reportsService.update(reportId, {
                    content: factsDetails,
                    suspect_id: civilianId
                });
            }

            const arrestData = {
                suspect_name: suspectName,
                suspect_alias: alias,
                civilian_id: civilianId,
                charges: charges,
                location,
                status,
                mugshot_url: mugshotUrl,
                report_id: currentReportId,
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

    const handleExportPDF = async () => {
        if (isNew) {
            alert("Please save the arrest record first.");
            return;
        }
        setExporting(true);
        try {
            // Re-fetch current data to ensure cleanliness or use state
            // Construct a temporary Arrest object from state
            const currentArrest: Arrest = {
                id: id!,
                suspect_name: suspectName,
                suspect_alias: alias,
                civilian_id: civilianId,
                charges: charges,
                location,
                status,
                mugshot_url: mugshotUrl,
                arresting_officer_id: user?.id || "",
                officer: {
                    username: user?.username || "Unknown",
                    rank: user?.rank || "",
                    matricule: user?.matricule || "",
                    division: user?.division || ""
                },
                date_of_arrest: new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            const element = (
                <ArrestPDF
                    arrest={currentArrest}
                    suspect={selectedCivilian}
                    preview={true}
                    overrideSpecialty={selectedSpecialty}
                />
            );

            const staticHtml = ReactDOMServer.renderToStaticMarkup(element);
            const container = document.createElement("div");
            container.style.width = "210mm";
            container.style.position = "absolute";
            container.style.left = "-9999px";
            container.style.top = "0";
            container.innerHTML = staticHtml;
            document.body.appendChild(container);

            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: 794,
                windowWidth: 1000
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfImgHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfImgHeight);
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const sanitizedName = suspectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const fileName = `${year}_${month}_${day}_${sanitizedName}.pdf`;

            pdf.save(fileName);

            document.body.removeChild(container);

        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to generate PDF");
        } finally {
            setExporting(false);
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
                        {isNew ? 'New Arrest Record' : `Arrest Record ${id?.slice(0, 8)}`}
                    </h1>
                </div>
                <div className="flex gap-2">
                    {!isNew && (
                        <>
                            <Button variant="outline" onClick={() => setExportDialogOpen(true)} disabled={exporting}>
                                <FileDown className="mr-2 h-4 w-4" />
                                {exporting ? 'Generating...' : 'Export PDF'}
                            </Button>
                        </>
                    )}
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save Record
                    </Button>
                </div>
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
                                    setSelectedCivilian(civilian);
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
                        <Label htmlFor="charges">Charges (Code Pénal)</Label>
                        <ChargeSelect
                            selectedCharges={charges}
                            onChargesChange={setCharges}
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

                    <div className="space-y-2">
                        <Label>Détails des faits</Label>
                        <ReportEditor
                            content={factsDetails}
                            onChange={setFactsDetails}
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                            Un rapport sera automatiquement créé à partir de ces détails.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Mugshot</Label>
                        <div className="border-2 border-dashed rounded-md h-48 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors overflow-hidden relative">
                            {mugshotUrl ? (
                                <img src={mugshotUrl} alt="Mugshot Preview" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 mb-2" />
                                    <span className="text-xs">No image URL</span>
                                </>
                            )}
                        </div>
                        <Input
                            placeholder="https://..."
                            value={mugshotUrl}
                            onChange={(e) => setMugshotUrl(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">Paste an image URL here.</p>
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

            {/* PDF Export Dialog */}
            <PDFExportDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                userTeams={userTeams}
                selectedSpecialty={selectedSpecialty}
                onSpecialtyChange={setSelectedSpecialty}
                onConfirm={handleExportPDF}
            />
        </div>
    );
}
