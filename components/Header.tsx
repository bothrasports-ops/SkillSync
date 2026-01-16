
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  currentView: string;
  setView: (view: any) => void;
  onLogout: () => void;
  pendingCount?: number;
}

const Header: React.FC<HeaderProps> = ({ currentUser, currentView, setView, onLogout, pendingCount = 0 }) => {
  return (
    <header className="sticky top-0 z-40 glass border-b border-slate-200 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
        <div className="bg-indigo-600 text-white p-2 rounded-lg">
            <i className="fa-solid fa-bolt-lightning text-lg"></i>
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">TimeShare</h1>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <button onClick={() => setView('home')} className={`font-medium transition ${currentView === 'home' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Discover</button>
        <button onClick={() => setView('requests')} className={`font-medium transition relative ${currentView === 'requests' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>
          Requests
          {pendingCount > 0 && (
            <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingCount}
            </span>
          )}
        </button>
        <button onClick={() => setView('sessions')} className={`font-medium transition ${currentView === 'sessions' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Sessions</button>
        <button onClick={() => setView('invitations')} className={`font-medium transition ${currentView === 'invitations' ? 'text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}>Invite</button>
      </div>

      {currentUser ? (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance</span>
            <span className="text-sm font-bold text-indigo-600">{currentUser.balanceHours.toFixed(1)} hrs</span>
          </div>
          <button
            onClick={() => setView('profile')}
            className="w-10 h-10 rounded-full border-2 border-indigo-100 overflow-hidden hover:border-indigo-500 transition"
          >
            <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
          </button>
          <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition hidden md:block">
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      ) : (
        <span className="text-slate-400 italic text-sm">Guest Mode</span>
      )}
    </header>
  );
};

export default Header;
