import React from 'react';
import { Phone, Mail, MapPin, Twitter, Linkedin, Instagram, MessageCircle } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: 'home' | 'auth' | 'dashboard' | 'admin' | 'consultant' | 'privacy' | 'terms') => void;
}

const Footer = ({ onNavigate }: FooterProps) => {
  const handleScroll = (id: string) => {
    if (onNavigate) {
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <footer id="contact" className="bg-[#06152e] text-white pt-10 pb-10 border-t border-white/5 scroll-mt-32">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 lg:gap-20 mb-16 items-start">
          
          {/* Company Info - Right Side (RTL) */}
          <div className="md:col-span-2">
            <div className="mb-8">
               <h3 className="text-3xl font-extrabold tracking-widest uppercase leading-none">
                 FUTURE <br/>
                 <span className="text-brand-gold">THINKING</span>
               </h3>
            </div>
            <p className="text-gray-400 leading-relaxed mb-8 text-lg font-medium max-w-md">
              شريكك الاستراتيجي لتحقيق التميز المؤسسي وبناء مستقبل مستدام وفق رؤية المملكة 2030.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-gold hover:text-[#06152e] transition-all transform hover:scale-110">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-gold hover:text-[#06152e] transition-all transform hover:scale-110">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-gold hover:text-[#06152e] transition-all transform hover:scale-110">
                  <Instagram className="w-5 h-5" />
                </a>
             </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-xl mb-8 text-white">روابط سريعة</h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => handleScroll('hero')} className="text-gray-400 hover:text-brand-gold transition-colors block font-medium">الرئيسية</button>
              </li>
              <li>
                <button onClick={() => handleScroll('about')} className="text-gray-400 hover:text-brand-gold transition-colors block font-medium">من نحن</button>
              </li>
              <li>
                <button onClick={() => handleScroll('methodology')} className="text-gray-400 hover:text-brand-gold transition-colors block font-medium">منهجيتنا</button>
              </li>
              <li>
                <button onClick={() => handleScroll('services')} className="text-gray-400 hover:text-brand-gold transition-colors block font-medium">خدماتنا</button>
              </li>
              <li>
                <button onClick={() => handleScroll('sectors')} className="text-gray-400 hover:text-brand-gold transition-colors block font-medium">القطاعات</button>
              </li>
              <li>
                <a 
                  href="https://wa.me/966534786272" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-green-400 transition-colors block font-medium flex items-center gap-2"
                >
                  اتصل بنا <MessageCircle size={14}/>
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-xl mb-8 text-white">تواصل معنا</h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <Phone className="w-5 h-5 text-brand-gold mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1 font-bold">الهاتف</p>
                  <a href="https://wa.me/966534786272" target="_blank" rel="noopener noreferrer" className="font-bold text-gray-300 hover:text-white transition-colors text-right block" dir="ltr">
                    +966 53 478 6272
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-brand-gold mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1 font-bold">البريد الإلكتروني</p>
                  <a href="mailto:info@futurethinking.sa" className="font-bold text-gray-300 hover:text-white transition-colors">info@futurethinking.sa</a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-brand-gold mt-1" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1 font-bold">الموقع</p>
                  <p className="font-bold text-gray-300">مدينة الرياض، المملكة العربية السعودية</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm font-medium">© 2026 فكر المستقبل. جميع الحقوق محفوظة.</p>
          <div className="flex gap-6 text-sm text-gray-500 font-medium">
             <button onClick={() => onNavigate && onNavigate('privacy')} className="hover:text-white transition-colors">سياسة الخصوصية</button>
             <button onClick={() => onNavigate && onNavigate('terms')} className="hover:text-white transition-colors">الشروط والأحكام</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;