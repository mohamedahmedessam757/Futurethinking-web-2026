
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, CheckCircle2, Plus, Loader2 } from 'lucide-react';
import { useDashboard } from './dashboard/DashboardContext';
import { useGlobal } from './GlobalContext';
import MoyasarForm from './MoyasarForm';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    amount: number | string;
    itemName: string;
    itemType?: string; // 'course', 'book', 'subscription', 'consultation'
    itemId?: string;
    metadata?: Record<string, any>;
}

const PaymentModal = ({ isOpen, onClose, onConfirm, amount, itemName, itemType = 'subscription', itemId = 'sub_upgrade', metadata = {} }: PaymentModalProps) => {
    const { initiatePayment, refreshData } = useDashboard();
    const { sendNotification, currentUser } = useGlobal(); // Get sendNotification from Global
    const [step, setStep] = useState<'method' | 'processing' | 'moyasar' | 'success'>('method');
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('method');
            setTransactionId(null);
            setLoading(false);
        }
    }, [isOpen]);

    const handleMoyasarSuccess = async (payment: any) => {
        // Payment successful on Moyasar side
        setStep('success');

        // Call onConfirm (optional specific logic)
        await onConfirm();

        // Refresh Global Data (to reflect backend updates from webhook)
        if (refreshData) await refreshData();

        setTimeout(() => {
            onClose();
            setStep('method');
        }, 3000);
    };

    const handleInitiatePayment = async () => {
        setLoading(true);
        try {
            // Convert amount to numeric if string
            const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

            const tx = await initiatePayment(
                numAmount,
                itemName,
                itemType,
                itemId
            );

            if (tx && tx.id) {
                // BYPASS: If simulation, skip Moyasar and go to success
                if (tx.id === 'SIMULATION-PASS') {
                    handleMoyasarSuccess({ id: 'simulated_tx', status: 'paid', message: 'Payment Simulated' });
                    return;
                }

                setTransactionId(tx.id);
                setStep('moyasar');
            }
        } catch (error: any) {
            console.error("Payment Initiation Failed", error);
            if (currentUser?.id) {
                sendNotification(currentUser.id, "فشل الدفع", "فشل في بدء عملية الدفع. يرجى المحاولة مرة أخرى.", "error");
            } else {
                // Fallback if no user
                // alert("فشل في بدء عملية الدفع. يرجى المحاولة مرة أخرى.");
                console.error("Payment failed (No User ID)");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#06152e]">
                    <div>
                        <h3 className="text-xl font-bold text-white">إتمام الدفع الآمن</h3>
                        <div className="flex items-center gap-1 text-green-400 text-xs mt-1">
                            <Lock size={12} /> تشفير 256-bit SSL | مدعوم بواسطة Moyasar
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/5 hover:bg-white/10 p-2 rounded-full text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">

                        {/* Step 1: Confirmation */}
                        {step === 'method' && (
                            <motion.div
                                key="method"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-400">المنتج</span>
                                        <span className="text-white font-bold">{itemName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="text-gray-400">الإجمالي</span>
                                        <span className="text-brand-gold font-bold">{amount} <span className="text-sm">ر.س</span></span>
                                    </div>
                                </div>

                                {parseFloat(String(amount)) > 0 ? (
                                    <button
                                        onClick={handleInitiatePayment}
                                        disabled={loading}
                                        className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-gold hover:text-brand-navy transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                                        {loading ? 'جاري التحضير...' : 'دفع آمن بالبطاقة'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleMoyasarSuccess({ id: 'FREE-TX', status: 'paid' })}
                                        className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 size={20} /> إتمام (مجاني)
                                    </button>
                                )}
                            </motion.div>
                        )}

                        {/* Step 2: Moyasar Form */}
                        {step === 'moyasar' && transactionId && (
                            <motion.div
                                key="moyasar"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <MoyasarForm
                                    amount={(typeof amount === 'string' ? parseFloat(amount) : amount) * 100} // Halalas
                                    currency="SAR"
                                    description={itemName}
                                    publishableKey={import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY || ''}
                                    callbackUrl={window.location.href} // Or a dedicated success page
                                    metadata={{
                                        transaction_id: transactionId,
                                        ...metadata
                                    }}
                                    onCompleted={handleMoyasarSuccess}
                                    onFailed={(error) => {
                                        console.error('Payment failed:', error);
                                        if (currentUser?.id) {
                                            sendNotification(currentUser.id, "فشل الدفع", "فشلت عملية الدفع. يرجى المحاولة مرة أخرى.", "error");
                                        } else {
                                            alert('فشلت عملية الدفع. يرجى المحاولة مرة أخرى.');
                                        }
                                        setStep('method');
                                        setLoading(false);
                                    }}
                                />
                            </motion.div>
                        )}

                        {/* Step 3: Success */}
                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">تم الدفع بنجاح!</h3>
                                <p className="text-gray-400">شكراً لك، تم تأكيد اشتراكك بنجاح.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentModal;
