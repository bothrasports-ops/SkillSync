
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

  const myIncoming = sessions.filter(s => s.providerId === currentUser.id);
  const myOutgoing = sessions.filter(s => s.requesterId === currentUser.id);

  const getOtherUser = (id: string) => users.find(u => u.id === id);

  const SessionItem: React.FC<{ session: SessionRequest, isProvider: boolean }> = ({ session, isProvider }) => {
    const otherUser = getOtherUser(isProvider ? session.requesterId : session.providerId);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex items-center gap-4 flex-1">
            <img src={otherUser?.avatar} className="w-12 h-12 rounded-xl" alt="avatar" />
            <div>
                <h4 className="font-bold">{isProvider ? `Request from ${otherUser?.name}` : `Learn ${session.skillName} from ${otherUser?.name}`}</h4>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <i className="fa-regular fa-clock"></i>
                    {session.durationHours} hours requested • {new Date(session.timestamp).toLocaleDateString()}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            {session.status === SessionStatus.PENDING && (
                <>
                    {isProvider ? (
                        <>
                            <button onClick={() => onUpdateSession(session.id, SessionStatus.ACCEPTED)} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">Accept</button>
                            <button onClick={() => onUpdateSession(session.id, SessionStatus.CANCELLED)} className="flex-1 md:flex-none px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-200 transition">Decline</button>
                        </>
                    ) : (
                        <button onClick={() => onUpdateSession(session.id, SessionStatus.CANCELLED)} className="flex-1 md:flex-none px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-200 transition">Cancel Request</button>
                    )}
                </>
            )}

            {session.status === SessionStatus.ACCEPTED && (
                <>
                    {isProvider ? (
                        <button onClick={() => setRatingModal(session.id)} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition">Complete Session</button>
                    ) : (
                        <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold border border-blue-100">Session Scheduled</span>
                    )}
                </>
            )}

            {session.status === SessionStatus.COMPLETED && (
                <div className="flex flex-col items-end">
                    <span className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-sm font-bold">Completed</span>
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
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <i className="fa-solid fa-inbox text-indigo-500"></i>
            Incoming Requests
            <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{myIncoming.length}</span>
        </h2>
        <div className="space-y-4">
            {myIncoming.length > 0 ? myIncoming.map(s => <SessionItem key={s.id} session={s} isProvider={true} />) : <p className="text-slate-400 italic">No incoming requests yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <i className="fa-solid fa-paper-plane text-indigo-500"></i>
            Sent Requests
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{myOutgoing.length}</span>
        </h2>
        <div className="space-y-4">
            {myOutgoing.length > 0 ? myOutgoing.map(s => <SessionItem key={s.id} session={s} isProvider={false} />) : <p className="text-slate-400 italic">You haven't requested any skills yet.</p>}
        </div>
      </section>

      {/* Rating Modal */}
      {ratingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 space-y-6">
                  <h3 className="text-2xl font-bold text-center">Rate the Experience</h3>
                  <p className="text-center text-slate-500">Your review helps providers earn bonus hours!</p>

                  <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`text-4xl transition ${rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                          >
                              <i className="fa-solid fa-star"></i>
                          </button>
                      ))}
                  </div>

                  <textarea
                    className="w-full p-4 rounded-2xl border border-slate-200"
                    placeholder="Tell us what you learned..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    rows={3}
                  />

                  <button
                    onClick={() => {
                        onUpdateSession(ratingModal, SessionStatus.COMPLETED, rating, review);
                        setRatingModal(null);
                    }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                  >
                      Complete & Award Hours
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Sessions;
