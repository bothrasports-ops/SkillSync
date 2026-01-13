
import React, { useState } from 'react';
import { Invitation, User } from '../types';
import { generateInviteEmail } from '../services/geminiService';

interface InvitationsProps {
  invitations: Invitation[];
  onInvite: (emailOrPhone: string) => void;
  onCancel: (id: string) => void;
  isAdmin: boolean;
  currentUser: User;
}

const Invitations: React.FC<InvitationsProps> = ({ invitations, onInvite, onCancel, isAdmin, currentUser }) => {
  const [target, setTarget] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [showDraft, setShowDraft] = useState<{ contact: string, subject: string, message: string } | null>(null);

  const handleStartInvite = async () => {
    if (!target) return;
    setIsDrafting(true);
    try {
        // Pass window.location.origin as the appUrl so it's included in the email
        const result = await generateInviteEmail(currentUser.name, target, window.location.origin);
        setShowDraft({ contact: target, subject: result.subject, message: result.body });
    } catch (e) {
        console.error(e);
    } finally {
        setIsDrafting(false);
    }
  };

  const handleConfirmInvite = () => {
    if (showDraft) {
        onInvite(showDraft.contact);
        setShowDraft(null);
        setTarget('');
    }
  };

  const copyToClipboard = () => {
    if (showDraft) {
        navigator.clipboard.writeText(showDraft.message);
        alert("Invitation message copied to clipboard!");
    }
  };

  const handleSendEmail = () => {
    if (!showDraft) return;
    const subject = encodeURIComponent(showDraft.subject);
    const body = encodeURIComponent(showDraft.message);
    window.location.href = `mailto:${showDraft.contact}?subject=${subject}&body=${body}`;
  };

  const handleShare = async () => {
    if (!showDraft) return;
    if (navigator.share) {
        try {
            await navigator.share({
                title: showDraft.subject,
                text: showDraft.message,
                url: window.location.origin
            });
        } catch (err) {
            console.log('Share failed:', err);
        }
    } else {
        copyToClipboard();
    }
  };
// Only allow canceling if the current user is the inviter or an admin, and it's pending
  const canCancel = (inv: Invitation) => {
    return (inv.invitedBy === currentUser.id || currentUser.isAdmin) && inv.status === 'pending';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100 rotate-3">
            <i className="fa-solid fa-paper-plane text-white text-3xl"></i>
        </div>
        <h2 className="text-3xl font-black mb-4 tracking-tight">Expand Your Network</h2>
        <p className="text-slate-500 mb-10 leading-relaxed max-w-sm mx-auto">
            TimeShare is an exclusive community. {isAdmin ? 'Invite new members to join the peer-to-peer revolution.' : 'Invite your trusted friends to share their skills.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 p-2 bg-slate-50 rounded-[2rem] border border-slate-100">
            <input
                type="text"
                placeholder="Email or Phone Number"
                className="flex-1 px-6 py-4 rounded-2xl bg-transparent focus:outline-none text-slate-700 font-medium"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartInvite()}
            />
            <button
                onClick={handleStartInvite}
                disabled={isDrafting || !target}
                className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isDrafting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>}
                Draft Invite
            </button>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-6">
            <i className="fa-solid fa-shield-halved mr-1"></i>
            Member Verification Required
        </p>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
                <i className="fa-solid fa-history text-slate-400"></i>
                Invitation History
            </h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{invitations.length} Total</span>
        </div>
        <div className="space-y-4">
            {invitations.length > 0 ? invitations.map(inv => (
                <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex justify-between items-center group hover:border-indigo-300 transition-all shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <i className="fa-solid fa-user-tag text-xl"></i>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{inv.emailOrPhone}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                    {new Date(inv.timestamp).toLocaleDateString()}
                                </span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                <span className="text-[10px] text-indigo-400 font-bold uppercase">Community Access</span>
                            </div>
                        </div>
                    </div>
                  <div className="flex items-center gap-3">
                      {canCancel(inv) && (
                          <button
                              onClick={() => onCancel(inv.id)}
                              title="Cancel Invitation"
                              className="text-slate-300 hover:text-red-500 transition-colors p-2"
                          >
                              <i className="fa-solid fa-trash-can"></i>
                          </button>
                      )}
                      <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          inv.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          inv.status === 'cancelled' ? 'bg-slate-50 text-slate-400 border border-slate-100 line-through' :
                          'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                          {inv.status}
                      </span>
                  </div>
              </div>
          )) : (
                <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-solid fa-ghost text-slate-200 text-3xl"></i>
                    </div>
                    <p className="text-slate-400 font-medium">No invitations sent yet.</p>
                </div>
            )}
        </div>
      </section>

      {/* Review Invite Modal */}
      {showDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-slate-900 p-8 text-white">
                      <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-2xl font-black tracking-tight">Send Invitation</h3>
                            <p className="text-slate-400 text-sm mt-1">Draft for {showDraft.contact}</p>
                          </div>
                          <button onClick={() => setShowDraft(null)} className="text-slate-400 hover:text-white transition p-2">
                            <i className="fa-solid fa-xmark text-xl"></i>
                          </button>
                      </div>
                  </div>

                  <div className="p-8 flex-1 overflow-y-auto space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-700 text-sm">
                              {showDraft.subject}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message Body</label>
                          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 relative">
                              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
                                {showDraft.message}
                              </p>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={handleSendEmail}
                            className="bg-white border border-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition active:scale-95"
                          >
                            <i className="fa-solid fa-envelope text-indigo-500"></i>
                            Open Email App
                          </button>
                          <button
                            onClick={handleShare}
                            className="bg-white border border-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition active:scale-95"
                          >
                            <i className="fa-solid fa-share-nodes text-indigo-500"></i>
                            Share Native
                          </button>
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                      <button
                        onClick={handleConfirmInvite}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-check"></i>
                        Record as Sent in Database
                      </button>
                      <button
                        onClick={() => setShowDraft(null)}
                        className="w-full text-slate-400 py-2 rounded-xl text-xs font-bold hover:text-slate-600 transition"
                      >
                        Discard Draft
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Invitations;