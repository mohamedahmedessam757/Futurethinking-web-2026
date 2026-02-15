import React, { useState, useEffect } from 'react';
import { Search, Calendar, Star, Users, ArrowRight, Video, MessageSquare, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobal } from '../GlobalContext';
import { useConsultationServices, ServiceWithConsultant } from '../../hooks/useConsultationServices';

interface PublicConsultationsProps {
    onNavigate: (page: string, id?: string) => void;
    selectedId?: string | null;
}

const PublicConsultations = ({ onNavigate, selectedId }: PublicConsultationsProps) => {
    const { currentUser } = useGlobal();
    const { services, isLoading, fetchServices } = useConsultationServices();

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredServices = services.filter(service => {
        const matchesSearch =
            service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.consultantName.toLowerCase().includes(searchQuery.toLowerCase());

        // You can add category filtering if you add a category field to services
        return matchesSearch;
    });

    const handleBook = (service: ServiceWithConsultant) => {
        if (currentUser) {
            // Navigate to booking flow (e.g., dashboard schedule with service ID pre-selected)
            onNavigate('dashboard-schedule', service.consultantId);
        } else {
            onNavigate('auth', `redirect=public-consultations&id=${service.id}`);
        }
    };

    return (
        <div className="container mx-auto px-4 pt-32 pb-12 animate-fade-in text-right" dir="rtl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-brand-navy mb-4">خدمات الاستشارات</h1>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">تواصل مع خبراء معتمدين واحصل على استشارات متخصصة لتطوير أعمالك ومهاراتك.</p>
            </div>

            {/* Search */}
            <div className="max-w-xl mx-auto relative mb-12">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن خدمة أو اسم المستشار..."
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 pr-12 pl-4 text-brand-navy focus:outline-none focus:border-brand-gold shadow-sm"
                />
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredServices.length > 0 ? (
                            filteredServices.map((service) => (
                                <motion.div
                                    key={service.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-xl transition-all group hover:-translate-y-1"
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                                                    <img
                                                        src={service.consultantAvatar || `https://ui-avatars.com/api/?name=${service.consultantName}`}
                                                        alt={service.consultantName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{service.consultantName}</p>
                                                    <p className="text-xs text-gray-500">{service.consultantTitle}</p>
                                                </div>
                                            </div>
                                            <span className="bg-brand-navy/5 text-brand-navy px-3 py-1 rounded-full text-xs font-bold border border-brand-navy/10">
                                                {service.duration} دقيقة
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-brand-navy mb-2 line-clamp-2 min-h-[3.5rem]">{service.title}</h3>
                                        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{service.description}</p>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-400">سعر الخدمة</p>
                                                <p className="text-2xl font-bold text-brand-gold">{service.price} <span className="text-sm text-gray-400 font-normal">ر.س</span></p>
                                            </div>
                                            <button
                                                onClick={() => handleBook(service)}
                                                className="bg-brand-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-gold hover:text-brand-navy transition-all shadow-md flex items-center gap-2"
                                            >
                                                احجز الآن <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-gray-500">
                                <p className="text-xl font-bold mb-2">لا توجد خدمات متاحة حالياً.</p>
                                <p className="text-sm">جرب البحث بكلمات أخرى أو عد لاحقاً.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default PublicConsultations;
