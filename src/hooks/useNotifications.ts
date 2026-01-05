import { useEffect } from 'react';
import { notificationsService } from '@/features/notifications/notificationsService';
import { useAuthStore } from '@/features/auth/AuthStore';
import { toast } from 'sonner';

export function useNotifications() {
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user?.id) return;

        // Subscribe to new notifications
        const channel = notificationsService.subscribeToMyNotifications(
            user.id,
            (payload) => {
                const newNotif = payload.new;

                // Show a toast
                toast(newNotif.title, {
                    description: newNotif.message,
                    action: newNotif.link ? {
                        label: 'Voir',
                        onClick: () => window.location.href = newNotif.link
                    } : undefined,
                });
            }
        );

        return () => {
            channel.unsubscribe();
        };
    }, [user?.id]);
}
