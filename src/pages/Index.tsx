import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import HomeView from '../components/HomeView';
import ChatsView from '../components/ChatsView';
import OrdersView from '../components/OrdersView';
import RewardsView from '../components/RewardsView';
import ProfileView from '../components/ProfileView';
import ChatInterface from '../components/ChatInterface';
import LoginView from '../components/LoginView';
import VisualResultsView from '../components/VisualResultsView';
import TrackingOverlay from '../components/TrackingOverlay';
import { authService } from '../services/authService';
import { dataService } from '../services/dataService';
import { performVisualSearch, VisualSearchSummary } from '../services/geminiService';
import { ServiceContext } from '../types';
import { VENDORS } from '../constants';
import 'leaflet/dist/leaflet.css';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showChat, setShowChat] = useState(false);
  const [trackingData, setTrackingData] = useState<{ active: boolean, serviceName: string, arrivalMinutes: number } | null>(null);
  const [repairHistory, setRepairHistory] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [repairCoins, setRepairCoins] = useState("0");
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [visualSearchResults, setVisualSearchResults] = useState<VisualSearchSummary | null>(null);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
  const [selectedExpert, setSelectedExpert] = useState<string | undefined>(undefined);
  const [chatContext, setChatContext] = useState<ServiceContext>('onsite');

  useEffect(() => {
    authService.getSession().then((session) => {
      setSession(session);
      setIsAuthChecking(false);
    });
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserCoords({ lat: 12.9716, lng: 77.5946 }),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchCoins = useCallback(async () => {
    const uid = session?.user?.id || 'guest';
    const amount = await dataService.getUserCoins(uid);
    setRepairCoins(amount.toLocaleString());
  }, [session]);

  const fetchChatHistory = useCallback(async () => {
    const uid = session?.user?.id || 'guest';
    setLoadingHistory(true);
    const experts = await dataService.getContactedExperts(uid);
    const chats = [];
    for (const expertName of experts) {
      const msgs = await dataService.getMessages(uid, expertName);
      const knownVendor = VENDORS.find(v => v.name === expertName);
      const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1] : null;
      chats.push({ expertName, icon: knownVendor?.icon || '🛠️', lastMsg, updatedAt: lastMsg ? new Date(lastMsg.created_at).getTime() : Date.now() });
    }
    setActiveChats(chats.sort((a, b) => b.updatedAt - a.updatedAt));
    setLoadingHistory(false);
  }, [session]);

  useEffect(() => {
    fetchCoins();
    if (activeTab === 'chats') fetchChatHistory();
    if (activeTab === 'orders') dataService.getRepairs(session?.user?.id || 'guest').then(setRepairHistory);
  }, [activeTab, fetchChatHistory, fetchCoins, showChat, trackingData]);

  const handleStartChat = (service?: string, expert?: string, context: ServiceContext = 'onsite') => {
    setSelectedService(service);
    setSelectedExpert(expert);
    setChatContext(context);
    setShowChat(true);
  };

  const handleBookingTriggered = (serviceName: string) => {
    setShowChat(false);
    setTrackingData({ active: true, serviceName, arrivalMinutes: 20 });
  };

  const handleTrackOrder = (order: any, timeLeft: number) => {
    setTrackingData({ active: true, serviceName: order.service_name, arrivalMinutes: timeLeft });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeView onStartChat={handleStartChat} onOpenMap={() => {}} onVisualSearch={async (b) => { setIsVisualSearching(true); const s = await performVisualSearch(b); setVisualSearchResults(s); setIsVisualSearching(false); }} repairCoins={repairCoins} userCoords={userCoords} />;
      case 'chats': return <ChatsView onStartChat={handleStartChat} activeChats={activeChats} loading={loadingHistory} />;
      case 'orders': return <OrdersView orders={repairHistory} onTrackOrder={handleTrackOrder} />;
      case 'rewards': return <RewardsView coins={repairCoins} session={session} isGuest={isGuest} onLogin={() => setIsGuest(false)} />;
      case 'profile': return <ProfileView session={session} onLogout={() => authService.signOut().then(() => setSession(null))} onInfo={() => {}} onLogin={() => setIsGuest(false)} />;
      default: return null;
    }
  };

  if (isAuthChecking) return null;
  if (!session && !isGuest) return <LoginView onLogin={setSession} onSkip={() => setIsGuest(true)} />;

  return (
    <div className="flex flex-col h-screen bg-white w-full relative overflow-hidden shadow-2xl max-w-md mx-auto">
      <Layout activeTab={activeTab} onTabChange={setActiveTab} hideNav={showChat || isVisualSearching || !!visualSearchResults || trackingData?.active}>
        {renderContent()}
      </Layout>

      {showChat && (
        <ChatInterface 
          initialService={selectedService} 
          expertName={selectedExpert} 
          context={chatContext} 
          userId={session?.user?.id || 'guest'} 
          onClose={() => setShowChat(false)}
          onBookingConfirmed={handleBookingTriggered}
        />
      )}
      
      {trackingData?.active && (
        <TrackingOverlay 
          userCoords={userCoords} 
          serviceName={trackingData.serviceName} 
          arrivalMinutes={trackingData.arrivalMinutes}
          onClose={() => setTrackingData(null)} 
        />
      )}

      {visualSearchResults && <VisualResultsView results={visualSearchResults} onClose={() => setVisualSearchResults(null)} onChatWithChacha={() => { const res = visualSearchResults; setVisualSearchResults(null); handleStartChat(res.productType, undefined, 'pickup'); }} />}
      
      {isVisualSearching && (
        <div className="absolute inset-0 z-[2000] bg-white flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white animate-pulse">📷</div>
            <h2 className="text-xl font-black uppercase italic">System Scan...</h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
