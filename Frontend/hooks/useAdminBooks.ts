import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Book } from '../components/GlobalContext';

interface UseAdminBooksOptions {
    page?: number;
    limit?: number;
    status?: 'all' | 'active' | 'draft';
    search?: string;
}

export const useAdminBooks = ({ page = 1, limit = 10, status = 'all', search = '' }: UseAdminBooksOptions) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);

    const fetchBooks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('books')
                .select('*', { count: 'exact' });

            // Apply Filters
            if (status !== 'all') {
                query = query.eq('status', status);
            }

            if (search) {
                query = query.ilike('title', `%${search}%`);
            }

            // Apply Pagination
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to).order('created_at', { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            // Transform data (snake_case -> camelCase)
            const mappedBooks = (data || []).map((b: any) => ({
                ...b,
                coverImage: b.cover_image,
                fileUrl: b.file_url,
                previewUrl: b.preview_url, // Map preview_url to previewUrl
                publishYear: b.publish_year,
                // Ensure other fields if needed, but spread ...b keeps original keys too just in case
            }));

            setBooks(mappedBooks);
            setTotalCount(count || 0);

        } catch (err: any) {
            console.error('[useAdminBooks] Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, limit, status, search]);

    // Initial Fetch
    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('admin-books-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'books' },
                () => {
                    fetchBooks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchBooks]);

    return {
        books,
        loading,
        error,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        refresh: fetchBooks
    };
};
