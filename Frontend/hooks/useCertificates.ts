import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Certificate } from '../types/store';

export const useCertificates = (userId: string | undefined) => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchCertificates = useCallback(async (force = false) => {
        if (!userId || (hasLoaded && !force)) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('certificates')
                .select('*')
                .eq('student_id', userId)
                .order('issue_date', { ascending: false });

            if (error) throw error;

            const mapped: Certificate[] = (data || []).map(c => ({
                id: c.id,
                studentId: c.student_id,
                studentName: c.student_name,
                courseId: c.course_id,
                courseTitle: c.course_title || c.course_name, // Fallback if needed
                instructor: c.instructor_name,
                issueDate: c.issue_date,
                serialNumber: c.serial_number,
                // certificateUrl: c.certificate_url, // Removed as it's not in the interface
                // grade: c.grade // Removed as it's not in the interface
            }));

            setCertificates(mapped);
            setHasLoaded(true);
        } catch (err: any) {
            console.error('Error fetching certificates:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId, hasLoaded]);

    return {
        certificates,
        isLoading,
        error,
        fetchCertificates,
        refetch: () => fetchCertificates(true)
    };
};
