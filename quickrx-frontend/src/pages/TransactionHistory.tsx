import { useEffect, useState, type ChangeEvent } from 'react';
import { Search, Printer, Loader2, FileClock, XCircle } from 'lucide-react';
import api from '../services/api';

// 1. Strict interfaces for our internal State
interface Transaction {
  id: number;
  total_amount: number;
  sale_date: string;
  customer_phone: string;
}

interface SaleItem {
  name: string;
  quantity: number;
  price: number;
  generic_name: string;
}

// 2. Interfaces for raw API responses (handling potential SQL casing)
interface RawTransaction {
  id?: number;
  ID?: number;
  total_amount?: number;
  TOTAL_AMOUNT?: number;
  sale_date?: string;
  SALE_DATE?: string;
  customer_phone?: string;
  CUSTOMER_PHONE?: string;
}

interface RawSaleItem {
  name?: string;
  NAME?: string;
  quantity?: number;
  QUANTITY?: number;
  price?: number;
  PRICE?: number;
  generic_name?: string;
  GENERIC_NAME?: string;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [reprintData, setReprintData] = useState<{ id: number; items: SaleItem[]; total: number } | null>(null);

  useEffect(() => {
    // Replaced any[] with RawTransaction[]
    api.get<RawTransaction[]>('/billing/history')
      .then(res => {
        const normalized: Transaction[] = res.data.map(item => ({
          id: item.id ?? item.ID ?? 0,
          total_amount: item.total_amount ?? item.TOTAL_AMOUNT ?? 0,
          sale_date: item.sale_date ?? item.SALE_DATE ?? new Date().toISOString(),
          customer_phone: item.customer_phone ?? item.CUSTOMER_PHONE ?? 'Walk-in'
        }));
        setTransactions(normalized);
      })
      .catch(error => console.error("History fetch error:", error))
      .finally(() => setLoading(false));
  }, []);

  const handleReprint = async (id: number) => {
    setPrintingId(id);
    try {
      // Replaced any with specific structure
      const res = await api.get<{ items: RawSaleItem[] }>(`/billing/${id}/details`);
      const sale = transactions.find(t => t.id === id);
      
      if (sale) {
        const items: SaleItem[] = res.data.items.map(i => ({
          name: i.name ?? i.NAME ?? 'Unknown',
          quantity: i.quantity ?? i.QUANTITY ?? 0,
          price: i.price ?? i.PRICE ?? 0,
          generic_name: i.generic_name ?? i.GENERIC_NAME ?? ''
        }));

        setReprintData({ id, items, total: sale.total_amount });
        
        setTimeout(() => {
          window.print();
          setReprintData(null);
        }, 500);
      }
    } catch {
        console.error("Failed to fetch reprint details");
    } finally {
      setPrintingId(null);
    }
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filtered = transactions.filter(t => 
    t.id.toString().includes(searchTerm) || 
    t.customer_phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="text-xs font-black uppercase tracking-[0.2em]">Syncing Ledger...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {reprintData && (
        <div className="hidden print:block p-10 font-mono text-black">
          <div className="text-center border-b-2 pb-4 mb-4">
            <h1 className="text-2xl font-bold uppercase tracking-tight">QuickRx Pharmacy - Duplicate</h1>
            <p className="text-sm">Original Transaction: #INV-{reprintData.id}</p>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">Medicine Name</th>
                <th className="text-center py-2">Qty</th>
                <th className="text-right py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {reprintData.items.map((item, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{item.generic_name}</p>
                  </td>
                  <td className="text-center py-2">{item.quantity}</td>
                  <td className="text-right py-2">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right font-black text-xl">Total Amount: ${reprintData.total.toFixed(2)}</div>
          <div className="mt-10 text-center text-[10px] text-slate-400">
            <p>Computer generated duplicate bill for record keeping.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
            <FileClock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sales History</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Audit logs for QuickRx</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search Invoice ID or Customer..." 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm transition-all"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Inv ID</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
              <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
              <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length > 0 ? filtered.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-8 py-5 font-black text-slate-900 text-sm">#INV-{sale.id}</td>
                <td className="px-8 py-5 text-sm text-slate-600 font-medium">
                  {new Date(sale.sale_date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-8 py-5 text-sm font-bold text-slate-600">{sale.customer_phone}</td>
                <td className="px-8 py-5 font-black text-slate-900">
                  ${sale.total_amount.toFixed(2)}
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => handleReprint(sale.id)}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all active:scale-95"
                  >
                    {printingId === sale.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Printer className="w-3 h-3" />}
                    Duplicate Bill
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                   <div className="flex flex-col items-center gap-3 opacity-20">
                      <XCircle className="w-12 h-12" />
                      <p className="font-bold uppercase tracking-widest text-xs">No records found</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}