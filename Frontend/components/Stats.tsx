
import React from 'react';
import { motion } from 'framer-motion';
import { useStats } from '../hooks/useStats';

const Stats = () => {
  const { stats: platformStats } = useStats();

  const activeLearners = platformStats.activeLearnersCount;
  const activeCourses = platformStats.activeCoursesCount;

  const stats = [
    { number: `+${activeLearners + 25}`, label: "عاماً من الخبرة القيادية" }, // Mock + Real logic
    { number: `${Math.max(10, activeCourses)}`, label: "مسارات لبناء القدرات" },
    {
      number: (
        <div className="flex items-center justify-center gap-0.5 font-sans" dir="ltr">
          <span>360</span>
          <span className="text-3xl lg:text-4xl -mt-4 text-brand-gold">°</span>
          <span>5</span>
        </div>
      ),
      label: "منهجية فريدة"
    },
    { number: "2030", label: "متوافقون مع الرؤية" },
  ];

  return (
    <section className="py-12 bg-white relative z-20 mt-0 lg:-mt-20 container mx-auto px-4">
      <div className="bg-brand-navy rounded-3xl p-12 shadow-2xl flex flex-wrap justify-around items-center gap-8 text-white relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#c6a568 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="text-center relative z-10"
          >
            <div className="text-5xl font-bold text-brand-gold mb-2 flex justify-center items-center h-16">
              {stat.number}
            </div>
            <p className="text-gray-300 font-medium text-lg">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
