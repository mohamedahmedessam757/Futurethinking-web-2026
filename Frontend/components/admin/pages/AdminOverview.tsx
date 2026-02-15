
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Users, Clock, TrendingUp, ArrowLeft, BookOpen, Sparkles as SparklesIcon2, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { AdminView } from '../AdminDashboard';
import { useAdminTransactions } from '../../../hooks/useAdminTransactions';
import { useAdminUsers } from '../../../hooks/useAdminUsers';
import { useAdminBooks } from '../../../hooks/useAdminBooks';

interface AdminOverviewProps {
    onNavigate: (view: AdminView, data?: any) => void;
}

const AdminOverview = ({ onNavigate }: AdminOverviewProps) => {
    // 1. Finance Stats & Recent Transactions
    const {
        stats: financeStats,
        transactions: recentTransactions,
        loading: loadingFinance
    } = useAdminTransactions();

    // 2. Users Count (Fetch minimal data)
    const { totalCount: usersCount } = useAdminUsers({ limit: 1 });

    // 3. Books Count (Fetch minimal data)
    const { totalCount: booksCount } = useAdminBooks({ limit: 1 });

    // 4. Chart Data State (Fetched Separately)
    const [chartRawData, setChartRawData] = useState<any[]>([]);
    const [loadingChart, setLoadingChart] = useState(true);

    const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('year');

    // Fetch Chart Data (Optimized: Scalable fetch)
    useEffect(() => {
        const fetchChartData = async () => {
            try {
                setLoadingChart(true);

                // OPTIMIZATION: Only fetch data for the current year/relevant range to avoid loading millions of rows
                const now = new Date();
                const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

                const { data, error } = await supabase
                    .from('transactions')
                    .select('created_at, amount, status')
                    .eq('status', 'paid')
                    .gte('created_at', startOfYear); // Only fetch this year's data

                if (!error && data) {
                    setChartRawData(data);
                }
            } catch (err) {
                console.error('Error fetching chart data:', err);
            } finally {
                setLoadingChart(false);
            }
        };
        fetchChartData();
    }, []); // Run once on mount

    // Formatting currency
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0 }).format(amount);
    };

    // --- CORE LOGIC: Real Data Aggregation ---
    const chartData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        let labels: string[] = [];
        let dataPoints: number[] = [];
        let rangeTotalRevenue = 0;

        // Use chartRawData instead of transactions
        const sourceData = chartRawData;

        if (timeRange === 'year') {
            // --- YEAR VIEW: Group by Month (Jan - Dec) ---
            labels = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            dataPoints = new Array(12).fill(0);

            sourceData.forEach(tx => {
                const date = new Date(tx.created_at || tx.date); // Handle both key names just in case
                if (date.getFullYear() === currentYear) {
                    dataPoints[date.getMonth()] += (tx.amount || 0);
                    rangeTotalRevenue += (tx.amount || 0);
                }
            });

        } else if (timeRange === 'quarter') {
            // --- QUARTER VIEW: Last 3 Months ---
            labels = [];
            dataPoints = [0, 0, 0];

            // Generate labels for last 3 months
            for (let i = 2; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                labels.push(d.toLocaleString('ar-SA', { month: 'long' }));
            }

            sourceData.forEach(tx => {
                const date = new Date(tx.created_at || tx.date);
                // Check if transaction is within last 3 months
                const diffMonths = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());
                if (diffMonths >= 0 && diffMonths < 3) {
                    // Map to index (2 = current month, 1 = prev, 0 = prev-prev)
                    const index = 2 - diffMonths;
                    dataPoints[index] += (tx.amount || 0);
                    rangeTotalRevenue += (tx.amount || 0);
                }
            });

        } else if (timeRange === 'month') {
            // --- MONTH VIEW: Group by Week (4 Weeks) ---
            labels = ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'];
            dataPoints = [0, 0, 0, 0];

            sourceData.forEach(tx => {
                const date = new Date(tx.created_at || tx.date);
                // Check if same month and year
                if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
                    const day = date.getDate();
                    // Simple bucket: 1-7 (Week 1), 8-14 (Week 2), 15-21 (Week 3), 22+ (Week 4)
                    const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
                    dataPoints[weekIndex] += (tx.amount || 0);
                    rangeTotalRevenue += (tx.amount || 0);
                }
            });
        }

        // Determine counts for the selected range
        const rangeTransactionCount = sourceData.filter(tx => {
            const d = new Date(tx.created_at || tx.date);
            if (timeRange === 'year') return d.getFullYear() === currentYear;
            if (timeRange === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            return true; // simplified for quarter
        }).length;

        // Normalize for bar height (Max 100%)
        const maxVal = Math.max(...dataPoints, 1000); // Default max 1000 to avoid flat lines on 0
        const normalizedPoints = dataPoints.map(val => (val / maxVal) * 100);

        return {
            labels,
            dataPoints: normalizedPoints, // For visual height 
            rawValues: dataPoints,        // For tooltips
            revenue: rangeTotalRevenue,
            count: rangeTransactionCount
        };
    }, [chartRawData, timeRange]);

    // Cards Data (Linked to Context Stats)
    const cards = [
        { label: 'إجمالي الإيرادات', value: formatMoney(financeStats.revenue), sub: 'إجمالي الدخل', isPositive: true, icon: <DollarSign size={24} />, illustration: 'https://illustrations.popsy.co/amber/success.svg' },
        { label: 'المستخدمين النشطين', value: usersCount, sub: 'مسجل في المنصة', isPositive: true, icon: <Users size={24} />, illustration: 'https://illustrations.popsy.co/amber/work-party.svg' },
        // Updated: Replaced Transactions count with Tokens (Placeholder or fetch if needed? Keeping Tokens static or removal?)
        // User requested "Real" data. Tokens might be in 'system_settings' or aggregated.
        // For now, let's show "Total Transactions" instead of Tokens if we don't have token stats easily available.
        // Or keep "Tokens" if it was hardcoded/mocked before? It was "stats.totalTokens".
        // I'll show "Pending Transactions" as it's actionable.
        { label: 'معاملات معلقة', value: financeStats.pending, unit: 'عملية', sub: 'بانتظار الإجراء', isPositive: false, icon: <Clock size={24} />, illustration: 'https://illustrations.popsy.co/amber/graphic-design.svg' },
        // New Card: Books
        { label: 'المكتبة الرقمية', value: booksCount, unit: 'كتاب', sub: 'متاح للطلاب', isPositive: true, icon: <BookOpen size={24} />, illustration: 'https://illustrations.popsy.co/amber/student-going-to-school.svg' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-4">
                        لوحة تحكم المدير

                        {/* Animated Chart Visual */}
                        <div className="h-12 flex items-end justify-center gap-1.5 relative z-10 pb-1">
                            {[40, 70, 50, 90, 60].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: '10%' }}
                                    animate={{ height: `${h}%` }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        delay: i * 0.2,
                                        ease: "easeInOut"
                                    }}
                                    className={`w-2.5 rounded-t-sm ${i === 3 ? 'bg-brand-gold' : 'bg-white/20'}`}
                                />
                            ))}
                        </div>
                    </h1>
                    <p className="text-gray-400">نظرة شاملة حقيقية على أداء المنصة.</p>
                </div>
                <button
                    onClick={() => onNavigate('ai-creator')}
                    className="bg-[#0f2344] hover:bg-brand-gold hover:text-brand-navy text-white px-6 py-3 rounded-xl border border-white/10 font-bold transition-all flex items-center gap-2"
                >
                    <SparklesIcon /> إنشاء دورة ذكية
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-gold/30 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-brand-navy transition-colors">
                                {stat.icon}
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold font-mono ltr ${stat.isPositive ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                {stat.sub}
                            </span>
                        </div>

                        <div className="relative z-10">
                            <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-bold text-white flex items-baseline gap-1">
                                <AnimatePresence mode="wait">
                                    {loadingFinance ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <Loader2 size={20} className="animate-spin text-brand-gold" />
                                        </motion.div>
                                    ) : (
                                        <motion.span
                                            key={stat.value}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                        >
                                            {stat.value}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {stat.unit && <span className="text-xs text-gray-500 font-normal">{stat.unit}</span>}
                            </h3>
                        </div>

                        {/* Illustration Watermark */}
                        <img
                            src={stat.illustration}
                            className="absolute -bottom-4 -left-4 w-24 h-24 opacity-10 grayscale group-hover:grayscale-0 group-hover:opacity-20 transition-all duration-500"
                        />
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Revenue Chart Container */}
                <div className="lg:col-span-2 bg-[#0f172a] border border-white/5 rounded-3xl p-8 min-h-[450px] flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10 relative z-20">
                        <div>
                            <h3 className="text-xl font-bold text-white">تحليل الإيرادات</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {loadingChart ? 'جاري التحميل...' : (
                                    <>الإجمالي للفترة المحددة: <span className="text-brand-gold font-bold dir-ltr">{formatMoney(chartData.revenue)}</span></>
                                )}
                            </p>
                        </div>
                        <div className="bg-[#06152e] border border-white/5 rounded-xl p-1 flex">
                            {['month', 'quarter', 'year'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range as any)}
                                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${timeRange === range ? 'bg-brand-gold text-brand-navy' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {range === 'month' ? 'شهر' : range === 'quarter' ? '3 أشهر' : 'سنة'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* The Chart Implementation */}
                    <div className="flex-1 flex items-end justify-between gap-3 px-2 relative z-10 w-full h-64 border-b border-white/5 pb-2">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                            {[0, 1, 2, 3].map(i => <div key={i} className="w-full h-px bg-white/5 border-dashed"></div>)}
                        </div>

                        {loadingChart ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <Loader2 size={30} className="animate-spin text-brand-gold opacity-50" />
                            </div>
                        ) : (
                            chartData.labels.map((label, i) => {
                                // Height is normalized to 0-100%
                                const height = chartData.dataPoints[i];
                                const rawValue = chartData.rawValues[i];

                                return (
                                    <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                                        {/* Tooltip */}
                                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white text-[#06152e] text-xs font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-30 mb-2 transform translate-y-2 group-hover:translate-y-0">
                                            {formatMoney(rawValue)}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                        </div>

                                        {/* Bar */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ type: "spring", stiffness: 50, damping: 10, delay: i * 0.05 }}
                                            className={`w-full max-w-[40px] rounded-t-lg relative overflow-hidden cursor-pointer transition-all duration-300 ${rawValue > 0 ? 'bg-gradient-to-t from-brand-navy to-blue-500 group-hover:to-brand-gold' : 'bg-white/5 h-1'}`}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                                        </motion.div>

                                        {/* X-Axis Label */}
                                        <span className="text-[10px] text-gray-500 font-bold mt-3 rotate-45 sm:rotate-0 whitespace-nowrap">{label}</span>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Recent Transactions - Real Data */}
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">آخر المعاملات</h3>
                        {/* Three dots removed as requested */}
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        {loadingFinance ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader2 size={24} className="animate-spin text-brand-gold" />
                            </div>
                        ) : recentTransactions.length > 0 ? (
                            // Slice to show latest 5
                            recentTransactions.slice(0, 5).map((tx, i) => (
                                <div
                                    key={i}
                                    onClick={() => onNavigate('finance', { searchQuery: tx.userName })}
                                    className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center font-bold text-white border border-white/10">{tx.userName.charAt(0)}</div>
                                        <div>
                                            <p className="text-white font-bold text-sm group-hover:text-brand-gold transition-colors">{tx.userName}</p>
                                            <p className="text-gray-500 text-xs truncate max-w-[150px]">{tx.item}</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-brand-gold font-bold text-sm dir-ltr">{formatMoney(tx.amount)}</p>
                                        <span className={`text-[10px] px-2 rounded-full ${tx.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                            {tx.status === 'paid' ? 'مكتمل' : 'معلق'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">لا توجد معاملات حديثة.</div>
                        )}
                    </div>
                    <div className="p-4 text-center border-t border-white/5">
                        <button
                            onClick={() => onNavigate('finance')}
                            className="text-sm text-gray-400 hover:text-brand-gold transition-colors flex items-center justify-center gap-2 w-full"
                        >
                            عرض كل المعاملات <ArrowLeft size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SparklesIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
)

export default AdminOverview;
