import { supabase } from "@/lib/supabase";

export interface PenalCharge {
    id: string;
    title: string;
    category: string;
    fine: number;
    prison_time: number;
    description: string;
    created_at: string;
}

export const penalCodeService = {
    async getAll() {
        const { data, error } = await supabase
            .from('penal_code')
            .select('*')
            .order('category', { ascending: true })
            .order('title', { ascending: true });

        if (error) throw error;
        return data as PenalCharge[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('penal_code')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as PenalCharge;
    },

    async create(charge: Partial<PenalCharge>) {
        const { data, error } = await supabase
            .from('penal_code')
            .insert(charge)
            .select()
            .single();

        if (error) throw error;
        return data as PenalCharge;
    },

    async update(id: string, charge: Partial<PenalCharge>) {
        const { data, error } = await supabase
            .from('penal_code')
            .update(charge)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as PenalCharge;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('penal_code')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
