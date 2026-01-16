
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

  const myLearningActive = sessions.filter(s => s.requesterId === currentUser.id && (s.status === SessionStatus.PENDING || s.status === SessionStatus.ACCEPTED));
  const myHistory = sessions.filter(s => (s.requesterId === currentUser.id || s.providerId === currentUser.id) && (s.status === SessionStatus.COMPLETED || s.status === SessionStatus.CANCELLED));

  const getOtherUser = (id: string) => users.find(u => u.id === id);

  const SessionCard: React.FC<{ session: SessionRequest }> = ({ session }) => {
    const isProvider = session.providerId === currentUser.id;
    const otherUser = getOtherUser(isProvider ? session.requesterId : session.providerId);
    const scheduledDate = session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'Not scheduled';

    return (
      <div className={`bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center shadow-sm hover:shadow-md transition-all relative overflow-hidden ${session.status === SessionStatus.ACCEPTED ? 'border-l-8 border-l-indigo-600' : ''}`}>
        <div className="flex items-center gap-6 flex-1">
            <img src={otherUser?.avatar} className="w-20 h-20 rounded-[1.5rem] object-cover border border-slate-100 shadow-sm" alt="avatar" />
            <div className="space-y-2">
                <h4 className="font-black text-xl text-slate-800">
                    {isProvider ? `Teaching ${otherUser?.name}` : `${session.skillName} from ${otherUser?.name}`}
                </h4>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full">
                      <i className="fa-regular fa-clock"></i>
                      {session.durationHours} hours
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full">
                      <i className="fa-solid fa-calendar-check"></i>
                      {scheduledDate}
                  </div>
                </div>
            </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-slate-100">
            {session.status === SessionStatus.PENDING && (
                <div className="flex flex-col items-center md:items-end gap-3 w-full">
                  <span className="px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100">Awaiting Confirmation</span>
                  <button onClick={() => onUpdateSession(session.id, SessionStatus.CANCELLED)} className="w-full md:w-auto px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl text-xs font-black hover:bg-red-50 hover:text-red-500 transition-all active:scale-95">Retract Request</button>
                </div>
            )}

            {session.status === SessionStatus.ACCEPTED && (
                <div className="flex flex-col items-center md:items-end gap-3 w-full">
                    <span className="px-5 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                        Active Session
                    </span>
                    {!isProvider ? (
                        <button onClick={() => setRatingModal(session.id)} className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-slate-100 active:scale-95 flex items-center gap-2">
                            <i className="fa-solid fa-check-double"></i>
                            Complete & Review
                        </button>
                    ) : (
                        <p className="text-xs font-bold text-slate-400 italic">Learner will mark complete</p>
                    )}
                </div>
            )}

            {session.status === SessionStatus.COMPLETED && (
                <div className="flex flex-col items-end gap-1">
                    <span className="px-4 py-1.5 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">Completed</span>
                    {session.rating && (
                        <div className="flex items-center text-sm font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full mt-2">
                            <i className="fa-solid fa-star mr-1.5"></i> {session.rating.toFixed(1)}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-24">
      <header className="mb-12">
          <h2 className="text-4xl font-black flex items-center gap-4 text-slate-900 tracking-tight">
              <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
              My Learning Path
          </h2>
          <p className="text-slate-500 mt-3 font-medium text-lg">Your ongoing personal development and knowledge journey.</p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Current & Upcoming ({myLearningActive.length})</h3>
        </div>
        <div className="space-y-8">
            {myLearningActive.length > 0 ? myLearningActive.map(s => <SessionCard key={s.id} session={s} />) : (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
                        <i className="fa-solid fa-book-open text-2xl"></i>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active learning sessions</p>
                    <button className="mt-6 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">Explore Hub</button>
                </div>
            )}
        </div>
      </section>

      <section className="pt-12 border-t border-slate-100">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Historical Records ({myHistory.length})</h3>
        </div>
        <div className="space-y-6">
            {myHistory.length > 0 ? myHistory.map(s => <SessionCard key={s.id} session={s} />) : (
                <p className="text-slate-400 italic text-sm text-center py-10">Your skill history is currently empty.</p>
            )}
        </div>
      </section>

      {/* Rating & Completion Modal */}
      {ratingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass animate-in fade-in duration-300">
              <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl p-10 md:p-14 space-y-10 animate-in zoom-in duration-300 border border-slate-100">
                  <div className="text-center space-y-3">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Skill Mastery Feedback</h3>
                    <p className="text-slate-500 font-medium">Help your mentor earn community bonuses by sharing your experience.</p>
                  </div>

                  <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`transition-all duration-300 transform ${rating >= star ? 'scale-125 text-amber-400' : 'text-slate-100 grayscale'}`}
                          >
                              <i className="fa-solid fa-star text-4xl"></i>
                          </button>
                      ))}
                  </div>

                  <div className="bg-indigo-50/50 p-6 rounded-3xl space-y-4 border border-indigo-100/50">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Community Reward Tier</span>
                        <i className="fa-solid fa-award text-indigo-400"></i>
                    </div>
                    {rating >= 5 ? (
                        <p className="text-sm font-bold text-indigo-700 leading-snug">✨ Elite Rating! Mentor receives <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-lg ml-1 font-black">+1.5h</span> bonus credit.</p>
                    ) : rating >= 4 ? (
                        <p className="text-sm font-bold text-indigo-700 leading-snug">💎 High Quality! Mentor receives <span className="bg-indigo-400 text-white px-2 py-0.5 rounded-lg ml-1 font-black">+1.0h</span> bonus credit.</p>
                    ) : (
                        <p className="text-xs font-bold text-slate-400 italic">No community bonus awarded for mid-tier ratings.</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Write a short review</label>
                    <textarea
                        className="w-full p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-slate-700 text-sm leading-relaxed"
                        placeholder="What did you learn? How was the mentorship?"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={3}
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                        onClick={() => {
                            onUpdateSession(ratingModal, SessionStatus.COMPLETED, rating, review);
                            setRatingModal(null);
                        }}
                        className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <i className="fa-solid fa-certificate"></i>
                        Confirm Completion
                    </button>
                    <button onClick={() => setRatingModal(null)} className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest">Go back</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Sessions;
