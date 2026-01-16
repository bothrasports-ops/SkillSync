
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
  const incomingAccepted = sessions.filter(s => s.providerId === currentUser.id && s.status === SessionStatus.ACCEPTED);

  const getOtherUser = (id: string) => users.find(u => u.id === id);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <section>
        <div className="mb-8">
            <h2 className="text-3xl font-black flex items-center gap-3">
                <i className="fa-solid fa-bell text-indigo-500"></i>
                Incoming Requests
            </h2>
            <p className="text-slate-500 mt-2">Manage people who want to learn from you.</p>
        </div>

        <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Action Required ({incomingPending.length})</h3>
            {incomingPending.length > 0 ? incomingPending.map(session => {
                const requester = getOtherUser(session.requesterId);
                return (
                    <div key={session.id} className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-sm hover:shadow-md transition">
                        <div className="flex items-center gap-4 flex-1">
                            <img src={requester?.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="avatar" />
                            <div>
                                <h4 className="font-black text-lg text-slate-800">{requester?.name}</h4>
                                <p className="text-indigo-600 text-sm font-bold">Wants to learn: {session.skillName}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                                        <i className="fa-regular fa-clock"></i>
                                        {session.durationHours} Hours
                                    </span>
                                    <span className="text-xs font-bold text-slate-400">
                                        {new Date(session.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <button
                                onClick={() => onUpdateSession(session.id, SessionStatus.ACCEPTED)}
                                className="flex-1 md:flex-none px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => onUpdateSession(session.id, SessionStatus.CANCELLED)}
                                className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl text-sm font-black hover:bg-slate-200 transition"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                );
            }) : (
                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 italic">No pending requests for your skills.</p>
                </div>
            )}
        </div>
      </section>

      {incomingAccepted.length > 0 && (
        <section>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Accepted & Active</h3>
            <div className="space-y-4">
                {incomingAccepted.map(session => {
                    const requester = getOtherUser(session.requesterId);
                    return (
                        <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex justify-between items-center opacity-75">
                            <div className="flex items-center gap-4">
                                <img src={requester?.avatar} className="w-10 h-10 rounded-xl" alt="avatar" />
                                <div>
                                    <p className="font-bold text-slate-800">{requester?.name}</p>
                                    <p className="text-xs text-slate-400">Teaching {session.skillName}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">In Progress</span>
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
