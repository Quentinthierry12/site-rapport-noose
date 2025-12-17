import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Shield, UserPlus, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActionsWidget() {
    const navigate = useNavigate();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate('/civilians')}>
                    <UserPlus className="h-6 w-6" />
                    Créer un civil
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate('/vehicles')}>
                    <Car className="h-6 w-6" />
                    Enregistrer un véhicule
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate('/weapons')}>
                    <Shield className="h-6 w-6" />
                    Enregistrer une arme
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate('/reports/new')}>
                    <FileText className="h-6 w-6" />
                    Nouveau rapport
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => navigate('/arrests/new')}>
                    <Users className="h-6 w-6" />
                    Nouvelle arrestation
                </Button>
            </CardContent>
        </Card>
    );
}
