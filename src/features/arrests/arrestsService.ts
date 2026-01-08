import { supabase } from "@/lib/supabase";

export interface Arrest {
    id: string;
    suspect_name: string;
    suspect_alias?: string;
    civilian_id?: string; // Link to civilian profile
    charges: string[];
    arresting_officer_id: string;
    officer?: {
        username: string;
        rank: string;
        matricule: string;
        division: string;
    };
    date_of_arrest: string;
    location: string;
    mugshot_url?: string;
    report_id?: string; // Link to the automatically created report
    status: 'Pending' | 'Processed' | 'In Custody' | 'Released';
    created_at: string;
}

export const arrestsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('arrests')
            .select('*, officer:noose_user(username, rank, matricule, division)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Arrest[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('arrests')
            .select('*, officer:noose_user(username, rank, matricule, division)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Arrest;
    },

    async create(arrest: Partial<Arrest>) {
        const { data, error } = await supabase
            .from('arrests')
            .insert(arrest)
            .select()
            .single();

        if (error) throw error;
        return data as Arrest;
    },

    async update(id: string, arrest: Partial<Arrest>) {
        const { data, error } = await supabase
            .from('arrests')
            .update(arrest)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Arrest;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('arrests')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getByCivilianId(civilianId: string) {
        const { data, error } = await supabase
            .from('arrests')
            .select('*, officer:noose_user(username, rank, matricule, division)')
            .eq('civilian_id', civilianId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Arrest[];
    }
};
