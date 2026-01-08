import { forwardRef } from 'react';
import { type DocumentTemplate, type TemplateField } from '@/features/reports/templatesService';
import { type Report } from '@/features/reports/reportsService';
import { type User } from '@/features/auth/AuthStore';
import { Users, Car, Image as ImageIcon } from 'lucide-react';
import { PDFStamp, type SpecialtyKey } from '@/components/pdf/PDFStamp';

interface DynamicReportPDFProps {
    report: Partial<Report>;
    template: DocumentTemplate;
    templateData: Record<string, any>;
    author?: User | null;
    preview?: boolean;
    redactedFields?: string[];
    overrideSpecialty?: SpecialtyKey;
}

export const DynamicReportPDF = forwardRef<HTMLDivElement, DynamicReportPDFProps>(({ report, template, templateData, author, preview = false, redactedFields = [], overrideSpecialty }, ref) => {
    const settings = template.layout_settings || {
        layout_type: 'report',
        show_logo: true
    };

    const isRedacted = (id: string | undefined) => id ? redactedFields.includes(id) : false;

    const renderValue = (field: TemplateField) => {
        if (isRedacted(field.id)) return '[REDACTED]';

        const val = templateData[field.id];
        if (field.type === 'boolean') return val ? 'OUI' : 'NON';
        if (field.type === 'date' && val) return new Date(val).toLocaleDateString('fr-FR');
        return val || 'N/A';
    };

    const color = settings.theme_color || '#1e3a8a';

    const getValueByLabel = (label: string) => {
        const field = template.schema.find(f => f.label.toLowerCase() === label.toLowerCase());
        if (field) return renderValue(field);
        return templateData[label] || '---';
    };

    // --- Standard Report Layout (A4) ---
    const renderStandardReport = () => (
        <div className="p-10 font-serif bg-white text-black min-h-[297mm]">
            <div className="text-center pb-6 mb-8 border-b-2" style={{ borderColor: color }}>
                {settings.show_logo && (
                    <img src="/noose-seal.png" alt="Sceau" className="w-24 h-24 mx-auto mb-4" />
                )}
                <h1 className="text-2xl font-black uppercase tracking-widest" style={{ color: color }}>{settings.header_title || template.name}</h1>
                {settings.header_subtitle && <p className="text-sm font-bold mt-1 opacity-80">{settings.header_subtitle}</p>}

                <div className="mt-4 flex justify-between text-[10px] font-black uppercase opacity-60">
                    <span>Réf: {report.id?.slice(0, 8) || 'DRAFT'}</span>
                    <span>Date d'édition: {new Date().toLocaleDateString('fr-FR')}</span>
                    <span>Sécurité level {template.min_clearance}</span>
                </div>
            </div>

            {settings.static_content && (
                <div className="mb-8 p-4 bg-gray-50 border-l-4 text-xs italic leading-relaxed text-gray-700" style={{ borderLeftColor: color }}>
                    {settings.static_content}
                </div>
            )}

            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-2">
                    {template.schema.map((field) => (
                        <div key={field.id} className="border flex bg-white" style={{ borderColor: '#e5e7eb' }}>
                            <div className="w-48 p-2 font-black text-[10px] border-r uppercase flex items-center bg-gray-50/50" style={{ color: color, borderColor: '#e5e7eb' }}>
                                {field.label}
                            </div>
                            <div className="p-2 flex-1 text-sm whitespace-pre-wrap font-medium">
                                {renderValue(field)}
                            </div>
                        </div>
                    ))}
                </div>

                {report.content && (
                    <div className="mt-8">
                        <h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Déroulement / Observations</h3>
                        <div className="text-sm leading-relaxed text-justify whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: report.content }}></div>
                    </div>
                )}
            </div>

            <div className="mt-20 pt-8 border-t border-gray-300">
                <div className="flex justify-between items-end">
                    <div className="text-xs space-y-1 italic text-gray-600">
                        {settings.footer_text ? (
                            <p>{settings.footer_text}</p>
                        ) : (
                            <p>Ce document est une pièce officielle du NOOSE. Toute altération est passible de poursuites.</p>
                        )}
                        <p>Imprimé le {new Date().toLocaleString('fr-FR')}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black uppercase tracking-tight">Official Bureau Document</span>
                        <span className="text-[7px] text-gray-500 italic max-w-[150px] text-center">
                            Property of the United States Government.
                        </span>

                        <div className="mt-4 scale-75 origin-bottom-right">
                            <PDFStamp
                                author={author as any}
                                specialty={overrideSpecialty || (author as any)?.division?.toLowerCase() as SpecialtyKey}
                                date={new Date(report.created_at || new Date()).toLocaleDateString('fr-FR')}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Toolbox V2: Block-based Layout ---
    const renderCustomBlocks = () => {
        const blocks = settings.blocks || [];
        return (
            <div className="p-8 w-[210mm] min-h-[297mm] mx-auto font-serif text-black bg-white flex flex-col shadow-lg border">
                {blocks.map((block) => {
                    switch (block.type) {
                        case 'classification':
                            const colors: Record<string, string> = {
                                'TOP SECRET': 'bg-red-700',
                                'RESTRICTED': 'bg-orange-600',
                                'CONFIDENTIAL': 'bg-yellow-500',
                                'UNCLASSIFIED': 'bg-green-600'
                            };
                            return (
                                <div key={block.id} className="mb-6">
                                    <div className={`w-full py-1 text-center text-white text-[12px] font-black tracking-[0.5em] uppercase ${colors[block.config.level] || 'bg-black'}`}>
                                        --- {block.config.level || 'CONFIDENTIAL'} ---
                                    </div>
                                </div>
                            );
                        case 'header':
                            return (
                                <div key={block.id} className="relative mb-6 text-center border-b-2 border-black pb-4">
                                    <div className="w-24 h-24 mx-auto mb-2 flex items-center justify-center">
                                        <img src="/noose-seal.png" alt="Seal" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h1 className="text-xl font-black uppercase tracking-[0.15em]">National Office of Security Enforcement</h1>
                                        <div className="text-[10px] font-bold tracking-widest text-gray-600 px-3 py-0.5 bg-gray-100 inline-block">
                                            DEPARTMENT OF HOMELAND SECURITY
                                        </div>
                                        <h2 className="text-2xl font-bold uppercase underline decoration-1 underline-offset-4 mt-2">{settings.header_title || template.name}</h2>
                                    </div>
                                    <div className="mt-4 flex justify-between items-center text-[10px] font-bold">
                                        <p>REF: <span className="font-mono">{report.id?.slice(0, 8).toUpperCase() || 'DRAFT'}</span></p>
                                        <p>DATE: {new Date().toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            );
                        case 'warning':
                            return (
                                <div key={block.id} className="mb-6 p-4 border-l-4 border-red-800 bg-red-50/30">
                                    <p className="text-[9px] leading-tight text-justify uppercase font-bold italic text-red-950">
                                        {block.config.text || "Ce document est classé CONFIDENTIEL..."}
                                    </p>
                                </div>
                            );
                        case 'personnel':
                            return (
                                <div key={block.id} className="mb-6 border border-black shadow-sm max-w-[300px]">
                                    <div className="bg-black text-white text-[9px] font-bold px-3 py-1 uppercase tracking-widest">DÉSIGNATION DE L'OFFICIER</div>
                                    <div className="p-3">
                                        <div className="flex justify-between border-b pb-1 mb-1">
                                            <span className="text-[7px] text-gray-400 font-bold uppercase">IDENTITÉ</span>
                                            <span className="text-[11px] font-black uppercase">{author?.username || "---"}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span className="text-[7px] text-gray-400 font-bold uppercase">UNITÉ / MATRICULE</span>
                                            <span className="text-[11px] font-black uppercase font-mono">{author?.matricule || "---"}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        case 'narrative':
                            return (
                                <div key={block.id} className="mb-6">
                                    <div className="bg-gray-800 text-white px-2 py-0.5 mb-1">
                                        <h3 className="font-bold text-[10px] uppercase tracking-widest">{block.config.title || 'Déroulement'}</h3>
                                    </div>
                                    <div className="text-[11px] text-justify p-4 border border-black bg-white">
                                        <div dangerouslySetInnerHTML={{ __html: report.content || '...' }} />
                                    </div>
                                </div>
                            );
                        case 'fields':
                            return (
                                <div key={block.id} className="mb-6 border border-black p-3 bg-gray-50/30">
                                    {(block.fields || template.schema).map((f: any) => (
                                        <div key={f.id} className="flex justify-between border-b last:border-0 pb-1 mb-1">
                                            <span className="text-[8px] font-bold text-gray-500 uppercase">{f.label}:</span>
                                            <span className="text-[10px] font-bold uppercase">{getValueByLabel(f.label)}</span>
                                        </div>
                                    ))}
                                </div>
                            );
                        case 'signature':
                            return (
                                <div key={block.id} className="mt-10 flex flex-col items-end">
                                    <div className="border-b border-black w-48 text-right italic text-gray-300 mb-1">{author?.username}</div>
                                    <p className="text-[9px] font-black uppercase">{author?.username}</p>
                                    <PDFStamp
                                        author={author as any}
                                        specialty={overrideSpecialty || (author as any)?.division?.toLowerCase() as SpecialtyKey}
                                        date={new Date(report.created_at || new Date()).toLocaleDateString('fr-FR')}
                                    />
                                </div>
                            );
                        case 'spacer':
                            return <div key={block.id} style={{ height: `${block.config.height || 40}px` }} />;
                        default:
                            return null;
                    }
                })}
            </div>
        );
    };

    // --- Arrest Warrant Layout ---
    const renderArrestWarrant = () => (
        <div className="p-10 font-serif bg-white text-black min-h-[297mm] border-[12px] border-double m-2" style={{ borderColor: color }}>
            <div className="p-10 border-4 m-1 flex flex-col min-h-full" style={{ borderColor: color }}>
                <div className="text-center text-white py-6 mb-8" style={{ backgroundColor: color }}>
                    <h1 className="text-4xl font-black">{settings.header_title || "MANDAT D'ARRÊT"}</h1>
                </div>
                <div className="flex-1">
                    <p className="font-black uppercase underline mb-8">{settings.static_content || "ORDRE D'INTERPELLATION IMMÉDIATE"}</p>
                    <div className="grid grid-cols-1 border-4" style={{ borderColor: color }}>
                        {template.schema.map((field) => (
                            <div key={field.id} className="flex border-b last:border-0" style={{ borderColor: color }}>
                                <div className="w-56 p-4 font-black text-sm border-r-4 uppercase" style={{ backgroundColor: `${color}10`, color: color, borderColor: color }}>
                                    {field.label}
                                </div>
                                <div className="p-4 flex-1 text-2xl font-black uppercase italic">
                                    {renderValue(field)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-auto pt-16 text-right">
                    <p className="text-3xl font-serif italic" style={{ color: color }}>{author?.username}</p>
                </div>
            </div>
        </div>
    );

    const renderLayout = () => {
        if (settings.layout_type === 'custom_v2' || (settings.blocks && settings.blocks.length > 0)) {
            return renderCustomBlocks();
        }
        switch (settings.layout_type) {
            case 'arrest_warrant': return renderArrestWarrant();
            default: return renderStandardReport();
        }
    };

    return (
        <div ref={ref} className={`${preview ? '' : 'hidden print:block'} w-full overflow-auto bg-gray-200/50 p-2`}>
            {renderLayout()}
        </div>
    );
});

DynamicReportPDF.displayName = "DynamicReportPDF";
