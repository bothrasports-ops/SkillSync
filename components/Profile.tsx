
import React, { useState } from 'react';
import { User, Skill } from '../types';
import { CATEGORIES } from '../constants';
import { getSkillSuggestion } from '../services/geminiService';

interface ProfileProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>(user);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSuggestSkills = async () => {
      if (!formData.bio) return;
      setIsGenerating(true);
      const suggestions = await getSkillSuggestion(formData.bio);
      if (suggestions.length > 0) {
          const newSkills: Skill[] = suggestions.map(s => ({
              id: Math.random().toString(36).substr(2, 9),
              name: s,
              category: 'Other',
              description: ''
          }));
          setFormData({ ...formData, skills: [...(formData.skills || []), ...newSkills] });
      }
      setIsGenerating(false);
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Skill',
      category: 'Other',
      description: ''
    };
    setFormData({ ...formData, skills: [...(formData.skills || []), newSkill] });
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    const updated = (formData.skills || []).map(s => s.id === id ? { ...s, [field]: value } : s);
    setFormData({ ...formData, skills: updated });
  };

  const removeSkill = (id: string) => {
    setFormData({ ...formData, skills: (formData.skills || []).filter(s => s.id !== id) });
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col items-center">
        <div className="relative group mb-6">
            <img src={user.avatar} alt={user.name} className="w-32 h-32 rounded-3xl object-cover shadow-lg border-4 border-white" />
            <button className="absolute -bottom-2 -right-2 bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition">
                <i className="fa-solid fa-camera"></i>
            </button>
        </div>

        {isEditing ? (
            <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-2xl font-bold text-center border-b-2 border-indigo-500 outline-none mb-2"
                placeholder="Name"
            />
        ) : (
            <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
        )}

        <div className="flex flex-col items-center text-slate-400 font-medium mb-6">
            {isEditing && user.isAdmin ? (
                <div className="flex flex-col gap-2 items-center w-full">
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="text-sm border rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                        placeholder="Email"
                    />
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="text-xs border rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                        placeholder="Phone"
                    />
                </div>
            ) : (
                <>
                    <span>{user.email}</span>
                    {user.phone && <span className="text-xs">{user.phone}</span>}
                </>
            )}
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <span className="block text-xl font-bold text-indigo-600">{user.balanceHours.toFixed(1)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hours Available</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl text-center">
                <span className="block text-xl font-bold text-indigo-600">{user.rating.toFixed(1)}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Rating</span>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-indigo-500"></i>
                Profile Configuration
            </h3>
            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">
                    Edit Profile
                </button>
            )}
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">Bio & Introduction</label>
                {isEditing ? (
                    <textarea
                        className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell others what you are passionate about..."
                    />
                ) : (
                    <p className="text-slate-600 bg-slate-50 p-4 rounded-2xl italic">"{user.bio || 'No bio added yet.'}"</p>
                )}
            </div>

            <div>
                <div className="flex justify-between items-end mb-4">
                    <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Skills You Offer</label>
                    {isEditing && (
                        <div className="flex gap-2">
                            <button onClick={handleSuggestSkills} disabled={isGenerating || !formData.bio} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition disabled:opacity-50">
                                {isGenerating ? 'Analyzing...' : 'Suggest Skills ✨'}
                            </button>
                            <button onClick={addSkill} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition">
                                + Add Skill
                            </button>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    {(isEditing ? formData.skills : user.skills)?.map((skill) => (
                        <div key={skill.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center">
                            {isEditing ? (
                                <>
                                    <input
                                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        value={skill.name}
                                        onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                                    />
                                    <select
                                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm min-w-[120px]"
                                        value={skill.category}
                                        onChange={(e) => updateSkill(skill.id, 'category', e.target.value)}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <button onClick={() => removeSkill(skill.id)} className="text-red-400 hover:text-red-600">
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">{skill.category}</span>
                                    <span className="font-bold text-slate-700">{skill.name}</span>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {isEditing && (
                <div className="flex gap-4 pt-4">
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
                    >
                        Save Changes
                    </button>
                    <button
                        onClick={() => { setFormData(user); setIsEditing(false); }}
                        className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-200 transition"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Profile;