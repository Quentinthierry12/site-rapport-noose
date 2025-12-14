import { supabase } from "@/lib/supabase";

export interface Investigation {
    id: string;
    case_number: string;
    title: string;
    description: string;
    lead_agent_id: string;
    status: string;
    classification: string;
    created_at: string;
    shared_with_teams?: string[];
}

export interface InvestigationLink {
    id: string;
    investigation_id: string;
    linked_item_type: 'report' | 'arrest' | 'civilian' | 'vehicle' | 'weapon';
    linked_item_id: string;
    linked_item_title?: string;
    notes?: string;
    created_at: string;
}

export const investigationsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('investigations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Investigation[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('investigations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Investigation;
    },

    async create(investigation: Partial<Investigation>) {
        const { data, error } = await supabase
            .from('investigations')
            .insert(investigation)
            .select()
            .single();

        if (error) throw error;
        return data as Investigation;
    },

    async update(id: string, updates: Partial<Investigation>) {
        const { data, error } = await supabase
            .from('investigations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Investigation;
    },

    async addLink(investigationId: string, itemType: string, itemId: string, itemTitle: string, notes?: string) {
        const { data, error } = await supabase
            .from('investigation_links')
            .insert({
                investigation_id: investigationId,
                linked_item_type: itemType,
                linked_item_id: itemId,
                linked_item_title: itemTitle,
                notes
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async removeLink(linkId: string) {
        const { error } = await supabase
            .from('investigation_links')
            .delete()
            .eq('id', linkId);

        if (error) throw error;
    },

    async getLinks(investigationId: string) {
        const { data, error } = await supabase
            .from('investigation_links')
            .select('*')
            .eq('investigation_id', investigationId);

        if (error) throw error;
        return data as InvestigationLink[];
    },

    // Share investigation with teams
    async shareWithTeams(investigationId: string, teamIds: string[]) {
        const { data, error } = await supabase
            .from('investigations')
            .update({ shared_with_teams: teamIds })
            .eq('id', investigationId)
            .select()
            .single();

        if (error) throw error;
        return data as Investigation;
    },

    // Add team to shared list
    async addTeamShare(investigationId: string, teamId: string) {
        const { data: investigation } = await supabase
            .from('investigations')
            .select('shared_with_teams')
            .eq('id', investigationId)
            .single();

        const currentTeams = investigation?.shared_with_teams || [];
        if (!currentTeams.includes(teamId)) {
            currentTeams.push(teamId);
        }

        return this.shareWithTeams(investigationId, currentTeams);
    },

    // Remove team from shared list
    async removeTeamShare(investigationId: string, teamId: string) {
        const { data: investigation } = await supabase
            .from('investigations')
            .select('shared_with_teams')
            .eq('id', investigationId)
            .single();

        const currentTeams = (investigation?.shared_with_teams || []).filter((id: string) => id !== teamId);
        return this.shareWithTeams(investigationId, currentTeams);
    },

    // Get teams an investigation is shared with
    async getSharedTeams(investigationId: string) {
        const { data: investigation } = await supabase
            .from('investigations')
            .select('shared_with_teams')
            .eq('id', investigationId)
            .single();

        if (!investigation?.shared_with_teams || investigation.shared_with_teams.length === 0) {
            return [];
        }

        const { data: teams, error } = await supabase
            .from('teams')
            .select('*')
            .in('id', investigation.shared_with_teams);

        if (error) throw error;
        return teams;
    }
};
