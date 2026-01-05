import { supabase } from '@/lib/supabase';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'shared_report';
    link?: string;
    read: boolean;
    created_at: string;
}

export const notificationsService = {
    async getMyNotifications(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Notification[];
    },

    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) throw error;
    },

    async create(notification: Partial<Notification>) {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) throw error;
        return data as Notification;
    },

    // Simplified notification creator for sharing
    async notifyTeamOfSharedReport(teamId: string, reportId: string, reportTitle: string, sharedBy: string) {
        // 1. Get all members of the team
        const { data: members, error } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId);

        if (error) throw error;
        if (!members) return;

        // 2. Create notifications for each member (except potentially the person who shared it, but for simplicity we notify all)
        const notifications = members.map(m => ({
            user_id: m.user_id,
            title: 'Nouveau rapport partagé',
            message: `${sharedBy} a partagé le rapport "${reportTitle}" avec votre équipe.`,
            type: 'shared_report' as const,
            link: `/reports/${reportId}`
        }));

        const { error: notifyError } = await supabase
            .from('notifications')
            .insert(notifications);

        if (notifyError) throw notifyError;
    },

    subscribeToMyNotifications(userId: string, onNotification: (payload: any) => void) {
        return supabase
            .channel(`public:notifications:user_id=eq.${userId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            }, onNotification)
            .subscribe();
    }
};
