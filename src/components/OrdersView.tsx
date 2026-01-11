import React, { useState, useEffect } from 'react';

interface Order {
  id: string;
  service_name: string;
  expert_name: string;
  status: string;
  arrival_time: string;
  total_amount: string;
  created_at: string;
}

interface OrdersViewProps {
  orders: Order[];
  onTrackOrder?: (order: Order, timeLeft: number) => void;
}

const OrderItem: React.FC<{ order: Order; onTrack: (timeLeft: number) => void }> = ({ order, onTrack }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasReached, setHasReached] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const arrival = new Date(order.arrival_time).getTime();
      const diff = Math.floor((arrival - now) / 60000); 

      if (diff <= 0) {
        setTimeLeft(0);
        setHasReached(true);
      } else {
        setTimeLeft(diff);
        setHasReached(false);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 10000); 
    return () => clearInterval(interval);
  }, [order.arrival_time]);

  return (
    <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm relative overflow-hidden w-full text-left transition-all hover:border-blue-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-100 flex-shrink-0">
            {order.service_name.toLowerCase().includes('phone') ? '📱' : 
             order.service_name.toLowerCase().includes('ac') ? '❄️' : 
             order.service_name.toLowerCase().includes('shoe') ? '👟' : '🛠️'}
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-slate-900 uppercase text-[12px] leading-tight truncate tracking-tight">{order.service_name}</h4>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest truncate">{order.expert_name}</p>
            <p className="text-[11px] font-black text-blue-600 mt-1">{order.total_amount}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest">
            {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
      
      <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${hasReached ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${hasReached ? 'text-green-600' : 'text-blue-600'}`}>
              {hasReached ? 'Specialist Reached' : 'In Progress'}
            </span>
          </div>
          <p className="text-[11px] font-black text-slate-600 uppercase tracking-tighter">
            {hasReached ? 'At your door' : `Arriving in ${timeLeft} min`}
          </p>
        </div>

        {!hasReached && (
          <button 
            onClick={() => onTrack(timeLeft || 0)}
            className="bg-slate-900 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-lg"
          >
            Track Agent
          </button>
        )}
      </div>

      {hasReached && (
        <div className="mt-3 px-1">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Please provide OTP 5824 to the specialist</p>
        </div>
      )}
    </div>
  );
};

const OrdersView: React.FC<OrdersViewProps> = ({ orders, onTrackOrder }) => (
  <div className="animate-fade-in bg-slate-50 min-h-full flex flex-col w-full overflow-x-hidden">
    <div className="p-4 bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10 w-full">
      <h2 className="text-2xl font-[900] text-slate-800 uppercase tracking-tight">Active Bookings</h2>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Real-time status tracking</p>
    </div>
    <div className="p-4 space-y-4 w-full flex-1 overflow-y-auto no-scrollbar pb-32">
      {orders.length > 0 ? (
        orders.map(order => (
          <OrderItem 
            key={order.id} 
            order={order} 
            onTrack={(timeLeft) => onTrackOrder?.(order, timeLeft)} 
          />
        ))
      ) : (
        <div className="py-24 text-center w-full">
          <div className="text-6xl mb-6 grayscale opacity-20">📦</div>
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No active repair orders</p>
          <button className="mt-6 text-blue-600 text-[10px] font-black uppercase tracking-widest border-b-2 border-blue-600 pb-1">Start a new repair</button>
        </div>
      )}
    </div>
  </div>
);

export default OrdersView;
