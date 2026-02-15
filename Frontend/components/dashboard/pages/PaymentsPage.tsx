
import React, { useState } from 'react';
import { CreditCard, Download, FileText, CheckCircle2, X, ShieldCheck, Printer, Trash2, AlertCircle, Check } from 'lucide-react';
import { useDashboard } from '../DashboardContext';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentModal from '../../PaymentModal'; // Import the new modal

const LOGO_URL = "/Primary.png";

// --- Assets for Moyasar Simulation ---
const VisaLogo = () => <svg className="h-6 w-auto" viewBox="0 0 48 48" fill="none"><path fill="#fff" d="M0 0h48v48H0z" /><path d="M18.3 29.6l1.7-10.4h2.8l-1.6 10.4h-2.9zm4.9-10.2c-.1 0-2.7 0-3.3 0-.6 0-1 .1-1.3.5l-4.5 10.9h3l.6-1.7h3.7l.4 1.7h2.6l-1.2-11.4zM20.2 26l1.5-4.1.9 4.1h-2.4zM32.8 19.3c-1 0-1.8.5-2.2 1.2l-.1-.9h-2.7c.1.4.3 1.9.3 1.9l-2.6 12.3h3l1.6-7.8c.4-1.3 1.5-1.5 1.9-1.5.3 0 .7 0 .9.1v-2.7c-.3 0-.7-.1-1.1-.1zM42.3 22c-1.3-.7-2.1-1.1-2.1-1.8 0-.6.7-.8 1.4-.8.7 0 2 .2 2.7.5l.5-2.4c-.9-.4-2.1-.6-3.2-.6-3.4 0-5.7 1.8-5.7 4.3 0 1.9 1.7 2.9 3 3.5 1.3.7 1.8 1.1 1.8 1.7 0 .9-1.1 1.3-2.1 1.3-1.4 0-3.2-.6-4.1-1.3l-.6 2.5c1.2.6 2.8 1 4.3 1 3.7 0 6.2-1.8 6.2-4.6.1-1.6-1-2.8-2.1-3.3z" fill="#1434CB" /></svg>;

// Dummy initial cards - Removed as per user request
const INITIAL_CARDS: any[] = [];

const PaymentsPage = () => {
    const { transactions, user, upgradeSubscription, addTransaction } = useDashboard();

    // Modals State
    const [showPlansModal, setShowPlansModal] = useState(false);
    const [viewInvoice, setViewInvoice] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false); // Controls the new PaymentModal component

    // Logic State
    const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: number, tier: 'pro' | 'enterprise' } | null>(null);
    const [showDeleteToast, setShowDeleteToast] = useState(false);

    // Cards State
    const [savedCards, setSavedCards] = useState(INITIAL_CARDS);

    const isPro = user.subscriptionTier !== 'free';

    // --- Handlers ---

    const openPlanSelection = () => {
        setShowPlansModal(true);
    };

    const handleSelectPlan = (plan: any) => {
        if (user.subscriptionTier === plan.tier) return;
        setSelectedPlan(plan);
        setShowPlansModal(false);
        setShowPaymentModal(true); // Open the unified payment modal
    };

    const handlePaymentConfirm = async () => {
        // Payment verification and subscription upgrade are handled by the backend webhook.
        // However, if the plan is free (price 0), we must manually upgrade.
        if (selectedPlan && selectedPlan.price === 0) {
            upgradeSubscription(selectedPlan.tier);
            addTransaction({
                desc: `ترقية الاشتراك: ${selectedPlan.name}`,
                amount: '0',
                date: new Date().toISOString().split('T')[0],
                status: 'paid'
            });
        }
        // The UI will refresh automatically via PaymentModal's refreshData logic.
    };

    const handleDeleteCard = (id: number) => {
        setSavedCards(prev => prev.filter(c => c.id !== id));
        setShowDeleteToast(true);
        setTimeout(() => setShowDeleteToast(false), 3000);
    };

    const plans = [
        { id: 'pro', name: 'باقة المحترفين', price: 49, tier: 'pro', features: ['وصول لكافة الكورسات', 'شهادات معتمدة', 'أولوية في الاستشارات'] },
        { id: 'ent', name: 'باقة المؤسسات', price: 199, tier: 'enterprise', features: ['كل مميزات المحترفين', 'جلسات استشارية مجانية', 'مدير حساب خاص'] }
    ];

    return (
        <div className="space-y-8 relative">
            {/* Robust Print Styles (Kept for manual print support via browser menu) */}
            <style>{`
        @media print {
            @page { size: auto; margin: 0mm; }
            
            body {
                background-color: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* Hide everything by default */
            body > * { display: none !important; }
            
            /* Show only the invoice modal wrapper */
            body > div:has(#invoice-modal-content) {
                display: block !important;
            }

            /* Isolate and style the invoice content */
            #invoice-modal-content {
                display: block !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: white !important;
                color: black !important;
                z-index: 99999 !important;
                visibility: visible !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                overflow: visible !important;
            }

            #invoice-modal-content * {
                visibility: visible !important;
            }

            /* Override Dark Mode Colors for Print */
            #invoice-header {
                background-color: #f3f4f6 !important; /* Light Gray Header */
                color: #000 !important;
                border-bottom: 2px solid #000 !important;
            }
            
            #invoice-header h1, #invoice-header h2, #invoice-header p {
                color: #000 !important;
            }

            /* Ensure text is black on white paper */
            #invoice-modal-content .text-white { color: #000 !important; }
            #invoice-modal-content .text-gray-300 { color: #4b5563 !important; }
            #invoice-modal-content .text-gray-400 { color: #374151 !important; }
            #invoice-modal-content .text-gray-500 { color: #1f2937 !important; }
            #invoice-modal-content .text-brand-gold { color: #c6a568 !important; }
            
            #invoice-modal-content table th { color: #000 !important; border-color: #000 !important; }
            #invoice-modal-content table td { color: #000 !important; }

            /* Fix Logo for white paper */
            #invoice-logo {
                filter: brightness(0) !important; /* Make logo black */
            }

            /* Hide Buttons */
            .no-print, button {
                display: none !important;
            }
        }
       `}</style>

            {/* Unified Payment Modal */}
            {selectedPlan && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onConfirm={handlePaymentConfirm}
                    amount={selectedPlan?.price || 0}
                    itemName={selectedPlan?.name || ''}
                    itemType="subscription"
                    itemId={selectedPlan?.tier}
                />
            )}

            {/* Delete Toast */}
            <AnimatePresence>
                {showDeleteToast && (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-red-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-bold"
                    >
                        <Trash2 size={18} /> تم حذف البطاقة بنجاح
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center md:text-right">
                <h1 className="text-3xl font-bold text-white mb-2">الفواتير والمدفوعات</h1>
                <p className="text-gray-400">سجل كامل لجميع مشترياتك (كورسات، كتب، استشارات) وإدارة بطاقاتك.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Plan Card */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-b from-[#0f2344] to-[#06152e] border border-white/10 rounded-3xl p-8 relative overflow-hidden h-full flex flex-col shadow-2xl">
                        <div className={`absolute top-0 right-0 text-[#06152e] text-xs font-bold px-3 py-1 rounded-bl-xl ${isPro ? 'bg-brand-gold' : 'bg-gray-400'}`}>
                            {isPro ? 'نشط' : 'مجاني'}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">الخطة الحالية</p>
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {user.subscriptionTier === 'free' ? 'الخطة المجانية' : user.subscriptionTier === 'pro' ? 'باقة المحترفين' : 'باقة المؤسسات'}
                        </h2>

                        <div className="flex items-baseline gap-1 mb-8">
                            {user.subscriptionTier === 'free' ? (
                                <span className="text-4xl font-bold text-white">0</span>
                            ) : user.subscriptionTier === 'pro' ? (
                                <span className="text-4xl font-bold text-white">49</span>
                            ) : (
                                <span className="text-4xl font-bold text-white">199</span>
                            )}
                            <span className="text-sm text-brand-gold font-bold"> ر.س</span>
                            <span className="text-gray-500">/ شهرياً</span>
                        </div>

                        <div className="space-y-3 mt-auto">
                            <button
                                onClick={openPlanSelection}
                                className="w-full bg-brand-gold text-brand-navy font-bold py-3 rounded-xl hover:bg-white transition-colors shadow-lg hover:shadow-brand-gold/20"
                            >
                                {isPro ? 'تغيير الخطة' : 'ترقية الخطة الآن'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="lg:col-span-2">
                    <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h3 className="font-bold text-white text-lg">طرق الدفع المحفوظة</h3>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <AnimatePresence>
                                {savedCards.length > 0 ? (
                                    savedCards.map(card => (
                                        <motion.div
                                            key={card.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                                            className="flex items-center gap-4 bg-[#06152e] p-4 rounded-2xl border border-white/10 relative overflow-hidden group hover:border-brand-gold transition-colors"
                                        >
                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-gold"></div>
                                            <div className="w-14 h-9 bg-white rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                                                <VisaLogo />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                                    {card.type} منتهي بـ {card.number}
                                                    {card.isDefault && <span className="bg-brand-gold/20 text-brand-gold text-[10px] px-2 py-0.5 rounded-full">أساسي</span>}
                                                </p>
                                                <p className="text-xs text-gray-500">ينتهي في {card.expiry}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCard(card.id)}
                                                className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full"
                                                title="حذف البطاقة نهائياً"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-10 text-gray-500 flex flex-col items-center"
                                    >
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <CreditCard size={32} className="opacity-40" />
                                        </div>
                                        <p>لا توجد طرق دفع محفوظة.</p>
                                        <p className="text-xs mt-2 text-gray-600">سيطلب منك إدخال البيانات عند الشراء.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PLANS MODAL --- */}
            <AnimatePresence>
                {showPlansModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowPlansModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 md:p-8 text-center bg-[#06152e]">
                                <h2 className="text-2xl font-bold text-white mb-2">اختر الخطة المناسبة لك</h2>
                                <p className="text-gray-400">استثمر في مستقبلك مع باقات فكر المستقبل المميزة.</p>
                                <button onClick={() => setShowPlansModal(false)} className="absolute top-6 left-6 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full"><X size={20} /></button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 p-8">
                                {plans.map((plan) => (
                                    <div key={plan.id} className={`bg-[#0f2344]/50 border ${user.subscriptionTier === plan.tier ? 'border-brand-gold bg-brand-gold/5' : 'border-white/10 hover:border-brand-gold/50'} rounded-2xl p-6 relative group transition-all`}>
                                        {user.subscriptionTier === plan.tier && <div className="absolute top-4 left-4 bg-brand-gold text-brand-navy text-xs font-bold px-2 py-1 rounded">بافتك الحالية</div>}
                                        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                        <div className="text-3xl font-bold text-white mb-6">{plan.price} <span className="text-sm font-medium text-gray-400">ر.س / شهر</span></div>
                                        <ul className="space-y-3 mb-8">
                                            {plan.features.map((feat, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <CheckCircle2 size={16} className="text-brand-gold" /> {feat}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            disabled={user.subscriptionTier === plan.tier}
                                            className={`w-full py-3 rounded-xl font-bold transition-all ${user.subscriptionTier === plan.tier ? 'bg-white/5 text-gray-500 cursor-not-allowed' : 'bg-brand-gold text-brand-navy hover:bg-white shadow-lg'}`}
                                        >
                                            {user.subscriptionTier === plan.tier ? 'مفعلة حالياً' : 'اشترك الآن'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Invoices History Table */}
            <div className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#06152e]">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <FileText className="text-brand-gold" size={20} /> سجل المعاملات المالية
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right min-w-[700px]">
                        <thead className="bg-[#0f2344] text-xs text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">رقم العملية</th>
                                <th className="px-6 py-4">تفاصيل الخدمة/المنتج</th>
                                <th className="px-6 py-4">التاريخ</th>
                                <th className="px-6 py-4">المبلغ</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {transactions.length > 0 ? (
                                transactions.map((inv, i) => (
                                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-brand-gold font-mono text-xs">{inv.id}</td>
                                        <td className="px-6 py-4 text-white font-bold">{inv.desc}</td>
                                        <td className="px-6 py-4 text-gray-400">{inv.date}</td>
                                        <td className="px-6 py-4 text-white font-bold dir-ltr text-right">{inv.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 w-fit ${inv.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                                {inv.status === 'paid' ? <><CheckCircle2 size={12} /> ناجحة</> : 'معلقة'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <button
                                                onClick={() => setViewInvoice(inv)}
                                                className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-brand-navy p-2 rounded-lg border border-transparent hover:border-brand-gold/30"
                                                title="عرض الفاتورة"
                                            >
                                                <FileText size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500">لا توجد معاملات سابقة.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Modal */}
            <AnimatePresence>
                {viewInvoice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto" onClick={() => setViewInvoice(null)}>
                        <motion.div
                            id="invoice-modal-content"
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-lg shadow-2xl relative max-w-3xl w-full mx-auto my-8 overflow-hidden print:shadow-none print:w-full print:max-w-none print:my-0"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header Bar */}
                            <div id="invoice-header" className="bg-[#0f2c59] p-8 text-white flex justify-between items-start">
                                <div>
                                    <img id="invoice-logo" src={LOGO_URL} alt="Future Thinking" className="h-12 mb-4 object-contain brightness-0 invert" />
                                    <h1 className="text-2xl font-bold uppercase tracking-widest text-brand-gold">فاتورة ضريبية</h1>
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-bold">شركة فكر المستقبل</h2>
                                    <p className="text-xs text-gray-300 opacity-80 mt-1">الرياض، المملكة العربية السعودية</p>
                                    <p className="text-xs text-gray-300 opacity-80">info@futurethinking.sa</p>
                                </div>
                            </div>

                            {/* Invoice Info */}
                            <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">فاتورة إلى</p>
                                    <p className="text-gray-900 font-bold text-lg">{user.name}</p>
                                    <p className="text-sm text-gray-600">{user.email}</p>
                                </div>
                                <div className="text-left">
                                    <div className="flex gap-8">
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">رقم الفاتورة</p>
                                            <p className="text-gray-900 font-mono font-bold">#{viewInvoice.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold uppercase mb-1">التاريخ</p>
                                            <p className="text-gray-900 font-mono">{viewInvoice.date}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="p-8">
                                <table className="w-full text-right mb-8">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100">
                                            <th className="pb-4 text-xs font-bold text-gray-500 uppercase w-1/2">الوصف</th>
                                            <th className="pb-4 text-xs font-bold text-gray-500 uppercase text-center">الكمية</th>
                                            <th className="pb-4 text-xs font-bold text-gray-500 uppercase text-center">السعر</th>
                                            <th className="pb-4 text-xs font-bold text-gray-500 uppercase text-left">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-50">
                                            <td className="py-6">
                                                <p className="font-bold text-gray-800 text-lg">{viewInvoice.desc}</p>
                                                <p className="text-sm text-gray-500">عملية شراء رقمية</p>
                                            </td>
                                            <td className="py-6 text-center text-gray-600 font-mono">1</td>
                                            <td className="py-6 text-center text-gray-600 font-mono">{viewInvoice.amount}</td>
                                            <td className="py-6 text-left font-bold text-gray-900 font-mono">{viewInvoice.amount}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Summary */}
                                <div className="flex justify-end">
                                    <div className="w-1/2 md:w-1/3 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">المجموع الفرعي</span>
                                            <span className="font-bold text-gray-900 font-mono">{viewInvoice.amount}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">الضريبة (15%)</span>
                                            <span className="font-bold text-gray-900 font-mono">0.00 ر.س</span>
                                        </div>
                                        <div className="border-t-2 border-gray-900 pt-3 flex justify-between items-center">
                                            <span className="font-bold text-gray-900 text-lg">الإجمالي</span>
                                            <span className="font-bold text-[#0f2c59] text-2xl font-mono">{viewInvoice.amount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Paid Stamp */}
                            <div className="absolute top-[280px] left-10 transform -rotate-12 border-4 border-green-600 text-green-600 px-6 py-2 rounded-lg text-4xl font-black opacity-20 select-none pointer-events-none">
                                PAID
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-50 p-6 flex justify-between items-center no-print">
                                <p className="text-xs text-gray-500">شكراً لثقتكم بنا. تم إصدار هذه الفاتورة إلكترونياً.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setViewInvoice(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-sm rounded-lg transition-colors">إغلاق</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PaymentsPage;
