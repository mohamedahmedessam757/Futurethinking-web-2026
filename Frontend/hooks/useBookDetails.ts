import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Book } from '../types/store';

export const useBookDetails = (bookId: string | null | undefined) => {
    const [book, setBook] = useState<Book | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!bookId) {
            setBook(null);
            return;
        }

        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const { data: b, error: bookError } = await supabase
                    .from('books')
                    .select('*')
                    .eq('id', bookId)
                    .single();

                if (bookError) throw bookError;
                if (!b) throw new Error('Book not found');

                // Fetch reviews
                const { data: reviews, error: reviewsError } = await supabase
                    .from('reviews')
                    .select('*')
                    .eq('target_id', bookId)
                    .eq('target_type', 'book');

                if (reviewsError) throw reviewsError;

                const fullBook: Book = {
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
                    owners: [], // We can fetch this if needed, but for public view it's not critical
                    reviews: (reviews || []).map((r: any) => ({
                        id: r.id,
                        userId: r.user_id,
                        userName: r.user_name,
                        userAvatar: r.user_avatar,
                        rating: r.rating,
                        comment: r.comment,
                        date: r.created_at?.split('T')[0],
                        adminReply: r.admin_reply,
                    })),
                };

                setBook(fullBook);
            } catch (err: any) {
                console.error('Error fetching book details:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [bookId]);

    return { book, isLoading, error };
};
