import { forwardRef } from 'react';

interface AccountAssignmentPDFProps {
    username: string;
    password: string;
    matricule: string;
    rank: string;
    division: string;
    clearance: number;
    isPasswordReset?: boolean;
}

export const AccountAssignmentPDF = forwardRef<HTMLDivElement, AccountAssignmentPDFProps>(
    ({ username, password, matricule, rank, division, clearance, isPasswordReset = false }, ref) => {
        const getClearanceLabel = (level: number) => {
            switch (level) {
                case 1: return 'Niveau 1';
                case 2: return 'Niveau 2';
                case 3: return 'Niveau 3';
                case 4: return 'Niveau 4';
                case 5: return 'Niveau 5';
                default: return `Niveau ${level}`;
            }
        };

        return (
            <div ref={ref} className="print-only hidden print:block p-8 max-w-[210mm] mx-auto bg-white text-black font-serif">
                {/* Header */}
                <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <div className="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                        <img src="/noose-seal.png" alt="NOOSE Seal" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">
                        National Office of Security Enforcement
                    </h1>
                    <h2 className="text-xl font-bold uppercase underline mb-4">
                        {isPasswordReset ? 'RÉINITIALISATION DE COMPTE' : 'ASSIGNATION DE COMPTE'}
                    </h2>
                    <h3 className="text-lg font-bold uppercase">ACCÈS SÉCURISÉ</h3>

                    <div className="text-sm font-bold space-y-1 mt-4">
                        <p>Classification : <span className="uppercase">CONFIDENTIEL</span></p>
                        <p>Date d'émission : {new Date().toLocaleDateString('fr-FR')}</p>
                        <p>Référence : US-GOV/US-NOOSE/ACC-{matricule}</p>
                    </div>
                </div>

                {/* Security Warning */}
                <div className="text-[10px] text-justify mb-8 leading-tight space-y-2 border border-black p-3 bg-gray-50">
                    <p className="font-bold uppercase text-center mb-2">⚠️ AVERTISSEMENT DE SÉCURITÉ ⚠️</p>
                    <p>
                        Ce document contient des <strong>informations d'identification confidentielles</strong> pour accéder aux systèmes sécurisés du NOOSE.
                        Il est de votre responsabilité de protéger ces informations et de ne jamais les partager avec des personnes non autorisées.
                    </p>
                    <p>
                        <strong>U.S. Code Title 18 § 1030</strong> - Accès frauduleux aux systèmes informatiques.
                    </p>
                    <p>
                        <strong>U.S. Code Title 18 § 1905</strong> - Divulgation de renseignements confidentiels.
                    </p>
                    <p>
                        Conservez ce document dans un endroit sûr. En cas de compromission de vos identifiants, contactez immédiatement votre supérieur hiérarchique.
                    </p>
                </div>

                {/* Credentials Section */}
                <div className="mb-8">
                    <h3 className="font-bold uppercase mb-3 text-lg border-b-2 border-black pb-1">
                        INFORMATIONS D'IDENTIFICATION
                    </h3>
                    <table className="w-full border-collapse border-2 border-black text-sm">
                        <tbody>
                            <tr>
                                <td className="border border-black p-3 w-1/3 font-bold bg-gray-100">Nom d'utilisateur</td>
                                <td className="border border-black p-3 font-mono text-base">{username}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Mot de passe</td>
                                <td className="border border-black p-3 font-mono text-base font-bold">{password}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Matricule</td>
                                <td className="border border-black p-3">{matricule}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Grade</td>
                                <td className="border border-black p-3">{rank}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Division</td>
                                <td className="border border-black p-3">{division}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-3 font-bold bg-gray-100">Niveau d'habilitation</td>
                                <td className="border border-black p-3 font-bold">{getClearanceLabel(clearance)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Tutorial Section */}
                <div className="mb-8">
                    <h3 className="font-bold uppercase mb-3 text-lg border-b-2 border-black pb-1">
                        GUIDE D'UTILISATION DU SYSTÈME
                    </h3>

                    <div className="space-y-4 text-sm">
                        {/* Step 1: Access */}
                        <div className="border-l-4 border-black pl-3">
                            <h4 className="font-bold mb-1">1. ACCÈS AU SYSTÈME</h4>
                            <p className="mb-1">
                                Accédez au système NOOSE via votre navigateur web sécurisé à l'adresse fournie par votre administrateur.
                            </p>
                            <p className="text-xs italic">
                                Note : Utilisez uniquement des connexions réseau sécurisées. Ne vous connectez jamais depuis un réseau public.
                            </p>
                        </div>

                        {/* Step 2: Login */}
                        <div className="border-l-4 border-black pl-3">
                            <h4 className="font-bold mb-1">2. CONNEXION</h4>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Entrez votre <strong>nom d'utilisateur</strong> dans le premier champ</li>
                                <li>Entrez votre <strong>mot de passe</strong> dans le second champ</li>
                                <li>Cliquez sur le bouton "Se connecter"</li>
                            </ul>
                            <p className="text-xs italic mt-1">
                                Conseil : Il est recommandé de changer votre mot de passe lors de votre première connexion.
                            </p>
                        </div>

                        {/* Step 3: Dashboard */}
                        <div className="border-l-4 border-black pl-3">
                            <h4 className="font-bold mb-1">3. TABLEAU DE BORD</h4>
                            <p className="mb-1">
                                Après connexion, vous accédez au tableau de bord principal qui affiche :
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Statistiques en temps réel (rapports, arrestations, enquêtes)</li>
                                <li>Activités récentes de votre équipe</li>
                                <li>Actions rapides pour créer de nouveaux documents</li>
                            </ul>
                        </div>

                        {/* Step 4: Navigation */}
                        <div className="border-l-4 border-black pl-3">
                            <h4 className="font-bold mb-1">4. NAVIGATION</h4>
                            <p className="mb-1">
                                Utilisez le menu latéral gauche pour accéder aux différentes sections :
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong>Rapports</strong> : Créer et consulter les rapports d'opération</li>
                                <li><strong>Arrestations</strong> : Gérer les dossiers d'arrestation</li>
                                <li><strong>Enquêtes</strong> : Suivre les enquêtes en cours</li>
                                <li><strong>Civils</strong> : Base de données des personnes</li>
                                <li><strong>Véhicules</strong> : Registre des véhicules</li>
                                <li><strong>Armes</strong> : Inventaire des armes saisies</li>
                            </ul>
                        </div>

                        {/* Step 5: Creating Reports */}
                        <div className="border-l-4 border-black pl-3">
                            <h4 className="font-bold mb-1">5. CRÉATION D'UN RAPPORT</h4>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Cliquez sur "Rapports" dans le menu latéral</li>
                                <li>Cliquez sur le bouton "+ Nouveau rapport"</li>
                                <li>Remplissez le titre et sélectionnez la classification appropriée</li>
                                <li>Rédigez le contenu dans l'éditeur de texte</li>
                                <li>Ajoutez un suspect si nécessaire (recherche par nom)</li>
                                <li>Cliquez sur "Save Report" pour enregistrer</li>
                            </ul>
                            <p className="text-xs italic mt-1">
                                Important : Choisissez le niveau de classification approprié selon la sensibilité des informations.
                            </p>
                        </div>

                        {/* Step 6: Search */}
                        <div className="border-l-4 border-black pl-3">
                            <h4 className="font-bold mb-1">6. RECHERCHE GLOBALE</h4>
                            <p className="mb-1">
                                Utilisez la barre de recherche en haut de l'écran (icône de loupe) pour :
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Rechercher des rapports, arrestations, enquêtes</li>
                                <li>Trouver des civils dans la base de données</li>
                                <li>Localiser des véhicules ou armes</li>
                            </ul>
                            <p className="text-xs italic mt-1">
                                Astuce : Tapez au moins 2 caractères pour lancer la recherche.
                            </p>
                        </div>

                        {/* Step 7: Security Best Practices */}
                        <div className="border-l-4 border-black pl-3">
                            <h4 className="font-bold mb-1">7. BONNES PRATIQUES DE SÉCURITÉ</h4>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>Ne partagez <strong>JAMAIS</strong> vos identifiants avec quiconque</li>
                                <li>Déconnectez-vous toujours après utilisation</li>
                                <li>Ne laissez pas votre session ouverte sans surveillance</li>
                                <li>Signalez immédiatement toute activité suspecte</li>
                                <li>Respectez les niveaux de classification des documents</li>
                                <li>Changez votre mot de passe régulièrement</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t-2 border-black text-xs">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="font-bold">Document émis par :</p>
                            <p>NOOSE - Administration Système</p>
                            <p>Department of Homeland Security</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">Date d'émission :</p>
                            <p>{new Date().toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-center font-bold uppercase">
                        <p>Ce document est strictement confidentiel et personnel</p>
                        <p>En cas de perte ou de vol, contactez immédiatement votre supérieur</p>
                    </div>
                </div>
            </div>
        );
    }
);

AccountAssignmentPDF.displayName = 'AccountAssignmentPDF';
