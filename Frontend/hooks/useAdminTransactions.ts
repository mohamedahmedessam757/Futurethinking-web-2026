import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AdminTransaction } from '../components/admin/AdminContext';

export const useAdminTransactions = () => {
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ revenue: 0, pending: 0, total: 0, failed_refunded: 0 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed' | 'refunded'>('all');
    const [filteredCount, setFilteredCount] = useState(0);

    const fetchStats = useCallback(async () => {
        try {
            // Parallel counts & Revenue Optimization
            // We use RPC for revenue to avoid fetching millions of rows
            const [pending, failed, refunded, total, revenueResult] = await Promise.all([
                supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
                supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'refunded'),
                supabase.from('transactions').select('*', { count: 'exact', head: true }),
                supabase.rpc('get_total_revenue') // SCALABLE: Server-side calculation
            ]);

            const revenue = revenueResult?.data || 0;

            setStats({
                revenue,
                pending: pending.count || 0,
                failed_refunded: (failed.count || 0) + (refunded.count || 0),
                total: total.count || 0
            });
        } catch (error) {
            console.error('Error fetching transaction stats:', error);
        }
    }, []);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('transactions')
                .select('*', { count: 'exact' });

            // Apply Filters
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            if (search) {
                const searchTerm = search.trim();
                // Check if search term is a valid UUID
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm);

                if (isUUID) {
                    // Exact match for ID
                    query = query.eq('id', searchTerm);
                } else {
                    // Text search on other fields (avoiding ID to prevent invalid input syntax for type uuid)
                    // Sanitize search term for ILIKE to prevent syntax errors
                    const safeSearch = searchTerm.replace(/[%,]/g, '');
                    if (safeSearch) {
                        query = query.or(`user_name.ilike.%${safeSearch}%,item_name.ilike.%${safeSearch}%,payment_method.ilike.%${safeSearch}%`);
                    }
                }
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Map to AdminTransaction type
            setTransactions((data || []).map((t: any) => ({
                id: t.id,
                userId: t.user_id,
                userName: t.user_name,
                item: t.item_name,
                itemType: t.item_type,
                amount: t.amount,
                status: t.status,
                date: t.created_at?.split('T')[0] || t.new_date || t.created_at, // Handle potential date fields
                method: t.payment_method,
            })));

            if (count !== null) setFilteredCount(count);

        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, statusFilter, search]);

    // Initial Fetch
    useEffect(() => {
        fetchTransactions();
        fetchStats();
    }, [fetchTransactions, fetchStats]);

    const refresh = async () => {
        await Promise.all([fetchTransactions(), fetchStats()]);
    };

    // Real-time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('admin-transactions-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions',
                },
                () => {
                    refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        transactions,
        loading,
        stats,
        totalCount: filteredCount, // Total matching filters
        globalTotal: stats.total, // Total in DB
        totalPages: Math.ceil(filteredCount / pageSize),
        currentPage: page,
        setCurrentPage: setPage,
        itemsPerPage: pageSize,
        setItemsPerPage: setPageSize,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        refresh,
    };
};
