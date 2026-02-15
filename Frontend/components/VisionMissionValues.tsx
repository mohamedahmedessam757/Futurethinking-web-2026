import React from 'react';
import { motion } from 'framer-motion';
import { Target, Briefcase, Award, TrendingUp, Users } from 'lucide-react';

const VisionMissionValues = () => {
  const values = [
    { number: "01", title: "الكفاءة والتمكّن", icon: <Award className="w-6 h-6 text-brand-gold" /> },
    { number: "02", title: "الاستدامة والتنبؤ", icon: <TrendingUp className="w-6 h-6 text-brand-gold" /> },
    { number: "03", title: "الشراكة الفاعلة", icon: <Users className="w-6 h-6 text-brand-gold" /> },
  ];

  return (
    <section className="py-24 bg-brand-navy text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-gold/10 to-transparent"></div>
         <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-brand-gold/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-brand-gold font-bold text-lg mb-2">استراتيجيتنا</h2>
          <h3 className="text-4xl font-bold">بوصلة النجاح المؤسسي</h3>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Vision Card */}
          <motion.div 
            whileHover={{ y: -10 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Target className="w-32 h-32" />
            </div>
            <div className="bg-gradient-to-br from-brand-gold to-yellow-600 w-16 h-16 flex items-center justify-center rounded-2xl mb-8 shadow-lg shadow-brand-gold/20">
              <Target className="text-white w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 group-hover:text-brand-gold transition-colors">رؤيتنا</h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              أن نكون بيت الخبرة السعودي الرائد في مجال الفكر والإبداع لبناء استدامة ومستقبل قوي.
            </p>
          </motion.div>

          {/* Mission Card */}
          <motion.div 
             whileHover={{ y: -10 }}
             className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Briefcase className="w-32 h-32" />
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-brand-navy w-16 h-16 flex items-center justify-center rounded-2xl mb-8 shadow-lg shadow-blue-500/20 border border-white/20">
              <Briefcase className="text-white w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-4 group-hover:text-brand-gold transition-colors">رسالتنا</h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              تُمكّن الجهات والأفراد من تحقيق تحول فعال عبر استشارات تنفيذية تدار بكفاءات وطنية وخبرات عالمية للوصول للمستقبل قبل الجميع.
            </p>
          </motion.div>

          {/* Values Column */}
          <div className="flex flex-col justify-between gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl h-full flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-8">قيمنا الراسخة</h3>
                <div className="space-y-4">
                    {values.map((value, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-default"
                    >
                        <span className="text-2xl font-black text-white/20">{value.number}</span>
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-white/10 p-2 rounded-lg">{value.icon}</div>
                          <h4 className="font-bold text-lg">{value.title}</h4>
                        </div>
                    </motion.div>
                    ))}
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default VisionMissionValues;