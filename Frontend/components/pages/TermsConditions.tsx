import React from 'react';
import { FileText } from 'lucide-react';

const TermsConditions = () => {
  return (
    <div className="bg-brand-light min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-[#06152e] text-white rounded-[2.5rem] p-10 md:p-16 mb-12 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-gold/30">
                 <FileText className="w-10 h-10 text-brand-gold" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">الشروط والأحكام</h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                 يرجى قراءة هذه الشروط بعناية قبل استخدام خدمات فكر المستقبل.
              </p>
           </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-gray-100 space-y-10">
           
           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">1. قبول الشروط</h2>
              <p className="text-gray-700 leading-relaxed">
                 من خلال الوصول إلى هذا الموقع واستخدامه، فإنك توافق على الالتزام بهذه الشروط والأحكام وجميع القوانين واللوائح المعمول بها في المملكة العربية السعودية. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام الموقع.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">2. الخدمات الاستشارية والتدريبية</h2>
              <p className="text-gray-700 leading-relaxed">
                 تقدم "فكر المستقبل" خدمات استشارية وبرامج تدريبية. نحن نسعى لضمان دقة وجودة المحتوى والخدمات المقدمة، ولكننا لا نضمن نتائج محددة حيث تعتمد النتائج على عوامل متعددة منها تطبيق العميل للتوصيات.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">3. حقوق الملكية الفكرية</h2>
              <p className="text-gray-700 leading-relaxed">
                 جميع المحتويات الموجودة على هذا الموقع (النصوص، التصاميم، الشعارات، البرامج التدريبية) هي ملكية حصرية لشركة فكر المستقبل ومحمية بموجب قوانين حقوق النشر والعلامات التجارية. يمنع نسخ أو توزيع أو تعديل أي جزء من المحتوى دون إذن كتابي مسبق.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">4. التسجيل والحسابات</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                 عند إنشاء حساب لدينا، يجب عليك تقديم معلومات دقيقة وكاملة. أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور الخاصة بك، وعن جميع الأنشطة التي تحدث تحت حسابك.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">5. سياسة الدفع والاسترجاع</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                 <li>يجب دفع رسوم الخدمات الاستشارية أو الدورات التدريبية مقدماً عبر وسائل الدفع المعتمدة.</li>
                 <li>تخضع سياسة الاسترجاع للشروط المحددة في كل عقد خدمة أو دورة تدريبية على حدة.</li>
                 <li>في حالة إلغاء المواعيد من قبل العميل، يجب الإشعار قبل 24 ساعة على الأقل لتجنب رسوم الإلغاء.</li>
              </ul>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">6. إخلاء المسؤولية</h2>
              <p className="text-gray-700 leading-relaxed">
                 يتم تقديم الموقع والخدمات "كما هي" دون أي ضمانات صريحة أو ضمنية. لا تتحمل فكر المستقبل المسؤولية عن أي أضرار مباشرة أو غير مباشرة تنشأ عن استخدام الموقع أو عدم القدرة على استخدامه.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">7. القانون الواجب التطبيق</h2>
              <p className="text-gray-700 leading-relaxed">
                 تخضع هذه الشروط والأحكام وتفسر وفقاً لأنظمة المملكة العربية السعودية. تختص المحاكم السعودية بالفصل في أي نزاع ينشأ عن هذه الشروط.
              </p>
           </section>

           <div className="border-t border-gray-100 pt-8 mt-8">
              <p className="text-gray-500 text-sm">
                 آخر تحديث: 1 يناير 2024 <br/>
                 للاستفسارات: <a href="mailto:info@futurethinking.sa" className="text-brand-navy font-bold hover:text-brand-gold transition-colors">info@futurethinking.sa</a>
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;