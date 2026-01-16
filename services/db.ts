
import { createClient } from '@supabase/supabase-js';
import { User, SessionRequest, Invitation, AppState, SessionStatus, Skill } from '../types';
import { INITIAL_HOURS } from '../constants';

const supabaseUrl = process.env.SUPABASE_URL || 'https://qbmeqqczjgfynpbguctx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibWVxcWN6amdmeW5wYmd1Y3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjM5MzEsImV4cCI6MjA4Mzg5OTkzMX0.chqjhu0_YA_qBU8-Ueq0woJzT96nrhOgWCIuEY7CFOg';
export const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  supabase,

  async init(): Promise<AppState> {
    const [pRes, sRes, iRes] = await Promise.all([
      supabase.from('profiles').select('*, skills(*)'),
      supabase.from('sessions').select('*').order('timestamp', { ascending: false }),
      supabase.from('invitations').select('*').order('timestamp', { ascending: false })
    ]);

    if (pRes.error) console.error("Error fetching profiles:", pRes.error);
    if (sRes.error) console.error("Error fetching sessions:", sRes.error);
    if (iRes.error) console.error("Error fetching invitations:", iRes.error);

    const users: User[] = (pRes.data || []).map(p => this.mapProfile(p));
    const sessions: SessionRequest[] = (sRes.data || []).map(s => this.mapSession(s));

    const invitations: Invitation[] = (iRes.data || []).map(i => ({
      id: String(i.id),
      emailOrPhone: i.email_or_phone,
      invitedBy: i.invited_by,
      timestamp: i.timestamp ? new Date(i.timestamp).getTime() : Date.now(),
      status: i.status as 'pending' | 'accepted' | 'cancelled'
    }));

    return {
      currentUser: null,
      users,
      sessions,
      invitations
    };
  },

  mapSession(s: any): SessionRequest {
    return {
      id: String(s.id),
      requesterId: String(s.requester_id),
      providerId: String(s.provider_id),
      skillId: String(s.skill_id),
      skillName: String(s.skill_name),
      durationHours: Number(s.duration_hours),
      status: s.status as SessionStatus,
      timestamp: s.timestamp ? new Date(s.timestamp).getTime() : Date.now(),
      scheduledAt: s.scheduled_at ? new Date(s.scheduled_at).getTime() : undefined,
      rating: s.rating ? Number(s.rating) : undefined,
      review: s.review ? String(s.review) : undefined
    };
  },

  async checkAccess(email: string): Promise<{ status: 'existing' | 'invited' | 'denied', profile?: User }> {
    const trimmedEmail = email.trim().toLowerCase();

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, skills(*)')
        .eq('email', trimmedEmail)
        .maybeSingle();

    if (profile) return { status: 'existing', profile: this.mapProfile(profile) };

    const { data: invite } = await supabase
        .from('invitations')
        .select('*')
        .eq('email_or_phone', trimmedEmail)
        .eq('status', 'pending')
        .maybeSingle();

    if (invite) return { status: 'invited' };

    return { status: 'denied' };
  },

  async signUp(email: string, data: { name: string, phone: string, bio: string }): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();
    const userId = Math.random().toString(36).substr(2, 9);

    const { data: newProfile, error: sError } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            name: data.name,
            email: trimmedEmail,
            phone: data.phone,
            bio: data.bio,
            balance_hours: INITIAL_HOURS,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedEmail}`
        })
        .select('*, skills(*)')
        .single();

    if (sError) throw sError;

    await supabase.from('invitations')
        .update({ status: 'accepted' })
        .eq('email_or_phone', trimmedEmail);

    return this.mapProfile(newProfile);
  },

  mapProfile(p: any): User {
    return {
      id: String(p.id),
      name: String(p.name),
      email: String(p.email || ''),
      phone: String(p.phone || ''),
      bio: String(p.bio || ''),
      balanceHours: Number(p.balance_hours),
      rating: Number(p.rating || 5),
      reviewCount: Number(p.review_count || 0),
      isAdmin: Boolean(p.is_admin),
      avatar: String(p.avatar),
      isInvited: true,
      location: p.location_lat ? { lat: Number(p.location_lat), lng: Number(p.location_lng) } : undefined,
      skills: p.skills || []
    };
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email.toLowerCase();
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.balanceHours !== undefined) dbUpdates.balance_hours = Number(updates.balanceHours);

    const { data, error: uError } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', userId)
      .select('*, skills(*)')
      .single();

    if (uError) throw uError;

    if (updates.skills) {
        await supabase.from('skills').delete().eq('profile_id', userId);
        const skillInserts = updates.skills.map(s => ({
            id: Math.random().toString(36).substr(2, 9),
            profile_id: userId,
            name: s.name,
            category: s.category,
            description: s.description
        }));
        if (skillInserts.length > 0) {
            await supabase.from('skills').insert(skillInserts);
        }
    }

    return this.mapProfile(data);
  },

  async createSession(request: SessionRequest): Promise<void> {
    const sessionToInsert = {
      requester_id: String(request.requesterId),
      provider_id: String(request.providerId),
      skill_id: String(request.skillId),
      skill_name: String(request.skillName),
      duration_hours: Number(request.durationHours),
      status: String(request.status),
      timestamp: new Date(request.timestamp).toISOString(),
      scheduled_at: request.scheduledAt ? new Date(request.scheduledAt).toISOString() : null
    };

    const { error: iError } = await supabase.from('sessions').insert(sessionToInsert);

    if (iError) {
      console.error("Supabase Session Insert Details:", {
        error: iError,
        dataSent: sessionToInsert
      });
      // Friendly message for Foreign Key errors
      if (iError.code === '23503') {
          throw new Error("One of the users involved in this request does not exist in the database profiles table.");
      }
      throw new Error(iError.message || "Database insert failed. Check your console for details.");
    }

    // Deduct Balance
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, balance_hours')
        .eq('id', request.requesterId)
        .single();

    if (profile) {
        await supabase
            .from('profiles')
            .update({ balance_hours: Number(profile.balance_hours) - Number(request.durationHours) })
            .eq('id', request.requesterId);
    }
  },

  async updateSession(sessionId: string, status: SessionStatus, rating?: number, review?: string): Promise<void> {
    const { data: session, error: sError } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    if (sError || !session) throw new Error("Session not found");

    const { error: uError } = await supabase.from('sessions').update({ status, rating, review }).eq('id', sessionId);
    if (uError) throw uError;

    if (status === SessionStatus.COMPLETED && rating) {
      const { data: provider, error: pError } = await supabase.from('profiles').select('*').eq('id', session.provider_id).single();
      if (pError || !provider) throw new Error("Provider not found");

      let bonus = 0;
      if (rating >= 5.0) bonus = 1.5;
      else if (rating >= 4.0) bonus = 1.0;

      const totalEarned = Number(session.duration_hours) + bonus;
      const newReviewCount = Number(provider.review_count) + 1;
      const newRating = ((Number(provider.rating) * Number(provider.review_count)) + Number(rating)) / newReviewCount;

      await supabase.from('profiles').update({
          balance_hours: Number(provider.balance_hours) + totalEarned,
          rating: newRating,
          review_count: newReviewCount
      }).eq('id', session.provider_id);

    } else if (status === SessionStatus.CANCELLED) {
      const { data: requester } = await supabase.from('profiles').select('id, balance_hours').eq('id', session.requester_id).single();
      if (requester) {
        await supabase.from('profiles').update({ balance_hours: Number(requester.balance_hours) + Number(session.duration_hours) }).eq('id', session.requester_id);
      }
    }
  },

  async inviteUser(invitation: Invitation): Promise<void> {
    await supabase.from('invitations').insert({
      id: String(invitation.id),
      email_or_phone: String(invitation.emailOrPhone).toLowerCase(),
      invited_by: String(invitation.invitedBy).toLowerCase(),
      timestamp: new Date(invitation.timestamp).toISOString(),
      status: String(invitation.status)
    });
  },

  async cancelInvite(id: string): Promise<void> {
    await supabase.from('invitations').update({ status: 'cancelled' }).eq('id', id);
  }
};
