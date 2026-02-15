import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-brand-light min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="bg-[#06152e] text-white rounded-[2.5rem] p-10 md:p-16 mb-12 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-gold/30">
                 <Shield className="w-10 h-10 text-brand-gold" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">سياسة الخصوصية</h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                 في فكر المستقبل، نلتزم بحماية خصوصيتك وضمان أمان بياناتك الشخصية.
              </p>
           </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto bg-white rounded-[2rem] p-8 md:p-12 shadow-xl border border-gray-100 space-y-10">
           
           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">1. مقدمة</h2>
              <p className="text-gray-700 leading-relaxed">
                 توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات التي تقدمها لنا عند استخدام موقعنا الإلكتروني أو خدماتنا. باستخدامك للموقع، فإنك توافق على الممارسات الموضحة في هذه السياسة.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">2. المعلومات التي نجمعها</h2>
              <p className="text-gray-700 leading-relaxed mb-4">قد نجمع المعلومات التالية:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                 <li>المعلومات الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف) عند التسجيل أو حجز استشارة.</li>
                 <li>معلومات حول استخدامك للموقع (ملفات تعريف الارتباط، الصفحات التي تمت زيارتها).</li>
                 <li>المعلومات المتعلقة بالمدفوعات (يتم معالجتها بشكل آمن عبر بوابات دفع طرف ثالث).</li>
              </ul>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">3. استخدام المعلومات</h2>
              <p className="text-gray-700 leading-relaxed mb-4">نستخدم المعلومات التي نجمعها من أجل:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 mr-4">
                 <li>تقديم خدماتنا وتحسين تجربتك على الموقع.</li>
                 <li>التواصل معك بخصوص مواعيدك، تحديثات الخدمات، أو العروض الترويجية (في حال الموافقة).</li>
                 <li>تحليل البيانات لتحسين أداء الموقع وتطوير خدماتنا.</li>
              </ul>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">4. حماية البيانات</h2>
              <p className="text-gray-700 leading-relaxed">
                 نحن نتخذ تدابير أمنية تقنية وتنظيمية مناسبة لحماية بياناتك من الوصول غير المصرح به أو التغيير أو الإفصاح أو الإتلاف. يتم تشفير البيانات الحساسة أثناء النقل.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">5. مشاركة المعلومات</h2>
              <p className="text-gray-700 leading-relaxed">
                 لا نقوم ببيع أو تأجير بياناتك الشخصية لأطراف ثالثة. قد نشارك المعلومات فقط مع مقدمي الخدمات الموثوق بهم الذين يساعدوننا في تشغيل أعمالنا (مثل معالجة المدفوعات)، وذلك بموجب اتفاقيات سرية صارمة.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">6. حقوقك</h2>
              <p className="text-gray-700 leading-relaxed">
                 لديك الحق في الوصول إلى بياناتك الشخصية، تصحيحها، أو طلب حذفها في أي وقت. يمكنك التواصل معنا عبر البريد الإلكتروني لممارسة هذه الحقوق.
              </p>
           </section>

           <section>
              <h2 className="text-2xl font-bold text-brand-navy mb-4 border-r-4 border-brand-gold pr-3">7. تغييرات السياسة</h2>
              <p className="text-gray-700 leading-relaxed">
                 قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة، ويعتبر استمرارك في استخدام الموقع بعد نشر التغييرات موافقة عليها.
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

export default PrivacyPolicy;