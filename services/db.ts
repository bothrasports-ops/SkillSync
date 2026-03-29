
import { createClient } from '@supabase/supabase-js';
import { User, SessionRequest, Invitation, AppState, SessionStatus, Skill, Message } from '../types';
import { INITIAL_HOURS } from '../constants';

const supabaseUrl = process.env.SUPABASE_URL || 'https://qbmeqqczjgfynpbguctx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibWVxcWN6amdmeW5wYmd1Y3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjM5MzEsImV4cCI6MjA4Mzg5OTkzMX0.chqjhu0_YA_qBU8-Ueq0woJzT96nrhOgWCIuEY7CFOg';
export const supabase = createClient(supabaseUrl, supabaseKey);

export const db = {
  supabase,

  async init(): Promise<AppState> {
    const [pRes, sRes, iRes, mRes] = await Promise.all([
      supabase.from('profiles').select('*, skills(*)'),
      supabase.from('sessions').select('*').order('timestamp', { ascending: false }),
      supabase.from('invitations').select('*').order('timestamp', { ascending: false }),
      supabase.from('messages').select('*').order('timestamp', { ascending: true })
    ]);

    if (pRes.error) console.error("Error fetching profiles:", pRes.error);
    const users: User[] = (pRes.data || []).map(p => this.mapProfile(p));
    const sessions: SessionRequest[] = (sRes.data || []).map(s => this.mapSession(s));
    const invitations: Invitation[] = (iRes.data || []).map(i => ({
      id: String(i.id),
      emailOrPhone: i.email_or_phone,
      invitedBy: i.invited_by,
      timestamp: i.timestamp ? new Date(i.timestamp).getTime() : Date.now(),
      status: i.status as 'pending' | 'accepted' | 'cancelled'
    }));
    const messages: Message[] = (mRes.data || []).map(m => ({
      id: String(m.id),
      senderId: String(m.sender_id),
      receiverId: String(m.receiver_id),
      text: String(m.text),
      timestamp: new Date(m.timestamp).getTime(),
      read: Boolean(m.read)
    }));

    return { currentUser: null, users, sessions, invitations, messages };
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

  async checkAccess(identifier: string): Promise<{ status: 'existing' | 'invited' | 'denied', profile?: User }> {
    const term = identifier.trim().toLowerCase();

    // Check for profile using either email or phone
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, skills(*)')
        .or(`email.eq.${term},phone.eq.${term}`)
        .maybeSingle();

    if (profile) return { status: 'existing', profile: this.mapProfile(profile) };

    // Check for invitation
    const { data: invite } = await supabase
        .from('invitations')
        .select('*')
        .eq('email_or_phone', term)
        .eq('status', 'pending')
        .maybeSingle();

    if (invite) return { status: 'invited' };

    return { status: 'denied' };
  },

  async signUp(identifier: string, data: { name: string, phone: string, bio: string, isVerified?: boolean }): Promise<User> {
    const isEmail = identifier.includes('@');
    const email = isEmail ? identifier.trim().toLowerCase() : `${data.phone}@guest.local`;
    const userId = Math.random().toString(36).substr(2, 9);

    // Check for existing duplicates
    const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .or(`email.eq.${email},phone.eq.${data.phone}`)
        .maybeSingle();

    if (existing) {
        throw new Error("Account already exists with this email or phone.");
    }

    // Insert new profile
    const { data: newProfile, error: sError } = await supabase
        .from('profiles')
        .insert({
            id: userId,
            name: data.name,
            email: email,
            phone: data.phone,
            bio: data.bio,
            balance_hours: INITIAL_HOURS,
            is_phone_verified: !!data.isVerified,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        })
        .select() // Use simple select on insert
        .single();

    if (sError) {
        console.error("Supabase Error Object:", sError);
        throw new Error(sError.message || "Database insert failed");
    }

    // Mark invitation as accepted
    await supabase.from('invitations')
        .update({ status: 'accepted' })
        .eq('email_or_phone', identifier.trim().toLowerCase());

    return this.mapProfile({ ...newProfile, skills: [] });
  },

  mapProfile(p: any): User {
    return {
      id: String(p.id),
      name: String(p.name),
      email: String(p.email || ''),
      phone: String(p.phone || ''),
      password: p.password,
      bio: String(p.bio || ''),
      balanceHours: Number(p.balance_hours),
      rating: Number(p.rating || 5),
      reviewCount: Number(p.review_count || 0),
      isAdmin: Boolean(p.is_admin),
      avatar: String(p.avatar),
      isInvited: true,
      isPhoneVerified: Boolean(p.is_phone_verified),
      location: p.location_lat ? { lat: Number(p.location_lat), lng: Number(p.location_lng) } : undefined,
      skills: p.skills || []
    };
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email.toLowerCase();
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.password !== undefined) dbUpdates.password = updates.password;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
    if (updates.balanceHours !== undefined) dbUpdates.balance_hours = Number(updates.balanceHours);
    if (updates.isPhoneVerified !== undefined) dbUpdates.is_phone_verified = Boolean(updates.isPhoneVerified);

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
    const { error: iError } = await supabase.from('sessions').insert({
      requester_id: String(request.requesterId),
      provider_id: String(request.providerId),
      skill_id: String(request.skillId),
      skill_name: String(request.skillName),
      duration_hours: Number(request.durationHours),
      status: String(request.status),
      timestamp: new Date(request.timestamp).toISOString(),
      scheduled_at: request.scheduledAt ? new Date(request.scheduledAt).toISOString() : null
    });
    if (iError) throw iError;

    const { data: profile } = await supabase.from('profiles').select('id, balance_hours').eq('id', request.requesterId).single();
    if (profile) {
        await supabase.from('profiles').update({ balance_hours: Number(profile.balance_hours) - Number(request.durationHours) }).eq('id', request.requesterId);
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

      let bonus = rating >= 5.0 ? 1.5 : (rating >= 4.0 ? 1.0 : 0);
      const totalEarned = Number(session.duration_hours) + bonus;
      const newReviewCount = Number(provider.review_count || 0) + 1;
      const oldRatingSum = Number(provider.rating || 5) * Number(provider.review_count || 0);
      const newRating = (oldRatingSum + rating) / newReviewCount;

      await supabase.from('profiles').update({
          balance_hours: Number(provider.balance_hours) + totalEarned,
          rating: newRating,
          review_count: newReviewCount
      }).eq('id', session.provider_id);
    }
  },

  async inviteUser(invite: Invitation): Promise<void> {
    const { error } = await supabase.from('invitations').insert({
        id: invite.id,
        email_or_phone: invite.emailOrPhone,
        invited_by: invite.invitedBy,
        timestamp: new Date(invite.timestamp).toISOString(),
        status: invite.status
    });
    if (error) throw error;
  },

  async cancelInvite(id: string): Promise<void> {
    const { error } = await supabase.from('invitations').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
  },

  async sendMessage(senderId: string, receiverId: string, text: string): Promise<Message> {
    const { data, error } = await supabase.from('messages').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      text: text,
      timestamp: new Date().toISOString(),
      read: false
    }).select().single();

    if (error) throw error;
    return {
      id: String(data.id),
      senderId: String(data.sender_id),
      receiverId: String(data.receiver_id),
      text: String(data.text),
      timestamp: new Date(data.timestamp).getTime(),
      read: Boolean(data.read)
    };
  },

  async markMessageAsRead(messageId: string): Promise<void> {
    await supabase.from('messages').update({ read: true }).eq('id', messageId);
  },

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) throw error;
  },

  async deleteChat(userId1: string, userId2: string): Promise<void> {
    const { error } = await supabase.from('messages')
      .delete()
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`);
    if (error) throw error;
  }
};
