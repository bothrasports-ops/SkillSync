
export enum SessionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Location {
  lat: number;
  lng: number;
  name?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  bio: string;
  skills: Skill[];
  balanceHours: number;
  rating: number;
  reviewCount: number;
  location?: Location;
  isAdmin: boolean;
  avatar: string;
  isInvited: boolean;
}

export interface SessionRequest {
  id: string;
  requesterId: string;
  providerId: string;
  skillId: string;
  skillName: string;
  durationHours: number;
  status: SessionStatus;
  timestamp: number;
  rating?: number;
  review?: string;
}

export interface Invitation {
  id: string;
  emailOrPhone: string;
  invitedBy: string;
  timestamp: number;
  status: 'pending' | 'accepted' | 'cancelled';
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  sessions: SessionRequest[];
  invitations: Invitation[];
}