import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Link as LinkIcon, Trash2, FileText, Users, Car, Shield, User } from "lucide-react";
import { investigationsService, type InvestigationLink } from "@/features/investigations/investigationsService";
import { searchService, type SearchResult } from "@/features/search/searchService";
import { useAuthStore } from "@/features/auth/AuthStore";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export function InvestigationPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const isNew = !id || id === 'new';

    const [title, setTitle] = useState("");
    const [caseNumber, setCaseNumber] = useState("");
    const [description, setDescription] = useState("");
    const [classification, setClassification] = useState("Restricted");
    const [status, setStatus] = useState("Open");
    const [loading, setLoading] = useState(!isNew);
    const [links, setLinks] = useState<InvestigationLink[]>([]);

    // Link Dialog State
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkType, setLinkType] = useState("report");
    const [linkId, setLinkId] = useState("");
    const [linkTitle, setLinkTitle] = useState("");
    const [linkNotes, setLinkNotes] = useState("");

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

    useEffect(() => {
        if (!isNew && id) {
            async function fetchInvestigation() {
                try {
                    const data = await investigationsService.getById(id!);
                    setTitle(data.title);
                    setCaseNumber(data.case_number);
                    setDescription(data.description || "");
                    setClassification(data.classification);
                    setStatus(data.status);

                    const linksData = await investigationsService.getLinks(id!);
                    setLinks(linksData);
                } catch (error) {
                    console.error("Failed to fetch investigation:", error);
                } finally {
                    setLoading(false);
                }
            }
            fetchInvestigation();
        } else if (isNew) {
            setCaseNumber(`CASE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
        }
    }, [id, isNew]);

    // Search Effect
    useEffect(() => {
        const search = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            try {
                const data = await searchService.search(searchQuery, linkType);
                setSearchResults(data);
            } catch (error) {
                console.error(error);
            }
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, linkType]);

    const handleSave = async () => {
        try {
            const investigationData = {
                title,
                case_number: caseNumber,
                description,
                classification,
                status,
                lead_agent_id: user?.id
            };

            if (isNew) {
                await investigationsService.create(investigationData);
            } else {
                await investigationsService.update(id!, investigationData);
            }

            navigate('/investigations');
        } catch (error) {
            console.error("Failed to save investigation:", error);
        }
    };

    const handleAddLink = async () => {
        if (!id || isNew) {
            alert("Please save the investigation first.");
            return;
        }
        if (!linkId || !linkTitle) {
            alert("Please select an item to link.");
            return;
        }
        try {
            await investigationsService.addLink(id, linkType, linkId, linkTitle, linkNotes);
            const updatedLinks = await investigationsService.getLinks(id);
            setLinks(updatedLinks);
            setLinkDialogOpen(false);
            setLinkId("");
            setLinkTitle("");
            setLinkNotes("");
            setSearchQuery("");
        } catch (error) {
            console.error("Failed to add link:", error);
            alert("Failed to add link.");
        }
    };

    const handleRemoveLink = async (linkId: string) => {
        try {
            await investigationsService.removeLink(linkId);
            setLinks(links.filter(l => l.id !== linkId));
        } catch (error) {
            console.error("Failed to remove link:", error);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'report': return <FileText className="h-4 w-4" />;
            case 'arrest': return <Users className="h-4 w-4" />;
            case 'civilian': return <User className="h-4 w-4" />;
            case 'vehicle': return <Car className="h-4 w-4" />;
            case 'weapon': return <Shield className="h-4 w-4" />;
            default: return <LinkIcon className="h-4 w-4" />;
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading case file...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/investigations')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isNew ? 'New Investigation' : `Case ${caseNumber}`}
                    </h1>
                </div>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Save Case
                </Button>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">Case Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Operation Name or Case Title"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description / Overview</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief summary of the investigation..."
                            className="h-32"
                        />
                    </div>

                    {!isNew && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg">Evidence & Links</CardTitle>
                                <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                            <Plus className="h-4 w-4 mr-2" /> Add Link
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Link Evidence</DialogTitle>
                                            <DialogDescription>
                                                Search and link evidence items to this investigation.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Select value={linkType} onValueChange={(val) => {
                                                    setLinkType(val);
                                                    setSearchQuery("");
                                                    setSearchResults([]);
                                                }}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="report">Report</SelectItem>
                                                        <SelectItem value="arrest">Arrest</SelectItem>
                                                        <SelectItem value="civilian">Civilian</SelectItem>
                                                        <SelectItem value="vehicle">Vehicle</SelectItem>
                                                        <SelectItem value="weapon">Weapon</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Search Item</Label>
                                                <div className="border rounded-md">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder={`Search ${linkType}s...`}
                                                            value={searchQuery}
                                                            onValueChange={setSearchQuery}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>No results found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {searchResults.map((result) => (
                                                                    <CommandItem
                                                                        key={result.id}
                                                                        onSelect={() => {
                                                                            setLinkId(result.id);
                                                                            setLinkTitle(result.title);
                                                                            setSearchQuery(result.title);
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col">
                                                                            <span>{result.title}</span>
                                                                            <span className="text-xs text-muted-foreground">{result.summary}</span>
                                                                        </div>
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </div>
                                                {linkTitle && (
                                                    <p className="text-xs text-green-500">Selected: {linkTitle}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Notes</Label>
                                                <Input
                                                    value={linkNotes}
                                                    onChange={(e) => setLinkNotes(e.target.value)}
                                                    placeholder="Relevance to case..."
                                                />
                                            </div>
                                            <Button onClick={handleAddLink} className="w-full" disabled={!linkId}>
                                                Add Link
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {links.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">No linked evidence.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {links.map(link => (
                                            <div key={link.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-background rounded-full border">
                                                        {getIconForType(link.linked_item_type)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm capitalize">{link.linked_item_type}</p>
                                                        <p className="text-sm font-semibold">{link.linked_item_title || link.linked_item_id}</p>
                                                        {link.notes && <p className="text-xs text-muted-foreground mt-1">"{link.notes}"</p>}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveLink(link.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="caseNumber">Case Number</Label>
                        <Input
                            id="caseNumber"
                            value={caseNumber}
                            onChange={(e) => setCaseNumber(e.target.value)}
                            placeholder="CASE-YYYY-XXX"
                            disabled={!isNew}
                        />
                    </div>

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
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                                <SelectItem value="Archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
