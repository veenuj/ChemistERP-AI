import type { FC } from 'react';

// Define the shape of the medicine object
interface Medicine {
  id: number;
  name: string;
  genericName: string;
  price: number;
  stockLevel: number;
  barcode: string;
}

// Define the shape of a single item in the invoice
interface InvoiceItem {
  medicine: Medicine;
  quantity: number;
}

// Define the data prop shape
interface InvoiceData {
  invoiceNo: string;
  date: string;
  items: InvoiceItem[]; // Replaced any[] with InvoiceItem[]
  total: number;
  customer: string;
}

interface InvoiceProps {
  data: InvoiceData;
}

const PrintableInvoice: FC<InvoiceProps> = ({ data }) => {
  return (
    <div id="printable-invoice" className="p-8 text-slate-900 bg-white font-mono text-sm leading-tight">
      {/* Header */}
      <div className="text-center border-b-2 border-slate-200 pb-4 mb-4">
        <h1 className="text-xl font-black uppercase tracking-tighter text-indigo-900">QuickRx Pharmacy</h1>
        <p className="text-[10px] text-slate-500">123 Medical Plaza, Meerut, UP</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">GSTIN: 09AAAFM1234F1Z5</p>
      </div>

      {/* Meta Info */}
      <div className="flex justify-between mb-6 text-[11px] font-bold text-slate-600">
        <div>
          <p>INV NO: <span className="text-slate-900">{data.invoiceNo}</span></p>
          <p>CUSTOMER: <span className="text-slate-900">{data.customer}</span></p>
        </div>
        <div className="text-right">
          <p>DATE: <span className="text-slate-900">{data.date}</span></p>
          <p>TIME: <span className="text-slate-900">{new Date().toLocaleTimeString()}</span></p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-6 border-collapse">
        <thead className="border-b-2 border-slate-900 text-left uppercase text-[10px] text-slate-500">
          <tr>
            <th className="py-2">Medicine Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-800">
          {data.items.map((item, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              <td className="py-3">
                <p className="font-black text-sm">{item.medicine.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-tighter">{item.medicine.genericName}</p>
              </td>
              <td className="py-3 text-center font-medium">{item.quantity}</td>
              <td className="py-3 text-right">${item.medicine.price.toFixed(2)}</td>
              <td className="py-3 text-right font-bold text-slate-900">
                ${(item.medicine.price * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="border-t-2 border-slate-900 pt-6 space-y-1">
        <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Subtotal</span>
            <span className="text-lg font-medium text-slate-600">${data.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center border-b-4 border-double border-slate-900 pb-2">
            <span className="text-sm font-black text-slate-900 uppercase tracking-widest">Grand Total</span>
            <span className="text-2xl font-black text-indigo-600 tracking-tighter">${data.total.toFixed(2)}</span>
        </div>
        
        <div className="pt-6 text-center">
            <p className="text-[10px] italic text-slate-500">Thank you for choosing QuickRx. Your health, our priority.</p>
            <div className="mt-2 flex justify-center gap-1">
                {[...Array(40)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-slate-200 rounded-full" />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;