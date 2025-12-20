
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { UserCard } from '../components/UserCard';
import { Search, MapPin, Sparkles, X } from 'lucide-react';
import { findBestMatches } from '../services/geminiService';
import { User, Skill } from '../types';

interface HomeProps {
    onRequestSession: (user: User, skill: Skill) => void;
    onViewProfile: (user: User) => void;
}

export const Home: React.FC<HomeProps> = ({ onRequestSession, onViewProfile }) => {
  const { users, currentUser, updateUserLocation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [filteredUserIds, setFilteredUserIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'ai'>('all');

  useEffect(() => {
    // Basic geolocation on mount
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        updateUserLocation(position.coords.latitude, position.coords.longitude);
      });
    }
  }, []);

  const handleAiSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    setActiveFilter('ai');
    try {
      const ids = await findBestMatches(searchQuery, users);
      setFilteredUserIds(ids);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Fixed the logic to handle filters cleanly and avoid redundant comparison errors
  const getDisplayedUsers = () => {
    const list = users.filter(u => u.id !== currentUser?.id);

    switch (activeFilter) {
      case 'ai':
        return list.filter(u => filteredUserIds.includes(u.id));

      case 'nearby':
        // For 'nearby', we could filter by distance, but keeping original behavior for now
        return list;

      case 'all':
      default:
        if (searchQuery) {
          const lower = searchQuery.toLowerCase();
          return list.filter(u =>
            u.name.toLowerCase().includes(lower) ||
            u.skills.some(s => s.name.toLowerCase().includes(lower))
          );
        }
        return list;
    }
  };

  const displayedUsers = getDisplayedUsers();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Find Help & Share Skills</h2>
        <p className="text-indigo-100 mb-6">Connect with your community using time credits.</p>

        <div className="relative">
          <input
            type="text"
            placeholder="What do you need help with?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-3 rounded-xl text-gray-900 border-none focus:ring-2 focus:ring-indigo-300 shadow-lg"
          />
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />

          <button
            onClick={handleAiSearch}
            disabled={isAiSearching || !searchQuery}
            className="absolute right-2 top-2 bg-indigo-100 text-indigo-700 p-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            {isAiSearching ? (
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <Sparkles size={20} />
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
            All Members
        </button>
        <button
            onClick={() => setActiveFilter('nearby')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 ${activeFilter === 'nearby' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
            <MapPin size={14} />
            Nearby
        </button>
        {activeFilter === 'ai' && (
             <button
             onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
             className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 bg-indigo-100 text-indigo-700"
         >
             <X size={14} />
             Clear AI Search
         </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedUsers.map(user => (
          <UserCard
            key={user.id}
            user={user}
            onConnect={onRequestSession}
            onViewProfile={onViewProfile}
          />
        ))}
        {displayedUsers.length === 0 && (
            <div className="text-center py-12 col-span-full text-gray-400">
                <p>No users found matching your criteria.</p>
            </div>
        )}
      </div>
    </div>
  );
};
