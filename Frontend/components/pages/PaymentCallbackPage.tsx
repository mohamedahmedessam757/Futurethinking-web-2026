// Payment Callback Page
// Handles redirect from Moyasar payment

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, Home, ArrowRight } from 'lucide-react';
import { paymentService } from '../../services/payment';
import { useGlobal } from '../GlobalContext';

const PaymentCallbackPage = () => {
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('');
    const { refreshData } = useGlobal();

    useEffect(() => {
        const processCallback = async () => {
            const result = paymentService.parseCallback();

            if (!result) {
                setStatus('failed');
                setMessage('رابط غير صالح');
                return;
            }

            if (result.status === 'paid') {
                setStatus('success');
                setMessage('تمت العملية بنجاح! تم تأكيد الدفع.');
                // Refresh data to get updated enrollments/purchases
                await refreshData();
            } else {
                setStatus('failed');
                setMessage(result.message || 'فشلت عملية الدفع');
            }
        };

        processCallback();
    }, [refreshData]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#020817] via-[#06152e] to-[#0a1628] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
            >
                {status === 'loading' && (
                    <>
                        <div className="w-20 h-20 mx-auto mb-6 bg-brand-gold/10 rounded-full flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-brand-gold animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">جاري التحقق...</h2>
                        <p className="text-gray-400">يرجى الانتظار بينما نتحقق من حالة الدفع.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.5 }}
                            className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30"
                        >
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-white mb-2">تم بنجاح! 🎉</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <a
                            href="/dashboard"
                            className="inline-flex items-center gap-2 bg-brand-gold text-brand-navy font-bold px-6 py-3 rounded-xl hover:bg-white transition-colors"
                        >
                            <ArrowRight size={18} />
                            الذهاب للوحة التحكم
                        </a>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30"
                        >
                            <XCircle className="w-10 h-10 text-red-500" />
                        </motion.div>
                        <h2 className="text-xl font-bold text-white mb-2">فشلت العملية</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => window.history.back()}
                                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
                            >
                                المحاولة مرة أخرى
                            </button>
                            <a
                                href="/"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-gold text-brand-navy font-bold rounded-xl hover:bg-white transition-colors"
                            >
                                <Home size={18} />
                                الرئيسية
                            </a>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default PaymentCallbackPage;
