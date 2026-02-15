// Auth Callback Page - Handles OAuth redirects from Google
// Location: Frontend/components/pages/AuthCallbackPage.tsx
// SIMPLIFIED VERSION: Only verifies session and redirects
// Profile creation is handled by GlobalContext auth listener

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

type CallbackStatus = 'loading' | 'success' | 'error';

const AuthCallbackPage = () => {
    const [status, setStatus] = useState<CallbackStatus>('loading');
    const [message, setMessage] = useState('جاري التحقق من الحساب...');

    useEffect(() => {
        let isMounted = true;

        const handleCallback = async () => {
            try {
                // Give a small delay for the auth state to settle
                await new Promise(resolve => setTimeout(resolve, 500));

                // Step 1: Get session from Supabase
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (sessionError) {
                    console.error('[OAuth Callback] Session error:', sessionError.message);
                    setStatus('error');
                    setMessage(sessionError.message);
                    return;
                }

                if (!session?.user) {
                    console.error('[OAuth Callback] No session found');
                    setStatus('error');
                    setMessage('لم يتم العثور على بيانات الجلسة. يرجى المحاولة مرة أخرى.');
                    return;
                }

                // Step 2: Success! The GlobalContext auth listener will handle:
                // - Profile creation for new users
                // - Loading user data
                // - Setting up realtime subscriptions
                setStatus('success');
                setMessage('تم تسجيل الدخول بنجاح! جاري التحويل...');

                // Step 3: Redirect to home - App.tsx will handle role-based routing
                // Use a short delay to show the success message
                setTimeout(() => {
                    if (isMounted) {
                        // Clean redirect - no localStorage tricks
                        window.location.href = '/';
                    }
                }, 1500);

            } catch (err: any) {
                console.error('[OAuth Callback] Error:', err);
                if (isMounted) {
                    setStatus('error');
                    setMessage(err.message || 'حدث خطأ أثناء تسجيل الدخول.');
                }
            }
        };

        handleCallback();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020817] via-[#06152e] to-[#0a1628] flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">

                {/* Loading State */}
                {status === 'loading' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-brand-gold/10 rounded-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">جاري التحقق...</h2>
                        <p className="text-gray-400">{message}</p>
                    </>
                )}

                {/* Success State */}
                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">مرحباً بك! 🎉</h2>
                        <p className="text-gray-400">{message}</p>
                        <div className="mt-4">
                            <Loader2 className="w-5 h-5 text-brand-gold animate-spin mx-auto" />
                        </div>
                    </>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">حدث خطأ</h2>
                        <p className="text-gray-400 mb-6">{message}</p>

                        <a
                            href="/auth"
                            className="inline-block px-6 py-3 bg-brand-gold text-brand-navy font-bold rounded-xl hover:bg-white transition-colors"
                        >
                            العودة لتسجيل الدخول
                        </a>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthCallbackPage;
