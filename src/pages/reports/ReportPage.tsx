import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportEditor } from '@/components/editor/ReportEditor';
import { Save, ArrowLeft, FileDown, Search, X, Shield } from 'lucide-react';
import { reportsService } from '@/features/reports/reportsService';
import { searchService, type SearchResult } from '@/features/search/searchService';
import { civiliansService, type Civilian } from '@/features/civilians/civiliansService';
import { useAuthStore } from '@/features/auth/AuthStore';
import { ReportPDF } from './ReportPDF';
import { TeamSelector } from '@/components/teams/TeamSelector';
import { RedactionEditor } from '@/components/redaction/RedactionEditor';
import { VersionSelector } from '@/components/redaction/VersionSelector';
import { type ReportVersion } from '@/features/redaction/redactionService';

export function ReportPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isNew = !id || id === 'new';

    const [title, setTitle] = useState('');
    const [classification, setClassification] = useState('Unclassified');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('Draft');
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
    const [selectedVersion, setSelectedVersion] = useState<ReportVersion | null>(null);
    const [redactedFields, setRedactedFields] = useState<string[]>([]);

    useEffect(() => {
        if (!isNew && id) {
            async function fetchReport() {
                try {
                    const data = await reportsService.getById(id!);
                    setTitle(data.title);
                    setClassification(data.classification);
                    setContent(data.content);
                    setStatus(data.status);
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
                suspect_id: suspectId || undefined
            };

            if (isNew) {
                await reportsService.create(reportData);
            } else if (id) {
                await reportsService.update(id, reportData);
                // Update shared teams if changed
                if (sharedTeams.length > 0 || sharedTeams.length !== (await reportsService.getById(id)).shared_with_teams?.length) {
                    await reportsService.shareWithTeams(id, sharedTeams);
                }
            }
            navigate('/reports');
        } catch (error) {
            console.error("Failed to save report:", error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="p-8 text-center">Loading report...</div>;
    }

    // Construct report object for PDF
    const reportData = {
        id: id || 'NEW',
        title,
        classification,
        content,
        status,
        created_at: createdAt,
        author_id: user?.id || '',
        updated_at: new Date().toISOString(),
        suspect_id: suspectId || undefined
    };

    return (
        <>
            <div className="print-only hidden print:block">
                <ReportPDF
                    report={reportData}
                    author={user}
                    suspect={suspect}
                    redactedFields={redactedFields}
                />
            </div>
            <div className="space-y-6 max-w-4xl mx-auto print:hidden">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isNew ? 'New Report' : `Report ${id}`}
                        </h1>
                        {!isNew && (
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${status === 'Validated' ? 'bg-green-100 text-green-800 border-green-200' :
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
                                    <Shield className="mr-2 h-4 w-4" /> Manage Redactions
                                </Button>
                                <Button variant="outline" onClick={handlePrint}>
                                    <FileDown className="mr-2 h-4 w-4" /> Export PDF
                                </Button>
                            </>
                        )}
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" /> Save Report
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Report Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter report title"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content</Label>
                            <ReportEditor content={content} onChange={setContent} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Classification</Label>
                            <Select value={classification} onValueChange={setClassification}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select classification" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Unclassified">Unclassified</SelectItem>
                                    <SelectItem value="Restricted">Restricted</SelectItem>
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
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Validated">Validated</SelectItem>
                                    <SelectItem value="Archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Suspect</Label>
                            {suspect ? (
                                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <div>
                                        <p className="font-medium text-sm">{suspect.full_name}</p>
                                        <p className="text-xs text-muted-foreground">DOB: {suspect.dob || 'Unknown'}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={handleRemoveSuspect}>
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
                                    />
                                    {searchQuery.length >= 2 && (
                                        <div className="absolute top-full left-0 right-0 z-10 bg-popover text-popover-foreground shadow-md rounded-md border mt-1 max-h-60 overflow-auto">
                                            {searchResults.length === 0 && !isSearching ? (
                                                <div className="p-2 text-sm text-muted-foreground text-center">No civilians found.</div>
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
                                <Label>Share with Teams</Label>
                                <TeamSelector
                                    selectedTeams={sharedTeams}
                                    onTeamsChange={setSharedTeams}
                                    userDivision={user?.division}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Share this report with specific teams for collaboration.
                                </p>
                            </div>
                        )}

                        {/* Document Versions */}
                        {!isNew && (
                            <div className="space-y-2">
                                <VersionSelector
                                    reportId={id!}
                                    onVersionSelect={(version) => {
                                        setSelectedVersion(version);
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
