
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useGlobal } from './GlobalContext';

interface HeroProps {
  onNavigate: (page: 'home' | 'auth' | 'dashboard' | 'admin' | 'consultant') => void;
}

const Hero = ({ onNavigate }: HeroProps) => {
  const { currentUser } = useGlobal();

  const handleBookConsultation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentUser) {
      if (currentUser.role === 'student') {
        onNavigate('dashboard');
      } else {
        onNavigate(currentUser.role === 'admin' ? 'admin' : 'consultant');
      }
    } else {
      onNavigate('auth');
    }
  };

  const handleExploreServices = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentUser) {
      onNavigate(currentUser.role === 'admin' ? 'admin' : currentUser.role === 'instructor' || currentUser.role === 'consultant' ? 'consultant' : 'dashboard');
    } else {
      onNavigate('auth');
    }
  };

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-brand-light pt-32 pb-12 lg:pb-20 scroll-mt-20">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[250px] md:w-[400px] lg:w-[800px] h-[250px] md:h-[400px] lg:h-[800px] bg-brand-navy/5 rounded-full blur-[60px] lg:blur-[100px] translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[200px] md:w-[300px] lg:w-[600px] h-[200px] md:h-[300px] lg:h-[600px] bg-brand-gold/10 rounded-full blur-[50px] lg:blur-[80px] -translate-x-1/3 translate-y-1/4"></div>

        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#0f2c59 1px, transparent 1px), linear-gradient(90deg, #0f2c59 1px, transparent 1px)', backgroundSize: '60px 60px' }}>
        </div>
      </div>

      <div className="container mx-auto px-4 z-10 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-right relative order-2 lg:order-1 flex flex-col items-start"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm mb-6 border border-white/50"
          >
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold"></span>
            </span>
            <span className="text-brand-navy text-xs lg:text-sm font-bold tracking-wide">رؤية تتجاوز الحاضر</span>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-brand-navy leading-[1.2] lg:leading-[1.15] mb-6 tracking-tight">
            تمكين مستقبل <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-brand-navy via-brand-navy to-brand-gold">
              المؤسسات
            </span> بالتعليم <br />
            المدعوم
            <span className="relative inline-block mr-2 lg:mr-4 text-brand-gold">
              بالذكاء الاصطناعي
              <svg className="absolute w-full h-2 lg:h-4 -bottom-1 left-0 text-brand-gold/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 15 100 5" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-gray-700 mb-8 leading-relaxed max-w-2xl font-medium">
            فكر المستقبل شركة سعودية متخصصة في الاستشارات المؤسسية وبناء القدرات، نمكّن الجهات الحكومية والخاصة من تحقيق التميز المؤسسي عبر حلول تتماشى مع رؤية 2030.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={handleBookConsultation}
              className="w-full sm:w-auto px-8 py-4 bg-brand-navy text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-navy/20 hover:shadow-brand-navy/40 active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              احجز استشارة
            </button>
            <button
              onClick={handleExploreServices}
              className="w-full sm:w-auto px-8 py-4 bg-white/80 backdrop-blur-sm text-brand-navy border border-gray-200 rounded-2xl font-bold text-lg shadow-sm hover:border-brand-gold hover:text-brand-gold active:scale-95 transition-all text-center"
            >
              استكشف خدماتنا
            </button>
          </div>
        </motion.div>

        {/* Visual Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative h-[300px] md:h-[500px] lg:h-[600px] w-full order-1 lg:order-2 flex justify-center items-center"
        >
          {/* Main Visual with Frame */}
          <div className="relative z-10 w-full flex justify-center items-center px-4 lg:px-0">
            <div className="relative w-full max-w-[650px] aspect-[4/3] rounded-[3rem] bg-white/40 backdrop-blur-sm border border-white/60 shadow-2xl flex items-center justify-center overflow-hidden group">
              {/* Optional: Inner decorative gradient/glow inside the frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/5 via-transparent to-brand-navy/5 opacity-50 z-10 pointer-events-none"></div>

              <img
                src="/hero-3d-visual.png"
                alt="Future Thinking AI Brain Network"
                className="relative w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                width="800"
                height="600"
              />
            </div>
          </div>

          {/* Floating Element - Responsive Position */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-4 lg:right-auto lg:left-0 z-20 bg-white/80 backdrop-blur-xl border border-white/40 p-3 lg:p-5 rounded-2xl shadow-xl max-w-[160px] lg:max-w-xs"
          >
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="bg-brand-gold/10 p-2 lg:p-3 rounded-xl shrink-0">
                <TrendingUp className="text-brand-gold w-5 h-5 lg:w-8 lg:h-8" />
              </div>
              <div>
                <p className="text-[10px] lg:text-xs text-gray-700 font-bold">نمو مستدام</p>
                <p className="font-bold text-brand-navy text-xs lg:text-lg">نتائج قياسية</p>
              </div>
            </div>
          </motion.div>

          {/* Decorative Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] lg:w-[500px] h-[250px] lg:h-[500px] bg-brand-gold/20 rounded-full blur-[60px] lg:blur-[100px] -z-10 mix-blend-multiply"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
