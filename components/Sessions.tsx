
import React, { useState } from 'react';
import { SessionRequest, SessionStatus, User } from '../types';

interface SessionsProps {
  sessions: SessionRequest[];
  currentUser: User;
  users: User[];
  onUpdateSession: (id: string, status: SessionStatus, rating?: number, review?: string) => void;
}

const Sessions: React.FC<SessionsProps> = ({ sessions, currentUser, users, onUpdateSession }) => {
  const [ratingModal, setRatingModal] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');

  // Outgoing requests where current user is learning
  const myLearning = sessions.filter(s => s.requesterId === currentUser.id);
  // History of completed sessions
  const myHistory = sessions.filter(s => (s.requesterId === currentUser.id || s.providerId === currentUser.id) && s.status === SessionStatus.COMPLETED);

  const getOtherUser = (id: string) => users.find(u => u.id === id);

  const SessionItem: React.FC<{ session: SessionRequest }> = ({ session }) => {
    const isProvider = session.providerId === currentUser.id;
    const otherUser = getOtherUser(isProvider ? session.requesterId : session.providerId);
    const scheduledDate = session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'Not scheduled';

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-sm">
        <div className="flex items-center gap-4 flex-1">
            <img src={otherUser?.avatar} className="w-12 h-12 rounded-xl object-cover" alt="avatar" />
            <div>
                <h4 className="font-bold text-slate-800">{isProvider ? `Teaching ${otherUser?.name}` : `Learning ${session.skillName} from ${otherUser?.name}`}</h4>
                <div className="space-y-1 mt-1">
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                      <i className="fa-regular fa-clock"></i>
                      {session.durationHours} hours • {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-indigo-500 font-bold flex items-center gap-2">
                      <i className="fa-solid fa-calendar-check"></i>
                      Scheduled: {scheduledDate}
                  </p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            {session.status === SessionStatus.PENDING && (
                <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">Waiting for Response</span>
                  <button onClick={() => onUpdateSession(session.id, SessionStatus.CANCELLED)} className="w-full md:flex-none px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-200 transition">Cancel Request</button>
                </div>
            )}

            {session.status === SessionStatus.ACCEPTED && (
                <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Active</span>
                    {!isProvider ? (
                        <button onClick={() => setRatingModal(session.id)} className="w-full md:flex-none px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg">Rate & Complete</button>
                    ) : (
                        <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold border border-indigo-100">Teaching Mode</span>
                    )}
                </div>
            )}

            {session.status === SessionStatus.COMPLETED && (
                <div className="flex flex-col items-end">
                    <span className="px-4 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">Done</span>
                    {session.rating && (
                        <div className="flex items-center text-xs mt-1 text-amber-500 font-bold">
                            <i className="fa-solid fa-star mr-1"></i> {session.rating}
                        </div>
                    )}
                </div>
            )}

            {session.status === SessionStatus.CANCELLED && (
                <span className="px-4 py-2 bg-red-50 text-red-400 rounded-xl text-sm font-bold">Cancelled</span>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <section>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <i className="fa-solid fa-graduation-cap text-indigo-500"></i>
            My Learning Path
            <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{myLearning.length}</span>
        </h2>
        <div className="space-y-4">
            {myLearning.length > 0 ? myLearning.map(s => <SessionItem key={s.id} session={s} />) : <p className="text-slate-400 italic">You haven't requested any skills yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <i className="fa-solid fa-clock-rotate-left text-indigo-500"></i>
            Session History
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{myHistory.length}</span>
        </h2>
        <div className="space-y-4">
            {myHistory.length > 0 ? myHistory.map(s => <SessionItem key={s.id} session={s} />) : <p className="text-slate-400 italic">No completed history yet.</p>}
        </div>
      </section>

      {/* Rating Modal */}
      {ratingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 space-y-8 animate-in zoom-in duration-300">
                  <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-slate-800">Rate Session</h3>
                    <p className="text-slate-500 text-sm">Reviewing your provider helps them earn community bonuses.</p>
                  </div>

                  <div className="flex justify-center gap-2">
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`transition-all ${rating >= star ? 'scale-110 text-amber-400' : 'text-slate-200'}`}
                            title={star.toString()}
                          >
                              <i className={`fa-solid ${star % 1 === 0 ? 'fa-star' : 'fa-star-half-stroke'} text-3xl`}></i>
                          </button>
                      ))}
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-indigo-600">
                        <span>Bonus Tracker</span>
                        <i className="fa-solid fa-award"></i>
                    </div>
                    {rating > 4.5 ? (
                        <p className="text-sm font-bold text-indigo-700">✨ Provider will receive <span className="bg-white px-2 py-1 rounded-lg text-indigo-600">+1.5 hrs</span> bonus!</p>
                    ) : rating > 4.0 ? (
                        <p className="text-sm font-bold text-indigo-700">💎 High quality! Provider will receive <span className="bg-white px-2 py-1 rounded-lg text-indigo-600">+4.0 hrs</span> bonus!</p>
                    ) : (
                        <p className="text-sm font-medium text-slate-400 italic">No community bonus for ratings ≤ 4.0</p>
                    )}
                  </div>

                  <textarea
                    className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                    placeholder="Tell us what you learned or how it went..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={3}
                  />

                  <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            onUpdateSession(ratingModal, SessionStatus.COMPLETED, rating, review);
                            setRatingModal(null);
                        }}
                        className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black hover:bg-slate-800 transition shadow-xl active:scale-95"
                    >
                        Award Hours & Complete
                    </button>
                    <button onClick={() => setRatingModal(null)} className="text-slate-400 font-bold text-sm hover:text-slate-600 transition">Maybe Later</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Sessions;