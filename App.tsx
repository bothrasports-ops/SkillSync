import React, { useState } from 'react';
import { AppProvider, useApp } from './store';
import { Auth } from './views/Auth';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { Profile } from './views/Profile';
import { Admin } from './views/Admin';
import { Sessions } from './views/Sessions';
import { User, Skill } from './types';
import { X, Clock, Star, MapPin, Calendar, MessageSquare } from 'lucide-react';
import { UserReviews } from './components/UserReviews';

const AppContent: React.FC = () => {
  const { currentUser, requestSession, sessions, users } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [connectModal, setConnectModal] = useState<{ user: User, skill: Skill } | null>(null);
  const [profileModal, setProfileModal] = useState<User | null>(null);
  const [duration, setDuration] = useState(1);

  if (!currentUser) {
    return <Auth />;
  }

  const handleRequest = () => {
    if (connectModal) {
        requestSession(connectModal.user.id, connectModal.skill.id, duration);
        setConnectModal(null);
        setActiveTab('sessions');
    }
  };

  const handleConnectFromProfile = (user: User, skill: Skill) => {
    setConnectModal({ user, skill });
    setProfileModal(null);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && (
        <Home
            onRequestSession={(user, skill) => setConnectModal({ user, skill })}
            onViewProfile={(user) => setProfileModal(user)}
        />
      )}
      {activeTab === 'profile' && <Profile />}
      {activeTab === 'sessions' && <Sessions />}
      {activeTab === 'invite' && <Admin />}

      {/* Public Profile Modal */}
      {profileModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] flex flex-col">
                <div className="relative h-24 bg-gradient-to-r from-indigo-500 to-purple-500">
                    <button
                        onClick={() => setProfileModal(null)}
                        className="absolute right-4 top-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 pb-6 overflow-y-auto">
                    <div className="relative -mt-10 mb-6">
                        <img
                            src={profileModal.avatar}
                            alt={profileModal.name}
                            className="w-20 h-20 rounded-full border-4 border-white shadow-md bg-white object-cover"
                        />
                        <div className="mt-2">
                            <h3 className="text-xl font-bold text-gray-900">{profileModal.name}</h3>
                            <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="text-yellow-500 fill-current" />
                                    <span className="font-bold text-gray-900">{profileModal.rating.toFixed(1)}</span>
                                    <span>({profileModal.reviewsCount} reviews)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin size={14} />
                                    <span>{profileModal.location.address || 'Local'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>Member since {new Date(profileModal.joinedDate).getFullYear()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <section>
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Skills Offered</h4>
                            <div className="space-y-3">
                                {profileModal.skills.map(skill => (
                                    <div key={skill.id} className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 group">
                                        <div className="flex justify-between items-start mb-1">
                                            <h5 className="font-bold text-indigo-900">{skill.name}</h5>
                                            <button
                                                onClick={() => handleConnectFromProfile(profileModal, skill)}
                                                className="bg-indigo-600 text-white text-[10px] px-3 py-1 rounded-full font-bold hover:bg-indigo-700 transition-colors"
                                            >
                                                Connect
                                            </button>
                                        </div>
                                        <p className="text-xs text-indigo-700 leading-relaxed">{skill.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare size={16} className="text-gray-400" />
                                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Review History</h4>
                            </div>
                            <UserReviews userId={profileModal.id} sessions={sessions} users={users} />
                        </section>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Connection Modal */}
      {connectModal && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 animate-slide-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Request Help</h3>
                    <button onClick={() => setConnectModal(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <img src={connectModal.user.avatar} className="w-14 h-14 rounded-full border border-gray-100" />
                    <div>
                        <p className="font-semibold text-gray-900">{connectModal.user.name}</p>
                        <p className="text-indigo-600 font-medium">{connectModal.skill.name}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration needed (hours)</label>
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <Clock className="text-gray-400" />
                        <input
                            type="range"
                            min="0.5"
                            max="5"
                            step="0.5"
                            value={duration}
                            onChange={(e) => setDuration(parseFloat(e.target.value))}
                            className="flex-1 accent-indigo-600"
                        />
                        <span className="font-bold text-gray-900 w-12 text-right">{duration}h</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">Cost: {duration} credits</p>
                </div>

                <button
                    onClick={handleRequest}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    Confirm Request
                </button>
            </div>
        </div>
      )}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
