import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types/store';

export const useTransactions = (userId: string | undefined, role: string | undefined) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchTransactions = useCallback(async (force = false) => {
        if (!userId || (hasLoaded && !force)) return;

        setIsLoading(true);
        setError(null);

        try {
            let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });

            if (role !== 'admin') {
                query = query.eq('user_id', userId);
            }

            const { data, error } = await query;

            if (error) throw error;

            const mapped: Transaction[] = (data || []).map(t => ({
                id: t.id,
                userId: t.user_id,
                userName: t.user_name,
                item: t.item_name,
                itemType: t.item_type,
                amount: t.amount,
                status: t.status,
                date: t.created_at?.split('T')[0],
                method: t.payment_method,
            }));

            setTransactions(mapped);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching transactions:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId, role, hasLoaded]);

    return {
        transactions,
        isLoading,
        error,
        fetchTransactions,
        refetch: () => fetchTransactions(true)
    };
};
