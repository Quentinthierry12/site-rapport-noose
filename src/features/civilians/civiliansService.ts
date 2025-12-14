import { supabase } from '@/lib/supabase';

export interface Civilian {
    id: string;
    full_name: string;
    dob: string | null;
    gender: string | null;
    race: string | null;
    hair_color: string | null;
    eye_color: string | null;
    height?: string;
    weight?: string;
    pob?: string;
    address: string | null;
    licenses: Record<string, string>; // e.g. { driver: 'valid' }
    mugshot_url: string | null;
    flags: string[];
    created_at: string;
}

export const civiliansService = {
    async getAll() {
        const { data, error } = await supabase
            .from('noose_civilians')
            .select('*')
            .order('full_name');

        if (error) throw error;
        return data as Civilian[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('noose_civilians')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Civilian;
    },

    async create(civilian: Partial<Civilian>) {
        const { data, error } = await supabase
            .from('noose_civilians')
            .insert(civilian)
            .select()
            .single();

        if (error) throw error;
        return data as Civilian;
    },

    async update(id: string, updates: Partial<Civilian>) {
        const { data, error } = await supabase
            .from('noose_civilians')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Civilian;
    },

    async search(query: string) {
        const { data, error } = await supabase
            .from('noose_civilians')
            .select('*')
            .ilike('full_name', `%${query}%`)
            .limit(10);

        if (error) throw error;
        return data as Civilian[];
    }
};
