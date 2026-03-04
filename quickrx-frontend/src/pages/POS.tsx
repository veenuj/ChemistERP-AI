import { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, AlertCircle, Loader2, Camera, FileText, Printer, Smartphone, Banknote, Sparkles, X } from 'lucide-react';
import api from '../services/api';

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  price: number;
  stockLevel: number;
  barcode: string;
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
}

interface Substitution {
  name: string;
  reason: string;
  generic: string;
}

interface InvoiceData {
  id: string;
  items: CartItem[];
  total: number;
  payment: string;
}

export default function POS() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Printing States
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastInvoice, setLastInvoice] = useState<InvoiceData | null>(null);
  
  // Substitution States
  const [isSearchingAlt, setIsSearchingAlt] = useState<number | null>(null);
  const [showAltModal, setShowAltModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<Substitution | null>(null);
  const [medToSwap, setMedToSwap] = useState<Medicine | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NEW: Bulletproof Printing Logic ---
  useEffect(() => {
    if (lastInvoice && showSuccess) {
      // Give React exactly 1 frame to render the hidden print block
      const printTimer = setTimeout(() => {
        window.print();
        
        // After print dialog closes, reset the state
        setTimeout(() => {
          setShowSuccess(false);
          setLastInvoice(null);
        }, 500);
      }, 300);

      return () => clearTimeout(printTimer);
    }
  }, [lastInvoice, showSuccess]);
  // ---------------------------------------

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        try {
          const res = await api.get(`/inventory/search?name=${searchTerm}`);
          setSearchResults(res.data);
        } catch (error) {
          console.error("Search error:", error);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handlePrescriptionScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setErrorMessage(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/ai/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const cleanJson = res.data.recommendation.replace(/```json|```/g, '').trim();
      const detectedItems = JSON.parse(cleanJson);
      for (const item of detectedItems) {
        const searchRes = await api.get(`/inventory/search?name=${item.name}`);
        if (searchRes.data && searchRes.data.length > 0) {
          addToCart(searchRes.data[0]);
        }
      }
    } catch {
      setErrorMessage("Could not read prescription. Please try a clearer photo.");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFindSubstitute = async (med: Medicine) => {
    setIsSearchingAlt(med.id);
    setMedToSwap(med);
    try {
      const inventoryRes = await api.get('/inventory/all-names'); 
      const res = await api.post('/ai/substitute-lookup', {
        brandName: med.name,
        inventory: inventoryRes.data 
      });

      const suggestions = JSON.parse(res.data.recommendation.replace(/```json|```/g, '').trim());
      
      if (suggestions.length > 0) {
        setAiSuggestion(suggestions[0]);
        setShowAltModal(true);
      } else {
        setErrorMessage(`No generics found in stock for ${med.name}`);
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch {
      setErrorMessage("AI Assistant is currently unavailable.");
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setIsSearchingAlt(null);
    }
  };

  const confirmSwap = async () => {
    if (!aiSuggestion) return;
    try {
      const res = await api.get(`/inventory/search?name=${aiSuggestion.name}`);
      if (res.data.length > 0) {
        addToCart(res.data[0]);
        setShowAltModal(false);
      }
    } catch {
      setErrorMessage("Failed to add substitute.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const addToCart = (medicine: Medicine) => {
    if (medicine.stockLevel <= 0) {
      handleFindSubstitute(medicine);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.medicine.id === medicine.id);
      if (existing) {
        return prev.map(item => item.medicine.id === medicine.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { medicine, quantity: 1 }];
    });
    setSearchTerm("");
    setSearchResults([]);
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.medicine.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.medicine.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.medicine.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const payload = {
        customerPhone: customerPhone || "Walk-in",
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
          medicine: { id: item.medicine.id },
          quantity: item.quantity
        }))
      };
      
      const res = await api.post('/billing/checkout', payload);
      
      // 1. Set the invoice data (This triggers the component to render the print block)
      setLastInvoice({
        id: res.data.id || Math.random().toString(36).substr(2, 9).toUpperCase(),
        items: [...cart],
        total: subtotal,
        payment: paymentMethod
      });
      
      // 2. Clear Cart & Show Success (Triggers the useEffect for printing)
      setShowSuccess(true);
      setCart([]);
      setCustomerPhone("");
      setPaymentMethod("CASH");

    } catch {
      setErrorMessage("Transaction failed. Check stock levels.");
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-500 relative">
      
      {/* AI SUBSTITUTE MODAL */}
      {showAltModal && medToSwap && aiSuggestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-xl"><Sparkles className="text-amber-600 w-5 h-5" /></div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Smart Substitute</h3>
                </div>
                <button onClick={() => setShowAltModal(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                <span className="font-bold text-slate-800">{medToSwap.name}</span> is out of stock. Here is a generic match from your inventory:
              </p>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 glow-indigo">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-black text-indigo-600">{aiSuggestion.name}</span>
                  <span className="text-[10px] font-black bg-white px-3 py-1 rounded-lg border border-slate-200 text-indigo-500">98% MATCH</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{aiSuggestion.generic}</p>
                <div className="pt-4 border-t border-slate-200/50 text-[11px] text-slate-600 leading-relaxed italic">
                  "{aiSuggestion.reason}"
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowAltModal(false)} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Discard</button>
                <button 
                  onClick={confirmSwap}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-200 active:scale-95 transition-all"
                >
                  Swap & Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HIDDEN PRINT INVOICE (Now stays rendered if lastInvoice exists) --- */}
      {lastInvoice && (
          <div className="hidden print:block print:fixed print:inset-0 print:bg-white p-8 font-mono text-black text-sm z-[9999]">
            <div className="text-center border-b-2 border-black pb-4 mb-4">
                <h1 className="text-2xl font-bold uppercase tracking-tighter">QuickRx Pharmacy</h1>
                <p className="text-xs italic">Personalized Medical Care</p>
            </div>
            <div className="flex justify-between mb-6 text-xs">
                <div>
                    <p>Invoice: <strong>#{lastInvoice.id}</strong></p>
                    <p>Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                    <p>Pay: <strong>{lastInvoice.payment}</strong></p>
                    <p>Status: PAID</p>
                </div>
            </div>
            <table className="w-full mb-6">
                <thead className="border-b-2 border-slate-800 text-left">
                    <tr><th className="py-2">Item</th><th className="py-2 text-center">Qty</th><th className="py-2 text-right">Amt</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {lastInvoice.items.map((item, i) => (
                        <tr key={i}>
                            <td className="py-2 font-bold">{item.medicine.name}</td>
                            <td className="py-2 text-center">{item.quantity}</td>
                            <td className="py-2 text-right font-medium">${(item.medicine.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="text-right border-t-2 border-black pt-4">
                <p className="font-black text-xl">Total: ${lastInvoice.total.toFixed(2)}</p>
            </div>
            <div className="mt-12 text-center text-[10px] text-slate-500 italic">
                Thank you for your visit. Get well soon!
            </div>
          </div>
      )}

      {/* --- MAIN UI --- */}
      <div className="flex-1 flex flex-col gap-4 print:hidden">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-200 shadow-sm flex gap-4 glass-panel">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search by brand, generic, or barcode..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePrescriptionScan} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex items-center gap-3 px-8 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] hover:bg-indigo-600 transition-all active:scale-95"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {isScanning ? "AI Parsing..." : "Scan RX"}
          </button>
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Engine</span>
            {searchResults.length > 0 && <span className="text-[10px] font-bold text-indigo-500">{searchResults.length} Matches Found</span>}
          </div>
          <div className="flex-1 overflow-auto p-6">
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((med) => (
                  <button key={med.id} onClick={() => addToCart(med)} className="flex flex-col p-5 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all text-left group relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-slate-800 group-hover:text-indigo-600 truncate text-base tracking-tight">{med.name}</span>
                      <span className="text-indigo-600 font-black text-sm">${med.price}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-4">{med.genericName}</span>
                    
                    <div className="flex justify-between items-center mt-auto">
                      <span className={`text-[9px] px-3 py-1 rounded-lg font-black tracking-widest border ${med.stockLevel < 10 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>STK: {med.stockLevel}</span>
                      {isSearchingAlt === med.id ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Plus className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300">
                <div className="bg-slate-50 p-6 rounded-full mb-4"><FileText className="w-10 h-10 opacity-20" /></div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em]">Awaiting Search Query</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[420px] flex flex-col gap-4 print:hidden">
        <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
            <h2 className="font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 text-indigo-400" /> Live Cart
            </h2>
            <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black">{cart.length} ITEMS</span>
          </div>

          <div className="p-6 bg-slate-50/50 border-b border-slate-200 space-y-5">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Info</label>
                <input 
                    type="text" 
                    placeholder="Enter phone number..."
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold placeholder:font-medium placeholder:text-slate-300"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod("CASH")} className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all font-black text-[10px] tracking-widest ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100' : 'border-slate-100 bg-white text-slate-400'}`}><Banknote className="w-4 h-4" /> CASH</button>
                <button onClick={() => setPaymentMethod("UPI")} className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 transition-all font-black text-[10px] tracking-widest ${paymentMethod === 'UPI' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-100' : 'border-slate-100 bg-white text-slate-400'}`}><Smartphone className="w-4 h-4" /> UPI</button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-4">
            {cart.map((item) => (
              <div key={item.medicine.id} className="flex gap-4 p-4 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in slide-in-from-right-2">
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-800 tracking-tight">{item.medicine.name}</div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center border border-slate-100 rounded-xl bg-slate-50 overflow-hidden">
                      <button onClick={() => updateQuantity(item.medicine.id, -1)} className="p-2 hover:bg-slate-200"><Minus className="w-3 h-3 text-slate-500" /></button>
                      <span className="px-4 text-xs font-black min-w-[35px] text-center text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.medicine.id, 1)} className="p-2 hover:bg-slate-200"><Plus className="w-3 h-3 text-slate-500" /></button>
                    </div>
                    <span className="text-sm font-black text-slate-900 ml-auto tracking-tighter">${(item.medicine.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.medicine.id)} className="text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>

          <div className="p-8 bg-slate-900 border-t border-slate-800 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center text-white mb-6">
              <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Total Amount</span>
              <span className="text-4xl font-black tracking-tighter">${subtotal.toFixed(2)}</span>
            </div>

            {showSuccess ? (
              <div className="bg-emerald-500 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest animate-in zoom-in duration-300"><Printer className="w-5 h-5" /> Dispensing Invoice</div>
            ) : errorMessage ? (
              <div className="bg-rose-500/10 text-rose-400 border border-rose-500/20 p-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-wider"><AlertCircle className="w-4 h-4" /> {errorMessage}</div>
            ) : (
              <button 
                onClick={handleCheckout} 
                disabled={cart.length === 0 || isProcessing} 
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-[1.5rem] transition-all shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-4 text-sm tracking-[0.15em] uppercase active:scale-95"
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finalize Order <Plus className="w-5 h-5"/></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}