import { supabase } from '@/lib/supabase';

export interface Team {
    id: string;
    name: string;
    division: string;
    description?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: 'member' | 'leader';
    joined_at: string;
    user?: {
        username: string;
        rank: string;
        division: string;
    };
}

export interface TeamWithMembers extends Team {
    members: TeamMember[];
    member_count: number;
}

export const teamsService = {
    // Get all teams (optionally filtered by division)
    async getAll(division?: string) {
        let query = supabase
            .from('teams')
            .select('*')
            .order('name');

        if (division) {
            query = query.eq('division', division);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data as Team[];
    },

    // Get team by ID with members
    async getById(id: string): Promise<TeamWithMembers> {
        const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('id', id)
            .single();

        if (teamError) throw teamError;

        const { data: members, error: membersError } = await supabase
            .from('team_members')
            .select('*, user:noose_user(username, rank, division)')
            .eq('team_id', id);

        if (membersError) throw membersError;

        return {
            ...team,
            members: members as TeamMember[],
            member_count: members.length
        } as TeamWithMembers;
    },

    // Get teams for a specific user
    async getUserTeams(userId: string): Promise<Team[]> {
        const { data, error } = await supabase
            .from('team_members')
            .select('teams(*)')
            .eq('user_id', userId);

        if (error) throw error;
        if (!data) return [];

        // Extract teams from the nested structure
        return data.map((item: any) => item.teams).filter(Boolean) as Team[];
    },

    // Create a new team
    async create(team: Partial<Team>) {
        const { data, error } = await supabase
            .from('teams')
            .insert(team)
            .select()
            .single();

        if (error) throw error;
        return data as Team;
    },

    // Update team
    async update(id: string, updates: Partial<Team>) {
        const { data, error } = await supabase
            .from('teams')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Team;
    },

    // Delete team
    async delete(id: string) {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Add member to team
    async addMember(teamId: string, userId: string, role: 'member' | 'leader' = 'member') {
        const { data, error } = await supabase
            .from('team_members')
            .insert({ team_id: teamId, user_id: userId, role })
            .select()
            .single();

        if (error) throw error;
        return data as TeamMember;
    },

    // Remove member from team
    async removeMember(teamId: string, userId: string) {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId);

        if (error) throw error;
    },

    // Update member role
    async updateMemberRole(teamId: string, userId: string, role: 'member' | 'leader') {
        const { data, error } = await supabase
            .from('team_members')
            .update({ role })
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as TeamMember;
    },

    // Check if user is member of team
    async isMember(teamId: string, userId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', teamId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    },

    // Get all members of a team
    async getMembers(teamId: string) {
        const { data, error } = await supabase
            .from('team_members')
            .select('*, user:noose_user(username, rank, division)')
            .eq('team_id', teamId);

        if (error) throw error;
        return data as TeamMember[];
    }
};
