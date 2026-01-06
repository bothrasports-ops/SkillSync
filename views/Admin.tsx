
import React, { useState } from 'react';
import { useApp } from '../store';
import { Mail, Copy, Check, Users, ShieldCheck, Smartphone, Palette, Send } from 'lucide-react';

export const Admin: React.FC = () => {
  const { invitations, createInvitation, currentUser } = useApp();
  const [email, setEmail] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'invites' | 'brand'>('invites');

  // Filter so users only see invitations they created
  const myInvitations = invitations.filter(i => i.created_by === currentUser?.id);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    createInvitation(email);
    setEmail('');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sendEmailInvite = (inviteEmail: string, code: string) => {
    const subject = encodeURIComponent("You're invited to join SkillSync!");
    const body = encodeURIComponent(
      `Hi there!\n\nI'd like to invite you to SkillSync, our community skill-sharing platform.\n\nYour Invitation Code: ${code}\n\nWhen you join, you'll automatically receive 40 hours of time credits to start learning new skills or getting help with tasks.\n\nJoin us here: ${window.location.origin}\n\nSee you there!`
    );
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
  };

  const PWA_ICON_URL = "https://cdn-icons-png.flaticon.com/512/10613/10613725.png";

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('invites')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'invites' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Users size={16} />
            Invitations
          </div>
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'brand' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Palette size={16} />
            Brand Assets
          </div>
        </button>
      </div>

      {activeTab === 'invites' ? (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <ShieldCheck size={24} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Invite Friends</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
                SkillSync is a trusted community. Generate a code below, then click the "Send Email" icon to invite your friends using your own email app.
            </p>

            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Friend's email address"
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                <Mail size={18} />
                Generate Code
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Recent Invitations</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {myInvitations.map((invite, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                          {invite.code}
                       </span>
                       <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${invite.used ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {invite.used ? 'Joined' : 'Pending'}
                       </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => sendEmailInvite(invite.email, invite.code)}
                      className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Send via Email Client"
                    >
                      <Send size={18} />
                    </button>
                    <button
                      onClick={() => copyToClipboard(invite.code)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Copy Code"
                    >
                      {copiedCode === invite.code ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              ))}
              {myInvitations.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                    <p className="italic">You haven't invited anyone yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Smartphone size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">PWA Preview</h2>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              This is how your SkillSync app appears on users' devices.
            </p>

            <div className="flex justify-center py-8 bg-slate-900 rounded-2xl relative overflow-hidden group">
              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 bg-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center p-3 transform group-hover:scale-110 transition-transform duration-500">
                  <img
                    src={PWA_ICON_URL}
                    alt="PWA Icon"
                    className="w-full h-full object-contain brightness-0 invert"
                  />
                </div>
                <span className="mt-3 text-white text-xs font-semibold tracking-wide">SkillSync</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
