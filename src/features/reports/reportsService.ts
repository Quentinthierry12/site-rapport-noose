import { supabase } from "@/lib/supabase";

export interface Report {
    id: string;
    title: string;
    content: string;
    author_id: string;
    author?: {
        username: string;
        rank: string;
    };
    suspect_id?: string;
    suspect?: {
        full_name: string;
        dob: string;
        address: string;
        height: string;
        weight: string;
        pob: string;
    };
    classification: string;
    status: string;
    created_at: string;
    updated_at: string;
    tags?: string[];
    shared_with_teams?: string[];
    template_id?: string;
    template_data?: Record<string, any>;
}

export const reportsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('reports')
            .select('*, author:noose_user(username, rank), suspect:noose_civilians(full_name, dob, address, height, weight, pob)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Report[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, author:noose_user(username, rank), suspect:noose_civilians(full_name, dob, address, height, weight, pob)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Report;
    },

    async create(report: Partial<Report>) {
        const { data, error } = await supabase
            .from('reports')
            .insert(report)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    async update(id: string, updates: Partial<Report>) {
        const { data, error } = await supabase
            .from('reports')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    // Share report with teams
    async shareWithTeams(reportId: string, teamIds: string[]) {
        const { data, error } = await supabase
            .from('reports')
            .update({ shared_with_teams: teamIds })
            .eq('id', reportId)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    // Add team to shared list
    async addTeamShare(reportId: string, teamId: string) {
        // First get current shared teams
        const { data: report } = await supabase
            .from('reports')
            .select('shared_with_teams')
            .eq('id', reportId)
            .single();

        const currentTeams = report?.shared_with_teams || [];
        if (!currentTeams.includes(teamId)) {
            currentTeams.push(teamId);
        }

        return this.shareWithTeams(reportId, currentTeams);
    },

    // Remove team from shared list
    async removeTeamShare(reportId: string, teamId: string) {
        const { data: report } = await supabase
            .from('reports')
            .select('shared_with_teams')
            .eq('id', reportId)
            .single();

        const currentTeams = (report?.shared_with_teams || []).filter((id: string) => id !== teamId);
        return this.shareWithTeams(reportId, currentTeams);
    },

    // Get teams a report is shared with
    async getSharedTeams(reportId: string) {
        const { data: report } = await supabase
            .from('reports')
            .select('shared_with_teams')
            .eq('id', reportId)
            .single();

        if (!report?.shared_with_teams || report.shared_with_teams.length === 0) {
            return [];
        }

        const { data: teams, error } = await supabase
            .from('teams')
            .select('*')
            .in('id', report.shared_with_teams);

        if (error) throw error;
        return teams;
    }
};
