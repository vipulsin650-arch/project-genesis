import React from 'react';

interface RewardsViewProps { coins: string; session: any; isGuest: boolean; onLogin: () => void; }

const RewardsView: React.FC<RewardsViewProps> = ({ coins, session, isGuest, onLogin }) => (
  <div className="animate-fade-in bg-slate-50 min-h-full flex flex-col w-full">
    <div className="p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
      <h2 className="text-2xl font-[900] text-slate-800 uppercase tracking-tight">Rewards</h2>
    </div>
    <div className="p-4 space-y-6 flex-1">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[40px] p-8 shadow-xl text-white">
        <p className="text-[10px] font-black uppercase opacity-70 tracking-[0.2em] mb-1">Total Balance</p>
        <span className="text-4xl font-black italic">{coins}</span>
        <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Repair Coins</span>
        {!session && <button onClick={onLogin} className="mt-4 block bg-white text-slate-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase">Login to Earn</button>}
      </div>
    </div>
  </div>
);

export default RewardsView;
