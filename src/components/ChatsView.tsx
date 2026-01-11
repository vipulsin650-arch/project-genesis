import React from 'react';

interface ChatsViewProps {
  activeChats: any[];
  loading: boolean;
  onStartChat: (service?: string, expert?: string, context?: any) => void;
}

const ChatsView: React.FC<ChatsViewProps> = ({ activeChats, loading, onStartChat }) => (
  <div className="animate-fade-in bg-slate-50 min-h-full flex flex-col w-full overflow-x-hidden">
    <div className="p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10 w-full">
      <h2 className="text-2xl font-[900] text-slate-800 uppercase tracking-tight">Messages</h2>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Chat history with experts</p>
    </div>
    <div className="p-4 space-y-3 w-full flex-1 overflow-y-auto no-scrollbar">
      {loading && activeChats.length === 0 ? (
        <div className="py-20 text-center animate-pulse">
          <p className="text-[10px] font-black uppercase text-slate-300">Loading chats...</p>
        </div>
      ) : activeChats.length > 0 ? (
        activeChats.map((c, i) => (
          <div 
            key={i} 
            onClick={() => onStartChat(undefined, c.expertName, 'onsite')} 
            className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer w-full"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 flex-shrink-0">
              {c.icon}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex justify-between items-center mb-0.5">
                <h4 className="font-black text-slate-800 text-xs uppercase truncate pr-2">{c.expertName}</h4>
                <span className="text-[8px] text-slate-400 font-bold flex-shrink-0">
                  {c.lastMsg ? new Date(c.lastMsg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate font-medium">
                {c.lastMsg ? c.lastMsg.text : 'No messages yet'}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="py-20 text-center w-full">
           <div className="text-4xl mb-4 opacity-10">💬</div>
           <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No active chats</p>
        </div>
      )}
    </div>
  </div>
);

export default ChatsView;
