import React, { useState, useCallback, useEffect } from 'react';
import { User, SessionRequest, SessionStatus, Skill, Invitation, Location } from './types';
import { db } from './services/db';
import Header from './components/Header';
import Home from './components/Home';
import Profile from './components/Profile';
import Sessions from './components/Sessions';
import Requests from './components/Requests';
import Invitations from './components/Invitations';
import Login from './components/Login';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<SessionRequest[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'sessions' | 'requests' | 'invitations'>('home');
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

  const handleLogin = (user: User) => {
      localStorage.setItem('ts_currentUser_id', user.id);
      setCurrentUser(user);
      refreshState();
  };

  const handleInviteUser = async (emailOrPhone: string) => {
    if (!currentUser) return;
    const newInvite: Invitation = {
      id: Math.random().toString(36).substr(2, 9),
      emailOrPhone,
      invitedBy: currentUser.email,
      timestamp: Date.now(),
      status: 'pending'
    };
    await db.inviteUser(newInvite);
    refreshState();
  };

  const handleCancelInvite = async (id: string) => {
    setBackgroundLoading(true);
    try {
      await db.cancelInvite(id);
      await refreshState();
    } catch (e) {
      alert("Failed to cancel invitation.");
    } finally {
      setBackgroundLoading(false);
    }
  };

  const handleRequestSession = async (providerId: string, skill: Skill, duration: number, scheduledAt?: number) => {
    if (!currentUser) return;

    if (currentUser.balanceHours < duration) {
        alert(`Not enough hours! You need ${duration}h but only have ${currentUser.balanceHours.toFixed(1)}h.`);
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
      scheduledAt: scheduledAt
    };

    setBackgroundLoading(true);
    try {
      await db.createSession(newRequest);
      await refreshState();
      alert("Request sent successfully!");
    } catch (e: any) {
      console.error("Session creation error details:", e);
      const errorMsg = e?.message || e?.details || (typeof e === 'object' ? JSON.stringify(e) : String(e));
      alert(`Failed to send request: ${errorMsg}`);
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

  if (loading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
              <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <i className="fa-solid fa-bolt absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 text-[10px]"></i>
              </div>
              <p className="mt-4 font-bold text-slate-400 uppercase tracking-widest text-[10px]">Accessing Community Hub...</p>
          </div>
      );
  }

  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home users={users} currentUser={currentUser} onRequestSession={handleRequestSession} userLocation={userLocation} />;
      case 'profile':
        return <Profile user={currentUser} onUpdate={handleUpdateProfile} onLogout={handleLogout} />;
      case 'sessions':
        return <Sessions sessions={sessions} currentUser={currentUser} users={users} onUpdateSession={handleUpdateSession} />;
      case 'requests':
        return <Requests sessions={sessions} currentUser={currentUser} users={users} onUpdateSession={handleUpdateSession} />;
      case 'invitations':
        return <Invitations invitations={invitations} onInvite={handleInviteUser} onCancel={handleCancelInvite} isAdmin={currentUser.isAdmin} currentUser={currentUser} />;
    }
  };

  const pendingRequestsCount = sessions.filter(s => s.providerId === currentUser.id && s.status === SessionStatus.PENDING).length;

  return (
    <div className="max-w-screen-xl mx-auto pb-24 md:pb-0">
      <Header
        currentUser={currentUser}
        currentView={currentView}
        setView={setCurrentView}
        onLogout={handleLogout}
        pendingCount={pendingRequestsCount}
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

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white flex items-center gap-1 p-1.5 rounded-3xl shadow-2xl md:hidden z-50 border border-white/10 backdrop-blur-xl bg-opacity-90">
        <button onClick={() => setCurrentView('home')} className={`p-3.5 rounded-2xl transition ${currentView === 'home' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/10 text-slate-400'}`}>
            <i className="fa-solid fa-compass text-lg"></i>
        </button>
        <button onClick={() => setCurrentView('requests')} className={`p-3.5 rounded-2xl transition relative ${currentView === 'requests' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/10 text-slate-400'}`}>
            <i className="fa-solid fa-bell text-lg"></i>
            {pendingRequestsCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white border-2 border-slate-900">
                    {pendingRequestsCount}
                </span>
            )}
        </button>
        <button onClick={() => setCurrentView('sessions')} className={`p-3.5 rounded-2xl transition ${currentView === 'sessions' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/10 text-slate-400'}`}>
            <i className="fa-solid fa-calendar-days text-lg"></i>
        </button>
        <button onClick={() => setCurrentView('invitations')} className={`p-3.5 rounded-2xl transition ${currentView === 'invitations' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/10 text-slate-400'}`}>
            <i className="fa-solid fa-paper-plane text-lg"></i>
        </button>
        <button onClick={() => setCurrentView('profile')} className={`p-3.5 rounded-2xl transition ${currentView === 'profile' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'hover:bg-white/10 text-slate-400'}`}>
            <i className="fa-solid fa-user-astronaut text-lg"></i>
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