import React, { useState, useRef } from 'react';
import { User, Skill } from '../types';
import { CATEGORIES, PREDEFINED_SKILLS } from '../constants';
import { getSkillSuggestion } from '../services/geminiService';

interface ProfileProps {
  user: User;
  onUpdate: (data: Partial<User>) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>(user);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSuggestSkills = async () => {
      if (!formData.bio) return;
      setIsGenerating(true);
      try {
        const suggestions = await getSkillSuggestion(formData.bio);
        if (suggestions.length > 0) {
            const newSkills: Skill[] = suggestions.map(s => {
                let category = 'Other';
                for (const cat of Object.keys(PREDEFINED_SKILLS)) {
                    if (PREDEFINED_SKILLS[cat].includes(s)) {
                        category = cat;
                        break;
                    }
                }
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    name: s,
                    category: category,
                    description: `I can help you with ${s}.`
                };
            });
            setFormData({ ...formData, skills: [...(formData.skills || []), ...newSkills] });
        }
      } catch (e) {
        console.error("Failed to suggest skills", e);
      } finally {
        setIsGenerating(false);
      }
  };

  const addSkill = () => {
    const firstCategory = CATEGORIES[0];
    const newSkill: Skill = {
      id: Math.random().toString(36).substr(2, 9),
      name: PREDEFINED_SKILLS[firstCategory]?.[0] || 'New Skill',
      category: firstCategory,
      description: ''
    };
    setFormData({ ...formData, skills: [...(formData.skills || []), newSkill] });
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    const updated = (formData.skills || []).map(s => {
      if (s.id === id) {
        const updatedSkill = { ...s, [field]: value };
        if (field === 'category') {
            updatedSkill.name = PREDEFINED_SKILLS[value]?.[0] || 'Custom Skill';
        }
        return updatedSkill;
      }
      return s;
    });
    setFormData({ ...formData, skills: updated });
  };

  const removeSkill = (id: string) => {
    setFormData({ ...formData, skills: (formData.skills || []).filter(s => s.id !== id) });
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const randomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;
    setFormData({ ...formData, avatar: newAvatar });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-20">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-12 flex flex-col items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-50 to-violet-50 opacity-50"></div>

        <div className="relative group mb-8 z-10">
            <img
              src={isEditing ? formData.avatar : user.avatar}
              alt={user.name}
              className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white rotate-2 transition-transform group-hover:rotate-0"
            />

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            {isEditing && (
              <div className="absolute -bottom-2 -right-2 flex gap-2">
                <button
                  onClick={randomizeAvatar}
                  className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-xl border-2 border-white hover:scale-110 transition active:scale-95"
                  title="Randomize Avatar"
                >
                    <i className="fa-solid fa-rotate"></i>
                </button>
                <button
                  onClick={triggerFilePicker}
                  className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-xl border-2 border-white hover:scale-110 transition active:scale-95"
                  title="Upload Custom Image"
                >
                    <i className="fa-solid fa-camera"></i>
                </button>
              </div>
            )}
        </div>

        <div className="text-center z-10 w-full">
            {isEditing ? (
                <div className="max-w-md mx-auto space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Name</label>
                      <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="text-3xl font-black text-center border-b-4 border-indigo-500 outline-none w-full bg-transparent pb-1"
                          placeholder="Your Name"
                      />
                    </div>
                </div>
            ) : (
                <>
                    <h2 className="text-4xl font-black text-slate-900 mb-2">{user.name}</h2>
                    <p className="text-slate-400 font-medium tracking-wide">{user.email}</p>
                </>
            )}
        </div>

        <div className="grid grid-cols-2 gap-6 w-full max-w-lg mt-10 z-10">
            <div className="bg-indigo-50/50 p-6 rounded-3xl text-center border border-indigo-100">
                <span className="block text-3xl font-black text-indigo-600">{user.balanceHours.toFixed(1)}</span>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Hours Balance</span>
            </div>
            <div className="bg-amber-50/50 p-6 rounded-3xl text-center border border-amber-100">
                <span className="block text-3xl font-black text-amber-600">{user.rating.toFixed(1)}</span>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">Avg Rating</span>
            </div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8 md:p-12 space-y-12">
        <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <i className="fa-solid fa-id-card text-indigo-500"></i>
                Profile Identity
            </h3>
            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition shadow-lg active:scale-95">
                    <i className="fa-solid fa-user-pen mr-2"></i>
                    Edit Profile
                </button>
            )}
        </div>

        <div className="space-y-10">
            {/* Bio Section */}
            <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">My Narrative</label>
                {isEditing ? (
                    <textarea
                        className="w-full p-6 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700 leading-relaxed"
                        rows={5}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Share your story and what makes you a great community member..."
                    />
                ) : (
                    <p className="text-lg text-slate-600 leading-relaxed font-medium p-8 bg-slate-50 rounded-[2rem] border border-slate-100 italic">
                        "{user.bio || 'This member hasn\'t written a bio yet.'}"
                    </p>
                )}
            </div>

            {/* Skills Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Skill Offerings</label>
                        <p className="text-slate-500 text-sm font-medium mt-1">What can you teach the community?</p>
                    </div>
                    {isEditing && (
                        <div className="flex gap-3">
                            <button onClick={handleSuggestSkills} disabled={isGenerating || !formData.bio} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition disabled:opacity-50 flex items-center gap-2">
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                {isGenerating ? 'Analyzing Bio...' : 'Suggest Skills'}
                            </button>
                            <button onClick={addSkill} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-100 transition flex items-center gap-2">
                                <i className="fa-solid fa-plus"></i>
                                Add Skill
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {(isEditing ? formData.skills : user.skills)?.map((skill) => (
                        <div key={skill.id} className={`p-8 rounded-[2rem] border transition-all ${isEditing ? 'bg-white border-slate-200 shadow-md' : 'bg-slate-50 border-slate-100'}`}>
                            {isEditing ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="w-full md:w-1/3 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                                value={skill.category}
                                                onChange={(e) => updateSkill(skill.id, 'category', e.target.value)}
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Skill Selection</label>
                                            <select
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                                value={skill.name}
                                                onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                                            >
                                                {PREDEFINED_SKILLS[skill.category]?.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                                <option value="Custom Skill">-- Custom Skill --</option>
                                            </select>
                                            {skill.name === 'Custom Skill' && (
                                                <input
                                                    className="w-full mt-2 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                                    placeholder="Type your custom skill name..."
                                                    onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                                                />
                                            )}
                                        </div>
                                        <button onClick={() => removeSkill(skill.id)} className="mt-8 text-red-300 hover:text-red-500 transition-colors p-2">
                                            <i className="fa-solid fa-circle-xmark text-2xl"></i>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Description</label>
                                        <textarea
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-3 text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                            value={skill.description}
                                            onChange={(e) => updateSkill(skill.id, 'description', e.target.value)}
                                            rows={2}
                                            placeholder="What will community members learn in a session with you?"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                                        <i className="fa-solid fa-graduation-cap text-xl"></i>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-xl font-black text-slate-800">{skill.name}</h4>
                                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest">{skill.category}</span>
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{skill.description || 'No description provided.'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {(isEditing ? formData.skills : user.skills)?.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium italic">No skills listed yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Logout Section for Mobile & Ease of use */}
            {!isEditing && (
                <div className="pt-10 border-t border-slate-100 flex flex-col items-center gap-4">
                  <button
                    onClick={onLogout}
                    className="w-full md:w-auto px-10 py-5 rounded-[2rem] border-2 border-red-50 text-red-500 font-black flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 shadow-sm"
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    Sign Out of Community
                  </button>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic text-center">Your local session will be cleared.</p>
                </div>
            )}

            {isEditing && (
                <div className="flex gap-4 pt-8 animate-in slide-in-from-bottom-4">
                    <button
                        onClick={handleSave}
                        className="flex-1 bg-indigo-600 text-white py-5 rounded-[2rem] font-black shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95"
                    >
                        Save Profile & Skills
                    </button>
                    <button
                        onClick={() => { setFormData(user); setIsEditing(false); }}
                        className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-[2rem] font-black hover:bg-slate-200 transition"
                    >
                        Discard Changes
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Profile;