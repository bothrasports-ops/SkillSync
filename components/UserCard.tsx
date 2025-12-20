import React from 'react';
import { User, Skill } from '../types';
import { Star, MapPin, ExternalLink } from 'lucide-react';
import { calculateDistance } from '../utils';
import { useApp } from '../store';

interface UserCardProps {
  user: User;
  onConnect: (user: User, skill: Skill) => void;
  onViewProfile: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onConnect, onViewProfile }) => {
  const { currentUser } = useApp();

  const distance = currentUser
    ? calculateDistance(currentUser.location.lat, currentUser.location.lng, user.location.lat, user.location.lng)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-4 flex gap-4">
        <div className="cursor-pointer" onClick={() => onViewProfile(user)}>
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border border-gray-200" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="cursor-pointer" onClick={() => onViewProfile(user)}>
              <div className="flex items-center gap-1 group">
                <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{user.name}</h3>
                <ExternalLink size={12} className="text-gray-300 group-hover:text-indigo-400" />
              </div>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin size={12} className="mr-1" />
                <span>{distance} km away</span>
              </div>
            </div>
            <button
              onClick={() => onViewProfile(user)}
              className="flex items-center bg-yellow-50 px-2 py-1 rounded-md hover:bg-yellow-100 transition-colors"
            >
              <Star size={12} className="text-yellow-500 mr-1 fill-current" />
              <span className="text-xs font-bold text-yellow-700">{user.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-400 ml-1">({user.reviewsCount})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Offered Skills</h4>
        <div className="space-y-2">
          {user.skills.map(skill => (
            <div key={skill.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg group hover:bg-indigo-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">{skill.name}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{skill.description}</p>
              </div>
              <button
                onClick={() => onConnect(user, skill)}
                className="opacity-0 group-hover:opacity-100 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-full font-medium transition-all"
              >
                Connect
              </button>
            </div>
          ))}
          {user.skills.length === 0 && (
             <p className="text-sm text-gray-400 italic">No skills listed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
