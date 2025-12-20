import React, { useState } from 'react';
import { useApp } from '../store';
import { MapPin, Calendar, Star, Plus, X, Save, MessageSquare } from 'lucide-react';
import { UserReviews } from '../components/UserReviews';

export const Profile: React.FC = () => {
  const { currentUser, addSkill, updateUserProfile, sessions, users } = useApp();

  // Skill Add State
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', description: '', category: 'Household' });

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');

  if (!currentUser) return null;

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name || !newSkill.description) return;
    addSkill(newSkill.name, newSkill.description, newSkill.category);
    setIsAddingSkill(false);
    setNewSkill({ name: '', description: '', category: 'Household' });
  };

  const startEditing = () => {
    setEditName(currentUser.name);
    setEditAddress(currentUser.location.address || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    updateUserProfile(editName, editAddress);
    setIsEditingProfile(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <div className="px-6 pb-6">
            <div className="relative -mt-12 mb-4 flex justify-between items-end">
                <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white object-cover"
                />
                {isEditingProfile ? (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSaveProfile}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shadow-sm"
                        >
                            <Save size={16} /> Save
                        </button>
                        <button
                            onClick={() => setIsEditingProfile(false)}
                            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={startEditing}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

            <div>
                {isEditingProfile ? (
                    <div className="mb-2">
                         <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-2xl font-bold text-gray-900 border-b-2 border-indigo-200 focus:border-indigo-600 outline-none w-full bg-transparent pb-1"
                            placeholder="Your Name"
                         />
                    </div>
                ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{currentUser.name}</h1>
                )}

                <p className="text-gray-500">{currentUser.email}</p>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        {isEditingProfile ? (
                             <input
                                type="text"
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-0.5 text-sm w-48 focus:ring-1 focus:ring-indigo-500 outline-none"
                                placeholder="City, State"
                            />
                        ) : (
                            <span>{currentUser.location.address || 'Location Hidden'}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Joined {new Date(currentUser.joinedDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star size={16} className="text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-900">{currentUser.rating.toFixed(1)}</span>
                        <span>({currentUser.reviewsCount} reviews)</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Time Bank Balance</h3>
                <div className="flex items-center justify-center p-8 bg-indigo-50 rounded-xl mb-4">
                    <div className="text-center">
                        <span className="block text-4xl font-extrabold text-indigo-600">{currentUser.credits.toFixed(1)}</span>
                        <span className="text-sm font-medium text-indigo-400 uppercase tracking-wide">Hours Available</span>
                    </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                    Earn more hours by helping others in the community.
                    High ratings (4.5+) earn 1.5x bonus credits!
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={20} className="text-indigo-600" />
                    <h3 className="text-lg font-bold text-gray-900">Reviews from Others</h3>
                </div>
                <UserReviews userId={currentUser.id} sessions={sessions} users={users} />
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900">My Skills</h3>
                 <button
                    onClick={() => setIsAddingSkill(!isAddingSkill)}
                    className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                 >
                    {isAddingSkill ? <X size={16} /> : <Plus size={16} />}
                    {isAddingSkill ? 'Cancel' : 'Add Skill'}
                 </button>
            </div>

            {isAddingSkill && (
                <form onSubmit={handleAddSkill} className="mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-fade-in">
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Skill Name (e.g. Painting)"
                            className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={newSkill.name}
                            onChange={e => setNewSkill({...newSkill, name: e.target.value})}
                            required
                        />
                        <select
                            className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={newSkill.category}
                            onChange={e => setNewSkill({...newSkill, category: e.target.value})}
                        >
                            <option>Household</option>
                            <option>Education</option>
                            <option>Tech</option>
                            <option>Arts</option>
                            <option>Other</option>
                        </select>
                        <textarea
                            placeholder="Describe your expertise..."
                            className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={newSkill.description}
                            onChange={e => setNewSkill({...newSkill, description: e.target.value})}
                            required
                        />
                        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-bold hover:bg-indigo-700 transition-colors">
                            Save Skill
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-3">
                {currentUser.skills.map(skill => (
                    <div key={skill.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 transition-colors">
                        <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-semibold text-gray-800">{skill.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{skill.category}</p>
                             </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{skill.description}</p>
                    </div>
                ))}
                {currentUser.skills.length === 0 && !isAddingSkill && (
                    <div className="text-center py-6 text-gray-400 italic">
                        No skills added. Add skills to start earning credits.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
