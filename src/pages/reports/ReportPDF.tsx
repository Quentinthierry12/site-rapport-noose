import { forwardRef } from 'react';
import { type Report } from '@/features/reports/reportsService';
import { type User } from '@/features/auth/AuthStore';
import { type Civilian } from '@/features/civilians/civiliansService';

interface ReportPDFProps {
    report: Report;
    author?: User | null;
    suspect?: Civilian | null;
    redactedFields?: string[]; // Fields to redact
}

export const ReportPDF = forwardRef<HTMLDivElement, ReportPDFProps>(({ report, author, suspect, redactedFields = [] }, ref) => {
    // Helper function to check if a field should be redacted
    const isRedacted = (fieldName: string) => redactedFields.includes(fieldName);

    // Helper function to get value or [REDACTED]
    const getValue = (value: any, fieldName: string) => {
        if (isRedacted(fieldName)) {
            return '[REDACTED]';
        }
        return value || '';
    };

    return (
        <div ref={ref} className="hidden print:block p-8 max-w-[210mm] mx-auto bg-white text-black font-serif">
            {/* Header */}
            <div className="text-center mb-8 border-b-2 border-black pb-4">
                <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                    <img src="/noose-seal.png" alt="NOOSE Seal" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">National Office of Security Enforcement</h1>
                <h2 className="text-xl font-bold uppercase underline mb-4">RAPPORT OFFICIEL</h2>

                <div className="text-sm font-bold space-y-1">
                    <p>Classification : <span className="uppercase">{report.classification}</span></p>
                    <p>Date de création : {new Date(report.created_at).toLocaleDateString()}</p>
                    <p>Référence : US-GOV/US-NOOSE/{report.id.slice(0, 8).toUpperCase()}</p>
                </div>
            </div>

            {/* Warning Text */}
            <div className="text-[10px] text-justify mb-8 leading-tight space-y-2">
                <p>
                    Ce document est classé <strong>CONFIDENTIEL</strong> et est destiné à un usage interne uniquement. Toute divulgation non autorisée, reproduction ou distribution de ce document est strictement interdite et constitue une violation des protocoles de sécurité du DHS.
                </p>
                <p><strong>U.S. Code Title 18 § 793</strong> - Espionnage et divulgation de documents relatifs à la défense nationale.</p>
                <p><strong>U.S. Code Title 18 § 1905</strong> - Divulgation de renseignements confidentiels.</p>
                <p><strong>DHS Directive 100-01</strong> - Security and Emergency Preparedness.</p>
            </div>

            {/* Object */}
            <div className="mb-6 border border-black flex">
                <div className="w-32 border-r border-black p-2 font-bold bg-gray-100">OBJET</div>
                <div className="p-2 flex-1 font-bold uppercase">{report.title}</div>
            </div>

            {/* Officer Info Table */}
            <div className="mb-6">
                <h3 className="font-bold uppercase mb-2 border-b border-black inline-block">INFORMATIONS OFFICIERS</h3>
                <table className="w-full border-collapse border border-black text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 w-1/3 font-bold bg-gray-100">Nom</td>
                            <td className="border border-black p-2">{author?.username?.split(' ').pop() || 'UNKNOWN'}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-gray-100">Prénom</td>
                            <td className="border border-black p-2">{author?.username?.split(' ')[0] || 'UNKNOWN'}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-gray-100">Matricule</td>
                            <td className="border border-black p-2">{author?.id.slice(0, 6).toUpperCase() || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Suspect Info Table */}
            <div className="mb-6">
                <h3 className="font-bold uppercase mb-2 border-b border-black inline-block">INFORMATIONS SUSPECT</h3>
                <table className="w-full border-collapse border border-black text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-black p-2 w-1/3 font-bold bg-gray-100">Nom</td>
                            <td className="border border-black p-2">
                                {getValue(suspect?.full_name?.split(' ').pop(), 'suspect_name')}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-gray-100">Prénom</td>
                            <td className="border border-black p-2">
                                {getValue(suspect?.full_name?.split(' ')[0], 'suspect_name')}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-gray-100">Date de Naissance / Lieu</td>
                            <td className="border border-black p-2">
                                {isRedacted('suspect_dob') ? '[REDACTED]' : (
                                    <>
                                        {suspect?.dob ? new Date(suspect.dob).toLocaleDateString() : ''}
                                        {suspect?.pob ? ` / ${suspect.pob}` : ''}
                                    </>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-gray-100">Lieu de résidence</td>
                            <td className="border border-black p-2">
                                {getValue(suspect?.address, 'suspect_address')}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-2 font-bold bg-gray-100">Taille / Poids</td>
                            <td className="border border-black p-2">
                                {suspect?.height ? `${suspect.height}` : ''}
                                {suspect?.weight ? ` / ${suspect.weight}` : ''}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Details */}
            <div className="mb-8 flex-1">
                <h3 className="font-bold uppercase mb-2 border-b border-black inline-block">DÉTAILS DES FAITS</h3>
                <div
                    className="border border-black p-4 min-h-[300px] text-sm [&>p]:mb-2"
                    dangerouslySetInnerHTML={{ __html: report.content }}
                />
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-black">
                <p className="font-bold">Cordialement,</p>
                <p className="mt-8">{author?.username || 'Officer Signature'}</p>
            </div>
        </div>
    );
});

ReportPDF.displayName = "ReportPDF";
