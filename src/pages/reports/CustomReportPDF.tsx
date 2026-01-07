import { forwardRef } from 'react';

// Define strict interfaces for the sections to ensure type safety
export interface CustomReportConfig {
    // Header & Meta
    title: string;
    subtitle?: string;
    reference?: string;
    date?: string | Date;
    logoUrl?: string; // Custom logo URL
    classification?: string; // e.g., SECRET, CONFIDENTIAL

    // Content Sections
    warningText?: string; // The legal warning text

    officers?: {
        label?: string; // "Nom", "Matricule", etc.
        value: string;
    }[];

    suspect?: {
        name?: string;
        dob?: string;
        address?: string;
        mugshotUrl?: string;
        details?: { label: string; value: string }[];
    };

    // Main content areas
    facts?: string; // HTML or text
    reportContent?: string; // HTML or text
    additionalInfo?: string; // "Information (tu vois se que je veux dire)"

    // Footer
    signature?: string;
}

interface CustomReportPDFProps {
    config: CustomReportConfig;
    preview?: boolean;
}

export const CustomReportPDF = forwardRef<HTMLDivElement, CustomReportPDFProps>(({ config, preview = false }, ref) => {

    const defaultWarningText = `
        <div style="font-weight: bold; text-decoration: underline; margin-bottom: 2px; font-size: 10px;">AVERTISSEMENT DE SÉCURITÉ</div>
        <p>Ce document est classé <strong>CONFIDENTIEL</strong> et est destiné à un usage interne uniquement. Toute divulgation non autorisée constitue une violation des protocoles de sécurité du DHS.</p>
        <p><strong>U.S. Code Title 18 § 793</strong> - Espionnage et divulgation de documents relatifs à la défense nationale.</p>
    `;

    return (
        <div
            ref={ref}
            className={`${preview ? '' : 'hidden'} print:block p-8 w-[210mm] min-h-[297mm] mx-auto font-serif text-black bg-white flex flex-col shadow-2xl print:shadow-none mb-10 print:mb-0`}
            style={{ color: '#000000', boxSizing: 'border-box' }}
        >
            {/* --- HEADER --- */}
            <div className="relative mb-6 text-center border-b-2 border-black pb-4">
                <div className="w-24 h-24 mx-auto mb-2 flex items-center justify-center">
                    <img
                        src={config.logoUrl || "/noose-seal.png"}
                        alt="Seal"
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="space-y-0.5">
                    <h1 className="text-xl font-black uppercase tracking-[0.15em]">National Office of Security Enforcement</h1>
                    <div className="text-[10px] font-bold tracking-widest text-gray-600 px-3 py-0.5 bg-gray-100 inline-block">
                        DEPARTMENT OF HOMELAND SECURITY
                    </div>
                    <h2 className="text-2xl font-bold uppercase underline decoration-1 underline-offset-4 mt-2">{config.title}</h2>
                    {config.subtitle && <h3 className="text-sm font-medium text-gray-700 uppercase">{config.subtitle}</h3>}
                </div>

                <div className="mt-4 flex justify-between items-center text-[10px] font-bold">
                    <div className="text-left w-1/3">
                        <p>REF: <span className="font-mono">{config.reference || 'PROV-V2'}</span></p>
                    </div>
                    <div className="px-3 py-1 border border-black bg-white z-10">
                        CLASSIFICATION: <span className="uppercase text-red-700">{config.classification || 'CONFIDENTIAL'}</span>
                    </div>
                    <div className="text-right w-1/3">
                        <p>DATE: {config.date ? new Date(config.date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
            </div>

            {/* --- LEGAL WARNING --- */}
            <div className="text-[9px] text-justify mb-6 leading-tight p-3 bg-gray-50 border border-gray-200 italic">
                <div dangerouslySetInnerHTML={{ __html: config.warningText || defaultWarningText }} />
            </div>

            {/* --- GRID: OFFICERS & SUSPECT --- */}
            <div className="grid grid-cols-12 gap-6 mb-6">

                {/* Left Column */}
                <div className="col-span-4 space-y-4">
                    {/* Mugshot Area */}
                    <div className="border-2 border-black p-1 bg-white">
                        <div className="aspect-[1/1] bg-gray-50 flex items-center justify-center border border-black overflow-hidden relative">
                            {config.suspect?.mugshotUrl ? (
                                <img src={config.suspect.mugshotUrl} alt="Mugshot" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center opacity-20">
                                    <div className="w-12 h-1 bg-black mx-auto mb-1"></div>
                                    <div className="text-[8px] font-bold">NO PHOTO</div>
                                </div>
                            )}
                            <div className="absolute top-0 right-0 bg-black text-white text-[7px] px-1">ID-FILE</div>
                        </div>
                        <div className="bg-black text-white text-[9px] font-bold p-1 text-center uppercase truncate">
                            {config.suspect?.name || 'NAME REDACTED'}
                        </div>
                    </div>

                    {/* Officer Box */}
                    <div className="border border-black">
                        <div className="bg-black text-white text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                            Personnel
                        </div>
                        <div className="p-2 space-y-1 min-h-[60px]">
                            {config.officers?.map((off, idx) => (
                                <div key={idx} className="flex justify-between items-end border-b border-gray-200 pb-0.5">
                                    <span className="text-[8px] font-bold text-gray-500 uppercase">{off.label || 'Duty'}:</span>
                                    <span className="text-[10px] font-bold">{off.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="col-span-8 space-y-5">
                    {/* Suspect Info */}
                    <div className="border border-black">
                        <div className="bg-gray-100 border-b border-black p-1">
                            <h3 className="font-bold text-[10px] uppercase tracking-wider pl-1">Target Intelligence</h3>
                        </div>
                        <table className="w-full text-[10px] border-collapse">
                            <tbody>
                                <tr>
                                    <td className="border-r border-b border-black p-1.5 bg-gray-50 font-bold w-1/3">NAME</td>
                                    <td className="border-b border-black p-1.5 font-medium">{config.suspect?.name || '---'}</td>
                                </tr>
                                <tr>
                                    <td className="border-r border-b border-black p-1.5 bg-gray-50 font-bold">DOB / AGE</td>
                                    <td className="border-b border-black p-1.5 font-medium">{config.suspect?.dob || '---'}</td>
                                </tr>
                                {config.suspect?.details?.map((detail, idx) => (
                                    <tr key={idx}>
                                        <td className="border-r border-b border-black p-1.5 bg-gray-50 font-bold uppercase last:border-b-0">{detail.label}</td>
                                        <td className="border-b border-black p-1.5 font-medium last:border-b-0">{detail.value || '---'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Information Box */}
                    <div className="flex-1">
                        <div className="bg-gray-100 border-x border-t border-black p-1">
                            <h3 className="font-bold text-[10px] uppercase tracking-wider pl-1">Informations Complémentaires</h3>
                        </div>
                        <div className="border border-black bg-white p-2 min-h-[80px] text-[10px] leading-relaxed relative">
                            <div dangerouslySetInnerHTML={{ __html: config.additionalInfo || '<p class="text-gray-400 italic">No entry.</p>' }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FULL WIDTH --- */}

            <div className="mb-4">
                <div className="bg-gray-800 text-white px-2 py-0.5 mb-1 flex justify-between items-center">
                    <h3 className="font-bold text-[10px] uppercase tracking-widest text-white">Détails des Faits</h3>
                    <span className="text-[8px] opacity-50 font-mono">SECTION_A / {config.reference?.split('-')[0] || 'NOOSE'}</span>
                </div>
                <div
                    className="text-[10px] text-justify leading-snug p-2 border border-black min-h-[60px] bg-gray-50/30"
                    dangerouslySetInnerHTML={{ __html: config.facts || '' }}
                />
            </div>

            <div className="mb-6 flex-1 flex flex-col">
                <div className="bg-gray-800 text-white px-2 py-0.5 mb-1 flex justify-between items-center">
                    <h3 className="font-bold text-[10px] uppercase tracking-widest text-white">Rapport / Narration de Mission</h3>
                    <span className="text-[8px] opacity-50 font-mono">SECTION_B / DHS-INTEL</span>
                </div>
                <div
                    className="text-[11px] text-justify leading-relaxed border border-black p-4 flex-1 bg-white"
                    style={{
                        backgroundImage: 'linear-gradient(transparent 95%, #f3f4f6 95%)',
                        backgroundSize: '100% 1.6rem',
                        lineHeight: '1.6rem'
                    }}
                >
                    <div dangerouslySetInnerHTML={{ __html: config.reportContent || '' }} />
                </div>
            </div>

            {/* --- FOOTER --- */}
            <div className="pt-4 border-t-2 border-black flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                        <div className="w-16 h-16 border border-gray-200 p-1 grayscale opacity-30">
                            <img src="/noose-seal.png" alt="small seal" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <span className="text-[8px] font-black uppercase tracking-tight">Bureau of Intelligence</span>
                            <span className="text-[7px] text-gray-500 italic max-w-[180px]">
                                Property of the United States Government. Unauthorized
                                possession is a violation of federal law.
                            </span>
                            <span className="text-[6px] font-mono mt-1">UUID: {Math.random().toString(36).substr(2, 12).toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="relative border-b border-black w-48 h-8 flex items-center justify-center">
                            <span className="text-lg font-serif italic text-gray-300 pointer-events-none select-none">
                                {config.signature}
                            </span>
                            <div className="absolute -top-2 -left-2 text-[6px] border border-black px-1 font-bold bg-white">SIGN HERE</div>
                        </div>
                        <div className="text-right mt-1">
                            <p className="text-[9px] font-black uppercase">{config.signature || 'AGENT NAME'}</p>
                            <p className="text-[7px] text-gray-400 font-bold uppercase tracking-tighter">Verified Field Agent - NOOSE Intelligence</p>
                        </div>
                    </div>
                </div>

                <div className="bg-black text-white text-center py-0.5 text-[8px] font-bold tracking-[0.5em] uppercase">
                    Official Document - DO NOT DUPLICATE - END OF REPORT
                </div>
            </div>
        </div>
    );
});

CustomReportPDF.displayName = "CustomReportPDF";
