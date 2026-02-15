import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ConsultationService } from '../types/store';

// Extend ConsultationService to include consultant name from join
export interface AdminConsultationService extends ConsultationService {
    consultant?: {
        name: string;
        avatar?: string;
    };
    // If join returns 'profiles' array/object depending on relationship
    profiles?: {
        name: string;
        avatar?: string;
    };
}

export const useAdminConsultations = () => {
    const [consultations, setConsultations] = useState<AdminConsultationService[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'draft'>('all');

    const fetchConsultations = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('consultation_services')
                .select('*, profiles(name, avatar)', { count: 'exact' });

            // Apply Filters
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (search) {
                // Search by title or consultant name is tricky with join.
                // Supabase doesn't easily support search on joined table valid in .or() with main table.
                // We'll search title first. For consultant name, it's harder server-side without separate query or complex RLS/View.
                // For now, let's search title and description.
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Map data to handle the joined 'profiles'
            const mappedData = (data || []).map((item: any) => ({
                ...item,
                consultantId: item.consultant_id,
                consultant: item.profiles, // 'profiles' matches the relation name
            }));

            setConsultations(mappedData);
            if (count !== null) setTotalCount(count);

        } catch (err) {
            console.error('Error fetching consultations:', err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, statusFilter, search]);

    // Initial Fetch
    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('admin-consultations-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'consultation_services',
                },
                () => {
                    fetchConsultations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchConsultations]);

    return {
        consultations,
        loading,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        setCurrentPage: setPage,
        itemsPerPage: pageSize,
        setItemsPerPage: setPageSize,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        refresh: fetchConsultations,
    };
};
