import { forwardRef } from 'react';
import { type Arrest } from '@/features/arrests/arrestsService';
import { type Civilian } from '@/features/civilians/civiliansService';

interface ArrestPDFProps {
    arrest: Arrest;
    suspect?: Civilian;
    preview?: boolean;
}

export const ArrestPDF = forwardRef<HTMLDivElement, ArrestPDFProps>(({ arrest, suspect, preview = false }, ref) => {
    return (
        <div ref={ref} className={`${preview ? '' : 'hidden'} print:block p-8 max-w-[210mm] mx-auto font-serif`} style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            {/* Header */}
            <div className="text-center mb-8 border-b-2 pb-4" style={{ borderColor: '#000000' }}>
                <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                    <img src="/noose-seal.png" alt="NOOSE Seal" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">National Office of Security Enforcement</h1>
                <h2 className="text-xl font-bold uppercase underline mb-4">RAPPORT D'ARRESTATION</h2>

                <div className="text-sm font-bold space-y-1">
                    <p>Date : {new Date(arrest.date_of_arrest).toLocaleDateString()}</p>
                    <p>Référence : US-GOV/US-NOOSE/ARR-{arrest.id.slice(0, 8).toUpperCase()}</p>
                </div>
            </div>

            {/* Warning Text */}
            <div className="text-[10px] text-justify mb-8 leading-tight space-y-2">
                <p>
                    Ce document est classé <strong>CONFIDENTIEL</strong>. Il consigne les détails d'une arrestation officielle effectuée par les services du NOOSE.
                </p>
                <p><strong>DHS Directive 100-01</strong> - Usage interne uniquement.</p>
            </div>

            {/* Mugshot & Main Info */}
            <div className="flex gap-6 mb-8">
                <div className="w-48 h-48 border flex items-center justify-center overflow-hidden" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>
                    {arrest.mugshot_url || suspect?.mugshot_url ? (
                        <img src={arrest.mugshot_url || suspect?.mugshot_url || ''} alt="Mugshot" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold" style={{ color: '#9ca3af' }}>NO PHOTO</span>
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="font-bold uppercase mb-1">INDIVIDU INTERPELLÉ</h3>
                    <div className="border-b mb-2" style={{ borderColor: '#000000' }}></div>
                    <table className="w-full text-sm" style={{ borderCollapse: 'collapse', borderColor: '#000000' }}>
                        <tbody>
                            <tr>
                                <td className="border p-2 font-bold w-1/3" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Nom Complet</td>
                                <td className="border p-2 font-bold text-lg" style={{ borderColor: '#000000' }}>{arrest.suspect_name}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>ID Civil</td>
                                <td className="border p-2" style={{ borderColor: '#000000' }}>{arrest.civilian_id ? arrest.civilian_id.slice(0, 8).toUpperCase() : 'N/A'}</td>
                            </tr>
                            {suspect && (
                                <>
                                    <tr>
                                        <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Date de Naissance</td>
                                        <td className="border p-2" style={{ borderColor: '#000000' }}>{suspect.dob ? new Date(suspect.dob).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Adresse</td>
                                        <td className="border p-2" style={{ borderColor: '#000000' }}>{suspect.address || 'N/A'}</td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Arrest Details */}
            <div className="mb-6">
                <h3 className="font-bold uppercase mb-1">DÉTAILS DE L'ARRESTATION</h3>
                <div className="border-b mb-2" style={{ borderColor: '#000000' }}></div>
                <table className="w-full border-collapse border text-sm" style={{ borderColor: '#000000' }}>
                    <tbody>
                        <tr>
                            <td className="border p-2 font-bold w-1/3" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Date / Heure</td>
                            <td className="border p-2" style={{ borderColor: '#000000' }}>{new Date(arrest.date_of_arrest).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Officier Interpellateur</td>
                            <td className="border p-2" style={{ borderColor: '#000000' }}>
                                {arrest.officer ? `${arrest.officer.username}` : 'Inconnu'}
                            </td>
                        </tr>
                        <tr>
                            <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Statut</td>
                            <td className="border p-2 uppercase font-bold" style={{ borderColor: '#000000' }}>{arrest.status}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Charges */}
            <div className="mb-8 flex-1">
                <h3 className="font-bold uppercase mb-2 border-b inline-block" style={{ borderColor: '#000000' }}>CHARGES RETENUES</h3>
                <div className="border p-4 min-h-[150px]" style={{ borderColor: '#000000' }}>
                    {arrest.charges && arrest.charges.length > 0 ? (
                        <ul className="list-disc list-inside space-y-2">
                            {arrest.charges.map((charge, idx) => (
                                <li key={idx} className="text-sm font-bold">{charge}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic text-sm" style={{ color: '#6b7280' }}>Aucune charge spécifiée.</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t" style={{ borderColor: '#000000' }}>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="font-bold text-sm mb-8">Signature de l'Officier</p>
                        <div className="border-b border-black w-48" style={{ borderColor: '#000000' }}></div>
                        <p className="text-xs mt-1">{arrest.officer?.username || 'Officer Signature'}</p>
                    </div>
                    <div>
                        <p className="font-bold text-sm mb-8">Signature du Suspect (Refus possible)</p>
                        <div className="border-b border-black w-48" style={{ borderColor: '#000000' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ArrestPDF.displayName = "ArrestPDF";
