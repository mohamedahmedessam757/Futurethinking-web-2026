import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ConsultantProfile } from '../types/store';

export interface Consultant extends ConsultantProfile {
    id: string; // User ID
    name: string;
    title: string;
    avatar: string;
    bio: string;
    role: string;
    email: string;
}

export const useConsultants = () => {
    const [consultants, setConsultants] = useState<Consultant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchConsultants = useCallback(async (force = false) => {
        if (hasLoaded && !force) return;

        setIsLoading(true);
        setError(null);

        try {
            // Join with profiles to get user info. 
            // We select directly from profiles table for user info.
            // Assuming 'consultant_profiles' has 'user_id' FK to 'profiles.id'
            const { data, error } = await supabase
                .from('consultant_profiles')
                .select(`
                    *,
                    user:profiles(id, name, title, avatar, bio, role, email)
                `);

            if (error) throw error;

            const mapped: Consultant[] = (data || []).map((cp: any) => ({
                userId: cp.user_id,
                specialization: cp.specialization,
                hourlyRate: cp.hourly_rate || 0,
                introVideoUrl: cp.intro_video_url,
                ratingAverage: cp.rating_average || 0,
                reviewsCount: cp.reviews_count || 0,
                isVerified: cp.is_verified || false,
                availableSlots: cp.available_slots || [],

                // User Details
                id: cp.user_id, // Consultants are users
                name: cp.user?.name || 'Unknown Consultant',
                title: cp.user?.title || 'Expert',
                avatar: cp.user?.avatar || '',
                bio: cp.user?.bio || '',
                role: cp.user?.role || 'consultant',
                email: cp.user?.email || ''
            }));

            setConsultants(mapped);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching consultants:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [hasLoaded]);

    return {
        consultants,
        isLoading,
        error,
        fetchConsultants,
        refetch: () => fetchConsultants(true)
    };
};
