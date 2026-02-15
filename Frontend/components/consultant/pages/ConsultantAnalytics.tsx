
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Calendar, Download, Wallet, Briefcase, Star, ArrowUpRight } from 'lucide-react';
import { useConsultant } from '../ConsultantContext';

const ConsultantAnalytics = () => {
   const { analytics, myRevenue, stats, handleDownloadReport, timeRange, setTimeRange } = useConsultant();

   // Normalize chart data for visualization height (avoid division by zero)
   // Ensure bars are visible even with 0 data by setting a min height via comparison
   const maxDataPoint = Math.max(...analytics.chartData, 100);

   return (
      <div className="space-y-8 animate-fade-in pb-10">

         {/* Top Header & Controls */}
         <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
               <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                  لوحة الأداء والمالية <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               </h1>
               <p className="text-gray-400">تحليل دقيق لتدفقاتك النقدية وأداء جلساتك الاستشارية.</p>
            </div>

            <div className="flex gap-3">
               <div className="bg-[#0f2344] p-1 rounded-xl border border-white/10 flex">
                  {['week', 'month', 'year'].map((range) => (
                     <button
                        key={range}
                        onClick={() => setTimeRange(range as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === range ? 'bg-brand-gold text-brand-navy shadow-lg' : 'text-gray-400 hover:text-white'}`}
                     >
                        {range === 'week' ? 'أسبوعي' : range === 'month' ? 'شهري' : 'سنوي'}
                     </button>
                  ))}
               </div>
               <button
                  onClick={handleDownloadReport}
                  className="bg-[#0f2344] border border-white/10 text-white px-6 py-2 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-2 font-bold group"
                  title="تنزيل تقرير Excel"
               >
                  <Download size={18} className="group-hover:translate-y-1 transition-transform" /> تصدير
               </button>
            </div>
         </div>

         {/* Key Performance Indicators (KPIs) */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* Revenue Card */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-gradient-to-br from-[#0f2344] to-[#06152e] border border-white/5 p-6 rounded-[2rem] relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-gold/10 transition-colors"></div>
               <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-3 bg-brand-gold/10 rounded-2xl text-brand-gold border border-brand-gold/20">
                     <Wallet size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded-lg">
                     <ArrowUpRight size={12} /> مباشر
                  </div>
               </div>
               <div className="relative z-10">
                  <p className="text-gray-400 text-sm font-medium mb-1">صافي الأرباح ({timeRange === 'year' ? 'السنوية' : timeRange === 'month' ? 'الشهرية' : 'الأسبوعية'})</p>
                  <h3 className="text-3xl lg:text-4xl font-bold text-white flex items-baseline gap-1">
                     <AnimatePresence mode="wait">
                        <motion.span
                           key={myRevenue}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: -10 }}
                        >
                           {myRevenue.toLocaleString()}
                        </motion.span>
                     </AnimatePresence>
                     <span className="text-lg font-medium text-brand-gold">ر.س</span>
                  </h3>
               </div>
            </motion.div>

            {/* Sessions Count Card */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-[#0f2344]/40 border border-white/5 p-6 rounded-[2rem]"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                     <Briefcase size={24} />
                  </div>
               </div>
               <p className="text-gray-400 text-sm font-medium mb-1">الجلسات المكتملة</p>
               <h3 className="text-3xl font-bold text-white mb-1">{analytics.totalSessions}</h3>
               <p className="text-xs text-gray-500">جلسة استشارية ناجحة</p>
            </motion.div>

            {/* Average Price Card */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-[#0f2344]/40 border border-white/5 p-6 rounded-[2rem]"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                     <TrendingUp size={24} />
                  </div>
               </div>
               <p className="text-gray-400 text-sm font-medium mb-1">متوسط قيمة الجلسة</p>
               <h3 className="text-3xl font-bold text-white mb-1">{analytics.avgSessionPrice} <span className="text-sm font-normal text-gray-500">ر.س</span></h3>
               <p className="text-xs text-gray-500">لكل ساعة استشارية</p>
            </motion.div>

            {/* Rating Card */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-[#0f2344]/40 border border-white/5 p-6 rounded-[2rem]"
            >
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-400 border border-yellow-500/20">
                     <Star size={24} />
                  </div>
               </div>
               <p className="text-gray-400 text-sm font-medium mb-1">رضا العملاء</p>
               {stats.rating !== null ? (
                  <>
                     <h3 className="text-3xl font-bold text-white mb-1">{stats.rating} <span className="text-sm text-gray-500">/ 5.0</span></h3>
                     <p className="text-xs text-gray-500">بناءً على {stats.totalReviews} تقييم</p>
                  </>
               ) : (
                  <>
                     <h3 className="text-xl font-bold text-gray-500 mb-1">لا يوجد تقييمات</h3>
                     <p className="text-xs text-gray-500">لم يتم استلام أي تقييم بعد</p>
                  </>
               )}
            </motion.div>
         </div>

         {/* Main Revenue Chart (Advanced Visual) */}
         <div className="bg-[#0f172a] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

            <div className="flex justify-between items-center mb-12 relative z-10">
               <div>
                  <h3 className="text-xl font-bold text-white mb-1">الرسم البياني للإيرادات</h3>
                  <p className="text-sm text-gray-400">تتبع التدفق المالي خلال الفترة المحددة ({timeRange === 'year' ? 'عام 2024' : 'الفترة الحالية'}).</p>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-gold"></span>
                  <span className="text-xs text-gray-300">الدخل المحقق</span>
               </div>
            </div>

            <div className="h-72 w-full relative z-10 flex items-end gap-2 md:gap-4 px-2">
               {/* Background Lines */}
               <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 pr-10">
                  {[...Array(5)].map((_, i) => <div key={i} className="w-full h-px bg-white border-dashed border-t"></div>)}
               </div>

               {/* Dynamic Bars with Tooltips */}
               {analytics.chartData.map((val, i) => (
                  <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group relative">

                     {/* Tooltip */}
                     <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white text-[#06152e] text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20 transform translate-y-2 group-hover:translate-y-0">
                        {val.toLocaleString()} ر.س
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                     </div>

                     {/* Bar Container */}
                     <div className="w-full max-w-[50px] h-full flex flex-col justify-end relative">
                        {/* The Bar */}
                        <motion.div
                           initial={{ height: 0 }}
                           animate={{ height: `${(val / maxDataPoint) * 100}%` }}
                           transition={{ duration: 1, delay: i * 0.05, type: "spring", stiffness: 50 }}
                           className={`w-full rounded-t-xl relative overflow-hidden transition-all duration-300 ${val > 0 ? 'bg-gradient-to-t from-brand-navy to-brand-gold opacity-80 group-hover:opacity-100 group-hover:shadow-[0_0_20px_rgba(198,165,104,0.3)]' : 'bg-white/5 h-1'}`}
                        >
                           {/* Shine Effect */}
                           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </motion.div>
                     </div>

                     {/* Label */}
                     <span className="text-[10px] md:text-xs text-gray-500 font-bold mt-4 h-6 whitespace-nowrap overflow-visible">
                        {analytics.chartLabels[i]}
                     </span>
                  </div>
               ))}
            </div>
         </div>

         {/* Consultation Performance Table (Replaces Courses) */}
         <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-[#0f2344]/30 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col">
               <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a]">
                  <div>
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Briefcase size={20} className="text-brand-gold" /> أداء أنواع الاستشارات
                     </h3>
                     <p className="text-xs text-gray-400 mt-1">تفاصيل الدخل حسب موضوع الاستشارة.</p>
                  </div>
               </div>

               <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-right min-w-[500px]">
                     <thead className="bg-[#06152e] text-xs text-gray-400 font-medium">
                        <tr>
                           <th className="px-8 py-5">نوع الاستشارة / الموضوع</th>
                           <th className="px-8 py-5 text-center">عدد الجلسات</th>
                           <th className="px-8 py-5 text-center">الإيرادات</th>
                           <th className="px-8 py-5 text-center">الأداء</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm">
                        {analytics.topServices.length > 0 ? (
                           analytics.topServices.map((service, idx) => (
                              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                 <td className="px-8 py-5 font-bold text-white relative">
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-brand-gold opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {service.title}
                                 </td>
                                 <td className="px-8 py-5 text-center">
                                    <span className="bg-white/5 px-3 py-1 rounded-lg text-gray-300 font-bold">{service.count}</span>
                                 </td>
                                 <td className="px-8 py-5 text-center text-brand-gold font-bold dir-ltr">{service.revenue.toLocaleString()} ر.س</td>
                                 <td className="px-8 py-5 text-center">
                                    <div className="flex items-center justify-center gap-1 text-yellow-400">
                                       <Star size={14} fill="currentColor" />
                                       <span className="font-bold text-white">{service.rating}</span>
                                    </div>
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={4} className="px-8 py-10 text-center text-gray-500">لا توجد بيانات كافية لعرض التحليل بعد.</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Quick Summary / Advice */}
            <div className="lg:col-span-1 bg-gradient-to-b from-brand-gold/10 to-[#0f2344]/50 border border-brand-gold/20 rounded-[2.5rem] p-8 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-gold/10 rounded-full blur-3xl"></div>

               <h3 className="text-xl font-bold text-white mb-4 relative z-10">رؤى ذكية 💡</h3>
               <p className="text-gray-300 text-sm leading-relaxed mb-6 relative z-10">
                  بناءً على تحليلاتك، يبدو أن استشارات <strong>"{analytics.topServices[0]?.title || 'التخطيط'}"</strong> هي الأكثر طلباً.
                  <br /><br />
                  نقترح عليك زيادة عدد الساعات المتاحة لهذا النوع من الجلسات لزيادة أرباحك بنسبة متوقعة <strong>15%</strong>.
               </p>
            </div>
         </div>
      </div>
   );
};

export default ConsultantAnalytics;
