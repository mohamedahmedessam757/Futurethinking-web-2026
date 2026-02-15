import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import Toast, { ToastType } from './Toast';

interface ToastData {
    id: string;
    title: string;
    message: string;
    type: ToastType;
    duration?: number;
    link?: string;
}

interface ToastContextType {
    showToast: (title: string, message: string, type?: ToastType, link?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const showToast = useCallback((title: string, message: string, type: ToastType = 'info', link?: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => {
            // Limit to 3 toasts to prevent flooding
            const current = [...prev];
            if (current.length >= 3) current.shift();
            return [...current, { id, title, message, type, duration: 5000, link }];
        });
    }, []);

    const closeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-0 left-0 p-4 md:p-8 w-full max-w-sm z-[9999] flex flex-col gap-2 pointer-events-none" style={{ direction: 'ltr' }}>
                {/* LTR direction ensures they stack nicely on the left (or right if preferred) - Using LEFT for visibility since RTL app usually has nav on Right */}
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            {...toast}
                            onClose={closeToast}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
};
