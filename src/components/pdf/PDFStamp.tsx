import React from 'react';
import { type User } from '@/features/auth/AuthStore';

export type SpecialtyKey = 'pia' | 'tru' | 'tss' | 'usbp' | 'uscg' | 'ics' | 'nletp' | 'sep';

interface PDFStampProps {
    author: Partial<User> | null;
    specialty?: SpecialtyKey;
    date?: string;
}

const specialtyConfig: Record<string, { label: string; logo: string; badge?: string }> = {
    pia: {
        label: "Patriotism And Immigration Authority / Border Patrol",
        logo: "/pia.png"
    },
    usbp: {
        label: "United States Border Patrol",
        logo: "/usbp.png"
    },
    tru: {
        label: "Tactical Response Unit",
        logo: "/tru.png"
    },
    tss: {
        label: "Transportation Security Services",
        logo: "/tss.png"
    },
    ics: {
        label: "Intelligence Compliance Section",
        logo: "/ics.png"
    },
    nletp: {
        label: "National Law Enforcement Training Program",
        logo: "/nletp.png"
    },
    sep: {
        label: "Security Enforcement Protection",
        logo: "/sep.png"
    },
    uscg: {
        label: "U.S. Coast Guard",
        logo: "/uscg.png"
    }
};

export const PDFStamp: React.FC<PDFStampProps> = ({ author, specialty, date }) => {
    const today = date || new Date().toLocaleDateString('fr-FR');
    const spec = specialty ? specialtyConfig[specialty] : null;

    if (spec) {
        // Specialization Stamp (Photo 2)
        return (
            <div className="relative w-full max-w-[450px] border-[3px] border-black p-4 font-sans text-black bg-white my-6">
                <div className="absolute -top-6 -left-6 w-16 h-16 pointer-events-none">
                    <img src={spec.logo} alt="Spec Logo" className="w-full h-full object-contain" />
                </div>
                {spec.badge && (
                    <div className="absolute -top-6 -right-6 w-16 h-16 pointer-events-none">
                        <img src={spec.badge} alt="Spec Badge" className="w-full h-full object-contain" />
                    </div>
                )}
                <div className="absolute -bottom-6 -left-6 w-16 h-16 pointer-events-none">
                    <img src="/noose-seal.png" alt="NOOSE Seal" className="w-full h-full object-contain" />
                </div>

                <div className="text-center space-y-1">
                    <h4 className="text-[14px] font-black uppercase tracking-tight">National Office Of Security Enforcement</h4>
                    <div className="py-2">
                        <p className="text-[18px] font-bold">{author?.username || '---'}</p>
                        <p className="text-[16px] font-bold uppercase">{author?.rank || 'Agent'}</p>
                        <p className="text-[18px] font-bold leading-tight">{spec.label}</p>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                        <p className="text-[12px] font-medium">Departement De La Sécurité Intérieure</p>
                        <p className="text-[10px] opacity-50 font-mono mt-1 text-right">{today}</p>
                    </div>
                </div>
            </div>
        );
    }

    // Base Stamp (Photo 1)
    return (
        <div className="relative w-full max-w-[380px] border-[3px] border-black p-4 font-sans text-black bg-white my-6">
            <div className="absolute -top-6 -right-6 w-16 h-16 pointer-events-none">
                <img src="/noose-seal.png" alt="NOOSE Seal" className="w-full h-full object-contain" />
            </div>

            <div className="text-center space-y-1">
                <h4 className="text-[14px] font-black uppercase tracking-tight">National Office Of Security Enforcement</h4>

                <div className="py-2">
                    <p className="text-[18px] font-bold">{author?.username || '---'}</p>
                    <p className="text-[16px] font-bold uppercase">{author?.rank || 'Agent'}</p>
                </div>

                <div className="space-y-0.5">
                    <p className="text-[13px] font-bold font-mono text-gray-700">{author?.matricule || 'NOOSE-LS-XXXXX'}</p>
                    <p className="text-[11px] font-medium">Departement De La Sécurité Intérieure</p>
                </div>

                <p className="text-[9px] opacity-40 font-mono pt-2 text-right">{today}</p>
            </div>
        </div>
    );
};
