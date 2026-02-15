import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export const realtimeService = {
    /**
     * Subscribe to generation updates (overall status)
     */
    subscribeToGeneration: (generationId: string, onUpdate: (payload: any) => void): RealtimeChannel => {
        return supabase
            .channel(`generation-${generationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'ai_course_generations',
                    filter: `id=eq.${generationId}`,
                },
                (payload) => onUpdate(payload.new)
            )
            .subscribe();
    },

    /**
     * Subscribe to lessons updates (content changes)
     */
    subscribeToLessons: (generationId: string, onUpdate: (payload: any) => void): RealtimeChannel => {
        return supabase
            .channel(`lessons-${generationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'ai_generated_lessons',
                    filter: `generation_id=eq.${generationId}`,
                },
                (payload) => onUpdate(payload)
            )
            .subscribe();
    },

    /**
     * Subscribe to generation status updates (for progress bars)
     */
    subscribeToGenStatus: (generationId: string, onStatus: (payload: any) => void): RealtimeChannel => {
        return supabase
            .channel(`gen-status-${generationId}`)
            .on('broadcast', { event: 'status' }, (payload) => onStatus(payload.payload))
            .subscribe();
    },

    /**
     * Broadcast generation status
     */
    broadcastStatus: async (generationId: string, status: any) => {
        const channel = supabase.channel(`gen-status-${generationId}`);
        await channel.subscribe(async (statusStr) => {
            if (statusStr === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'status',
                    payload: status,
                });
                supabase.removeChannel(channel);
            }
        });
    },

    /**
     * Track user presence (who is editing)
     */
    subscribeToPresence: (generationId: string, userId: string, onSync: (users: any[]) => void): RealtimeChannel => {
        const channel = supabase.channel(`presence-${generationId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users = Object.values(newState).flat();
                onSync(users);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return channel;
    },

    /**
     * Unsubscribe
     */
    unsubscribe: (channel: RealtimeChannel) => {
        supabase.removeChannel(channel);
    }
};
