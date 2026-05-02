const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /<button className="text-slate-500 bg-white hover:text-brand-600 hover:border-brand-200 font-bold py-2 px-5 rounded-xl transition-colors border border-slate-200 text-sm shadow-sm">\s*عرض الملف\s*<\/button>/g,
  `<button onClick={() => setSelectedAdminNurse({ name: ['أحمد محمد', 'محمود سيد', 'سعاد مصطفى'][item-1], rating: ['4.8', '4.5', '4.9'][item-1], ordersCompleted: ['15', '8', '24'][item-1], phone: '01012345678' })} className="text-slate-500 bg-white hover:text-brand-600 hover:border-brand-200 font-bold py-2 px-5 rounded-xl transition-colors border border-slate-200 text-sm shadow-sm">
                              عرض الملف
                            </button>`
);

content = content.replace(
  /<button className="text-slate-500 bg-white hover:text-brand-600 hover:border-brand-200 font-bold py-2 px-5 rounded-xl transition-colors border border-slate-200 text-sm shadow-sm">\s*التفاصيل\s*<\/button>/g,
  `<button onClick={() => setSelectedAdminPatient({ name: ['خالد إبراهيم', 'فاطمة علي'][item-1], phone: ['01233334444', '01044445555'][item-1], ordersCount: [12, 3][item-1], cancelledCount: [1, 0][item-1] })} className="text-slate-500 bg-white hover:text-brand-600 hover:border-brand-200 font-bold py-2 px-5 rounded-xl transition-colors border border-slate-200 text-sm shadow-sm">
                              التفاصيل
                            </button>`
);

fs.writeFileSync('src/App.tsx', content);
