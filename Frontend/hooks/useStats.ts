import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface PlatformStats {
    activeLearnersCount: number;
    activeCoursesCount: number;
    consultantsCount: number;
    totalExperienceYears: number; // For the "+25" logic
}

export const useStats = () => {
    const [stats, setStats] = useState<PlatformStats>({
        activeLearnersCount: 0,
        activeCoursesCount: 0,
        consultantsCount: 0,
        totalExperienceYears: 25 // Default base
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Run count queries in parallel with filters
                const [
                    { count: students },
                    { count: courses },
                    // { count: consultants }
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
                    supabase.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                    // supabase.from('consultant_profiles').select('*', { count: 'exact', head: true })
                ]);

                setStats(prev => ({
                    ...prev,
                    activeLearnersCount: students || 0,
                    activeCoursesCount: courses || 0,
                }));
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, isLoading };
};
