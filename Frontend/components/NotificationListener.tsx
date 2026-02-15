import React, { useEffect, useRef } from 'react';
import { useGlobal } from './GlobalContext';
import { useToast } from './ui/ToastContext';

/**
 * NotificationListener
 * 
 * Bridges the Global Notification system with the UI Toast system.
 * It listens for changes in the `notifications` array and triggers a toast
 * whenever a new notification is added at the top of the list.
 */
const NotificationListener = () => {
    const { notifications } = useGlobal();
    const { showToast } = useToast();
    const lastNotificationIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (notifications.length > 0) {
            const latest = notifications[0];

            // If we have a new notification ID that is different from the last one we handled
            if (lastNotificationIdRef.current !== latest.id) {

                // Only show toast if the notification was created very recently (< 2 seconds ago)
                // This prevents showing toasts for old notifications on page refresh
                // But since we don't have exact timestamp in ms in the Notification type (it's a string),
                // we rely on the fact that this component mounts and syncs.
                // To be safe, we skip the FIRST check on mount if we want to avoid "welcome back" spam on refresh,
                // BUT for "Welcome Admin" we actually WANT it on login/mount.
                // Logic: GlobalContext updates notifications on mount.

                // Better approach: Check if it's "read". New notifications are unread.
                if (!latest.read) {

                    // Prevent duplicate toasts for the same ID in this session
                    if (lastNotificationIdRef.current !== null || notifications.length === 1) { // Allow first if simple
                        showToast(latest.title, latest.message, latest.type as any, latest.link);
                    }
                }

                lastNotificationIdRef.current = latest.id;
            }
        }
    }, [notifications, showToast]);

    return null; // Headless component
};

export default NotificationListener;
