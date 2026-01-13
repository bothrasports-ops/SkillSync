
import React from 'react';
import { useApp } from '../store';
import { Home, User, UserPlus, Users, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, logout } = useApp();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-slate-800">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
             <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-100 shadow-xl overflow-hidden p-1.5">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/1162/1162456.png"
                  className="w-full h-full object-contain brightness-0 invert"
                  alt="SkillSync Logo"
                />
             </div>
             <div className="flex flex-col">
               <h1 className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight hidden sm:block">
                  SkillSync
               </h1>
               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block -mt-1">Community</span>
             </div>
        </div>

        {currentUser && (
            <div className="flex items-center gap-3">
                <div className="bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Credits</span>
                    <span className="font-bold text-indigo-700 text-sm">{currentUser.credits.toFixed(1)}h</span>
                </div>
                <button
                  onClick={() => setActiveTab('profile')}
                  className="relative group"
                >
                  <img
                      src={currentUser.avatar}
                      alt="avatar"
                      className="w-9 h-9 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-105"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </button>
            </div>
        )}
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 pb-24">
        {children}
      </main>

      {currentUser && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg pb-safe z-40">
          <div className="flex justify-around items-center h-16 max-w-5xl mx-auto">
            <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${activeTab === 'home' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Home size={22} className={activeTab === 'home' ? 'fill-indigo-50' : ''} />
              <span className="text-[10px] font-bold">Home</span>
            </button>
            <button
                onClick={() => setActiveTab('sessions')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${activeTab === 'sessions' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Users size={22} className={activeTab === 'sessions' ? 'fill-indigo-50' : ''} />
              <span className="text-[10px] font-bold">Sessions</span>
            </button>
            <button
                onClick={() => setActiveTab('invite')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${activeTab === 'invite' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <UserPlus size={22} className={activeTab === 'invite' ? 'fill-indigo-50' : ''} />
              <span className="text-[10px] font-bold">Invite</span>
            </button>
            <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${activeTab === 'profile' ? 'text-indigo-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <User size={22} className={activeTab === 'profile' ? 'fill-indigo-50' : ''} />
              <span className="text-[10px] font-bold">Profile</span>
            </button>
            <button
                onClick={logout}
                className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-300 hover:text-red-500 transition-colors"
            >
              <LogOut size={22} />
              <span className="text-[10px] font-bold">Logout</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};
