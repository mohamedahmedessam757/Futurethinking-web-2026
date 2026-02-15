import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types/store';

export const useAppointments = (userId: string | undefined, role: string | undefined) => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchAppointments = useCallback(async (force = false) => {
        if (!userId || (hasLoaded && !force)) return;

        setIsLoading(true);
        setError(null);

        try {
            let query = supabase.from('appointments').select('*').order('date', { ascending: false });

            if (role === 'admin') {
                // Admin sees all
            } else if (role === 'consultant') {
                query = query.eq('consultant_id', userId);
            } else {
                query = query.eq('student_id', userId);
            }

            const { data, error } = await query;

            if (error) throw error;

            const mapped: Appointment[] = (data || []).map(a => ({
                id: parseInt(a.id.replace(/-/g, '').slice(0, 8), 16) || Date.now(),
                title: a.title,
                date: a.date,
                time: a.time,
                type: a.type,
                status: a.status,
                expertName: a.consultant_name,
                studentName: a.student_name,
                studentId: a.student_id,
                expertId: a.consultant_id,
                preferredPlatform: a.preferred_platform,
                meetingLink: a.meeting_link,
            }));

            setAppointments(mapped);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching appointments:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId, role, hasLoaded]);

    return {
        appointments,
        isLoading,
        error,
        fetchAppointments,
        refetch: () => fetchAppointments(true)
    };
};
