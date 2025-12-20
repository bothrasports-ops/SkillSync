import React from 'react';
import { Session, User } from '../types';
import { Star, MessageSquare } from 'lucide-react';

interface UserReviewsProps {
  userId: string;
  sessions: Session[];
  users: User[];
}

export const UserReviews: React.FC<UserReviewsProps> = ({ userId, sessions, users }) => {
  const reviews = sessions
    .filter(s => s.providerId === userId && s.status === 'COMPLETED' && s.rating)
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
        <p>No reviews yet. Be the first to help them earn one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map(review => {
        const reviewer = users.find(u => u.id === review.consumerId);
        return (
          <div key={review.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <img
                  src={reviewer?.avatar || `https://picsum.photos/seed/${review.consumerId}/50/50`}
                  alt={reviewer?.name}
                  className="w-8 h-8 rounded-full border border-gray-100"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{reviewer?.name || 'Anonymous'}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">
                    {new Date(review.completedAt!).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex text-yellow-400">
                {'★'.repeat(review.rating!)}
                <span className="text-gray-200">{'★'.repeat(5 - review.rating!)}</span>
              </div>
            </div>
            {review.review && (
              <p className="text-sm text-gray-600 leading-relaxed italic">
                "{review.review}"
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
