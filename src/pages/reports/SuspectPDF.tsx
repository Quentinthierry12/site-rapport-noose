import { forwardRef } from 'react';
import { type Civilian } from '@/features/civilians/civiliansService';
import { type Arrest } from '@/features/arrests/arrestsService';
import { type Investigation } from '@/features/investigations/investigationsService';

interface SuspectPDFProps {
    suspect: Civilian;
    arrests?: Arrest[];
    investigations?: Investigation[];
    includeArrests?: boolean;
    includeInvestigations?: boolean;
    includeVehicles?: boolean;
    preview?: boolean;
}

export const SuspectPDF = forwardRef<HTMLDivElement, SuspectPDFProps>(({
    suspect,
    arrests = [],
    investigations = [],
    includeArrests = true,
    includeInvestigations = true,
    includeVehicles = true,
    preview = false
}, ref) => {
    return (
        <div ref={ref} className={`${preview ? '' : 'hidden'} print:block p-8 max-w-[210mm] mx-auto font-serif`} style={{ backgroundColor: '#ffffff', color: '#000000' }}>
            {/* Header */}
            <div className="text-center mb-8 border-b-2 pb-4" style={{ borderColor: '#000000' }}>
                <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                    <img src="/noose-seal.png" alt="NOOSE Seal" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">National Office of Security Enforcement</h1>
                <h2 className="text-xl font-bold uppercase underline mb-4">FICHE INDIVIDU</h2>

                <div className="text-sm font-bold space-y-1">
                    <p>Date d'édition : {new Date().toLocaleDateString()}</p>
                    <p>Référence : US-GOV/US-NOOSE/CIV-{suspect.id.slice(0, 8).toUpperCase()}</p>
                </div>
            </div>

            {/* Warning Text */}
            <div className="text-[10px] text-justify mb-8 leading-tight space-y-2">
                <p>
                    Ce document est classé <strong>CONFIDENTIEL</strong>. Il contient des informations personnelles protégées par les lois fédérales sur la vie privée.
                </p>
                <p><strong>DHS Directive 100-01</strong> - Usage interne uniquement.</p>
            </div>

            {/* Mugshot & Main Info */}
            <div className="flex gap-6 mb-8">
                <div className="w-48 h-48 border flex items-center justify-center overflow-hidden" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>
                    {suspect.mugshot_url ? (
                        <img src={suspect.mugshot_url} alt="Mugshot" className="w-full h-full object-cover" />
                    ) : (
                        <span className="font-bold" style={{ color: '#9ca3af' }}>NO PHOTO</span>
                    )}
                </div>

                <div className="flex-1">
                    <h3 className="font-bold uppercase mb-1">IDENTITÉ</h3>
                    <div className="border-b mb-2" style={{ borderColor: '#000000' }}></div>
                    <table className="w-full text-sm" style={{ borderCollapse: 'collapse', borderColor: '#000000' }}>
                        <tbody>
                            <tr>
                                <td className="border p-2 font-bold w-1/3" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Nom Complet</td>
                                <td className="border p-2 font-bold text-lg" style={{ borderColor: '#000000' }}>{suspect.full_name}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Date de Naissance</td>
                                <td className="border p-2" style={{ borderColor: '#000000' }}>
                                    {suspect.dob ? new Date(suspect.dob).toLocaleDateString() : 'Non renseignée'}
                                </td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Lieu de Naissance</td>
                                <td className="border p-2" style={{ borderColor: '#000000' }}>{suspect.pob || 'Non renseigné'}</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Adresse</td>
                                <td className="border p-2" style={{ borderColor: '#000000' }}>{suspect.address || 'SDF'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Physical Attributes */}
            <div className="mb-10 px-1" style={{ pageBreakInside: 'avoid' }}>
                <h3 className="font-bold uppercase mb-1">SIGNALEMENT</h3>
                <div className="border-b mb-2" style={{ borderColor: '#000000' }}></div>
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse', borderColor: '#000000' }}>
                    <tbody>
                        <tr>
                            <td className="border p-2 font-bold w-1/4" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Sexe</td>
                            <td className="border p-2 w-1/4" style={{ borderColor: '#000000' }}>{suspect.gender || 'N/A'}</td>
                            <td className="border p-2 font-bold w-1/4" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Race</td>
                            <td className="border p-2 w-1/4" style={{ borderColor: '#000000' }}>{suspect.race || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Cheveux</td>
                            <td className="border p-2" style={{ borderColor: '#000000' }}>{suspect.hair_color || 'N/A'}</td>
                            <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Yeux</td>
                            <td className="border p-2" style={{ borderColor: '#000000' }}>{suspect.eye_color || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Poids</td>
                            <td className="border p-2" style={{ borderColor: '#000000' }}>{suspect.weight ? `${suspect.weight}` : 'N/A'}</td>
                            <td className="border p-2 font-bold" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6' }}>Taille</td>
                            <td className="border p-2" style={{ borderColor: '#000000' }}>{suspect.height ? `${suspect.height}` : 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Licenses */}
            {includeVehicles && (
                <div className="mb-10 px-1" style={{ pageBreakInside: 'avoid' }}>
                    <h3 className="font-bold uppercase mb-1">PERMIS ET LICENCES</h3>
                    <div className="border-b mb-2" style={{ borderColor: '#000000' }}></div>
                    <div className="border p-4 text-sm" style={{ borderColor: '#000000' }}>
                        {Object.entries(suspect.licenses || {}).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(suspect.licenses).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center p-2 border"
                                        style={{
                                            backgroundColor: '#f9fafb',
                                            borderColor: '#e5e7eb'
                                        }}>
                                        <span className="font-bold uppercase">{key}</span>
                                        <span
                                            className="px-2 py-0.5 rounded text-xs border"
                                            style={
                                                value === 'valid' ? { backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#15803d' } :
                                                    value === 'suspended' ? { backgroundColor: '#fee2e2', borderColor: '#fca5a5', color: '#b91c1c' } :
                                                        { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' }
                                            }
                                        >
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="italic" style={{ color: '#6b7280' }}>Aucun permis ou licence enregistré.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Arrests */}
            {includeArrests && (
                <div className="mb-10 px-1" style={{ pageBreakInside: 'avoid' }}>
                    <h3 className="font-bold uppercase mb-1">HISTORIQUE JUDICIAIRE ({arrests.length})</h3>
                    <div className="border-b mb-2" style={{ borderColor: '#000000' }}></div>
                    {arrests.length > 0 ? (
                        <table className="w-full text-sm" style={{ borderCollapse: 'collapse', borderColor: '#000000' }}>
                            <thead style={{ backgroundColor: '#f3f4f6' }}>
                                <tr>
                                    <th className="border p-2 text-left" style={{ borderColor: '#000000' }}>Date</th>
                                    <th className="border p-2 text-left" style={{ borderColor: '#000000' }}>Charges</th>
                                    <th className="border p-2 text-left" style={{ borderColor: '#000000' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {arrests.map((arrest) => (
                                    <tr key={arrest.id}>
                                        <td className="border p-2 align-top w-24" style={{ borderColor: '#000000' }}>
                                            {new Date(arrest.date_of_arrest).toLocaleDateString()}
                                        </td>
                                        <td className="border p-2 align-top" style={{ borderColor: '#000000' }}>
                                            <ul className="list-disc list-inside">
                                                {arrest.charges.map((charge, idx) => (
                                                    <li key={idx}>{charge}</li>
                                                ))}
                                            </ul>
                                        </td>
                                        <td className="border p-2 align-top w-24" style={{ borderColor: '#000000' }}>
                                            {arrest.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="border p-4 text-sm italic" style={{ borderColor: '#000000' }}>Aucune arrestation enregistrée.</div>
                    )}
                </div>
            )}

            {/* Investigations */}
            {includeInvestigations && (
                <div className="mb-10 px-1" style={{ pageBreakInside: 'avoid' }}>
                    <h3 className="font-bold uppercase mb-1">DOSSIERS D'INVESTIGATION ({investigations.length})</h3>
                    <div className="border-b mb-2" style={{ borderColor: '#000000' }}></div>
                    {investigations.length > 0 ? (
                        <table className="w-full text-sm" style={{ borderCollapse: 'collapse', borderColor: '#000000' }}>
                            <thead style={{ backgroundColor: '#f3f4f6' }}>
                                <tr>
                                    <th className="border p-2 text-left" style={{ borderColor: '#000000' }}>Dossier #</th>
                                    <th className="border p-2 text-left" style={{ borderColor: '#000000' }}>Titre</th>
                                    <th className="border p-2 text-left" style={{ borderColor: '#000000' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {investigations.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="border p-2 font-mono" style={{ borderColor: '#000000' }}>
                                            {inv.case_number}
                                        </td>
                                        <td className="border p-2" style={{ borderColor: '#000000' }}>
                                            {inv.title}
                                        </td>
                                        <td className="border p-2 uppercase text-xs font-bold" style={{ borderColor: '#000000' }}>
                                            {inv.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="border p-4 text-sm italic" style={{ borderColor: '#000000' }}>Aucun dossier d'investigation lié.</div>
                    )}
                </div>
            )}
        </div>
    );
});

SuspectPDF.displayName = "SuspectPDF";
