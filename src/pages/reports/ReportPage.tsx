import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportEditor } from '@/components/editor/ReportEditor';
import { Save, ArrowLeft, FileDown, Search, X, Shield, FileJson, Settings2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { reportsService } from '@/features/reports/reportsService';
import { searchService, type SearchResult } from '@/features/search/searchService';
import { civiliansService, type Civilian } from '@/features/civilians/civiliansService';
import { useAuthStore } from '@/features/auth/AuthStore';
import { ReportPDF } from './ReportPDF';
import { TeamSelector } from '@/components/teams/TeamSelector';
import { notificationsService } from '@/features/notifications/notificationsService';
import { RedactionEditor } from '@/components/redaction/RedactionEditor';
import { VersionSelector } from '@/components/redaction/VersionSelector';
import { templatesService, type DocumentTemplate, type TemplateField } from '@/features/reports/templatesService';
import { DynamicReportPDF } from './DynamicReportPDF';


export function ReportPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isNew = !id || id === 'new';

    const [title, setTitle] = useState('');
    const [classification, setClassification] = useState('Unclassified');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('Draft');
    const [authorId, setAuthorId] = useState<string | null>(null);
    const [createdAt, setCreatedAt] = useState(new Date().toISOString());
    const [loading, setLoading] = useState(!isNew);

    // Suspect State
    const [suspectId, setSuspectId] = useState<string | null>(null);
    const [suspect, setSuspect] = useState<Civilian | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Team Sharing State
    const [sharedTeams, setSharedTeams] = useState<string[]>([]);

    // Redaction State
    const [redactionDialogOpen, setRedactionDialogOpen] = useState(false);
    const [redactedFields, setRedactedFields] = useState<string[]>([]);

    // Template Dynamic State
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [templateSchema, setTemplateSchema] = useState<TemplateField[]>([]);
    const [templateData, setTemplateData] = useState<Record<string, any>>({});

    useEffect(() => {
        if (!isNew && id) {
            async function fetchReport() {
                try {
                    const data = await reportsService.getById(id!);
                    setTitle(data.title);
                    setClassification(data.classification);
                    setContent(data.content);
                    setStatus(data.status);
                    setAuthorId(data.author_id);
                    setCreatedAt(data.created_at);
                    if (data.suspect_id) {
                        setSuspectId(data.suspect_id);
                        // The service returns a partial suspect object, but we might want the full one
                        // or we can just use what's returned if it matches the shape we need.
                        // For now, let's fetch the full civilian to be safe and consistent.
                        const fullSuspect = await civiliansService.getById(data.suspect_id);
                        setSuspect(fullSuspect);
                    }
                    // Load shared teams
                    if (data.shared_with_teams) {
                        setSharedTeams(data.shared_with_teams);
                    }
                    // Load template data
                    if (data.template_id) {
                        setSelectedTemplateId(data.template_id);
                        setTemplateData(data.template_data || {});
                        const t = await templatesService.getById(data.template_id);
                        setSelectedTemplate(t);
                        setTemplateSchema(t.schema);
                    }
                } catch (error) {
                    console.error("Failed to fetch report:", error);
                } finally {
                    setLoading(false);
                }
            }
            fetchReport();
        }
    }, [id, isNew]);

    // Search Effect
    useEffect(() => {
        const search = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const data = await searchService.search(searchQuery, 'civilian');
                setSearchResults(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Fetch suspect details when ID changes (if selected from search)
    useEffect(() => {
        if (suspectId && !suspect) {
            civiliansService.getById(suspectId).then(setSuspect).catch(console.error);
        } else if (!suspectId) {
            setSuspect(null);
        }
    }, [suspectId]);

    // Fetch Available Templates
    useEffect(() => {
        templatesService.getAll().then(setTemplates).catch(console.error);
    }, []);

    const handleTemplateChange = async (templateId: string) => {
        if (templateId === "none") {
            setSelectedTemplateId(null);
            setTemplateSchema([]);
            setTemplateData({});
            return;
        }
        setSelectedTemplateId(templateId);
        try {
            const template = await templatesService.getById(templateId);
            setSelectedTemplate(template);
            setTemplateSchema(template.schema);
            // Initialize template data with empty values if not already set
            const newData = { ...templateData };
            template.schema.forEach(field => {
                if (!(field.id in newData)) {
                    newData[field.id] = field.type === 'boolean' ? false : "";
                }
            });
            setTemplateData(newData);
        } catch (error) {
            console.error("Failed to fetch template schema:", error);
        }
    };

    const handleSelectSuspect = async (id: string) => {
        setSuspectId(id);
        setSearchQuery("");
        setSearchResults([]);
        // Fetch immediately to update UI
        try {
            const data = await civiliansService.getById(id);
            setSuspect(data);
        } catch (error) {
            console.error("Failed to fetch suspect:", error);
        }
    };

    const handleRemoveSuspect = () => {
        setSuspectId(null);
        setSuspect(null);
    };

    const handleSave = async () => {
        try {
            const reportData = {
                title,
                classification,
                content,
                status,
                author_id: user?.id,
                suspect_id: suspectId || undefined,
                template_id: selectedTemplateId || undefined,
                template_data: selectedTemplateId ? templateData : undefined,
                shared_with_teams: sharedTeams
            };

            if (isNew) {
                const newReport = await reportsService.create(reportData);
                // Notify teams
                if (sharedTeams.length > 0) {
                    for (const teamId of sharedTeams) {
                        await notificationsService.notifyTeamOfSharedReport(
                            teamId,
                            newReport.id,
                            title,
                            user?.username || 'Un officier'
                        );
                    }
                }
            } else if (id) {
                // Get old report to check for new shares
                const oldReport = await reportsService.getById(id);
                const oldTeams = oldReport.shared_with_teams || [];

                await reportsService.update(id, reportData);

                // Notify only newly added teams
                const newTeams = sharedTeams.filter(tid => !oldTeams.includes(tid));
                if (newTeams.length > 0) {
                    for (const teamId of newTeams) {
                        await notificationsService.notifyTeamOfSharedReport(
                            teamId,
                            id,
                            title,
                            user?.username || 'Un officier'
                        );
                    }
                }
            }
            navigate('/reports');
        } catch (error) {
            console.error("Failed to save report:", error);
        }
    };

    const handlePrint = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const fileName = `${year}_${month}_${day}_rapport_${sanitizedTitle}`;

        const originalTitle = document.title;
        document.title = fileName;
        window.print();
        document.title = originalTitle;
    };

    const handleExportJSON = () => {
        const fullReportData = {
            ...reportData,
            template_schema: templateSchema,
            template_data: templateData,
            author_details: user,
            suspect_details: suspect
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullReportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `report_${id || 'new'}_${title.toLowerCase().replace(/\s+/g, '_')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    if (loading) {
        return <div className="p-8 text-center">Chargement du rapport...</div>;
    }

    const canEdit = isNew
        ? user?.permissions.includes('reports.create')
        : (user?.permissions.includes('reports.edit') || (user?.id === authorId && status !== 'Validé'));

    const canValidate = user?.permissions.includes('reports.validate');

    // Construct report object for PDF
    const reportData = {
        id: id || 'NEW',
        title,
        classification,
        content,
        status,
        created_at: createdAt,
        author_id: authorId || user?.id || '',
        updated_at: new Date().toISOString(),
        suspect_id: suspectId || undefined
    };

    return (
        <>
            <div className="print-only hidden print:block">
                {selectedTemplate ? (
                    <DynamicReportPDF
                        report={reportData}
                        template={selectedTemplate}
                        templateData={templateData}
                        author={user}
                        redactedFields={redactedFields}
                    />
                ) : (
                    <ReportPDF
                        report={reportData}
                        author={user}
                        suspect={suspect}
                        redactedFields={redactedFields}
                    />
                )}
            </div>
            <div className="space-y-6 max-w-4xl mx-auto print:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isNew ? 'New Report' : `Report ${title}`}
                        </h1>
                        {!isNew && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${status === 'Validé' ? 'bg-green-100 text-green-800 border-green-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-200'
                                }`}>
                                {status}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isNew && (
                            <>
                                <Button variant="outline" onClick={() => setRedactionDialogOpen(true)}>
                                    <Shield className="mr-2 h-4 w-4" /> Gerer les classifications
                                </Button>
                                <Button variant="outline" onClick={handlePrint}>
                                    <FileDown className="mr-2 h-4 w-4" /> Exporter en PDF
                                </Button>
                                <Button variant="outline" onClick={handleExportJSON}>
                                    <FileJson className="mr-2 h-4 w-4" /> Exporter en JSON
                                </Button>
                            </>
                        )}
                        <Button onClick={handleSave} disabled={!canEdit}>
                            <Save className="mr-2 h-4 w-4" /> Enregistrer le rapport
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre du rapport</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Entrez le titre du rapport"
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Contenu</Label>
                            <ReportEditor content={content} onChange={setContent} readOnly={!canEdit} />
                        </div>

                        {/* Dynamic Template Fields */}
                        {selectedTemplateId && templateSchema.length > 0 && (
                            <div className="p-6 border rounded-lg bg-muted/30 space-y-6">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Settings2 className="h-5 w-5" /> Informations Complémentaires
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    {templateSchema.map(field => (
                                        <div key={field.id} className={field.type === 'textarea' ? 'col-span-2 space-y-2' : 'space-y-2'}>
                                            <Label className="flex items-center gap-1">
                                                {field.label}
                                                {field.required && <span className="text-destructive">*</span>}
                                            </Label>
                                            {field.type === 'text' && (
                                                <Input
                                                    value={templateData[field.id] || ""}
                                                    onChange={(e) => setTemplateData({ ...templateData, [field.id]: e.target.value })}
                                                    required={field.required}
                                                    disabled={!canEdit}
                                                />
                                            )}
                                            {field.type === 'number' && (
                                                <Input
                                                    type="number"
                                                    value={templateData[field.id] || ""}
                                                    onChange={(e) => setTemplateData({ ...templateData, [field.id]: e.target.value })}
                                                    required={field.required}
                                                    disabled={!canEdit}
                                                />
                                            )}
                                            {field.type === 'date' && (
                                                <Input
                                                    type="date"
                                                    value={templateData[field.id] || ""}
                                                    onChange={(e) => setTemplateData({ ...templateData, [field.id]: e.target.value })}
                                                    required={field.required}
                                                    disabled={!canEdit}
                                                />
                                            )}
                                            {field.type === 'textarea' && (
                                                <textarea
                                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={templateData[field.id] || ""}
                                                    onChange={(e) => setTemplateData({ ...templateData, [field.id]: e.target.value })}
                                                    required={field.required}
                                                    disabled={!canEdit}
                                                />
                                            )}
                                            {field.type === 'boolean' && (
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <Checkbox
                                                        id={field.id}
                                                        checked={templateData[field.id] || false}
                                                        onCheckedChange={(val) => setTemplateData({ ...templateData, [field.id]: !!val })}
                                                        disabled={!canEdit}
                                                    />
                                                    <label htmlFor={field.id} className="text-sm font-medium leading-none cursor-pointer">
                                                        {field.label}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Classification</Label>
                            <Select value={classification} onValueChange={setClassification} disabled={!canEdit}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select classification" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Publicly Releasable Information">Publicly Releasable Information</SelectItem>
                                    <SelectItem value="Sensitive But Unclassified ">Sensitive But Unclassified </SelectItem>
                                    <SelectItem value="Privacy Act Information">Privacy Act Information</SelectItem>
                                    <SelectItem value="Protected Critical Infrastructure Information">Protected Critical Infrastructure Information</SelectItem>
                                    <SelectItem value="Sensitive Security Information">Sensitive Security Information</SelectItem>
                                    <SelectItem value="For Official Use Only">For Official Use Only</SelectItem>
                                    <SelectItem value="Law Enforcement Sensitive">Law Enforcement Sensitive</SelectItem>
                                    <SelectItem value="Confidential">Confidential</SelectItem>
                                    <SelectItem value="Secret">Secret</SelectItem>
                                    <SelectItem value="Top Secret">Top Secret</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Higher classification restricts access to authorized personnel only.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Document Template</Label>
                            <Select value={selectedTemplateId || "none"} onValueChange={handleTemplateChange} disabled={!canEdit}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Aucun template (Libre)</SelectItem>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Utiliser un template pour structurer les données du document.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={status}
                                onValueChange={setStatus}
                                disabled={!canEdit && !canValidate}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="En cours de redaction">En cours de redaction</SelectItem>
                                    <SelectItem value="En Attente de validation">En Attente de validation</SelectItem>
                                    {(canValidate || status === 'Validé') && (
                                        <SelectItem value="Validé">Validé</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Suspect</Label>
                            {suspect ? (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <div>
                                        <p className="font-medium text-sm">{suspect.full_name}</p>
                                        <p className="text-xs text-muted-foreground">Date de naissance: {suspect.dob || 'Unknown'}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={handleRemoveSuspect} disabled={!canEdit}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="border rounded-md relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search suspect..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 border-0 focus-visible:ring-0"
                                        disabled={!canEdit}
                                    />
                                    {searchQuery.length >= 2 && (
                                        <div className="absolute top-full left-0 right-0 z-10 bg-popover text-popover-foreground shadow-md rounded-md border mt-1 max-h-60 overflow-auto">
                                            {searchResults.length === 0 && !isSearching ? (
                                                <div className="p-2 text-sm text-muted-foreground text-center">Aucun suspect trouvé.</div>
                                            ) : (
                                                <div className="p-1">
                                                    {searchResults.map(result => (
                                                        <div
                                                            key={result.id}
                                                            className="flex flex-col px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                            onClick={() => handleSelectSuspect(result.id)}
                                                        >
                                                            <span className="font-medium">{result.title}</span>
                                                            <span className="text-xs text-muted-foreground">{result.summary}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Team Sharing */}
                        {!isNew && (
                            <div className="space-y-2">
                                <Label>Partager avec les equipes</Label>
                                <TeamSelector
                                    selectedTeams={sharedTeams}
                                    onTeamsChange={setSharedTeams}
                                    userDivision={user?.permissions.includes('reports.create') ? undefined : user?.division}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Partagez ce rapport avec des equipes pour collaborer.
                                </p>
                            </div>
                        )}

                        {/* Document Versions */}
                        {!isNew && (
                            <div className="space-y-2">
                                <VersionSelector
                                    reportId={id!}
                                    onVersionSelect={(version) => {
                                        setRedactedFields(version?.redacted_fields || []);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Redaction Editor Dialog */}
            <RedactionEditor
                reportId={id || ''}
                open={redactionDialogOpen}
                onOpenChange={setRedactionDialogOpen}
                onSaved={() => {
                    // Refresh version selector
                    setRedactedFields([]);
                }}
            />
        </>
    );
}
