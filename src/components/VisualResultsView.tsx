import React from 'react';
import { VisualSearchSummary } from '../services/geminiService';

interface VisualResultsViewProps {
  results: VisualSearchSummary;
  onClose: () => void;
  onChatWithChacha: () => void;
}

const VisualResultsView: React.FC<VisualResultsViewProps> = ({ results, onClose, onChatWithChacha }) => (
  <div className="absolute inset-0 z-[2000] bg-slate-50 flex flex-col animate-slide-up overflow-hidden">
    <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between shadow-sm sticky top-0 z-20">
      <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">AI System Scan</h2>
      <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 active:scale-90">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-6 pb-32">
      <div className="relative rounded-[40px] overflow-hidden shadow-2xl border-4 border-white mb-6 aspect-square max-h-80 mx-auto">
        <img src={`data:image/jpeg;base64,${results.image}`} className="w-full h-full object-cover" alt="Scanned item" />
      </div>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-slate-900 uppercase">{results.productType}</h3>
        <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-600">{results.severity} Failure</span>
      </div>
      <div className="bg-white rounded-[35px] border border-slate-100 p-6 shadow-sm mb-8">
        <p className="text-3xl font-black text-blue-600 italic">{results.estimate}</p>
        <button onClick={onChatWithChacha} className="mt-4 w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest">Initialize Service</button>
      </div>
    </div>
  </div>
);

export default VisualResultsView;
