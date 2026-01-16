
import React from 'react';
import { SessionRequest, SessionStatus, User } from '../types';

interface RequestsProps {
  sessions: SessionRequest[];
  currentUser: User;
  users: User[];
  onUpdateSession: (id: string, status: SessionStatus) => void;
}

const Requests: React.FC<RequestsProps> = ({ sessions, currentUser, users, onUpdateSession }) => {
  const incomingPending = sessions.filter(s => s.providerId === currentUser.id && s.status === SessionStatus.PENDING);
  const incomingActive = sessions.filter(s => s.providerId === currentUser.id && s.status === SessionStatus.ACCEPTED);
  const incomingHistory = sessions.filter(s => s.providerId === currentUser.id && (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.CANCELLED));

  const getOtherUser = (id: string) => users.find(u => u.id === id);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <header className="mb-12">
          <h2 className="text-4xl font-black flex items-center gap-4 text-slate-900 tracking-tight">
              <i className="fa-solid fa-chalkboard-user text-indigo-600"></i>
              Teaching Dashboard
          </h2>
          <p className="text-slate-500 mt-3 font-medium text-lg">Manage your knowledge-sharing sessions and community requests.</p>
      </header>

      {/* New Requests Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">New Opportunities ({incomingPending.length})</h3>
        </div>

        <div className="space-y-6">
            {incomingPending.length > 0 ? incomingPending.map(session => {
                const requester = getOtherUser(session.requesterId);
                const scheduledDate = session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'Not scheduled';
                return (
                    <div key={session.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center shadow-sm hover:shadow-md transition-all group border-l-8 border-l-amber-400">
                        <div className="flex items-center gap-5 flex-1">
                            <img src={requester?.avatar} className="w-20 h-20 rounded-3xl object-cover shadow-lg border border-white rotate-2 group-hover:rotate-0 transition-transform" alt="avatar" />
                            <div className="space-y-1">
                                <h4 className="font-black text-xl text-slate-800">{requester?.name}</h4>
                                <p className="text-indigo-600 font-bold flex items-center gap-2">
                                    <i className="fa-solid fa-graduation-cap text-xs"></i>
                                    Topic: {session.skillName}
                                </p>
                                <div className="flex flex-wrap items-center gap-4 pt-2">
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
                                        <i className="fa-regular fa-clock"></i>
                                        {session.durationHours} Hours
                                    </span>
                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-widest">
                                        <i className="fa-solid fa-calendar-day"></i>
                                        {scheduledDate}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <button
                                onClick={() => onUpdateSession(session.id, SessionStatus.ACCEPTED)}
                                className="flex-1 md:flex-none px-10 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => onUpdateSession(session.id, SessionStatus.CANCELLED)}
                                className="flex-1 md:flex-none px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black hover:bg-slate-200 transition-all active:scale-95"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                );
            }) : (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
                        <i className="fa-solid fa-inbox text-2xl"></i>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No pending requests</p>
                </div>
            )}
        </div>
      </section>

      {/* Active Teaching Section */}
      {incomingActive.length > 0 && (
        <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Active Assignments ({incomingActive.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {incomingActive.map(session => {
                    const requester = getOtherUser(session.requesterId);
                    const scheduledDate = session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'Not scheduled';
                    return (
                        <div key={session.id} className="bg-white rounded-[2rem] border border-slate-200 p-6 flex flex-col gap-4 shadow-sm border-l-8 border-l-indigo-600">
                            <div className="flex items-center gap-4">
                                <img src={requester?.avatar} className="w-12 h-12 rounded-2xl border border-slate-100" alt="avatar" />
                                <div>
                                    <p className="font-black text-slate-800">{requester?.name}</p>
                                    <p className="text-xs font-bold text-indigo-600">{session.skillName}</p>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Details</p>
                                <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                    <i className="fa-solid fa-clock-rotate-left"></i>
                                    {scheduledDate}
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Active Learning
                                </span>
                                <span className="text-xs font-black text-slate-400">{session.durationHours}h Session</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
      )}

      {/* Teaching History Section */}
      {incomingHistory.length > 0 && (
        <section className="pt-8 border-t border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8">Teaching Legacy</h3>
            <div className="space-y-4">
                {incomingHistory.map(session => {
                    const requester = getOtherUser(session.requesterId);
                    const isCompleted = session.status === SessionStatus.COMPLETED;
                    return (
                        <div key={session.id} className="bg-white/50 rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img src={requester?.avatar} className="w-10 h-10 rounded-xl grayscale opacity-50" alt="avatar" />
                                <div>
                                    <p className="font-bold text-slate-500 text-sm">{requester?.name}</p>
                                    <p className="text-xs text-slate-400">{session.skillName} • {new Date(session.timestamp).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isCompleted && session.rating && (
                                    <div className="flex items-center text-xs font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full">
                                        <i className="fa-solid fa-star mr-1.5"></i> {session.rating.toFixed(1)}
                                    </div>
                                )}
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isCompleted ? 'bg-slate-100 text-slate-400' : 'bg-red-50 text-red-300'}`}>
                                    {session.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
      )}
    </div>
  );
};

export default Requests;
