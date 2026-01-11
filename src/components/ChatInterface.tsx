import React, { useState, useRef, useEffect } from 'react';
import { Message, ServiceContext } from '../types';
import { getExpertResponse } from '../services/geminiService';
import { dataService } from '../services/dataService';
import TrackingOverlay from './TrackingOverlay';

interface ChatInterfaceProps {
  initialService?: string;
  expertName?: string;
  onClose: () => void;
  onBookingConfirmed?: (serviceName: string) => void;
  context?: ServiceContext;
  userId?: string;
}

interface DiagnosticState {
  stage: 'greeting' | 'device' | 'damage' | 'questions' | 'completed';
  deviceName?: string;
  damageDescription?: string;
  questionsAsked: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ initialService, expertName, onClose, onBookingConfirmed, context = 'pickup', userId = 'guest' }) => {
  const activeExpert = expertName || (initialService ? `${initialService} Support` : "Technical Lead");
  const [messages, setMessages] = useState<(Message & { sources?: any[] })[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticState>({ stage: 'greeting', questionsAsked: 0 });
  const [showTracking, setShowTracking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadMessages = async () => {
      await dataService.ensureExpertInIndex(userId, activeExpert);
      const data = await dataService.getMessages(userId, activeExpert);
      if (data && data.length > 0) {
        setMessages(data.map((m: any) => ({
          id: (m.id || Date.now()).toString(),
          role: m.role,
          text: m.text,
          image: m.image,
          timestamp: new Date(m.created_at || Date.now()),
          sources: m.sources
        })));
        return;
      }
      // Initial diagnostic message with exactly 5 bullets
      const welcome = {
        id: '1', role: 'model', timestamp: new Date(),
        text: `• Protocol initiated for: ${initialService || 'Hardware'}\n• State specific technical symptoms\n• Provide hardware model details\n• Is there visible physical damage?\n• What is the current warranty status?`
      };
      setMessages([welcome as any]);
    };
    loadMessages();
  }, [userId, activeExpert, initialService]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async (customText?: string, base64Image?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() && !base64Image) return;

    const timestamp = new Date().toISOString();
    const userMsg: any = { id: Date.now().toString(), role: 'user', text: textToSend || "", image: base64Image, expert_name: activeExpert, created_at: timestamp };

    const currentHistory = [...messages, { ...userMsg, timestamp: new Date() }];
    setMessages(currentHistory);
    await dataService.addMessage(userId, userMsg);

    setInput('');
    setLoading(true);

    try {
      const isGreeting = textToSend?.toLowerCase().trim() === 'hi';

      if (isGreeting && diagnosticState.stage === 'greeting') {
        setDiagnosticState({ ...diagnosticState, stage: 'device' });
        const botMsg: any = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "What's the device you need help with?\n\n• Smartphone\n• Laptop\n• AC Unit\n• Refrigerator\n• Other Device",
          expert_name: activeExpert,
          created_at: timestamp
        };
        setMessages(prev => [...prev, { ...botMsg, timestamp: new Date() }]);
        await dataService.addMessage(userId, botMsg);
      } else if (diagnosticState.stage === 'device' && isGreeting === false) {
        setDiagnosticState({ ...diagnosticState, stage: 'damage', deviceName: textToSend });
        const botMsg: any = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "What's the damage or issue?\n\n• Screen Cracked\n• Not Turning On\n• Battery Issue\n• Overheating\n• Other",
          expert_name: activeExpert,
          created_at: timestamp
        };
        setMessages(prev => [...prev, { ...botMsg, timestamp: new Date() }]);
        await dataService.addMessage(userId, botMsg);
      } else if (diagnosticState.stage === 'damage') {
        setDiagnosticState({ ...diagnosticState, stage: 'questions', damageDescription: textToSend, questionsAsked: 0 });
        const reply = await getExpertResponse(currentHistory, textToSend || "Device issue provided", base64Image);
        const botMsg: any = { id: (Date.now() + 1).toString(), role: 'model', text: reply.text, sources: reply.sources, expert_name: activeExpert, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, { ...botMsg, timestamp: new Date() }]);
        await dataService.addMessage(userId, botMsg);
      } else if (diagnosticState.stage === 'questions') {
        if (textToSend?.includes('BILL_BREAKDOWN')) {
          setDiagnosticState({ ...diagnosticState, stage: 'completed' });
        }
        const reply = await getExpertResponse(currentHistory, textToSend || "Diagnostic data provided", base64Image);
        const botMsg: any = { id: (Date.now() + 1).toString(), role: 'model', text: reply.text, sources: reply.sources, expert_name: activeExpert, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, { ...botMsg, timestamp: new Date() }]);
        await dataService.addMessage(userId, botMsg);
      } else {
        const reply = await getExpertResponse(currentHistory, textToSend || "Diagnostic data provided", base64Image);
        const botMsg: any = { id: (Date.now() + 1).toString(), role: 'model', text: reply.text, sources: reply.sources, expert_name: activeExpert, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, { ...botMsg, timestamp: new Date() }]);
        await dataService.addMessage(userId, botMsg);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async (msgText: string) => {
    const match = msgText.match(/Total:\s*₹\s*([0-9,]+)/i);
    const price = match ? match[1] : "500";

    const botMsg: any = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: "Fetching Delivery Partner...",
      expert_name: activeExpert,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, { ...botMsg, timestamp: new Date() }]);

    setTimeout(() => {
      setShowTracking(true);
    }, 1500);

    await dataService.addRepair(userId, {
      service_name: initialService || 'Hardware Fix',
      expert_name: activeExpert,
      status: 'In Progress',
      arrival_time: new Date(Date.now() + 20 * 60000).toISOString(),
      total_amount: `₹${price}`
    });

    if (onBookingConfirmed) {
      onBookingConfirmed(initialService || 'Hardware Fix');
    }
  };

  if (showTracking) {
    return (
      <TrackingOverlay
        userCoords={{ lat: 12.9716, lng: 77.5946 }}
        serviceName={initialService || 'Hardware Repair'}
        onClose={() => {
          setShowTracking(false);
          onClose();
        }}
        arrivalMinutes={20}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col h-full bg-slate-50 max-w-md mx-auto overflow-hidden">
      <input type="file" accept="image/*" className="hidden" ref={chatFileRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onloadend = () => handleSend("", (r.result as string).split(',')[1]); r.readAsDataURL(file); } }} />
      
      <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-3 shadow-sm">
        <button onClick={onClose} className="p-1.5 text-slate-400 active:scale-90">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-800 leading-none truncate">{activeExpert}</h3>
          <p className="text-[7px] text-green-500 font-black uppercase mt-0.5 tracking-widest">Diagnostic Terminal</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-6">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-[20px] p-3 text-[12px] font-medium leading-tight ${m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 text-slate-800 shadow-sm'}`}>
              {m.image && <img src={`data:image/jpeg;base64,${m.image}`} className="rounded-xl mb-2 w-full border border-slate-100 shadow-sm" alt="Scan" />}
              <div className="whitespace-pre-wrap">{m.text}</div>
              {m.text.includes('BILL_BREAKDOWN') && (
                <button onClick={() => simulatePayment(m.text)} className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-[0.98] shadow-md">Confirm Booking</button>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-white border border-slate-50 p-3 rounded-2xl animate-pulse text-[9px] font-black uppercase text-slate-300">Processing Diagnostic...</div></div>}
      </div>

      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
        <button onClick={() => chatFileRef.current?.click()} className="p-3 bg-slate-50 text-slate-400 rounded-xl active:scale-90 border border-slate-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && handleSend()} 
          placeholder="Respond to diagnostic..." 
          className="flex-1 bg-slate-50 p-3 rounded-xl text-[12px] font-medium outline-none border border-slate-50 focus:border-blue-400 text-slate-900" 
        />
        <button onClick={() => handleSend()} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 shadow-lg">Submit</button>
      </div>
    </div>
  );
};

export default ChatInterface;
