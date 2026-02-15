import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, CheckCircle } from 'lucide-react';

const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Simulate API call
      setTimeout(() => {
        setIsSubscribed(true);
      }, 500);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden bg-[#06152e] border-t border-white/5">
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="bg-[#0f2344] rounded-[2rem] p-10 lg:p-16 border border-white/5 shadow-2xl relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

          <div className="grid lg:grid-cols-2 gap-10 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-16 h-16 bg-brand-gold/10 rounded-2xl flex items-center justify-center mb-6 border border-brand-gold/20">
                <Mail className="w-8 h-8 text-brand-gold" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">اشترك في نشرتنا البريدية</h2>
              <p className="text-gray-400 text-lg font-medium leading-relaxed">
                كن أول من يحصل على آخر المستجدات في عالم التميز المؤسسي، ومقالات حصرية، وعروض خاصة تصلك مباشرة إلى بريدك الإلكتروني.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              {isSubscribed ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/20 p-8 rounded-2xl text-center"
                >
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white mb-2">شكراً لاشتراكك!</h3>
                  <p className="text-green-200">ستصلك جميع التحديثات والمستجدات قريباً.</p>
                </motion.div>
              ) : (
                <>
                  <form className="flex flex-col sm:flex-row gap-4" onSubmit={handleSubmit}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="البريد الإلكتروني"
                      required
                      className="flex-1 px-6 py-4 rounded-xl bg-[#06152e] border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-gold focus:bg-[#0b1d3b] transition-all font-medium min-w-0"
                    />
                    <button
                      type="submit"
                      className="px-8 py-4 bg-brand-gold text-[#06152e] font-bold rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/10 group whitespace-nowrap"
                    >
                      اشترك الآن
                      <Send className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </form>
                  <p className="mt-4 text-sm text-gray-500 font-medium">
                    * نحترم خصوصيتك، ولا نرسل رسائل مزعجة.
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;