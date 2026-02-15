import React from 'react';
import { Edit, Trash, Plus } from 'lucide-react';

const AdminCourseManagement = () => {
  const courses = [
      { id: '1', title: 'إدارة التغيير المؤسسي (ADKAR)', instructor: 'د. صالح معمار', students: 150, price: '$375,000', status: 'active' },
      { id: '2', title: 'إعداد الاستراتيجيات ومؤشرات الأداء (KPIs)', instructor: 'فريق فكر المستقبل', students: 85, price: '$255,000', status: 'active' },
      { id: '3', title: 'التميز المؤسسي (EFQM)', instructor: 'د. محمد علي', students: 0, price: '$0', status: 'draft' },
  ];

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-end">
          <div>
             <h1 className="text-3xl font-bold text-white">إدارة الدورات</h1>
             <p className="text-gray-400">عرض وتعديل وإدارة المحتوى التعليمي ({courses.length} دورة)</p>
          </div>
          <button className="bg-[#0f2344] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white/5 border border-white/10 font-bold">
             <Plus size={18} /> إضافة دورة جديدة
          </button>
       </div>

       <div className="bg-[#0f172a] border border-white/5 rounded-3xl overflow-hidden">
          <table className="w-full text-right">
             <thead className="bg-[#06152e] text-xs text-gray-400 font-medium">
                <tr>
                   <th className="px-6 py-4">اسم الدورة</th>
                   <th className="px-6 py-4">المدرب</th>
                   <th className="px-6 py-4">الطلاب</th>
                   <th className="px-6 py-4">الإيرادات</th>
                   <th className="px-6 py-4">الحالة</th>
                   <th className="px-6 py-4">إجراءات</th>
                </tr>
             </thead>
             <tbody className="text-sm">
                {courses.map((course, i) => (
                   <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white text-right">{course.title}</td>
                      <td className="px-6 py-4 text-gray-400">{course.instructor}</td>
                      <td className="px-6 py-4 text-white font-bold">{course.students}</td>
                      <td className="px-6 py-4 text-white">{course.price}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded-full text-xs font-bold border ${course.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                            {course.status === 'active' ? 'نشط' : 'مسودة'}
                         </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                         <button className="p-1.5 text-gray-400 hover:text-white transition-colors"><Edit size={16} /></button>
                         <button className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"><Trash size={16} /></button>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default AdminCourseManagement;