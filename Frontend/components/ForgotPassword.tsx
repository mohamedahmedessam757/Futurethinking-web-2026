import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordProps {
    onBack: () => void;
}

const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setIsLoading(true);
        // Simulate API Call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsLoading(false);
        setIsSuccess(true);
    };

    return (
        <div className="min-h-screen bg-[#06152e] flex items-center justify-center py-12 px-4 lg:px-6 font-sans text-right relative overflow-y-auto" dir="rtl">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 fixed pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-navy/40 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/10 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-8">
                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium">العودة لتسجيل الدخول</span>
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="bg-[#0f2344]/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-gold/20">
                            {isSuccess ? <CheckCircle2 className="w-8 h-8 text-green-400" /> : <Mail className="w-8 h-8 text-brand-gold" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {isSuccess ? 'تم الإرسال بنجاح' : 'استعادة كلمة المرور'}
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {isSuccess
                                ? 'تحقق من بريدك الإلكتروني، لقد أرسلنا لك رابطاً لتعيين كلمة مرور جديدة.'
                                : 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لاستعادة كلمة المرور.'}
                        </p>
                    </div>

                    {isSuccess ? (
                        <button
                            onClick={onBack}
                            className="w-full bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                        >
                            العودة لتسجيل الدخول
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-300 mr-1">البريد الإلكتروني</label>
                                <div className="relative group">
                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-gold transition-colors" />
                                    <input
                                        {...register('email')}
                                        type="email"
                                        className="w-full bg-[#06152e]/50 border border-white/10 text-white pr-12 pl-4 py-3.5 rounded-xl focus:outline-none focus:border-brand-gold/60 focus:bg-[#06152e]/80 transition-all placeholder:text-gray-600 font-medium"
                                        placeholder="name@example.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-400 text-xs flex items-center gap-1 mr-2 mt-1"><AlertCircle className="w-3 h-3" /> {errors.email.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-brand-gold text-[#06152e] font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(198,165,104,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-[#06152e] border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    'إرسال الرابط'
                                )}
                            </button>
                        </form>
                    )}

                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;