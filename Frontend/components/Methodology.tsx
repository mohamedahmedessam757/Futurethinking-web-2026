import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Users, CheckCircle2, BookOpen, Layers, MonitorPlay, Video, Map } from 'lucide-react';

const Methodology = () => {
  return (
    <section id="methodology" className="py-24 bg-brand-light scroll-mt-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-brand-gold font-bold text-lg mb-2">كيف نعمل؟</h2>
            <h3 className="text-4xl lg:text-5xl font-bold text-brand-navy mb-6">منهجية <span dir="ltr">360°5</span> المبتكرة</h3>
            <p className="text-gray-700 text-lg leading-relaxed font-medium">
              تعتمد شركة فكر المستقبل على إطار عمل متكامل يربط بين التحليل الدقيق والتنفيذ الفعال، مدعوماً بمنظومة بناء قدرات شاملة من 10 مسارات.
            </p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Phase 1: Consultation */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col"
          >
            <div className="bg-brand-navy text-white p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 -translate-y-10"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h4 className="text-3xl font-bold mb-2">الاستشارات</h4>
                    <p className="text-brand-gold/80 font-bold">فهم عميق وتحليل دقيق</p>
                </div>
                <span className="text-6xl font-black text-white/10">01</span>
              </div>
            </div>
            
            <div className="p-10 flex-1">
               <p className="text-gray-700 mb-8 font-medium">نبدأ بدراسة الوضع الراهن وفهم العمليات التنظيمية والتشغيلية عبر أدوات قياس دقيقة:</p>
               <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: "تحليل البيانات", icon: <PieChart className="w-5 h-5" /> },
                   { label: "المقابلات الشخصية", icon: <Users className="w-5 h-5" /> },
                   { label: "اختبارات القياس", icon: <CheckCircle2 className="w-5 h-5" /> },
                   { label: "تحليل الوثائق", icon: <BookOpen className="w-5 h-5" /> },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-gold/50 transition-colors">
                      <div className="text-brand-gold bg-white p-2 rounded-lg shadow-sm">{item.icon}</div>
                      <span className="font-bold text-brand-navy text-sm">{item.label}</span>
                   </div>
                 ))}
               </div>
            </div>
          </motion.div>

          {/* Phase 2: Capacity Building */}
          <motion.div 
             whileHover={{ y: -5 }}
             className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col"
          >
            <div className="bg-brand-gold text-white p-10 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-10 -translate-y-10"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                    <h4 className="text-3xl font-bold mb-2">بناء القدرات</h4>
                    <p className="text-brand-navy/60 font-bold">10 مسارات للتعلم العميق</p>
                </div>
                <span className="text-6xl font-black text-brand-navy/10">02</span>
              </div>
            </div>
            
            <div className="p-10 flex-1">
              <p className="text-gray-700 mb-8 font-medium">لا نكتفي بالتدريب التقليدي، بل نتبنى منهجية متعددة القنوات لضمان رسوخ المعرفة:</p>
              <div className="flex flex-wrap gap-3">
                {[
                    "كتب ودراسات", "بودكاست", "فيديوهات", "زيارات ميدانية", 
                    "كوتش فردي", "تعليم أقران", "تدريب مدربين", 
                    "استضافات خبراء", "معسكرات تدريبية", "تدريب غير تزامني"
                ].map((track, i) => (
                  <span key={i} className="px-4 py-2 bg-brand-light text-brand-navy text-sm font-bold rounded-xl border border-brand-navy/5 hover:bg-brand-navy hover:text-white transition-all cursor-default">
                    {track}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Methodology;