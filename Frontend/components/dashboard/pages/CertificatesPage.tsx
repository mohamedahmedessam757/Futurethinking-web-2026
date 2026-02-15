
import React, { useRef, useState, useEffect } from 'react';
import { Award, Download, Share2, Eye, CheckCircle2, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../DashboardContext';
import { Certificate } from '../../GlobalContext';

const LOGO_URL = "/Primary.png";

interface CertificatesPageProps {
    selectedCertId?: string | null;
}

const CertificatesPage = ({ selectedCertId }: CertificatesPageProps) => {
    const { certificates } = useDashboard();
    const [generating, setGenerating] = useState(false);
    const [viewModalCert, setViewModalCert] = useState<Certificate | null>(null);
    const [showShareToast, setShowShareToast] = useState(false);

    // Hidden canvas for generation
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Auto-open if selectedCertId is provided
    useEffect(() => {
        if (selectedCertId) {
            const cert = certificates.find(c => c.id === selectedCertId);
            if (cert) {
                setViewModalCert(cert);
            }
        }
    }, [selectedCertId, certificates]);

    const handleDownload = async (cert: Certificate) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setGenerating(true);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Load Assets first
        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous";
        logoImg.src = LOGO_URL;

        // Wait for image
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve; // Continue even if logo fails
        });

        // Draw
        drawPremiumCertificate(ctx, canvas.width, canvas.height, cert, logoImg);

        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `Certificate-${cert.studentName}-${cert.serialNumber}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setGenerating(false);
        }, 500);
    };

    const drawPremiumCertificate = (ctx: CanvasRenderingContext2D, width: number, height: number, cert: Certificate, logoImg: HTMLImageElement) => {
        // 1. Background (Cream/Off-White)
        ctx.fillStyle = "#FDFBF7";
        ctx.fillRect(0, 0, width, height);

        // 2. Geometric Pattern (Subtle Watermark)
        ctx.save();
        ctx.strokeStyle = "rgba(15, 44, 89, 0.03)"; // Very faint Navy
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i - 200, height);
            ctx.stroke();
        }
        ctx.restore();

        // 3. Double Border (Premium Look)
        // Outer Navy
        ctx.strokeStyle = "#0f2c59";
        ctx.lineWidth = 15;
        ctx.strokeRect(20, 20, width - 40, height - 40);

        // Inner Gold
        ctx.strokeStyle = "#c6a568";
        ctx.lineWidth = 5;
        ctx.strokeRect(40, 40, width - 80, height - 80);

        // Corner Ornaments
        const cornerSize = 60;
        ctx.fillStyle = "#0f2c59";
        // Top Left
        ctx.fillRect(20, 20, cornerSize, 15);
        ctx.fillRect(20, 20, 15, cornerSize);
        // Top Right
        ctx.fillRect(width - 20 - cornerSize, 20, cornerSize, 15);
        ctx.fillRect(width - 20 - 15, 20, 15, cornerSize);
        // Bottom Left
        ctx.fillRect(20, height - 20 - 15, cornerSize, 15);
        ctx.fillRect(20, height - 20 - cornerSize, 15, cornerSize);
        // Bottom Right
        ctx.fillRect(width - 20 - cornerSize, height - 20 - 15, cornerSize, 15);
        ctx.fillRect(width - 20 - 15, height - 20 - cornerSize, 15, cornerSize);

        // 4. Logo (Top Center)
        // Safety check: Ensure image loaded correctly to avoid 'broken state' error
        if (logoImg.complete && logoImg.naturalWidth > 0) {
            const logoW = 100;
            const logoH = (logoW * logoImg.height) / logoImg.width;
            ctx.drawImage(logoImg, (width / 2) - (logoW / 2), 80, logoW, logoH);
        }

        // 5. Header Text
        ctx.textAlign = "center";
        ctx.fillStyle = "#0f2c59";
        ctx.font = "bold 50px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText("شهادة إتمام", width / 2, 230);

        ctx.fillStyle = "#c6a568";
        ctx.font = "30px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText("FUTURE THINKING CERTIFICATE", width / 2, 280);

        // 6. Body Text
        ctx.fillStyle = "#555";
        ctx.font = "24px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText("تشهد منصة فكر المستقبل بأن", width / 2, 380);

        // 7. Student Name (Big & Fancy)
        ctx.fillStyle = "#0f2c59";
        ctx.font = "bold 60px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText(cert.studentName, width / 2, 460);
        // Underline name
        ctx.beginPath();
        ctx.moveTo((width / 2) - 200, 480);
        ctx.lineTo((width / 2) + 200, 480);
        ctx.strokeStyle = "#c6a568";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 8. Course Details
        ctx.fillStyle = "#555";
        ctx.font = "24px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText("قد أتم بنجاح متطلبات الدورة التدريبية بعنوان:", width / 2, 550);

        ctx.fillStyle = "#c6a568";
        ctx.font = "bold 40px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText(cert.courseTitle, width / 2, 620);

        // 9. Footer Info (Date & Instructor)
        ctx.fillStyle = "#333";
        ctx.font = "20px 'IBM Plex Sans Arabic', sans-serif";
        ctx.fillText(`تاريخ الإصدار: ${new Date(cert.issueDate).toLocaleDateString('ar-SA')}`, (width / 2) + 250, 780);
        ctx.fillText(`المدرب: ${cert.instructor}`, (width / 2) - 250, 780);

        // 10. Serial No Only (No QR)
        ctx.fillStyle = "#888";
        ctx.font = "16px 'Courier New'";
        ctx.fillText(`Serial No: ${cert.serialNumber}`, width / 2, 900);

        // 11. Seal
        ctx.save();
        ctx.translate(150, 850);
        ctx.rotate(-0.2);
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.strokeStyle = "#c6a568"; // Gold
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = "rgba(198, 165, 104, 0.1)";
        ctx.fill();
        ctx.fillStyle = "#c6a568";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("OFFICIAL", 0, 5);
        ctx.fillText("SEAL", 0, 25);
        ctx.restore();
    }

    const handleShare = () => {
        navigator.clipboard.writeText(`https://futurethinking.sa/verify/${viewModalCert?.serialNumber}`);
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
    };

    return (
        <div className="space-y-8 relative">
            {/* Canvas hidden from view but used for generation */}
            <canvas ref={canvasRef} width={1200} height={1050} className="hidden"></canvas>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">شهاداتي</h1>
                    <p className="text-gray-400">إنجازاتك الموثقة ({certificates.length} شهادة)</p>
                </div>
            </div>

            {certificates.length > 0 ? (
                <div className="grid lg:grid-cols-2 gap-6">
                    {certificates.map((cert) => (
                        <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0f2344]/40 border border-white/5 rounded-3xl p-6 flex flex-col relative overflow-hidden group hover:border-brand-gold/30 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-brand-navy">
                                    <Award className="text-brand-gold" size={24} />
                                </div>
                                <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 size={12} /> معتمدة
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{cert.courseTitle}</h3>
                            <p className="text-sm text-gray-400 mb-6">تاريخ الإصدار: {new Date(cert.issueDate).toLocaleDateString('ar-SA')}</p>

                            <div className="mt-auto flex gap-3">
                                <button
                                    onClick={() => setViewModalCert(cert)}
                                    className="flex-1 bg-brand-gold text-brand-navy py-2 rounded-xl font-bold hover:bg-white transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye size={16} /> عرض
                                </button>
                                <button
                                    onClick={() => handleDownload(cert)}
                                    disabled={generating}
                                    className="px-3 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                                    title="تحميل"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[#0f2344]/20 rounded-3xl border border-white/5">
                    <Award className="w-20 h-20 text-gray-600 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد شهادات بعد</h3>
                    <p className="text-gray-400 mb-6">أكمل دوراتك التدريبية لتحصل على شهادات معتمدة.</p>
                </div>
            )}

            {/* View Modal */}
            <AnimatePresence>
                {viewModalCert && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={() => setViewModalCert(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-xl overflow-hidden max-w-4xl w-full relative shadow-2xl flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button onClick={() => setViewModalCert(null)} className="absolute top-4 left-4 p-2 bg-black/10 rounded-full hover:bg-black/20 z-50 text-brand-navy">
                                <X size={20} />
                            </button>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto flex-1">
                                {/* Certificate Visual (HTML Mockup matching Canvas logic for preview) */}
                                <div className="aspect-[1.414/1] w-full bg-[#FDFBF7] relative p-6 md:p-12 flex flex-col items-center text-center overflow-hidden">
                                    {/* Background Pattern */}
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #0f2c59 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                                    {/* Borders */}
                                    <div className="absolute inset-3 md:inset-4 border-[10px] md:border-[15px] border-brand-navy pointer-events-none"></div>
                                    <div className="absolute inset-6 md:inset-8 border-[2px] border-brand-gold pointer-events-none"></div>

                                    {/* Logo */}
                                    <img src={LOGO_URL} className="h-12 md:h-16 mb-4 md:mb-6 relative z-10" alt="Logo" />

                                    <h1 className="text-3xl md:text-5xl font-bold text-brand-navy mb-2">شهادة إتمام</h1>
                                    <p className="text-brand-gold text-lg md:text-xl tracking-widest mb-6 md:mb-8">CERTIFICATE OF COMPLETION</p>

                                    <p className="text-gray-600 text-base md:text-lg mb-4">تشهد منصة فكر المستقبل بأن</p>

                                    <h2 className="text-2xl md:text-5xl font-bold text-brand-navy mb-2">{viewModalCert.studentName}</h2>
                                    <div className="w-40 md:w-64 h-0.5 bg-brand-gold mb-6 md:mb-8"></div>

                                    <p className="text-gray-600 text-base md:text-lg mb-4">قد أتم بنجاح متطلبات الدورة التدريبية بعنوان</p>
                                    <h3 className="text-xl md:text-4xl font-bold text-brand-gold mb-8 md:mb-12">{viewModalCert.courseTitle}</h3>

                                    <div className="flex justify-between w-full max-w-3xl mt-auto relative z-10 px-4 md:px-8">
                                        <div className="text-center">
                                            <p className="font-bold text-brand-navy text-sm">التاريخ</p>
                                            <p className="text-gray-600 font-mono mt-1 text-sm">{new Date(viewModalCert.issueDate).toLocaleDateString('en-GB')}</p>
                                        </div>

                                        {/* Serial No (Text Only, No QR) */}
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Serial Number</p>
                                            <p className="text-xs md:text-sm font-mono text-brand-navy font-bold border-b border-gray-300 pb-1">{viewModalCert.serialNumber}</p>
                                        </div>

                                        <div className="text-center">
                                            <p className="font-bold text-brand-navy text-sm">المدرب</p>
                                            <div className="font-serif text-lg md:text-xl text-brand-gold mt-1 italic">{viewModalCert.instructor}</div>
                                        </div>
                                    </div>

                                    {/* Gold Seal */}
                                    <div className="absolute bottom-16 left-[20%] opacity-100 hidden sm:block">
                                        <div className="w-20 h-20 md:w-24 md:h-24 border-4 border-brand-gold rounded-full flex items-center justify-center relative rotate-[-15deg]">
                                            <div className="w-16 h-16 md:w-20 md:h-20 border border-brand-gold rounded-full flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-[8px] md:text-[10px] font-bold text-brand-gold tracking-widest">OFFICIAL</div>
                                                    <Award className="w-6 h-6 md:w-8 md:h-8 text-brand-gold mx-auto" />
                                                    <div className="text-[8px] md:text-[10px] font-bold text-brand-gold tracking-widest">SEAL</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="bg-gray-50 p-4 flex justify-end gap-3 border-t border-gray-200 shrink-0">
                                <button
                                    onClick={() => handleDownload(viewModalCert)}
                                    disabled={generating}
                                    className="bg-brand-navy text-white px-6 py-2 rounded-lg font-bold hover:bg-brand-gold hover:text-brand-navy transition-colors flex items-center gap-2 text-sm md:text-base"
                                >
                                    {generating ? 'جاري المعالجة...' : <><Download size={18} /> تحميل الشهادة</>}
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm md:text-base"
                                >
                                    <Share2 size={18} /> نسخ الرابط
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Share Toast */}
            <AnimatePresence>
                {showShareToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 z-[60] font-bold"
                    >
                        <Copy size={18} /> تم نسخ رابط التحقق بنجاح
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CertificatesPage;
