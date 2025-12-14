import { supabase } from '@/lib/supabase';
import type { User } from './AuthStore';

export const authService = {
    async login(username: string, password: string): Promise<User | null> {
        // TODO: Implement encryption/decryption logic here

        const { data, error } = await supabase
            .from('noose_user')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !data) {
            console.error('Login failed:', error);
            return null;
        }

        // Verify password (placeholder)
        // In real implementation, decrypt data.password and compare, or hash input and compare
        if (data.password !== password) {
            return null;
        }

        return {
            id: data.id,
            username: data.username,
            matricule: data.matricule,
            rank: data.rank,
            division: data.division,
            clearance: data.clearance,
            permissions: data.permissions || [],
        };
    }
};
