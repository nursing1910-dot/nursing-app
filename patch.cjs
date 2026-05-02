const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `                                  className="w-24 bg-white border border-slate-200 rounded-lg py-2 px-3 text-center text-slate-800 font-bold outline-none focus:border-brand-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>`;

const repl1 = `                                  className="w-24 bg-white border border-slate-200 rounded-lg py-2 px-3 text-center text-slate-800 font-bold outline-none focus:border-brand-500"
                                />
                                <button onClick={() => setServicesList(prev => prev.filter(s => s.id !== service.id))} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="حذف الخدمة">
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100">
                          <h4 className="font-bold text-slate-700 mb-4 text-sm">إضافة خدمة جديدة</h4>
                          <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                              <label className="block text-xs font-bold text-slate-500 mb-2">اسم الخدمة</label>
                              <input 
                                type="text"
                                value={newServiceName}
                                onChange={e => setNewServiceName(e.target.value)}
                                placeholder="مثال: قياس الضغط"
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 outline-none focus:border-brand-500"
                              />
                            </div>
                            <div className="w-full sm:w-32 shrink-0">
                              <label className="block text-xs font-bold text-slate-500 mb-2">السعر (جنيه)</label>
                              <input 
                                type="number"
                                value={newServicePrice}
                                onChange={e => setNewServicePrice(e.target.value)}
                                placeholder="0"
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-800 text-center outline-none focus:border-brand-500"
                              />
                            </div>
                            <button 
                              onClick={() => {
                                if(newServiceName && newServicePrice) {
                                  setServicesList(prev => [...prev, {
                                    id: 'new-' + Date.now(),
                                    name: newServiceName,
                                    price: Number(newServicePrice),
                                    icon: Activity 
                                  }]);
                                  setNewServiceName('');
                                  setNewServicePrice('');
                                }
                              }}
                              className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                            >
                              إضافة
                            </button>
                          </div>
                        </div>
                     </div>`;

content = content.replace(target1, repl1);
fs.writeFileSync('src/App.tsx', content);
