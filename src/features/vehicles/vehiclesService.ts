import { supabase } from '@/lib/supabase';

export interface Vehicle {
    plate: string;
    model: string;
    color: string | null;
    owner_id: string | null;
    owner?: {
        full_name: string;
    };
    status: 'Valid' | 'Stolen' | 'Expired' | 'Impounded';
    created_at: string;
}

export const vehiclesService = {
    async getAll() {
        const { data, error } = await supabase
            .from('noose_vehicles')
            .select('*, owner:noose_civilians(full_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Vehicle[];
    },

    async getByPlate(plate: string) {
        const { data, error } = await supabase
            .from('noose_vehicles')
            .select('*, owner:noose_civilians(full_name)')
            .eq('plate', plate)
            .single();

        if (error) throw error;
        return data as Vehicle;
    },

    async getByOwnerId(ownerId: string) {
        const { data, error } = await supabase
            .from('noose_vehicles')
            .select('*')
            .eq('owner_id', ownerId);

        if (error) throw error;
        return data as Vehicle[];
    },

    async create(vehicle: Partial<Vehicle>) {
        const { data, error } = await supabase
            .from('noose_vehicles')
            .insert(vehicle)
            .select()
            .single();

        if (error) throw error;
        return data as Vehicle;
    },

    async updateStatus(plate: string, status: string) {
        const { data, error } = await supabase
            .from('noose_vehicles')
            .update({ status })
            .eq('plate', plate)
            .select()
            .single();

        if (error) throw error;
        return data as Vehicle;
    },

    async search(query: string) {
        const { data, error } = await supabase
            .from('noose_vehicles')
            .select('*, owner:noose_civilians(full_name)')
            .ilike('plate', `%${query}%`)
            .limit(10);

        if (error) throw error;
        return data as Vehicle[];
    }
};
