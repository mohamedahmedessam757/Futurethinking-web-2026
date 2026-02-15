import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, CheckCircle2 } from 'lucide-react';

const LOGO_URL = "https://drive.google.com/thumbnail?id=1DLtih_kKWfp2LIqV-jiOOvzS9jPnAuPa&sz=w1000";

const AboutIdentity = () => {
  return (
    <section id="about" className="py-24 bg-white overflow-hidden scroll-mt-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          
          {/* Visual Side - Collage */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1287&auto=format&fit=crop" 
                alt="Saudi Heritage Diriyah" 
                className="rounded-[2rem] shadow-2xl w-3/4 mr-auto border-8 border-white"
                loading="lazy"
                width="600"
                height="400"
              />
              <motion.img 
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                src="https://economyplusme.com/app/uploads/2025/04/1745700697_255_377845_f236303aa7724c42afc9c42aa8e07f1f.jpeg" 
                alt="Modern Business Team" 
                className="absolute -bottom-10 -left-10 w-2/3 rounded-[2rem] shadow-2xl border-8 border-white"
                loading="lazy"
              />
              {/* Floating Logo Badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xl p-6 rounded-full shadow-xl border border-gray-100">
                 <img src={LOGO_URL} className="w-20 h-20 object-contain" alt="Logo Icon" loading="lazy" />
              </div>
            </div>
            
            {/* Decor */}
            <div className="absolute top-0 right-0 w-full h-full bg-brand-gold/5 rounded-[3rem] -z-10 rotate-3 scale-105"></div>
          </motion.div>

          {/* Text Side */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 text-right"
          >
            <div className="flex items-center gap-2 mb-4">
               <span className="w-10 h-1 bg-brand-gold rounded-full"></span>
               <h2 className="text-brand-gold font-bold text-lg tracking-wider">هويتنا</h2>
            </div>
            
            <h3 className="text-4xl lg:text-5xl font-bold text-brand-navy mb-8 leading-tight">
              نجمع بين <span className="text-brand-gold">أصالة الفكر</span> <br/>
              وابتكار المستقبل
            </h3>
            
            <p className="text-gray-700 mb-6 leading-relaxed text-lg font-medium">
              فكر المستقبل شركة سعودية متخصصة في الاستشارات المؤسسية وبناء القدرات. نهدف إلى تمكين الجهات الحكومية والخاصة وغير الربحية من تحقيق التميز المؤسسي ورفع كفاءتها التشغيلية من خلال حلول عملية مبتكرة.
            </p>
            
            <div className="flex flex-col gap-4 mb-8">
              {[
                "حلول متوافقة مع مستهدفات رؤية السعودية 2030",
                "استشارات واقعية تتمحور حول النتائج",
                "تنفيذ باحترافية عالية وتحقيق أثر مستدام"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="text-brand-gold w-5 h-5 flex-shrink-0" />
                  <span className="text-brand-navy font-bold">{item}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-brand-light p-6 rounded-2xl border border-brand-navy/5 relative overflow-hidden group hover:border-brand-gold/30 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold"></div>
              <h4 className="font-bold text-brand-navy mb-2 flex items-center gap-2 text-xl">
                <Lightbulb className="w-6 h-6 text-brand-gold" />
                فلسفة فكر المستقبل
              </h4>
              <p className="text-gray-700 leading-relaxed font-medium">
                يجمع اسمنا بين الكفاءة التي نعبر عنها بـ "الفكر"، والابتكار والتميز الذي نعبر عنه بـ "المستقبل". نحن نصل للمستقبل قبل الآخرين.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutIdentity;