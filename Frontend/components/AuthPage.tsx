
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ArrowRight, Mail, Lock, Eye, EyeOff, User,
    AlertCircle, Briefcase, Phone, ShieldCheck, Loader2
} from 'lucide-react';
import { useGlobal } from './GlobalContext';
import { loginSchema, registerSchema, LoginFormValues, RegisterFormValues } from '../lib/validations';
import { supabase } from '../lib/supabase';

// --- SVGs for Social Login ---
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.766 12.2764C23.766 11.4607 23.6999 10.6406 23.5588 9.83807H12.24V14.4591H18.7217C18.4528 15.9494 17.5885 17.2678 16.323 18.1056V21.1039H20.19C22.4608 19.0139 23.766 15.9274 23.766 12.2764Z" fill="#4285F4" />
        <path d="M12.24 24.0008C15.4765 24.0008 18.2058 22.9382 20.1945 21.1039L16.3275 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.24 24.0008Z" fill="#34A853" />
        <path d="M5.50253 14.3003C5.00236 12.8099 5.00236 11.1961 5.50253 9.70575V6.61481H1.51649C-0.18551 10.0056 -0.18551 14.0004 1.51649 17.3912L5.50253 14.3003Z" fill="#FBBC05" />
        <path d="M12.24 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.24 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.24 4.74966Z" fill="#EA4335" />
    </svg>
);

const TwitterIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const ILLUSTRATION_URL = "/hero-3d-visual.png";

interface AuthPageProps {
    onBack: () => void;
    onForgotPassword?: () => void;
}

const AuthPage = ({ onBack, onForgotPassword }: AuthPageProps) => {
    const { login, registerUser } = useGlobal();
    const [isLogin, setIsLogin] = useState(true);
    const [userType, setUserType] = useState<'client' | 'consultant' | 'admin'>('client');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Forms with Secure Schema
    const loginForm = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const registerForm = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
    });

    // Switch role to client if switching to Register mode and Admin is selected
    useEffect(() => {
        if (!isLogin && userType === 'admin') {
            setUserType('client');
        }
        setAuthError(null); // Clear error on mode change
    }, [isLogin, userType]);

    const onLoginSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setAuthError(null);

        // Map the UI state 'userType' to the actual role string
        const role = userType === 'admin' ? 'admin' : userType === 'consultant' ? 'consultant' : 'student';

        try {
            await login(data.email, data.password, role);
            // Navigation handles itself via App.tsx currentUser check
        } catch (err: any) {
            setAuthError(err.message || "حدث خطأ أثناء تسجيل الدخول.");
        } finally {
            setIsLoading(false);
        }
    };

    const onRegisterSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true);
        setAuthError(null);

        try {
            await registerUser({
                name: data.name,
                email: data.email,
                password: data.password, // Important: pass the password
                role: userType === 'consultant' ? 'consultant' : 'student',
                title: userType === 'client' ? 'طالب' : 'مستشار',
                bio: 'مستخدم جديد',
                subscriptionTier: 'free'
            });
            // Navigation will be handled by App.tsx checking currentUser
        } catch (err: any) {
            setAuthError(err.message || 'حدث خطأ أثناء إنشاء الحساب.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google') => {
        // Prevent multiple clicks
        if (isLoading) return;

        setIsLoading(true);
        setAuthError(null);

        // Safety Timeout: Reset loading state if redirect doesn't happen within 15 seconds
        // This fixes the "Eternal Loading" glitch if the network request fails silently
        const safetyTimeout = setTimeout(() => {
            setIsLoading(false);
            setAuthError("استغرق الاتصال وقتاً طويلاً. يرجى المحاولة مرة أخرى.");
        }, 15000);

        try {
            // Atomic Role Logic:
            // We pass the role in the `options.data` object.
            // The database trigger `handle_new_user` configured in `full_auth_setup.sql` 
            // will read `raw_user_meta_data->>'role'` and set it in the profiles table.

            // Only 'consultant' or 'student'
            const targetRole = userType === 'consultant' ? 'consultant' : 'student';

            // IMPORTANT: Store intended role in localStorage as backup
            // GlobalContext will use this if user_metadata doesn't have the role
            localStorage.setItem('intended_role', targetRole);

            // Use the wrapper method in our lib/supabase.ts
            // Note: We access `auth.signInWithOAuth` via the imported instance to match the new signature
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    data: {
                        role: targetRole,
                        // This metadata is critical. It travels with the user creation event.
                    }
                } as any
            });

            if (error) throw error;

            // If successful, the browser will redirect.
            // We DON'T clear the timeout here immediately.

        } catch (err: any) {
            clearTimeout(safetyTimeout); // Clear timeout since we handled the error
            console.error("OAuth Error:", err);
            setAuthError(err.message || 'فشل الدخول عبر Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#06152e] flex items-center justify-center py-12 px-4 lg:px-6 font-sans text-right relative overflow-y-auto" dir="rtl">

            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 fixed pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-navy/40 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/10 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
            </div>

            <div className="w-full max-w-[1400px] min-h-[700px] grid lg:grid-cols-2 gap-4 lg:gap-12 relative z-10">

                {/* Right Side: Form (Glassmorphism) */}
                <div className="flex flex-col justify-center items-center lg:items-start h-full pb-8 lg:pb-0">

                    {/* Back Button */}
                    <button onClick={onBack} className="absolute top-0 right-0 lg:-top-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors z-50 group mb-6">
                        <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium">العودة للرئيسية</span>
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full max-w-[480px] mx-auto lg:mx-0 mt-8 lg:mt-0"
                    >
                        {/* Header */}
                        <div className="text-center lg:text-right mb-8">
                            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                                {isLogin ? 'أهلاً بك مجدداً' : 'انضم لعائلة فكر'}
                            </h2>
                            <p className="text-gray-400 text-base leading-relaxed">
                                {isLogin
                                    ? 'سجل دخولك لمتابعة آخر التحديثات وإدارة مشاريعك.'
                                    : 'أنشئ حسابك الآن وابدأ رحلة التميز المؤسسي معنا.'}
                            </p>
                        </div>

                        {/* Main Card */}
                        <div className="bg-[#0f2344]/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">

                            {/* Role Selector Logic */}
                            <div className="flex bg-black/20 p-1.5 rounded-xl mb-8 relative border border-white/5">
                                <motion.div
                                    className="absolute top-1.5 bottom-1.5 rounded-lg bg-brand-gold shadow-lg shadow-brand-gold/20"
                                    initial={false}
                                    animate={{
                                        width: isLogin ? 'calc(33.33% - 4px)' : 'calc(50% - 4px)',
                                        left: isLogin
                                            ? (userType === 'client' ? 'calc(66.66% + 2px)' : userType === 'consultant' ? 'calc(33.33% + 2px)' : '2px')
                                            : (userType === 'client' ? 'calc(50% + 2px)' : '2px'),
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                />

                                <button
                                    type="button"
                                    onClick={() => setUserType('client')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg relative z-10 font-bold text-sm transition-colors cursor-pointer select-none
                              ${userType === 'client' ? 'text-[#06152e]' : 'text-gray-200 hover:text-white hover:bg-white/5'}`}
                                >
                                    <User className="w-4 h-4" />
                                    طالب
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUserType('consultant')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg relative z-10 font-bold text-sm transition-colors cursor-pointer select-none
                              ${userType === 'consultant' ? 'text-[#06152e]' : 'text-gray-200 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Briefcase className="w-4 h-4" />
                                    مستشار
                                </button>
                                {/* Admin Option - Only Visible in Login Mode */}
                                {isLogin && (
                                    <button
                                        type="button"
                                        onClick={() => setUserType('admin')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg relative z-10 font-bold text-sm transition-colors cursor-pointer select-none
                                ${userType === 'admin' ? 'text-[#06152e]' : 'text-gray-200 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <ShieldCheck className="w-4 h-4" />
                                        مشرف
                                    </button>
                                )}
                            </div>

                            {/* Forms Area */}
                            <div className="relative">
                                <AnimatePresence mode="wait">
                                    {isLogin ? (
                                        <motion.form
                                            key="login"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                                            className="space-y-5"
                                        >
                                            {/* Auth Error Message */}
                                            {authError && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm flex items-start gap-2"
                                                >
                                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                                    {authError}
                                                </motion.div>
                                            )}

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-300 mr-1">البريد الإلكتروني</label>
                                                <div className="relative group">
                                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-gold transition-colors" />
                                                    <input
                                                        {...loginForm.register('email')}
                                                        type="email"
                                                        className="w-full bg-[#06152e]/50 border border-white/10 text-white pr-12 pl-4 py-3.5 rounded-xl focus:outline-none focus:border-brand-gold/60 focus:bg-[#06152e]/80 transition-all placeholder:text-gray-600 font-medium"
                                                        placeholder="user@example.com"
                                                    />
                                                </div>
                                                {loginForm.formState.errors.email && (
                                                    <p className="text-red-400 text-xs flex items-center gap-1 mr-2 mt-1"><AlertCircle className="w-3 h-3" /> {loginForm.formState.errors.email.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-300 mr-1">كلمة المرور</label>
                                                <div className="relative group">
                                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-gold transition-colors" />
                                                    <input
                                                        {...loginForm.register('password')}
                                                        type={showPassword ? "text" : "password"}
                                                        className="w-full bg-[#06152e]/50 border border-white/10 text-white pr-12 pl-12 py-3.5 rounded-xl focus:outline-none focus:border-brand-gold/60 focus:bg-[#06152e]/80 transition-all placeholder:text-gray-600 font-medium"
                                                        placeholder="••••••••"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                {loginForm.formState.errors.password && (
                                                    <p className="text-red-400 text-xs flex items-center gap-1 mr-2 mt-1"><AlertCircle className="w-3 h-3" /> {loginForm.formState.errors.password.message}</p>
                                                )}
                                            </div>

                                            <div className="text-left">
                                                <button type="button" onClick={onForgotPassword} className="text-xs text-brand-gold hover:text-white transition-colors">نسيت كلمة المرور؟</button>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full bg-gradient-to-r from-brand-gold to-[#d4b67d] text-[#06152e] font-bold py-4 rounded-xl hover:shadow-[0_0_20px_rgba(198,165,104,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                                            >
                                                {isLoading ? (
                                                    <div className="w-5 h-5 border-2 border-[#06152e] border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    'تسجيل الدخول'
                                                )}
                                            </button>

                                            {/* Social Login Buttons - Hide for Admin */}
                                            {userType !== 'admin' && (
                                                <div className="mt-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSocialLogin('google')}
                                                        disabled={isLoading}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white text-[#06152e] rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
                                                    >
                                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />} متابعة باستخدام Google
                                                    </button>
                                                </div>
                                            )}

                                            <div className="text-center pt-4 border-t border-white/5">
                                                <p className="text-sm text-gray-400">
                                                    ليس لديك حساب؟ <button type="button" onClick={() => setIsLogin(false)} className="text-brand-gold font-bold hover:underline">سجل الآن</button>
                                                </p>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        <motion.form
                                            key="register"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-300 mr-1">الاسم الكامل</label>
                                                <div className="relative group">
                                                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-gold transition-colors" />
                                                    <input
                                                        {...registerForm.register('name')}
                                                        type="text"
                                                        className="w-full bg-[#06152e]/50 border border-white/10 text-white pr-12 pl-4 py-3.5 rounded-xl focus:outline-none focus:border-brand-gold/60 focus:bg-[#06152e]/80 transition-all placeholder:text-gray-600 font-medium"
                                                        placeholder="الاسم الثلاثي"
                                                    />
                                                </div>
                                                {registerForm.formState.errors.name && (
                                                    <p className="text-red-400 text-xs flex items-center gap-1 mr-2"><AlertCircle className="w-3 h-3" /> {registerForm.formState.errors.name.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-300 mr-1">البريد الإلكتروني</label>
                                                <div className="relative group">
                                                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-gold transition-colors" />
                                                    <input
                                                        {...registerForm.register('email')}
                                                        type="email"
                                                        className="w-full bg-[#06152e]/50 border border-white/10 text-white pr-12 pl-4 py-3.5 rounded-xl focus:outline-none focus:border-brand-gold/60 focus:bg-[#06152e]/80 transition-all placeholder:text-gray-600 font-medium"
                                                        placeholder="example@email.com"
                                                    />
                                                </div>
                                                {registerForm.formState.errors.email && (
                                                    <p className="text-red-400 text-xs flex items-center gap-1 mr-2"><AlertCircle className="w-3 h-3" /> {registerForm.formState.errors.email.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-300 mr-1">رقم الجوال</label>
                                                <div className="relative group">
                                                    <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-gold transition-colors" />
                                                    <input
                                                        {...registerForm.register('phone')}
                                                        type="tel"
                                                        className="w-full bg-[#06152e]/50 border border-white/10 text-white pr-12 pl-4 py-3.5 rounded-xl focus:outline-none focus:border-brand-gold/60 focus:bg-[#06152e]/80 transition-all placeholder:text-gray-600 font-medium text-left"
                                                        placeholder="05xxxxxxxx"
                                                        dir="ltr"
                                                    />
                                                </div>
                                                {registerForm.formState.errors.phone && (
                                                    <p className="text-red-400 text-xs flex items-center gap-1 mr-2"><AlertCircle className="w-3 h-3" /> {registerForm.formState.errors.phone.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-300 mr-1">كلمة المرور</label>
                                                <div className="relative group">
                                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-gold transition-colors" />
                                                    <input
                                                        {...registerForm.register('password')}
                                                        type="password"
                                                        className="w-full bg-[#06152e]/50 border border-white/10 text-white pr-12 pl-4 py-3.5 rounded-xl focus:outline-none focus:border-brand-gold/60 focus:bg-[#06152e]/80 transition-all placeholder:text-gray-600 font-medium"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                {registerForm.formState.errors.password && (
                                                    <p className="text-red-400 text-xs flex items-center gap-1 mr-2"><AlertCircle className="w-3 h-3" /> {registerForm.formState.errors.password.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-300 mr-1">تأكيد كلمة المرور</label>
                                                <div className="relative group">
                                                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-brand-gold transition-colors" />
                                                    <input
                                                        {...registerForm.register('confirmPassword')}
                                                        type="password"
                                                        className="w-full bg-[#06152e]/50 border border-white/10 text-white pr-12 pl-4 py-3.5 rounded-xl focus:outline-none focus:border-brand-gold/60 focus:bg-[#06152e]/80 transition-all placeholder:text-gray-600 font-medium"
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                {registerForm.formState.errors.confirmPassword && (
                                                    <p className="text-red-400 text-xs flex items-center gap-1 mr-2"><AlertCircle className="w-3 h-3" /> {registerForm.formState.errors.confirmPassword.message}</p>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full bg-brand-navy border border-brand-gold text-brand-gold font-bold py-4 rounded-xl hover:bg-brand-gold hover:text-brand-navy hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                                            >
                                                {isLoading ? (
                                                    <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    'إنشاء الحساب'
                                                )}
                                            </button>

                                            {/* Social Login Buttons */}
                                            <div className="mt-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSocialLogin('google')}
                                                    disabled={isLoading}
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-white text-[#06152e] rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm disabled:opacity-50"
                                                >
                                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />} التسجيل باستخدام Google
                                                </button>
                                            </div>

                                            <div className="text-center pt-4 border-t border-white/5">
                                                <p className="text-sm text-gray-400">
                                                    لديك حساب بالفعل؟ <button type="button" onClick={() => setIsLogin(true)} className="text-brand-gold font-bold hover:underline">سجل دخولك</button>
                                                </p>
                                            </div>
                                        </motion.form>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Left Side: Illustration */}
                <div className="hidden lg:block relative min-h-[700px] h-full rounded-[3rem] overflow-hidden shadow-2xl my-auto">
                    <div className="absolute inset-0 bg-brand-navy/30 mix-blend-multiply z-10"></div>
                    <img
                        src={ILLUSTRATION_URL}
                        alt="Future Thinking Illustration"
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-[20s]"
                    />
                    <div className="absolute bottom-0 left-0 right-0 z-30 p-12 text-center bg-gradient-to-t from-[#06152e] to-transparent pt-32">
                        <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                            تجربة تعليمية <span className="text-brand-gold">متكاملة</span>
                        </h1>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;
