
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
  password?: string; // Added for permanent authentication
  bio: string;
  skills: Skill[];
  balanceHours: number;
  rating: number;
  reviewCount: number;
  location?: Location;
  isAdmin: boolean;
  avatar: string;
  isInvited: boolean;
  isPhoneVerified: boolean;
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
  scheduledAt?: number;
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

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  read: boolean;
  deletedBySender: boolean;
  deletedByReceiver: boolean;
}

export interface ChatRoom {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  sessions: SessionRequest[];
  invitations: Invitation[];
  messages: Message[];
}
