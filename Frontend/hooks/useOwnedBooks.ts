import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Book } from '../types/store';

export const useOwnedBooks = (userId: string | undefined) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchOwnedBooks = useCallback(async (force = false) => {
        if (!userId || (hasLoaded && !force)) return;

        setIsLoading(true);
        setError(null);

        try {
            // Fetch from book_purchases table
            const { data, error } = await supabase
                .from('book_purchases')
                .select(`
                    *,
                    book:books(*)
                `)
                .eq('user_id', userId);

            if (error) throw error;

            const mappedBooks: any[] = (data || []).map((purchase: any) => {
                const b = purchase.book;
                if (!b) return null;

                return {
                    id: b.id,
                    title: b.title,
                    author: b.author,
                    description: b.description,
                    price: b.price,
                    coverImage: b.cover_image,
                    fileUrl: b.file_url,
                    category: b.category,
                    owners: [], // No longer needed or accessible
                    reviews: [], // Reviews fetch removed for now
                    rating: 5, // Default or fetch separately
                    owned: true,
                    purchaseDate: purchase.created_at // specific to this user's purchase
                };
            }).filter(Boolean);

            setBooks(mappedBooks);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching owned books:', err);
            setError(err.message || 'Failed to fetch books');
        } finally {
            setIsLoading(false);
        }
    }, [userId, hasLoaded]);

    return {
        books,
        isLoading,
        error,
        fetchBooks: fetchOwnedBooks,
        refetch: () => fetchOwnedBooks(true)
    };
};
