import React from 'react';

interface ProfileViewProps { session: any; onLogout: () => void; onInfo: (type: 'help' | 'terms') => void; onLogin: () => void; }

const ProfileView: React.FC<ProfileViewProps> = ({ session, onLogout, onLogin }) => (
  <div className="animate-fade-in bg-slate-50 min-h-full flex flex-col w-full">
    <div className="p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
      <h2 className="text-2xl font-[900] text-slate-800 uppercase tracking-tight">Account</h2>
    </div>
    <div className="p-4 flex-1">
      <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-50">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl">PRO</div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">{session?.user?.username || 'Guest'}</h2>
            <p className="text-blue-600 text-[10px] font-black uppercase">{session ? 'Verified' : 'Guest Mode'}</p>
          </div>
        </div>
        {!session ? (
          <button onClick={onLogin} className="w-full bg-blue-600 text-white py-5 rounded-[28px] font-black uppercase text-xs">Sign In</button>
        ) : (
          <button onClick={onLogout} className="w-full bg-red-50 text-red-600 py-5 rounded-[28px] font-black uppercase text-xs">Sign Out</button>
        )}
      </div>
      <p className="text-center text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] py-8">Repair It v1.0.4</p>
    </div>
  </div>
);

export default ProfileView;
