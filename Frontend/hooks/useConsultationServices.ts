import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ConsultationService } from '../types/store';

export interface ServiceWithConsultant extends ConsultationService {
    consultantName: string;
    consultantAvatar: string;
    consultantTitle: string;
    consultantId: string; // The user ID of the consultant
}

export const useConsultationServices = () => {
    const [services, setServices] = useState<ServiceWithConsultant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchServices = useCallback(async (force = false) => {
        if (hasLoaded && !force) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch services with consultant details
            // We join consultation_services -> consultant_profiles -> profiles
            // Note: 'consultant_id' in consultation_services refers to the profile/user id usually. 
            // Let's verify foreign key: usually consultant_id -> profiles.id or consultant_profiles.user_id

            const { data, error } = await supabase
                .from('consultation_services')
                .select(`
                    *,
                    consultant:profiles(id, name, avatar, title)
                `)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedServices: ServiceWithConsultant[] = (data || []).map((s: any) => {
                const user = s.consultant;
                // 'consultant' here is the joined profile directly
                return {
                    id: s.id,
                    consultantId: s.consultant_id,
                    title: s.title,
                    description: s.description,
                    price: s.price,
                    duration: s.duration,
                    status: s.status,

                    // Flatten consultant details
                    consultantName: user?.name || 'مستشار',
                    consultantAvatar: user?.avatar || '',
                    consultantTitle: user?.title || 'خبير',
                };
            });

            setServices(mappedServices);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching consultation services:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [hasLoaded]);

    return {
        services,
        isLoading,
        error,
        fetchServices,
        refetch: () => fetchServices(true)
    };
};
