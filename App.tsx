
import React, { useState, useEffect, useCallback } from 'react';
import { User, SessionRequest, SessionStatus, Skill, Invitation, Location } from './types';
import { INITIAL_HOURS } from './constants';
import { db } from './services/db';
import Header from './components/Header';
import Home from './components/Home';
import Profile from './components/Profile';
import Sessions from './components/Sessions';
import Invitations from './components/Invitations';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'sessions' | 'invitations'>('home');
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  const refreshState = useCallback(async (isInitial = false) => {
    if (!isInitial) setBackgroundLoading(true);
    try {
      const state = await db.init();
      setUsers(state.users);
      setSessions(state.sessions);
      setInvitations(state.invitations);

      const savedUserId = localStorage.getItem('ts_currentUser_id');
      if (savedUserId) {
        const user = state.users.find(u => u.id === savedUserId);
        if (user) setCurrentUser(user);
      }
    } catch (e) {
      console.error("Database sync failed", e);
    } finally {
      if (isInitial) setLoading(false);
      setBackgroundLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshState(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Location access denied")
      );
    }
  }, [refreshState]);

  const handleInviteUser = async (emailOrPhone: string) => {
    if (!currentUser) return;
    const newInvite: Invitation = {
      id: Math.random().toString(36).substr(2, 9),
      emailOrPhone,
      invitedBy: currentUser.id,
      timestamp: Date.now(),
      status: 'pending'
    };
    await db.inviteUser(newInvite);
    refreshState();
  };

  const handleRequestSession = async (providerId: string, skill: Skill, duration: number) => {
    if (!currentUser) return;
    if (currentUser.balanceHours < duration) {
        alert("Not enough hours in your balance!");
        return;
    }

    const newRequest: SessionRequest = {
      id: Math.random().toString(36).substr(2, 9),
      requesterId: currentUser.id,
      providerId,
      skillId: skill.id,
      skillName: skill.name,
      durationHours: duration,
      status: SessionStatus.PENDING,
      timestamp: Date.now(),
    };

    setBackgroundLoading(true);
    try {
      await db.createSession(newRequest);
      await refreshState();
      alert("Request sent successfully!");
    } catch (e) {
      alert("Failed to send request. Check your connection.");
    } finally {
      setBackgroundLoading(false);
    }
  };

  const handleUpdateSession = async (sessionId: string, status: SessionStatus, rating?: number, review?: string) => {
    setBackgroundLoading(true);
    try {
      await db.updateSession(sessionId, status, rating, review);
      await refreshState();
    } catch (e) {
      alert("Failed to update session.");
    } finally {
      setBackgroundLoading(false);
    }
  };

  const handleUpdateProfile = async (updatedData: Partial<User>) => {
    if (!currentUser) return;
    setBackgroundLoading(true);
    try {
      await db.updateUser(currentUser.id, updatedData);
      await refreshState();
    } catch (e) {
      alert("Failed to save profile.");
    } finally {
      setBackgroundLoading(false);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('ts_currentUser_id');
      setCurrentUser(null);
  };

  const handleLoginDemo = async () => {
      setLoading(true);
      const mockEmail = `user_${Date.now()}@example.com`;
      try {
        const { data, error } = await db.supabase.from('profiles').insert({
            name: 'New Member',
            email: mockEmail,
            bio: 'I am here to learn and contribute.',
            balance_hours: INITIAL_HOURS,
            avatar: `https://picsum.photos/seed/${Date.now()}/200`,
            location_lat: userLocation?.lat,
            location_lng: userLocation?.lng
        }).select().single();

        if (error) throw error;

        localStorage.setItem('ts_currentUser_id', data.id);
        await refreshState();
      } catch (e) {
        alert("Connection timed out. Please verify your Supabase settings.");
      } finally {
        setLoading(false);
      }
  };

  if (loading && !currentUser) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <i className="fa-solid fa-bolt absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 text-[10px]"></i>
              </div>
              <p className="mt-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Syncing Community Data...</p>
          </div>
      );
  }

  const renderView = () => {
    if (!currentUser) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-slate-100">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
                    <i className="fa-solid fa-bolt-lightning text-4xl"></i>
                </div>
                <h1 className="text-4xl font-black mb-3 tracking-tight">TimeShare</h1>
                <p className="text-slate-500 mb-10 leading-relaxed">Exchange professional skills using your hour credits. A community where time is the only value.</p>
                <div className="space-y-4">
                    <button
                        onClick={handleLoginDemo}
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Creating Account...' : 'Join the Community'}
                    </button>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global P2P Network</p>
                </div>
            </div>
        </div>
    );

    switch (currentView) {
      case 'home':
        return <Home users={users} currentUser={currentUser} onRequestSession={handleRequestSession} userLocation={userLocation} />;
      case 'profile':
        return <Profile user={currentUser} onUpdate={handleUpdateProfile} />;
      case 'sessions':
        return <Sessions sessions={sessions} currentUser={currentUser} users={users} onUpdateSession={handleUpdateSession} />;
      case 'invitations':
        return <Invitations invitations={invitations} onInvite={handleInviteUser} isAdmin={currentUser.isAdmin} currentUser={currentUser} />;
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-24 md:pb-0">
      <Header
        currentUser={currentUser}
        currentView={currentView}
        setView={setCurrentView}
        onLogout={handleLogout}
      />

      {backgroundLoading && (
          <div className="fixed top-[73px] left-0 right-0 z-50">
              <div className="h-0.5 bg-indigo-50 w-full overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-[loading_1s_infinite_linear] origin-left w-1/4"></div>
              </div>
          </div>
      )}

      <main className="px-4 py-8">
        {renderView()}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white flex items-center gap-2 p-2 rounded-3xl shadow-2xl md:hidden z-50 border border-white/10 backdrop-blur-xl bg-opacity-90">
        <button onClick={() => setCurrentView('home')} className={`p-4 rounded-2xl transition ${currentView === 'home' ? 'bg-indigo-600' : 'hover:bg-white/10'}`}>
            <i className="fa-solid fa-compass text-xl"></i>
        </button>
        <button onClick={() => setCurrentView('sessions')} className={`p-4 rounded-2xl transition ${currentView === 'sessions' ? 'bg-indigo-600' : 'hover:bg-white/10'}`}>
            <i className="fa-solid fa-calendar-days text-xl"></i>
        </button>
        <button onClick={() => setCurrentView('invitations')} className={`p-4 rounded-2xl transition ${currentView === 'invitations' ? 'bg-indigo-600' : 'hover:bg-white/10'}`}>
            <i className="fa-solid fa-user-plus text-xl"></i>
        </button>
        <button onClick={() => setCurrentView('profile')} className={`p-4 rounded-2xl transition ${currentView === 'profile' ? 'bg-indigo-600' : 'hover:bg-white/10'}`}>
            <i className="fa-solid fa-user-astronaut text-xl"></i>
        </button>
      </nav>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
};

export default App;
