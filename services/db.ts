
import { createClient } from '@supabase/supabase-js';
import { User, SessionRequest, Invitation, AppState, SessionStatus, Skill } from '../types';

const supabaseUrl = process.env.SUPABASE_URL || 'https://qbmeqqczjgfynpbguctx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibWVxcWN6amdmeW5wYmd1Y3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjM5MzEsImV4cCI6MjA4Mzg5OTkzMX0.chqjhu0_YA_qBU8-Ueq0woJzT96nrhOgWCIuEY7CFOg';
const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  // Expose supabase client for direct access if needed (e.g. login demo)
  supabase,

  async init(): Promise<AppState> {
    // Parallelize fetches to reduce connection time significantly
    const [pRes, sRes, iRes] = await Promise.all([
      supabase.from('profiles').select('*, skills(*)'),
      supabase.from('sessions').select('*').order('timestamp', { ascending: false }),
      supabase.from('invitations').select('*').order('timestamp', { ascending: false })
    ]);

    const { data: profiles, error: pError } = pRes;
    const { data: sessions, error: sError } = sRes;
    const { data: invitations, error: iError } = iRes;

    if (pError || sError || iError) {
      console.error("Supabase Fetch Error:", { pError, sError, iError });
      return { currentUser: null, users: [], sessions: [], invitations: [] };
    }

    const users: User[] = (profiles || []).map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      bio: p.bio,
      balanceHours: p.balance_hours,
      rating: p.rating,
      reviewCount: p.review_count,
      isAdmin: p.is_admin,
      avatar: p.avatar,
      isInvited: true,
      location: p.location_lat ? { lat: p.location_lat, lng: p.location_lng } : undefined,
      skills: p.skills || []
    }));

    return {
      currentUser: null,
      users,
      sessions: (sessions || []) as SessionRequest[],
      invitations: (invitations || []) as Invitation[]
    };
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.balanceHours !== undefined) dbUpdates.balance_hours = updates.balanceHours;
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.reviewCount !== undefined) dbUpdates.review_count = updates.reviewCount;
    if (updates.location) {
        dbUpdates.location_lat = updates.location.lat;
        dbUpdates.location_lng = updates.location.lng;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select('*, skills(*)')
      .single();

    if (error) throw error;

    if (updates.skills) {
        await supabase.from('skills').delete().eq('profile_id', userId);
        const skillInserts = updates.skills.map(s => ({
            profile_id: userId,
            name: s.name,
            category: s.category,
            description: s.description
        }));
        if (skillInserts.length > 0) {
            await supabase.from('skills').insert(skillInserts);
        }
    }

    return {
      ...data,
      balanceHours: data.balance_hours,
      reviewCount: data.review_count,
      isAdmin: data.is_admin,
      skills: data.skills || []
    };
  },

  async createSession(request: SessionRequest): Promise<void> {
    const { error: sError } = await supabase.from('sessions').insert({
      requester_id: request.requesterId,
      provider_id: request.providerId,
      skill_id: request.skillId,
      skill_name: request.skillName,
      duration_hours: request.durationHours,
      status: request.status,
      timestamp: request.timestamp
    });

    if (sError) throw sError;

    const { data: profile } = await supabase
        .from('profiles')
        .select('balance_hours')
        .eq('id', request.requesterId)
        .single();

    if (profile) {
        await supabase
            .from('profiles')
            .update({ balance_hours: profile.balance_hours - request.durationHours })
            .eq('id', request.requesterId);
    }
  },

  async updateSession(sessionId: string, status: SessionStatus, rating?: number, review?: string): Promise<void> {
    const { data: session, error: fError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fError || !session) return;

    const { error: uError } = await supabase
      .from('sessions')
      .update({ status, rating, review })
      .eq('id', sessionId);

    if (uError) throw uError;

    if (status === SessionStatus.COMPLETED && rating) {
      const { data: provider } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.provider_id)
        .single();

      if (provider) {
        const bonus = session.duration_hours * (rating / 3);
        const totalEarned = session.duration_hours + bonus;
        const newReviewCount = provider.review_count + 1;
        const newRating = ((provider.rating * provider.review_count) + rating) / newReviewCount;

        await supabase
          .from('profiles')
          .update({
            balance_hours: provider.balance_hours + totalEarned,
            rating: newRating,
            review_count: newReviewCount
          })
          .eq('id', session.provider_id);
      }
    } else if (status === SessionStatus.CANCELLED) {
      const { data: requester } = await supabase
        .from('profiles')
        .select('balance_hours')
        .eq('id', session.requester_id)
        .single();

      if (requester) {
        await supabase
          .from('profiles')
          .update({ balance_hours: requester.balance_hours + session.duration_hours })
          .eq('id', session.requester_id);
      }
    }
  },

  async inviteUser(invitation: Invitation): Promise<void> {
    await supabase.from('invitations').insert({
      email_or_phone: invitation.emailOrPhone,
      invited_by: invitation.invitedBy,
      timestamp: invitation.timestamp,
      status: invitation.status
    });
  },
 async cancelInvite(id: string): Promise<void> {
    const { error } = await supabase.from('invitations').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
  }
};
