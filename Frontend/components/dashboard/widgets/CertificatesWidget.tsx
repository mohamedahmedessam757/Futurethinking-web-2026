
import React from 'react';
import { Award, Download, ArrowLeft } from 'lucide-react';
import { DashboardView } from '../StudentDashboard';
import { useDashboard } from '../DashboardContext';

interface CertificatesWidgetProps {
    onNavigate?: (view: DashboardView, id?: string) => void;
}

const CertificatesWidget = ({ onNavigate }: CertificatesWidgetProps) => {
    const { certificates } = useDashboard();
    
    // Get latest (DashboardContext already sorts them)
    const latestCert = certificates[0];

    const navigateToCert = (id?: string) => {
        if (onNavigate) {
            // We pass the cert ID as the second param so CertificatesPage can open it
            onNavigate('certificates', id);
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-end">
                <h2 className="text-xl font-bold text-white border-r-4 border-brand-gold pr-3">أحدث الشهادات</h2>
             </div>

             {latestCert ? (
                 <div 
                    onClick={() => navigateToCert(latestCert.id)}
                    className="bg-[#0f2344]/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-brand-gold/30 transition-colors cursor-pointer group"
                 >
                     <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/20 shrink-0 group-hover:scale-110 transition-transform">
                         <Award size={20} />
                     </div>
                     <div className="flex-1">
                         <h4 className="text-white font-bold text-sm group-hover:text-brand-gold transition-colors line-clamp-1">{latestCert.courseTitle}</h4>
                         <p className="text-xs text-gray-500 mt-1">صدرت في: {new Date(latestCert.issueDate).toLocaleDateString('ar-SA')}</p>
                     </div>
                     <button className="text-gray-500 hover:text-white transition-colors">
                         <Download size={18} />
                     </button>
                 </div>
             ) : (
                 <div className="bg-[#0f2344]/20 border border-white/5 rounded-2xl p-6 text-center">
                     <Award className="w-10 h-10 text-gray-600 mx-auto mb-2 opacity-50" />
                     <p className="text-gray-400 text-sm mb-3">أكمل دورتك الأولى لتحصل على شهادة معتمدة.</p>
                     <button onClick={() => onNavigate && onNavigate('courses')} className="text-brand-gold text-xs font-bold hover:underline flex items-center justify-center gap-1">
                         الذهاب للدورات <ArrowLeft size={12}/>
                     </button>
                 </div>
             )}
        </div>
    )
}
export default CertificatesWidget;
