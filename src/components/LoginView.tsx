import React, { useState } from 'react';
import { authService } from '../services/authService';

interface LoginViewProps { onLogin: (session: any) => void; onSkip: () => void; }

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSkip }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = isRegistering 
        ? await authService.signUp(username, password)
        : await authService.signIn(username, password);
      if (result.data?.session) onLogin(result.data.session);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 animate-fade-in">
      <button onClick={onSkip} className="absolute top-8 right-8 px-5 py-2 rounded-full bg-white border border-slate-100 text-[10px] font-black text-slate-400 uppercase">Skip</button>
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex items-center mb-2">
          <span className="font-[900] text-4xl text-black uppercase">REPAIR</span>
          <span className="font-[900] text-4xl text-blue-600 uppercase ml-1">IT</span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">India's Doorstep Repair</p>
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-5">
          <h2 className="text-2xl font-black text-slate-800 uppercase text-center">{isRegistering ? 'Register' : 'Login'}</h2>
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center">{error}</div>}
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold outline-none text-slate-900" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-sm font-bold outline-none text-slate-900" />
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-xs">{isLoading ? 'Loading...' : isRegistering ? 'Register' : 'Sign In'}</button>
          <p className="text-[10px] text-center text-slate-400 font-black uppercase">
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="text-blue-600 ml-2">{isRegistering ? 'Log In' : 'Join Now'}</button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginView;
