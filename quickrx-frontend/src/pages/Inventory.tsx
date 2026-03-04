import { useEffect, useState } from 'react';
import { Package, RefreshCw, Edit2, Trash2, Plus, X, Search, Calendar, Hash, MapPin } from 'lucide-react';
import api from '../services/api';

interface Medicine {
  id?: number;
  name: string;
  genericName: string;
  barcode: string;
  batchNumber: string;
  expiryDate: string;
  stockLevel: number;
  price: number;
  shelfLocation: string;
}

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentMed, setCurrentMed] = useState<Medicine>({
    name: '', genericName: '', barcode: '', batchNumber: '', 
    expiryDate: '', stockLevel: 0, price: 0, shelfLocation: ''
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      setMedicines(res.data);
    } catch (error) { 
      console.error("Fetch error:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentMed.id) {
        await api.put(`/inventory/${currentMed.id}`, currentMed);
      } else {
        await api.post('/inventory', currentMed);
      }
      setIsModalOpen(false);
      fetchInventory();
      resetForm();
    } catch (error) { 
      console.error("Save error:", error);
      alert("Error saving medicine. Ensure all required fields (Expiry Date, Batch) are filled."); 
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await api.delete(`/inventory/${id}`);
        fetchInventory();
      } catch (error) { 
        console.error("Delete error:", error);
        alert("Error deleting medicine"); 
      }
    }
  };

  const openEdit = (med: Medicine) => {
    setCurrentMed(med);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setCurrentMed({ name: '', genericName: '', barcode: '', batchNumber: '', expiryDate: '', stockLevel: 0, price: 0, shelfLocation: '' });
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.genericName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
            <input 
              type="text" placeholder="Search stock by name or generic..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* FIXED: RefreshCw is now being used here */}
          <button 
            onClick={fetchInventory}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
        >
          <Plus className="w-5 h-5" /> Add New Medicine
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">Medicine</th>
                <th className="px-6 py-4">Generic / Batch</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && medicines.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-400">Loading inventory...</td></tr>
              ) : filteredMedicines.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-slate-400">No medicines found match your search.</td></tr>
              ) : filteredMedicines.map((med) => (
                <tr key={med.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{med.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 uppercase">
                       <MapPin className="w-3 h-3 text-slate-300"/> {med.shelfLocation || 'No Shelf'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600">{med.genericName}</div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider border border-slate-200">{med.batchNumber}</span>
                        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-tighter flex items-center gap-0.5">
                            <Calendar className="w-3 h-3" /> Exp: {med.expiryDate}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${med.stockLevel < 10 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                      {med.stockLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">${med.price.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => openEdit(med)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => med.id && handleDelete(med.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-indigo-600" />
                {currentMed.id ? 'Edit Medicine' : 'New Medicine Stock'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Medicine Name</label>
                  <input required placeholder="e.g. Crocin Advance" value={currentMed.name} onChange={e => setCurrentMed({...currentMed, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Generic Name</label>
                  <input placeholder="e.g. Paracetamol" value={currentMed.genericName} onChange={e => setCurrentMed({...currentMed, genericName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Barcode</label>
                  <input placeholder="Scan or enter ID" value={currentMed.barcode} onChange={e => setCurrentMed({...currentMed, barcode: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Hash className="w-3 h-3 text-slate-300"/> Batch Number</label>
                  <input required placeholder="B-1022" value={currentMed.batchNumber} onChange={e => setCurrentMed({...currentMed, batchNumber: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-300"/> Expiry Date</label>
                  <input required type="date" value={currentMed.expiryDate} onChange={e => setCurrentMed({...currentMed, expiryDate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Level</label>
                  <input required type="number" min="0" value={currentMed.stockLevel} onChange={e => setCurrentMed({...currentMed, stockLevel: parseInt(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unit Price ($)</label>
                  <input required type="number" step="0.01" min="0" value={currentMed.price} onChange={e => setCurrentMed({...currentMed, price: parseFloat(e.target.value) || 0})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                </div>

                <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-300"/> Shelf Location</label>
                    <input placeholder="e.g. Rack A, Shelf 2" value={currentMed.shelfLocation} onChange={e => setCurrentMed({...currentMed, shelfLocation: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 uppercase text-xs tracking-widest">Confirm & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}