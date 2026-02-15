// Payment Service - Moyasar Integration
// Frontend payment handling with Apple Pay support

import { functions } from '../lib/supabase';

interface PaymentResult {
    success: boolean;
    payment_url?: string;
    payment_id?: string;
    transaction_id?: string;
    error?: string;
}

interface PaymentOptions {
    amount: number;
    item_type: 'course' | 'book' | 'consultation' | 'subscription';
    item_id: string;
    item_name: string;
}

// Moyasar Publishable Key from environment
const MOYASAR_PUBLISHABLE_KEY = import.meta.env.VITE_MOYASAR_PUBLISHABLE_KEY;

export const paymentService = {
    /**
     * Create a payment via redirect flow
     */
    createPayment: async (options: PaymentOptions): Promise<PaymentResult> => {
        try {
            const { data, error } = await functions.createPayment({
                ...options,
                callback_url: `${window.location.origin}/payment/callback`,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: true,
                payment_url: data.payment_url,
                payment_id: data.invoice_id,
                transaction_id: data.transaction_id,
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Process Apple Pay payment
     */
    processApplePay: async (token: string, options: PaymentOptions): Promise<PaymentResult> => {
        try {
            const { data, error } = await functions.applePayPayment({
                token,
                ...options,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return {
                success: data.success,
                payment_id: data.payment_id,
                transaction_id: data.transaction_id,
                error: data.success ? undefined : 'Payment failed',
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },

    /**
     * Check if Apple Pay is available
     */
    isApplePayAvailable: (): boolean => {
        return !!(window as any).ApplePaySession &&
            (window as any).ApplePaySession.canMakePayments();
    },

    /**
     * Initialize Moyasar Payment Form (for embedded form)
     */
    initMoyasarForm: (elementId: string, options: PaymentOptions & { onSuccess: () => void; onFailure: (error: string) => void }) => {
        // Load Moyasar script if not already loaded
        if (!(window as any).Moyasar) {
            const script = document.createElement('script');
            script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
            script.async = true;
            script.onload = () => initForm();
            document.body.appendChild(script);

            const style = document.createElement('link');
            style.rel = 'stylesheet';
            style.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
            document.head.appendChild(style);
        } else {
            initForm();
        }

        function initForm() {
            (window as any).Moyasar.init({
                element: `#${elementId}`,
                amount: options.amount * 100, // Convert to halalas
                currency: 'SAR',
                description: options.item_name,
                publishable_api_key: MOYASAR_PUBLISHABLE_KEY,
                callback_url: `${window.location.origin}/payment/callback`,
                methods: ['creditcard', 'applepay', 'stcpay'],
                apple_pay: {
                    country: 'SA',
                    label: 'منصة فكر المستقبل',
                    validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
                },
                metadata: {
                    item_type: options.item_type,
                    item_id: options.item_id,
                    item_name: options.item_name,
                },
                on_completed: function (payment: any) {
                    if (payment.status === 'paid') {
                        options.onSuccess();
                    } else {
                        options.onFailure(payment.source?.message || 'فشلت العملية');
                    }
                },
                on_failure: function (error: any) {
                    options.onFailure(error.message || 'فشلت العملية');
                },
            });
        }
    },

    /**
     * Parse payment callback from URL
     */
    parseCallback: (): { id: string; status: string; message?: string } | null => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        const status = urlParams.get('status');
        const message = urlParams.get('message');

        if (!id || !status) return null;

        return { id, status, message: message || undefined };
    },
};

export default paymentService;
