
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session, Invitation, UserRole, Skill } from './types';
import { generateId, generateInviteCode } from './utils';

// Keys for localStorage
const STORAGE_KEYS = {
  USERS: 'skillsync_users',
  SESSIONS: 'skillsync_sessions',
  INVITATIONS: 'skillsync_invitations',
  CURRENT_USER: 'skillsync_current_user'
};

// Mock Data (Initial State if storage is empty)
const MOCK_SKILLS: Skill[] = [
  { id: 's1', name: 'Plumbing', description: 'Can fix leaky faucets and basic pipe issues', category: 'Household' },
  { id: 's2', name: 'React Tutoring', description: 'Senior dev teaching basics to advanced React', category: 'Education' },
  { id: 's3', name: 'Gardening', description: 'Help with weeding and planting', category: 'Household' },
  { id: 's4', name: 'Guitar Lessons', description: 'Acoustic guitar basics', category: 'Arts' },
];

const INITIAL_USERS: User[] = [
  {
    id: 'admin1',
    name: 'Admin Alice',
    email: 'alice@skillsync.com',
    avatar: 'https://picsum.photos/seed/alice/200/200',
    role: UserRole.ADMIN,
    credits: 40,
    skills: [MOCK_SKILLS[1]],
    location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
    rating: 5.0,
    reviewsCount: 10,
    joinedDate: '2023-01-01'
  },
  {
    id: 'user1',
    name: 'Bob Builder',
    email: 'bob@example.com',
    avatar: 'https://picsum.photos/seed/bob/200/200',
    role: UserRole.USER,
    credits: 40,
    skills: [MOCK_SKILLS[0], MOCK_SKILLS[2]],
    location: { lat: 40.7328, lng: -74.0260, address: 'Hoboken, NJ' },
    rating: 4.8,
    reviewsCount: 5,
    joinedDate: '2023-02-15'
  }
];

const INITIAL_INVITES: Invitation[] = [
  { code: 'WELCOME2024', email: 'guest@example.com', used: false, createdBy: 'admin1' }
];

interface AppState {
  currentUser: User | null;
  users: User[];
  sessions: Session[];
  invitations: Invitation[];
  login: (email: string) => void;
  logout: () => void;
  register: (name: string, email: string, inviteCode: string) => boolean;
  createInvitation: (email: string) => string;
  requestSession: (providerId: string, skillId: string, duration: number) => void;
  acceptSession: (sessionId: string) => void;
  cancelSession: (sessionId: string) => void;
  completeSession: (sessionId: string, rating: number, review: string) => void;
  updateUserLocation: (lat: number, lng: number) => void;
  addSkill: (name: string, description: string, category: string) => void;
  updateUserProfile: (name: string, address: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : [];
  });

  const [invitations, setInvitations] = useState<Invitation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    return saved ? JSON.parse(saved) : INITIAL_INVITES;
  });

  // Sync with localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
  }, [invitations]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  const login = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) setCurrentUser(user);
  };

  const logout = () => setCurrentUser(null);

  const register = (name: string, email: string, inviteCode: string): boolean => {
    const invite = invitations.find(i => i.code === inviteCode && !i.used);
    if (!invite) return false;

    const newUser: User = {
      id: generateId(),
      name,
      email,
      avatar: `https://picsum.photos/seed/${name}/200/200`,
      role: UserRole.USER,
      credits: 40,
      skills: [],
      location: { lat: 40.7128, lng: -74.0060 },
      rating: 0,
      reviewsCount: 0,
      joinedDate: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    setInvitations(prev => prev.map(i => i.code === inviteCode ? { ...i, used: true } : i));
    setCurrentUser(newUser);
    return true;
  };

  const createInvitation = (email: string) => {
    const code = generateInviteCode();
    const newInvite = { code, email, used: false, createdBy: currentUser?.id || 'admin' };
    setInvitations(prev => [...prev, newInvite]);
    return code;
  };

  const requestSession = (providerId: string, skillId: string, duration: number) => {
    if (!currentUser) return;

    if (currentUser.credits < duration) {
        alert("Not enough credits!");
        return;
    }

    const newSession: Session = {
      id: generateId(),
      providerId,
      consumerId: currentUser.id,
      skillId,
      status: 'PENDING',
      durationHours: duration,
      createdAt: new Date().toISOString()
    };

    // Update global users list
    setUsers(prev => prev.map(u =>
        u.id === currentUser.id ? { ...u, credits: u.credits - duration } : u
    ));
    // Update local session user
    setCurrentUser(prev => prev ? { ...prev, credits: prev.credits - duration } : null);
    setSessions(prev => [...prev, newSession]);
  };

  const acceptSession = (sessionId: string) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, status: 'ACCEPTED' } : s
    ));
  };

  const cancelSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.status === 'COMPLETED' || session.status === 'CANCELLED') return;

    setUsers(prev => prev.map(u => {
      if (u.id === session.consumerId) {
        return { ...u, credits: u.credits + session.durationHours };
      }
      return u;
    }));

    if (currentUser?.id === session.consumerId) {
      setCurrentUser(prev => prev ? { ...prev, credits: prev.credits + session.durationHours } : null);
    }

    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, status: 'CANCELLED' } : s
    ));
  };

  const completeSession = (sessionId: string, rating: number, review: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const bonus = rating >= 4.5 ? session.durationHours * 0.5 : 0;
    const totalEarned = session.durationHours + bonus;

    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, status: 'COMPLETED', rating, review, completedAt: new Date().toISOString() } : s
    ));

    setUsers(prev => prev.map(u => {
      if (u.id === session.providerId) {
        const newReviewCount = u.reviewsCount + 1;
        const newRating = ((u.rating * u.reviewsCount) + rating) / newReviewCount;
        return {
          ...u,
          credits: u.credits + totalEarned,
          rating: Number(newRating.toFixed(1)),
          reviewsCount: newReviewCount
        };
      }
      return u;
    }));

    if (currentUser?.id === session.providerId) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const newReviewCount = prev.reviewsCount + 1;
        const newRating = ((prev.rating * prev.reviewsCount) + rating) / newReviewCount;
        return {
          ...prev,
          credits: prev.credits + totalEarned,
          rating: Number(newRating.toFixed(1)),
          reviewsCount: newReviewCount
        };
      });
    }
  };

  const updateUserLocation = (lat: number, lng: number) => {
    if (currentUser) {
        const updated = { ...currentUser, location: { ...currentUser.location, lat, lng } };
        setCurrentUser(updated);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    }
  };

  const addSkill = (name: string, description: string, category: string) => {
    if (!currentUser) return;
    const newSkill: Skill = {
        id: generateId(),
        name,
        description,
        category
    };
    const updatedUser = { ...currentUser, skills: [...currentUser.skills, newSkill] };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  const updateUserProfile = (name: string, address: string) => {
    if (!currentUser) return;
    const updatedUser = {
        ...currentUser,
        name,
        location: { ...currentUser.location, address }
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, sessions, invitations,
      login, logout, register, createInvitation, requestSession, acceptSession, cancelSession, completeSession, updateUserLocation, addSkill, updateUserProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
