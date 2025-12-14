import { supabase } from '@/lib/supabase';

export interface Weapon {
    serial_number: string;
    model: string;
    type: string;
    owner_id: string | null;
    owner?: {
        full_name: string;
    };
    status: 'Valid' | 'Stolen' | 'Seized' | 'Revoked';
    created_at: string;
}

export const weaponsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('noose_weapons')
            .select('*, owner:noose_civilians(full_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Weapon[];
    },

    async getBySerial(serial: string) {
        const { data, error } = await supabase
            .from('noose_weapons')
            .select('*, owner:noose_civilians(full_name)')
            .eq('serial_number', serial)
            .single();

        if (error) throw error;
        return data as Weapon;
    },

    async getByOwnerId(ownerId: string) {
        const { data, error } = await supabase
            .from('noose_weapons')
            .select('*')
            .eq('owner_id', ownerId);

        if (error) throw error;
        return data as Weapon[];
    },

    async create(weapon: Partial<Weapon>) {
        const { data, error } = await supabase
            .from('noose_weapons')
            .insert(weapon)
            .select()
            .single();

        if (error) throw error;
        return data as Weapon;
    },

    async updateStatus(serial: string, status: string) {
        const { data, error } = await supabase
            .from('noose_weapons')
            .update({ status })
            .eq('serial_number', serial)
            .select()
            .single();

        if (error) throw error;
        return data as Weapon;
    },

    async search(query: string) {
        const { data, error } = await supabase
            .from('noose_weapons')
            .select('*, owner:noose_civilians(full_name)')
            .ilike('serial_number', `%${query}%`)
            .limit(10);

        if (error) throw error;
        return data as Weapon[];
    }
};
