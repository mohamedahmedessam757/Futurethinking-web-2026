import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Briefcase, Users, BookOpen, MessageCircle } from 'lucide-react';

const TargetSectors = () => {
  const sectors = [
    { 
      id: "01",
      title: "القطاع الحكومي", 
      icon: <Building2 className="w-8 h-8" />, 
      desc: "بناء أنظمة التميز المؤسسي وتطوير السياسات." 
    },
    { 
      id: "02",
      title: "القطاع الخاص", 
      icon: <Briefcase className="w-8 h-8" />, 
      desc: "تطوير نماذج الأعمال وأتمتة العمليات." 
    },
    { 
      id: "03",
      title: "القطاع غير الربحي", 
      icon: <Users className="w-8 h-8" />, 
      desc: "تصميم الخطط الاستراتيجية وأنظمة الحوكمة." 
    },
    { 
      id: "04",
      title: "القطاع التعليمي", 
      icon: <BookOpen className="w-8 h-8" />, 
      desc: "تطوير التميز الإداري والمبادرات القيادية." 
    },
  ];

  return (
    <section id="sectors" className="py-24 bg-[#06152e] text-white relative scroll-mt-32">
       {/* Subtle Grid Background */}
       <div className="absolute inset-0 opacity-[0.02]" 
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

      <div className="container mx-auto px-4 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="order-2 md:order-1">
                 <a 
                   href="https://wa.me/966534786272" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 text-white border-b border-brand-gold pb-1 hover:text-brand-gold transition-colors font-medium"
                 >
                    ابدأ مشروعك معنا <MessageCircle className="w-4 h-4" />
                </a>
            </div>
            <div className="text-right order-1 md:order-2">
                <h2 className="text-brand-gold font-bold text-lg mb-2">عملاؤنا</h2>
                <h3 className="text-4xl lg:text-5xl font-bold text-white">القطاعات المستهدفة</h3>
            </div>
        </div>
        
        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sectors.map((sector, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-[#0f2344] p-8 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-brand-gold/30 transition-all h-64 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                 <span className="text-4xl font-bold text-white/5 group-hover:text-white/10 transition-colors">{sector.id}</span>
                 <div className="bg-brand-gold/10 p-3 rounded-xl text-brand-gold group-hover:bg-brand-gold group-hover:text-[#06152e] transition-colors">
                    {sector.icon}
                 </div>
              </div>
              
              <div>
                  <h4 className="text-xl font-bold text-white mb-2">{sector.title}</h4>
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">{sector.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetSectors;