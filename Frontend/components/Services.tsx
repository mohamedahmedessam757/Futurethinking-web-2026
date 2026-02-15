import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Target, Award, Zap, Lightbulb } from 'lucide-react';

const GraduationCapIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const Services = () => {
  const services = [
    {
      id: "01",
      title: "إدارة واستدامة التغيير",
      desc: "تحليل مخاطر التغيير وبناء استراتيجياته وقيادة الجانب البشري (ADKAR).",
      icon: <Settings className="w-6 h-6" />
    },
    {
      id: "02",
      title: "التخطيط الاستراتيجي",
      desc: "إعداد استراتيجيات شاملة ترتبط بمؤشرات أداء قابلة للقياس (Balanced Scorecard).",
      icon: <Target className="w-6 h-6" />
    },
    {
      id: "03",
      title: "التحول المؤسسي والتميز",
      desc: "تطوير الهياكل التنظيمية وبناء أنظمة التميز المؤسسي (EFQM, KAQA).",
      icon: <Award className="w-6 h-6" />
    },
    {
      id: "04",
      title: "تطوير الأعمال والتحول الرقمي",
      desc: "إعادة تصميم العمليات التشغيلية (BPR) وتوظيف الحلول الرقمية.",
      icon: <Zap className="w-6 h-6" />
    },
    {
      id: "05",
      title: "المعرفة والابتكار",
      desc: "بناء أنظمة إدارة المعرفة (ISO 30401) وإدارة منظومة الابتكار (ISO 56001).",
      icon: <Lightbulb className="w-6 h-6" />
    },
    {
      id: "06",
      title: "بناء القدرات والتأهيل",
      desc: "بناء منظومة المهن والمهارات ورخص هيئة تقويم التعليم والتدريب.",
      icon: <GraduationCapIcon className="w-6 h-6" />
    },
  ];

  return (
    <section id="services" className="py-24 bg-white relative scroll-mt-32">
       {/* Decor */}
       <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-brand-light to-transparent -z-10"></div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
                <h2 className="text-brand-gold font-bold text-lg mb-2">مجالات خدماتنا</h2>
                <h3 className="text-4xl lg:text-5xl font-bold text-brand-navy">حلول شاملة <br/> لبناء منظومات عالية الأداء</h3>
            </div>
            {/* Removed "عرض جميع الخدمات" link */}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl hover:shadow-2xl hover:border-brand-gold/30 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light rounded-bl-[4rem] -mr-8 -mt-8 transition-colors group-hover:bg-brand-navy/5"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-brand-navy rounded-2xl flex items-center justify-center text-brand-gold group-hover:scale-110 group-hover:bg-brand-gold group-hover:text-white transition-all shadow-lg shadow-brand-navy/10">
                    {service.icon}
                    </div>
                    <span className="text-4xl font-bold text-gray-100 group-hover:text-brand-navy/5 transition-colors">{service.id}</span>
                </div>
                
                <h4 className="text-xl font-bold text-brand-navy mb-3 group-hover:text-brand-gold transition-colors">{service.title}</h4>
                <p className="text-gray-700 text-sm leading-relaxed mb-6 h-12 font-medium">{service.desc}</p>
                
                {/* Removed "استكشف المزيد" link and divider */}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;