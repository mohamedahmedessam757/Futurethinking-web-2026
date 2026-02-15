import React, { useEffect, useState } from 'react';
import { AICanvasEditor } from './AICanvasEditor';
import { useCanvasStore } from '../../../services/canvasStore';
import { useGlobal } from '../../GlobalContext';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

const StandaloneEditorPage = () => {
    const { currentUser, isLoading } = useGlobal();
    const { setGenerationId } = useCanvasStore();
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Get Draft ID from URL
        const params = new URLSearchParams(window.location.search);
        const draftId = params.get('id'); // e.g. ?id=123

        if (!draftId) {
            setError('رقم المسودة غير موجود في الرابط');
            setInitializing(false);
            return;
        }

        // 2. Set ID in Store
        setGenerationId(draftId);
        setInitializing(false);

    }, [setGenerationId]);

    // Back Handler
    const handleBack = () => {
        // Navigate back to Admin Dashboard -> AI Drafts Tab
        if ((window as any).navigateApp) {
            // We need to ensure the URL parameter is set for the dashboard to pick it up
            // Since navigateApp might just switch component state, we might need to force a URL update or rely on AdminDashboard's init logic if we full reload. 
            // Better approach: Navigate to 'admin' and let the dashboard handle it via a new prop or just relying on the fact that we can push state before navigating.

            const newUrl = new URL(window.location.href);
            newUrl.pathname = '/'; // Reset path if needed, or just keep it
            newUrl.searchParams.set('tab', 'ai-drafts');
            window.history.pushState({}, '', newUrl.toString());

            (window as any).navigateApp('admin');
        } else {
            window.location.href = '/?tab=ai-drafts';
        }
    };

    // --- Loading State ---
    if (isLoading || initializing) {
        return (
            <div className="min-h-screen bg-[#06152e] flex flex-col items-center justify-center text-white" dir="rtl">
                <Loader2 className="w-10 h-10 text-brand-gold animate-spin mb-4" />
                <p className="text-gray-400">جاري تحميل المحرر...</p>
            </div>
        );
    }

    // --- Auth Guard ---
    if (!currentUser || currentUser.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#06152e] flex flex-col items-center justify-center text-white" dir="rtl">
                <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">غير مصرح لك بالدخول</h2>
                    <p className="text-gray-400 mb-6">هذه الصفحة مخصصة للمشرفين فقط.</p>
                    <button
                        onClick={handleBack}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="min-h-screen bg-[#06152e] flex flex-col items-center justify-center text-white" dir="rtl">
                <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 text-center max-w-md">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">خطأ</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={handleBack}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        العودة للوحة التحكم
                    </button>
                </div>
            </div>
        );
    }

    // --- Main Editor Redirect ---
    return (
        <AICanvasEditor onBack={handleBack} />
    );
};

export default StandaloneEditorPage;
