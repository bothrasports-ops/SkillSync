export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string; // e.g., 'Education', 'Household', 'Tech'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  credits: number;
  skills: Skill[];
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  rating: number;
  reviewsCount: number;
  joinedDate: string;
}

export interface Session {
  id: string;
  providerId: string;
  consumerId: string;
  skillId: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  durationHours: number;
  createdAt: string;
  completedAt?: string;
  rating?: number;
  review?: string;
}

export interface Invitation {
  code: string;
  email: string;
  used: boolean;
  createdBy: string;
}
