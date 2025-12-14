import { supabase } from '@/lib/supabase';

export interface SearchResult {
    id: string;
    type: 'report' | 'arrest' | 'investigation' | 'civilian' | 'vehicle' | 'weapon';
    title: string;
    summary: string;
    classification: string;
    created_at: string;
}

export const searchService = {
    async search(query: string, type?: string): Promise<SearchResult[]> {
        if (!query || query.length < 2) return [];

        let queryBuilder = supabase
            .from('global_search_index')
            .select('*')
            .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
            .limit(10);

        if (type && type !== 'all') {
            queryBuilder = queryBuilder.eq('type', type);
        }

        const { data, error } = await queryBuilder;

        if (error) {
            console.error('Search failed:', error);
            return [];
        }

        return data as SearchResult[];
    }
};
