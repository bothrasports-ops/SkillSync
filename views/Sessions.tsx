import React, { useState } from 'react';
import { useApp } from '../store';
import { Session } from '../types';
import { Clock, CheckCircle, XCircle, Check, Trash2 } from 'lucide-react';

export const Sessions: React.FC = () => {
  const { currentUser, sessions, users, completeSession, acceptSession, cancelSession } = useApp();
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const mySessions = sessions.filter(
    s => s.consumerId === currentUser?.id || s.providerId === currentUser?.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleComplete = (sessionId: string) => {
    completeSession(sessionId, rating, review);
    setSelectedSession(null);
    setReview('');
    setRating(5);
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Your Sessions</h2>
      
      <div className="space-y-4">
        {mySessions.map(session => {
          const isProvider = session.providerId === currentUser.id;
          const otherUser = users.find(u => u.id === (isProvider ? session.consumerId : session.providerId));
          const providerUser = users.find(u => u.id === session.providerId);
          const skillName = providerUser?.skills.find(s => s.id === session.skillId)?.name || 'Help';

          const statusColors: Record<string, string> = {
            'PENDING': 'bg-yellow-100 text-yellow-700',
            'ACCEPTED': 'bg-indigo-100 text-indigo-700',
            'COMPLETED': 'bg-green-100 text-green-700',
            'CANCELLED': 'bg-red-100 text-red-700'
          };

          return (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isProvider ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isProvider ? 'Service' : 'Request'}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{skillName}</h3>
                        <p className="text-sm text-gray-500">
                            {isProvider ? 'Helping ' : 'Help from '} 
                            <span className="font-medium text-gray-900">{otherUser?.name}</span>
                        </p>
                    </div>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusColors[session.status]}`}>
                    {session.status}
                 </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{session.durationHours} hours</span>
                </div>
                <div className="flex items-center gap-1">
                    <span>•</span>
                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-2">
                {/* Provider View */}
                {isProvider && session.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => acceptSession(session.id)}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> Accept
                    </button>
                    <button 
                      onClick={() => cancelSession(session.id)}
                      className="flex-1 bg-white text-red-600 border border-red-100 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} /> Decline
                    </button>
                  </div>
                )}

                {/* Consumer View */}
                {!isProvider && session.status === 'PENDING' && (
                  <button 
                    onClick={() => cancelSession(session.id)}
                    className="w-full bg-white text-gray-500 border border-gray-200 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> Cancel Request
                  </button>
                )}

                {!isProvider && session.status === 'ACCEPTED' && (
                  <div>
                    {selectedSession === session.id ? (
                      <div className="bg-indigo-50 p-4 rounded-lg space-y-3 animate-fade-in border border-indigo-100">
                          <h4 className="font-semibold text-indigo-900">Rate this session</h4>
                          <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                  <button 
                                      key={star}
                                      onClick={() => setRating(star)}
                                      className={`text-2xl focus:outline-none transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  >
                                      ★
                                  </button>
                              ))}
                          </div>
                          <textarea
                              value={review}
                              onChange={e => setReview(e.target.value)}
                              placeholder="How was the experience?"
                              className="w-full p-2 rounded border border-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                          <div className="flex gap-2">
                              <button 
                                  onClick={() => handleComplete(session.id)}
                                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
                              >
                                  Submit & Complete
                              </button>
                              <button 
                                  onClick={() => setSelectedSession(null)}
                                  className="bg-white text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100"
                              >
                                  Back
                              </button>
                          </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                            onClick={() => setSelectedSession(session.id)}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Complete Session
                        </button>
                        <button 
                          onClick={() => cancelSession(session.id)}
                          className="bg-white text-red-500 border border-red-50 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Cancel Session"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {isProvider && session.status === 'ACCEPTED' && (
                  <div className="text-center py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg">
                    Session In Progress... Waiting for completion.
                  </div>
                )}

                {session.status === 'COMPLETED' && session.rating && (
                  <div className="border-t border-gray-100 pt-3 mt-1">
                      <div className="flex items-center gap-1 mb-1">
                          <span className="text-yellow-400">{'★'.repeat(Math.round(session.rating))}</span>
                          <span className="text-gray-200">{'★'.repeat(5 - Math.round(session.rating))}</span>
                      </div>
                      {session.review && <p className="text-sm text-gray-600 italic">"{session.review}"</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {mySessions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <Clock size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No session history yet.</p>
            </div>
        )}
      </div>
    </div>
  );
};
