
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session, Invitation, UserRole, Skill } from './types';
import { generateId, generateInviteCode } from './utils';
import { supabase, testConnection, isSupabaseConfigured } from './supabase';

interface AppState {
  currentUser: User | null;
  users: User[];
  sessions: Session[];
  invitations: Invitation[];
  isLoading: boolean;
  dbStatus: 'connecting' | 'connected' | 'error';
  dbErrorMessage: string | null;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, inviteCode: string) => Promise<{success: boolean, message?: string}>;
  createInvitation: (email: string) => Promise<string | null>;
  requestSession: (providerId: string, skillId: string, duration: number) => Promise<void>;
  acceptSession: (sessionId: string) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  completeSession: (sessionId: string, rating: number, review: string) => Promise<void>;
  updateUserLocation: (lat: number, lng: number) => Promise<void>;
  addSkill: (name: string, description: string, category: string) => Promise<void>;
  updateUserProfile: (name: string, address: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [dbErrorMessage, setDbErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // 1. Check Connection First
      const connection = await testConnection();
      if (connection.success) {
        setDbStatus('connected');
        setDbErrorMessage(null);
      } else {
        setDbStatus('error');
        setDbErrorMessage(connection.message || 'Unknown database error');
        console.warn("Database initialization failed:", connection.message);
      }

      try {
        if (connection.success) {
            const storedUser = localStorage.getItem('skillsync_user_session');
            if (storedUser) {
              const parsed = JSON.parse(storedUser);
              const success = await login(parsed.email);
              if (!success) {
                localStorage.removeItem('skillsync_user_session');
              }
            }
            await refreshData();
        }
      } catch (e) {
        console.error("Initial load failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const refreshData = async () => {
    if (!isSupabaseConfigured() || !supabase) return;

    try {
        const { data: userData } = await supabase.from('users').select('*');
        const { data: sessionData } = await supabase.from('sessions').select('*');
        const { data: inviteData } = await supabase.from('invitations').select('*');
        const { data: skillData } = await supabase.from('skills').select('*');

        if (userData) {
          const usersWithSkills = userData.map(u => ({
            ...u,
            skills: skillData?.filter(s => s.user_id === u.id) || []
          }));
          setUsers(usersWithSkills as User[]);

          if (currentUser) {
            const updatedMe = usersWithSkills.find(u => u.id === currentUser.id);
            if (updatedMe) setCurrentUser(updatedMe as User);
          }
        }
        if (sessionData) setSessions(sessionData as Session[]);
        if (inviteData) setInvitations(inviteData as Invitation[]);
    } catch (e) {
        console.error("Refresh data failed", e);
    }
  };

  const login = async (email: string): Promise<boolean> => {
    if (!supabase) return false;
    setIsLoading(true);
    try {
        const { data, error } = await supabase
          .from('users')
          .select('*, skills(*)')
          .eq('email', email.toLowerCase().trim())
          .single();

        if (data && !error) {
          setCurrentUser(data as User);
          localStorage.setItem('skillsync_user_session', JSON.stringify({ email: data.email }));
          await refreshData();
          return true;
        }
    } catch (e) {
        console.error("Login attempt failed", e);
    } finally {
        setIsLoading(false);
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('skillsync_user_session');
  };

  const register = async (name: string, email: string, inviteCode: string): Promise<{success: boolean, message?: string}> => {
    if (!supabase) return { success: false, message: "Database not available." };
    setIsLoading(true);

    try {
      // 1. Validate Invitation
      const { data: invite, error: inviteErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('code', inviteCode.trim().toUpperCase())
        .eq('used', false)
        .single();

      if (inviteErr) {
        console.error("Invitation check error:", inviteErr);
        setIsLoading(false);
        return { success: false, message: `Could not verify code: ${inviteErr.message}` };
      }

      if (!invite) {
        setIsLoading(false);
        return { success: false, message: "Invitation code not found or already used." };
      }

      // 2. Create User (Database uses snake_case)
      const newUser = {
        id: generateId(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        avatar: `https://picsum.photos/seed/${encodeURIComponent(name)}/200/200`,
        role: UserRole.USER,
        credits: 40,
        location: { lat: 40.7128, lng: -74.0060, address: "Community Center" },
        rating: 5.0,
        reviews_count: 0,
        joined_date: new Date().toISOString()
      };

      const { error: userError } = await supabase.from('users').insert([newUser]);
      if (userError) {
        console.error("User creation error:", userError);
        setIsLoading(false);
        return { success: false, message: `Registration failed: ${userError.message}` };
      }

      // 3. Mark Invite Used
      await supabase.from('invitations').update({ used: true }).eq('code', inviteCode.toUpperCase());

      const loggedIn = await login(email);
      return { success: loggedIn };
    } catch (e: any) {
      console.error("Registration critical failure:", e);
      setIsLoading(false);
      return { success: false, message: e.message || "An unexpected error occurred." };
    }
  };

  const createInvitation = async (email: string) => {
    if (!currentUser || !supabase) return null;
    const code = generateInviteCode();
    const newInvite = { code, email: email.toLowerCase(), used: false, created_by: currentUser.id };
    const { error } = await supabase.from('invitations').insert([newInvite]);
    if (!error) {
      await refreshData();
      return code;
    }
    return null;
  };

  const requestSession = async (providerId: string, skillId: string, duration: number) => {
    if (!currentUser || !supabase || currentUser.credits < duration) return;

    const newSession = {
      id: generateId(),
      provider_id: providerId,
      consumer_id: currentUser.id,
      skill_id: skillId,
      status: 'PENDING',
      duration_hours: duration,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('sessions').insert([newSession]);
    if (!error) {
      await supabase.from('users').update({ credits: currentUser.credits - duration }).eq('id', currentUser.id);
      await refreshData();
    }
  };

  const acceptSession = async (sessionId: string) => {
    if (!supabase) return;
    await supabase.from('sessions').update({ status: 'ACCEPTED' }).eq('id', sessionId);
    await refreshData();
  };

  const cancelSession = async (sessionId: string) => {
    if (!supabase) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    await supabase.from('sessions').update({ status: 'CANCELLED' }).eq('id', sessionId);

    const { data: consumer } = await supabase.from('users').select('credits').eq('id', session.consumer_id).single();
    if (consumer) {
      await supabase.from('users').update({ credits: consumer.credits + session.duration_hours }).eq('id', session.consumer_id);
    }
    await refreshData();
  };

  const completeSession = async (sessionId: string, rating: number, review: string) => {
    if (!supabase) return;
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    await supabase.from('sessions').update({
      status: 'COMPLETED',
      rating,
      review,
      completed_at: new Date().toISOString()
    }).eq('id', sessionId);

    const { data: provider } = await supabase.from('users').select('*').eq('id', session.provider_id).single();
    if (provider) {
      const bonus = rating >= 4.5 ? session.duration_hours * 0.5 : 0;
      const totalEarned = session.duration_hours + bonus;
      const newReviewCount = provider.reviews_count + 1;
      const newRating = ((provider.rating * provider.reviews_count) + rating) / newReviewCount;

      await supabase.from('users').update({
        credits: provider.credits + totalEarned,
        rating: Number(newRating.toFixed(1)),
        reviews_count: newReviewCount
      }).eq('id', session.provider_id);
    }
    await refreshData();
  };

  const updateUserLocation = async (lat: number, lng: number) => {
    if (!currentUser || !supabase) return;
    await supabase.from('users').update({ location: { ...currentUser.location, lat, lng } }).eq('id', currentUser.id);
    await refreshData();
  };

  const addSkill = async (name: string, description: string, category: string) => {
    if (!currentUser || !supabase) return;
    const newSkill = { user_id: currentUser.id, name, description, category };
    await supabase.from('skills').insert([newSkill]);
    await refreshData();
  };

  const updateUserProfile = async (name: string, address: string) => {
    if (!currentUser || !supabase) return;
    await supabase.from('users').update({ name, location: { ...currentUser.location, address } }).eq('id', currentUser.id);
    await refreshData();
  };

  return (
    <AppContext.Provider value={{
      currentUser, users, sessions, invitations, isLoading, dbStatus, dbErrorMessage,
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
