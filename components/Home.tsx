
import React, { useState, useMemo } from 'react';
import { User, Skill, Location } from '../types';
import { calculateDistance, getDistanceLabel } from '../utils/geo';
import { getSmartMatches } from '../services/geminiService';
import { CATEGORIES } from '../constants';

interface HomeProps {
  users: User[];
  currentUser: User;
  onRequestSession: (providerId: string, skill: Skill, duration: number, scheduledAt?: number) => void;
  userLocation: Location | null;
}

const Home: React.FC<HomeProps> = ({ users, currentUser, onRequestSession, userLocation }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState<number | 'Any'>('Any');
  const [requestModal, setRequestModal] = useState<{ user: User, skill: Skill } | null>(null);
  const [requestDuration, setRequestDuration] = useState(1);
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [isAiMatching, setIsAiMatching] = useState(false);
  const [aiMatches, setAiMatches] = useState<string[]>([]);

  const handleAiMatch = async () => {
    if (!search.trim()) return;
    setIsAiMatching(true);
    const matchedIds = await getSmartMatches(search, users.filter(u => u.id !== currentUser.id));
    setAiMatches(matchedIds);
    setIsAiMatching(false);
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter(u => u.id !== currentUser.id);

    // Filter by skill or name
    if (search && !aiMatches.length) {
      result = result.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.skills.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
      );
    } else if (aiMatches.length > 0) {
      result = result.sort((a, b) => {
        const idxA = aiMatches.indexOf(a.id);
        const idxB = aiMatches.indexOf(b.id);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(u => u.skills.some(s => s.category === selectedCategory));
    }

    // Geo filtering
    if (maxDistance !== 'Any' && userLocation) {
        result = result.filter(u => {
            if (!u.location) return false;
            const d = calculateDistance(userLocation.lat, userLocation.lng, u.location.lat, u.location.lng);
            return d <= (maxDistance as number);
        });
    }

    return result;
  }, [users, search, selectedCategory, maxDistance, userLocation, aiMatches, currentUser.id]);

  const handleSendRequest = () => {
    if (!requestModal) return;
    const scheduledAt = scheduledDateTime ? new Date(scheduledDateTime).getTime() : undefined;
    onRequestSession(requestModal.user.id, requestModal.skill, requestDuration, scheduledAt);
    setRequestModal(null);
    setScheduledDateTime('');
  };

  return (
    <div className="space-y-8">
      {/* Hero / Stats */}
      <section className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-bold mb-4">Discover Amazing Skills Around You</h2>
            <p className="text-indigo-100 mb-6 text-lg">Use your 40-hour budget to learn from others, or offer your own skills to earn even more hours.</p>
            <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 flex-1">
                    <span className="block text-3xl font-bold">{currentUser.balanceHours.toFixed(1)}h</span>
                    <span className="text-indigo-200 text-sm">Your Balance</span>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-4 flex-1">
                    <span className="block text-3xl font-bold">{users.length}</span>
                    <span className="text-indigo-200 text-sm">Members</span>
                </div>
            </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i className="fa-solid fa-hourglass text-[200px] -rotate-12"></i>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                    type="text"
                    placeholder="Search for a skill (e.g. 'coding', 'yoga', 'cooking')..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 transition"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        if (aiMatches.length) setAiMatches([]);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiMatch()}
                />
            </div>
            <button
                onClick={handleAiMatch}
                disabled={isAiMatching || !search}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
                {isAiMatching ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                AI Match
            </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center pt-2">
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">Category:</span>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-100 border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">Distance:</span>
                <select
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value === 'Any' ? 'Any' : Number(e.target.value))}
                    className="bg-slate-100 border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="Any">Anywhere</option>
                    <option value="5">Within 5km</option>
                    <option value="20">Within 20km</option>
                    <option value="100">Within 100km</option>
                </select>
            </div>
        </div>
      </section>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length > 0 ? filteredUsers.map(user => {
          const hasSkills = user.skills && user.skills.length > 0;

          return (
            <div key={user.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm transition group ${!hasSkills ? 'opacity-75' : 'hover:shadow-md'}`}>
              <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-xl object-cover" />
                          <div>
                              <h3 className="font-bold text-lg group-hover:text-indigo-600 transition">{user.name}</h3>
                              <div className="flex items-center text-xs text-slate-400 font-medium">
                                  <i className="fa-solid fa-star text-amber-400 mr-1"></i>
                                  {user.rating.toFixed(1)} ({user.reviewCount} reviews)
                              </div>
                          </div>
                      </div>
                      {userLocation && user.location && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
                              {getDistanceLabel(calculateDistance(userLocation.lat, userLocation.lng, user.location.lat, user.location.lng))}
                          </span>
                      )}
                  </div>

                  <p className="text-slate-600 text-sm line-clamp-2 mb-6 h-10">{user.bio || 'Sharing knowledge and building community.'}</p>

                  <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Offers Skills</span>
                      <div className="flex flex-wrap gap-2 min-h-[2rem]">
                          {hasSkills ? user.skills.map(skill => (
                              <button
                                  key={skill.id}
                                  onClick={() => setRequestModal({ user, skill })}
                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-600 hover:text-white transition"
                              >
                                  {skill.name}
                              </button>
                          )) : (
                            <span className="text-xs text-slate-400 italic">No skills listed yet</span>
                          )}
                      </div>
                  </div>
              </div>
              <div className="border-t border-slate-100 p-4 bg-slate-50/50 rounded-b-2xl">
                  <button
                      disabled={!hasSkills}
                      onClick={() => hasSkills && setRequestModal({ user, skill: user.skills[0] })}
                      className={`w-full py-2 border rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
                        hasSkills
                          ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600'
                          : 'bg-slate-100 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                      }`}
                  >
                      {hasSkills ? 'Connect & Learn' : (
                        <>
                          <i className="fa-solid fa-lock text-[10px]"></i>
                          No Skills Offered
                        </>
                      )}
                  </button>
              </div>
            </div>
          );
        }) : (
            <div className="col-span-full py-20 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-magnifying-glass text-slate-300 text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-400">No matches found</h3>
                <p className="text-slate-400">Try adjusting your filters or search keywords.</p>
            </div>
        )}
      </div>

      {/* Request Modal */}
      {requestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                  <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold">Request Session</h3>
                        <p className="text-indigo-100 text-sm opacity-90">Learning {requestModal.skill.name} from {requestModal.user.name}</p>
                      </div>
                      <button onClick={() => setRequestModal(null)} className="text-white/80 hover:text-white transition">
                        <i className="fa-solid fa-xmark text-xl"></i>
                      </button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                          <div className="text-sm">
                            <span className="block font-bold text-slate-700">Duration</span>
                            <span className="text-slate-400">How many hours?</span>
                          </div>
                          <div className="flex items-center gap-4">
                              <button
                                onClick={() => setRequestDuration(prev => Math.max(0.5, prev - 0.5))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white hover:border-indigo-500 transition"
                              >-</button>
                              <span className="font-bold text-lg min-w-[3rem] text-center">{requestDuration}h</span>
                              <button
                                onClick={() => setRequestDuration(prev => Math.min(currentUser.balanceHours, prev + 0.5))}
                                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-white hover:border-indigo-500 transition"
                              >+</button>
                          </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Schedule Date & Time</label>
                        <input
                          type="datetime-local"
                          className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                          value={scheduledDateTime}
                          onChange={(e) => setScheduledDateTime(e.target.value)}
                        />
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm flex gap-3">
                          <i className="fa-solid fa-circle-info mt-1"></i>
                          <p>Deducting <strong>{requestDuration} hours</strong> from your balance of <strong>{currentUser.balanceHours.toFixed(1)}h</strong>.</p>
                      </div>

                      <button
                        onClick={handleSendRequest}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition"
                      >
                        Send Request
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Home;
