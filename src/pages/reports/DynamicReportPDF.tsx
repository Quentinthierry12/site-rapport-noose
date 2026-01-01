import { forwardRef } from 'react';
import { type DocumentTemplate, type TemplateField } from '@/features/reports/templatesService';
import { type Report } from '@/features/reports/reportsService';
import { type User } from '@/features/auth/AuthStore';
import { Users } from 'lucide-react';

interface DynamicReportPDFProps {
    report: Partial<Report>;
    template: DocumentTemplate;
    templateData: Record<string, any>;
    author?: User | null;
    preview?: boolean;
    redactedFields?: string[];
}

export const DynamicReportPDF = forwardRef<HTMLDivElement, DynamicReportPDFProps>(({ report, template, templateData, author, preview = false, redactedFields = [] }, ref) => {
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

    const renderLayout = () => {
        switch (settings.layout_type) {
            case 'arrest_warrant':
                return renderArrestWarrant();
            case 'card':
                return renderCardLayout();
            case 'badge':
                return renderBadgeLayout();
            default:
                return renderStandardReport();
        }
    };

    const color = settings.theme_color || '#1e3a8a';

    // --- Standard Report Layout (A4) ---
    const renderStandardReport = () => (
        <div className="p-10 font-serif bg-white text-black min-h-[297mm]">
            {/* Header */}
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

            {/* Static Content / Instructions */}
            {settings.static_content && (
                <div className="mb-8 p-4 bg-gray-50 border-l-4 text-xs italic leading-relaxed text-gray-700" style={{ borderLeftColor: color }}>
                    {settings.static_content}
                </div>
            )}

            {/* Content Table */}
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

                {/* Report Content If Exists */}
                {report.content && (
                    <div className="mt-8">
                        <h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Déroulement / Observations</h3>
                        <div className="text-sm leading-relaxed text-justify whitespace-pre-wrap">
                            {report.content}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
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
                    <div className="text-right border-t border-black w-48 pt-2">
                        <p className="text-[10px] uppercase font-bold">Signature de l'Officier</p>
                        <p className="mt-2 font-serif text-lg italic">{author?.username || 'Officer Signature'}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Arrest Warrant Layout ---
    const renderArrestWarrant = () => (
        <div className="p-0 font-serif bg-white text-black min-h-[297mm] border-[12px] border-double m-2" style={{ borderColor: color }}>
            <div className="p-10 border-4 m-1 h-full min-h-[calc(297mm-36px)] flex flex-col" style={{ borderColor: color }}>
                <div className="text-center text-white py-6 mb-8 shadow-inner" style={{ backgroundColor: color }}>
                    <h1 className="text-4xl font-black tracking-tighter uppercase">{settings.header_title || "MANDAT D'ARRÊT"}</h1>
                    <p className="tracking-[0.5em] text-sm font-bold mt-1 opacity-80">OFFICIAL JUDICIAL ORDER</p>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none -z-10">
                    {settings.show_logo && (
                        <img src="/noose-seal.png" alt="Sceau" className="w-[120mm] h-[120mm]" />
                    )}
                </div>

                <div className="space-y-10 relative flex-1">
                    <p className="text-justify font-black uppercase underline text-sm mb-8 leading-relaxed">
                        {settings.static_content || "ORDRE EST DONNÉ PAR LA PRÉSENTE À TOUT AGENT DE LA PAIX DE PROCÉDER À L'INTERPELLATION IMMÉDIATE DE L'INDIVIDU DÉCRIT CI-DESSOUS."}
                    </p>

                    <div className="grid grid-cols-1 border-4" style={{ borderColor: color }}>
                        {template.schema.map((field) => (
                            <div key={field.id} className="flex border-b last:border-0" style={{ borderColor: color }}>
                                <div className="w-56 p-4 font-black text-sm border-r-4 uppercase" style={{ backgroundColor: `${color}10`, color: color, borderColor: color }}>
                                    {field.label}
                                </div>
                                <div className="p-4 flex-1 text-2xl font-black uppercase bg-white italic tracking-tighter">
                                    {renderValue(field)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 border-2 p-4 bg-gray-50 italic text-[10px] text-center uppercase font-bold opacity-70" style={{ borderColor: color }}>
                        <p>Ce mandat est valide sur tout le territoire national jusqu'à son exécution ou annulation par un juge compétent.</p>
                    </div>
                </div>

                <div className="mt-auto pt-16 flex justify-between items-center px-10">
                    <div className="w-48 h-1 bg-black/20"></div>
                    <div className="text-center italic opacity-30">
                        <p className="text-2xl font-serif">Sceau de l'État</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold uppercase text-[10px] opacity-60 mb-2">Signé électroniquement par :</p>
                        <p className="text-3xl font-serif italic" style={{ color: color }}>{author?.username || 'Directeur du NOOSE'}</p>
                        <p className="text-[8px] font-mono opacity-40">{report.id?.toUpperCase()}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Card layout (Compact) ---
    const renderCardLayout = () => (
        <div className="p-8 font-sans bg-gray-50 text-black min-h-[297mm]">
            <div className="bg-white border-2 rounded-2xl shadow-xl overflow-hidden max-w-2xl mx-auto border-gray-100">
                <div className="text-white p-6 flex justify-between items-center shadow-lg" style={{ backgroundColor: color }}>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight leading-none">{settings.header_title || template.name}</h1>
                        <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-1">{settings.header_subtitle || "OFFICIAL NOOSE RECORD"}</p>
                    </div>
                    {settings.show_logo && <img src="/noose-seal.png" alt="Sceau" className="w-14 h-14 invert brightness-200 opacity-90" />}
                </div>

                {settings.static_content && (
                    <div className="p-4 bg-gray-50 text-[10px] border-b text-gray-600 font-medium">
                        {settings.static_content}
                    </div>
                )}

                <div className="p-8 grid grid-cols-2 gap-x-8 gap-y-6">
                    {template.schema.map((field) => (
                        <div key={field.id} className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40" style={{ color: color }}>{field.label}</p>
                            <p className="text-lg font-bold border-b border-gray-100 pb-1 text-gray-900">{renderValue(field)}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-gray-50 p-4 border-t flex justify-between items-center px-8">
                    <div className="text-[9px] font-bold text-gray-400">ID: {report.id?.slice(0, 16).toUpperCase()}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        {settings.footer_text || "National Office for Security Enforcement - System Entry"}
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Badge Layout (ID Card) ---
    const renderBadgeLayout = () => (
        <div className="p-4 font-sans flex flex-wrap gap-10 justify-center">
            {/* Front of the badge */}
            <div className="w-[85.6mm] h-[54mm] bg-white border border-gray-300 rounded-[3mm] relative overflow-hidden shadow-2xl flex flex-col">
                <div className="text-white p-3 flex items-center gap-3 shadow-md" style={{ backgroundColor: color }}>
                    {settings.show_logo && <img src="/noose-seal.png" alt="Sceau" className="w-10 h-10 invert brightness-200" />}
                    <div className="flex-1">
                        <h1 className="text-xs font-black leading-none uppercase tracking-tighter">{settings.header_title || "CARTE D'IDENTITÉ"}</h1>
                        <p className="text-[6px] text-white/70 font-black uppercase tracking-widest mt-0.5">{settings.header_subtitle || "SECURE ACCESS DIVISION"}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-[8px] font-black">N</div>
                </div>

                <div className="flex-1 p-3 flex gap-4 bg-gradient-to-br from-white to-gray-50">
                    <div className="w-[22mm] h-[28mm] bg-gray-200 rounded-sm border-2 border-gray-100 shadow-inner flex flex-col items-center justify-center text-[7px] text-gray-400 font-black">
                        <Users className="w-8 h-8 opacity-20 mb-1" />
                        NO PHOTO
                    </div>
                    <div className="flex-1 space-y-2 py-1">
                        {template.schema.slice(0, 4).map((field) => (
                            <div key={field.id} className="border-b border-gray-100">
                                <p className="text-[6px] font-black uppercase opacity-40 leading-none" style={{ color: color }}>{field.label}</p>
                                <p className="text-[10px] font-black leading-tight truncate text-gray-800">{renderValue(field)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-[10mm] bg-white p-2 flex justify-between items-end border-t border-gray-100">
                    <div className="space-y-0.5">
                        <p className="text-[5px] font-bold text-gray-400 uppercase leading-none">Delivered by</p>
                        <p className="text-[10px] font-serif italic text-gray-900 leading-none">{author?.username?.split(' ').pop() || "Director"}</p>
                    </div>
                    <div className="text-[9px] font-mono font-black tracking-widest bg-gray-900 text-white px-2 py-0.5 rounded-sm">
                        {report.id?.slice(0, 8).toUpperCase() || 'NO-ID-000'}
                    </div>
                </div>
            </div>

            {/* Back of the badge */}
            <div className="w-[85.6mm] h-[54mm] bg-white border border-gray-300 rounded-[3mm] relative overflow-hidden shadow-lg p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[6px] font-bold uppercase mb-4 px-2 italic text-gray-600">
                    Cette carte est la propriété du gouvernement. En cas de découverte, veuillez la retourner au bureau du NOOSE le plus proche.
                </p>
                <div className="w-24 h-24 bg-gray-800 flex items-center justify-center">
                    <div className="bg-white w-20 h-20 p-1">
                        {/* Placeholder for QR Code */}
                        <div className="w-full h-full border-2 border-black flex items-center justify-center text-[10px] font-black">
                            QR CODE
                        </div>
                    </div>
                </div>
                <p className="text-[10px] font-black mt-2">DHS-SECURE-ACCESS</p>
            </div>
        </div>
    );

    return (
        <div ref={ref} className={`${preview ? '' : 'hidden print:block'} w-full overflow-auto bg-gray-200/50 p-2`}>
            {renderLayout()}
        </div>
    );
});

DynamicReportPDF.displayName = "DynamicReportPDF";
