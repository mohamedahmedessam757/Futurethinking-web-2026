import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../components/GlobalContext';

interface UseAdminUsersOptions {
    page?: number;
    limit?: number;
    role?: 'all' | 'admin' | 'student' | 'consultant';
    search?: string;
}

export const useAdminUsers = ({ page = 1, limit = 10, role = 'all', search = '' }: UseAdminUsersOptions) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' });

            // Apply Filters
            if (role !== 'all') {
                if (role === 'consultant') {
                    query = query.in('role', ['consultant', 'instructor']);
                } else {
                    query = query.eq('role', role);
                }
            }

            if (search) {
                query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
            }

            // Apply Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            setUsers(data as any || []);
            setTotalCount(count || 0);

        } catch (err: any) {
            console.error('[useAdminUsers] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, limit, role, search]);

    // Initial Fetch
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('admin-users-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    fetchUsers();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchUsers]);

    return {
        users,
        loading,
        error,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        refresh: fetchUsers
    };
};
