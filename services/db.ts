
import { createClient } from '@supabase/supabase-js';
import { User, SessionRequest, Invitation, AppState, SessionStatus, Skill } from '../types';
import { INITIAL_HOURS } from '../constants';

const supabaseUrl = process.env.SUPABASE_URL || 'https://qbmeqqczjgfynpbguctx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFibWVxcWN6amdmeW5wYmd1Y3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjM5MzEsImV4cCI6MjA4Mzg5OTkzMX0.chqjhu0_YA_qBU8-Ueq0woJzT96nrhOgWCIuEY7CFOg';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Temporary in-memory store for OTPs for this session/demo
const otpStore = new Map<string, string>();

export const db = {
  supabase,

  async init(): Promise<AppState> {
    const [pRes, sRes, iRes] = await Promise.all([
      supabase.from('profiles').select('*, skills(*)'),
      supabase.from('sessions').select('*').order('timestamp', { ascending: false }),
      supabase.from('invitations').select('*').order('timestamp', { ascending: false })
    ]);

    const users: User[] = (pRes.data || []).map(p => this.mapProfile(p));

    return {
      currentUser: null,
      users,
      sessions: (sRes.data || []) as SessionRequest[],
      invitations: (iRes.data || []) as Invitation[]
    };
  },

  async checkAccess(email: string): Promise<{ status: 'existing' | 'invited' | 'denied', profile?: User }> {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check if profile exists
    const { data: profile } = await supabase
        .from('profiles')
        .select('*, skills(*)')
        .eq('email', trimmedEmail)
        .maybeSingle();

    if (profile) return { status: 'existing', profile: this.mapProfile(profile) };

    // 2. Check for invitation
    const { data: invite } = await supabase
        .from('invitations')
        .select('*')
        .eq('email_or_phone', trimmedEmail)
        .eq('status', 'pending')
        .maybeSingle();

    if (invite) return { status: 'invited' };

    return { status: 'denied' };
  },

  async sendOTP(email: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email.trim().toLowerCase(), otp);
    console.log(`[AUTH SERVICE] OTP for ${email}: ${otp}`);
    return new Promise(resolve => setTimeout(resolve, 800));
  },

  async verifyOTP(email: string, code: string): Promise<boolean> {
    const stored = otpStore.get(email.trim().toLowerCase());
    return stored === code;
  },

  async signUp(email: string, data: { name: string, phone: string, bio: string }): Promise<User> {
    const trimmedEmail = email.trim().toLowerCase();
    const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
            name: data.name,
            email: trimmedEmail,
            phone: data.phone,
            bio: data.bio,
            balance_hours: INITIAL_HOURS,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmedEmail}`
        })
        .select('*, skills(*)')
        .single();

    if (error) throw error;

    await supabase.from('invitations')
        .update({ status: 'accepted' })
        .eq('email_or_phone', trimmedEmail);

    return this.mapProfile(newProfile);
  },

  mapProfile(p: any): User {
    return {
      id: p.id,
      name: p.name,
      email: p.email || '',
      phone: p.phone || '',
      bio: p.bio,
      balanceHours: p.balance_hours,
      rating: p.rating,
      reviewCount: p.review_count,
      isAdmin: p.is_admin,
      avatar: p.avatar,
      isInvited: true,
      location: p.location_lat ? { lat: p.location_lat, lng: p.location_lng } : undefined,
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
    if (updates.balanceHours !== undefined) dbUpdates.balance_hours = updates.balanceHours;

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
        if (skillInserts.length > 0) await supabase.from('skills').insert(skillInserts);
    }

    return this.mapProfile(data);
  },

  async createSession(request: SessionRequest): Promise<void> {
    await supabase.from('sessions').insert({
      requester_id: request.requesterId,
      provider_id: request.providerId,
      skill_id: request.skillId,
      skill_name: request.skillName,
      duration_hours: request.durationHours,
      status: request.status,
      timestamp: request.timestamp
    });

    const { data: profile } = await supabase.from('profiles').select('balance_hours').eq('id', request.requesterId).single();
    if (profile) {
        await supabase.from('profiles').update({ balance_hours: profile.balance_hours - request.durationHours }).eq('id', request.requesterId);
    }
  },

  async updateSession(sessionId: string, status: SessionStatus, rating?: number, review?: string): Promise<void> {
    const { data: session } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    if (!session) return;

    await supabase.from('sessions').update({ status, rating, review }).eq('id', sessionId);

    if (status === SessionStatus.COMPLETED && rating) {
      const { data: provider } = await supabase.from('profiles').select('*').eq('id', session.provider_id).single();
      if (provider) {
        let bonus = 0;
        // Business logic based on prompt:
        // Rating > 4.5 -> +1.5 extra hrs
        // 4 < Rating < 4.5 -> +4 extra hrs
        if (rating > 4.5) {
          bonus = 1.5;
        } else if (rating > 4.0 && rating <= 4.5) {
          bonus = 4.0;
        }

        const totalEarned = session.duration_hours + bonus;
        await supabase.from('profiles').update({
            balance_hours: provider.balance_hours + totalEarned,
            rating: ((provider.rating * provider.review_count) + rating) / (provider.review_count + 1),
            review_count: provider.review_count + 1
          }).eq('id', session.provider_id);
      }
    } else if (status === SessionStatus.CANCELLED) {
      const { data: requester } = await supabase.from('profiles').select('balance_hours').eq('id', session.requester_id).single();
      if (requester) {
        await supabase.from('profiles').update({ balance_hours: requester.balance_hours + session.duration_hours }).eq('id', session.requester_id);
      }
    }
  },

  async inviteUser(invitation: Invitation): Promise<void> {
    await supabase.from('invitations').insert({
      email_or_phone: invitation.emailOrPhone.toLowerCase(),
      invited_by: invitation.invitedBy,
      timestamp: invitation.timestamp,
      status: invitation.status
    });
  },

  async cancelInvite(id: string): Promise<void> {
    await supabase.from('invitations').update({ status: 'cancelled' }).eq('id', id);
  }
};
