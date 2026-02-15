import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Book } from '../types/store';

export const useBooks = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchBooks = useCallback(async (force = false) => {
        if (hasLoaded && !force) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedBooks: Book[] = (data || []).map(b => ({
                id: b.id,
                title: b.title,
                author: b.author,
                description: b.description,
                price: b.price,
                coverImage: b.cover_image,
                fileUrl: b.file_url,
                previewUrl: b.preview_url,
                category: b.category,
                pages: b.pages,
                publishYear: b.publish_year,
                status: b.status,
                owners: [], // Detail view only
                reviews: [] // Detail view only
            }));

            setBooks(mappedBooks);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching books:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [hasLoaded]);

    return {
        books,
        isLoading,
        error,
        fetchBooks,
        refetch: () => fetchBooks(true)
    };
};
