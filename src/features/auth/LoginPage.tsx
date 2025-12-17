import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './AuthStore';
import { authService } from './authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const user = await authService.login(username, password);
            if (user) {
                login(user);
                navigate('/');
            } else {
                setError('Identifiants invalides');
            }
        } catch (err) {
            setError('Une erreur s\'est produite lors de la connexion');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Connexion NICMS</CardTitle>
                    <CardDescription>Entrez vos identifiants pour accéder au système.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">Nom d'utilisateur</Label>
                                <Input
                                    id="username"
                                    placeholder="Nom d'utilisateur"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Mot de passe"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button type="submit" className="w-full">Se connecter</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
