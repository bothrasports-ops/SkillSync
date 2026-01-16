
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

    if (selectedCategory !== 'All') {
      result = result.filter(u => u.skills.some(s => s.category === selectedCategory));
    }

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
    if (!scheduledDateTime) {
      alert("Please select a date and time for your session.");
      return;
    }
    const scheduledAt = new Date(scheduledDateTime).getTime();
    onRequestSession(requestModal.user.id, requestModal.skill, requestDuration, scheduledAt);
    setRequestModal(null);
    setScheduledDateTime('');
    setRequestDuration(1);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">Master New Skills,<br/>Share Your Own.</h2>
            <p className="text-indigo-100 mb-8 text-lg opacity-90">Every member starts with 40 hours. Use them to learn, earn them back by teaching others. Time is our only currency.</p>
            <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 flex-1 border border-white/10">
                    <span className="block text-3xl font-black">{currentUser.balanceHours.toFixed(1)}h</span>
                    <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Available Balance</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 flex-1 border border-white/10">
                    <span className="block text-3xl font-black">{users.length}</span>
                    <span className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Global Hub Members</span>
                </div>
            </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i className="fa-solid fa-bolt-lightning text-[250px] -rotate-12 translate-x-12 -translate-y-12"></i>
        </div>
      </section>

      {/* Search & Filters Section */}
      <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                    type="text"
                    placeholder="What would you like to learn today?"
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700"
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
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
                {isAiMatching ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                AI Match
            </button>
        </div>

        <div className="flex flex-wrap gap-6 items-center pt-2">
            <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Category</span>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    <option value="All">All Topics</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Proximity</span>
                <select
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(e.target.value === 'Any' ? 'Any' : Number(e.target.value))}
                    className="bg-slate-100 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                    <option value="Any">Everywhere</option>
                    <option value="5">Within 5km</option>
                    <option value="20">Within 20km</option>
                    <option value="100">Within 100km</option>
                </select>
            </div>
        </div>
      </section>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredUsers.length > 0 ? filteredUsers.map(user => {
          const hasSkills = user.skills && user.skills.length > 0;
          return (
            <div key={user.id} className={`bg-white rounded-[2rem] border border-slate-200 shadow-sm transition-all group overflow-hidden flex flex-col ${!hasSkills ? 'opacity-70' : 'hover:shadow-xl hover:shadow-indigo-50 hover:-translate-y-1'}`}>
              <div className="p-8 flex-1">
                  <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-slate-100" />
                          <div>
                              <h3 className="font-black text-xl text-slate-800 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                              <div className="flex items-center text-xs text-amber-500 font-black tracking-wide mt-0.5">
                                  <i className="fa-solid fa-star mr-1"></i>
                                  {user.rating.toFixed(1)} <span className="text-slate-300 mx-1">•</span> <span className="text-slate-400">{user.reviewCount} Reviews</span>
                              </div>
                          </div>
                      </div>
                      {userLocation && user.location && (
                          <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                              {getDistanceLabel(calculateDistance(userLocation.lat, userLocation.lng, user.location.lat, user.location.lng))}
                          </span>
                      )}
                  </div>

                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 h-10 line-clamp-2">{user.bio || 'Dedicated community member sharing unique expertise.'}</p>

                  <div className="space-y-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Available Expertise</span>
                      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
                          {hasSkills ? user.skills.map(skill => (
                              <button
                                  key={skill.id}
                                  onClick={() => setRequestModal({ user, skill })}
                                  className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-black rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                              >
                                  {skill.name}
                              </button>
                          )) : (
                            <div className="flex items-center gap-2 text-slate-400 italic text-xs py-2">
                                <i className="fa-solid fa-hourglass-start text-[10px]"></i>
                                Setting up teaching curriculum...
                            </div>
                          )}
                      </div>
                  </div>
              </div>
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
                  <button
                      disabled={!hasSkills}
                      onClick={() => hasSkills && setRequestModal({ user, skill: user.skills[0] })}
                      className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                        hasSkills
                          ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg shadow-slate-100 active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                  >
                      {hasSkills ? (
                        <>
                          <i className="fa-solid fa-calendar-plus text-xs"></i>
                          Connect & Learn
                        </>
                      ) : (
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
            <div className="col-span-full py-24 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <i className="fa-solid fa-compass text-slate-200 text-4xl"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-400">No matches found</h3>
                <p className="text-slate-400 font-medium">Try broadening your search or adjusting the filters.</p>
            </div>
        )}
      </div>

      {/* Booking Pop-up Modal */}
      {requestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass animate-in fade-in duration-300">
              <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl animate-in zoom-in duration-300 overflow-hidden border border-slate-100">
                  <div className="bg-indigo-600 p-8 text-white relative">
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black tracking-tight">Schedule Session</h3>
                        <p className="text-indigo-100 text-sm font-medium mt-1">Learning {requestModal.skill.name} from {requestModal.user.name}</p>
                      </div>
                      <button onClick={() => setRequestModal(null)} className="absolute top-8 right-8 text-white/60 hover:text-white transition-colors p-2">
                        <i className="fa-solid fa-xmark text-2xl"></i>
                      </button>
                  </div>
                  <div className="p-10 space-y-8">
                      {/* Duration Select */}
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Session Length</label>
                          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                              <div className="text-sm font-bold text-slate-700 flex flex-col">
                                <span>Duration</span>
                                <span className="text-xs font-medium text-slate-400">Credits needed</span>
                              </div>
                              <div className="flex items-center gap-6">
                                  <button
                                    onClick={() => setRequestDuration(prev => Math.max(0.5, prev - 0.5))}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-indigo-500 hover:text-indigo-600 transition-all font-black"
                                  >–</button>
                                  <span className="font-black text-xl min-w-[3rem] text-center text-indigo-600">{requestDuration}h</span>
                                  <button
                                    onClick={() => setRequestDuration(prev => Math.min(currentUser.balanceHours, prev + 0.5))}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:border-indigo-500 hover:text-indigo-600 transition-all font-black"
                                  >+</button>
                              </div>
                          </div>
                      </div>

                      {/* Date Time Picker */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Proposed Meeting Time</label>
                        <div className="relative">
                            <i className="fa-solid fa-calendar-day absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500"></i>
                            <input
                              type="datetime-local"
                              className="w-full pl-14 pr-6 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700 text-sm"
                              value={scheduledDateTime}
                              onChange={(e) => setScheduledDateTime(e.target.value)}
                            />
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 text-indigo-800 text-sm flex gap-4">
                          <i className="fa-solid fa-circle-info mt-1 text-indigo-500"></i>
                          <p className="font-medium leading-relaxed">
                            This booking will deduct <span className="font-black underline">{requestDuration} hours</span> from your current balance of <span className="font-black">{currentUser.balanceHours.toFixed(1)}h</span>.
                          </p>
                      </div>

                      <button
                        onClick={handleSendRequest}
                        className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                        Send Booking Request
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Home;
