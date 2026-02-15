
import { useEffect, useRef } from 'react';

interface MoyasarProps {
    amount: number; // in Halalas (e.g., 1000 = 10 SAR)
    currency: string;
    description: string;
    publishableKey: string;
    callbackUrl: string;
    metadata?: Record<string, any>;
    onCompleted?: (payment: any) => void;
    onFailed?: (error: any) => void;
}

declare global {
    interface Window {
        Moyasar: any;
    }
}

const MoyasarForm = ({ amount, currency, description, publishableKey, callbackUrl, metadata, onCompleted, onFailed }: MoyasarProps) => {
    const formRef = useRef<HTMLDivElement>(null);
    const initiated = useRef(false);

    useEffect(() => {
        // Prevent double initialization
        if (initiated.current) return;
        initiated.current = true;

        // Load Moyasar CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
        document.head.appendChild(link);

        // Load Moyasar JS
        const script = document.createElement('script');
        script.src = 'https://polyfill.io/v3/polyfill.min.js?features=fetch';
        document.head.appendChild(script);

        const script2 = document.createElement('script');
        script2.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
        script2.onload = () => {
            if (window.Moyasar && formRef.current) {
                try {
                    window.Moyasar.init({
                        element: formRef.current,
                        amount: amount, // Amount in Halalas
                        currency: currency,
                        description: description,
                        publishable_api_key: publishableKey,
                        callback_url: callbackUrl,
                        methods: ['creditcard', 'stcpay', 'applepay'],
                        apple_pay: {
                            country: 'SA',
                            label: 'Future Thinking',
                            validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate'
                        },
                        metadata: metadata,
                        on_completed: (payment: any) => {
                            if (onCompleted) onCompleted(payment);
                        },
                        on_failed: (error: any) => {
                            console.error('Payment failed', error);
                            if (onFailed) onFailed(error);
                        }
                    });
                } catch (err) {
                    console.error("Moyasar init error:", err);
                }
            }
        };
        document.body.appendChild(script2);

        return () => {
            // Cleanup if necessary
            // document.head.removeChild(link);
            // document.body.removeChild(script2);
        };
    }, []);

    return (
        <div className="mysr-form-wrapper local-style">
            <div ref={formRef}></div>
            <style>{`
                /* Custom overrides to match dark theme */
                .mysr-form-wrapper {
                    direction: ltr; /* Moyasar form is usually LTR */
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                }
            `}</style>
        </div>
    );
};

export default MoyasarForm;
