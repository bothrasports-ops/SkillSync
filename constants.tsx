
import { User, SessionStatus, Skill } from './types';

export const INITIAL_HOURS = 40;

export const CATEGORIES = [
  'Programming', 'Design', 'Languages', 'Cooking', 'Music', 'Fitness', 'Marketing', 'Crafts', 'Other'
];

export const PREDEFINED_SKILLS: Record<string, string[]> = {
  'Programming': ['React Development', 'Python Scripting', 'JavaScript Basics', 'Mobile App Dev', 'Data Science', 'Web Security'],
  'Design': ['UI/UX Design', 'Graphic Design', 'Figma Mastery', 'Logo Design', 'Video Editing', '3D Modeling'],
  'Languages': ['English Conversation', 'Spanish for Beginners', 'French Tutoring', 'Mandarin Basics', 'German Practice'],
  'Cooking': ['Baking Basics', 'Italian Cuisine', 'Sushi Making', 'Vegan Cooking', 'Pastry Arts', 'Coffee Brewing'],
  'Music': ['Acoustic Guitar', 'Piano for Beginners', 'Vocal Coaching', 'Music Theory', 'DJing Basics', 'Drumming'],
  'Fitness': ['Yoga Flow', 'Personal Training', 'Pilates', 'Meditation & Mindfulness', 'HIIT Workout', 'Nutrition Coaching'],
  'Marketing': ['SEO Strategy', 'Social Media Growth', 'Content Writing', 'Email Marketing', 'Public Speaking'],
  'Crafts': ['Knitting', 'Pottery', 'Woodworking', 'Jewelry Making', 'Photography Basics'],
  'Other': ['Community Management', 'Pet Training', 'Gardening', 'Financial Planning', 'Event Organizing']
};

export const MOCK_USERS: User[] = [
  {
    id: 'admin',
    name: 'Alex Admin',
    email: 'admin@timeshare.com',
    phone: '1234567890',
    bio: 'Founding member and community manager.',
    skills: [{ id: 's1', name: 'Community Management', category: 'Other', description: 'Building great tribes.' }],
    balanceHours: 40,
    rating: 5,
    reviewCount: 0,
    isAdmin: true,
    isInvited: true,
    avatar: 'https://picsum.photos/seed/admin/200',
    location: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    phone: '0987654321',
    bio: 'Full stack developer and sushi enthusiast.',
    skills: [
        { id: 's2', name: 'React Development', category: 'Programming', description: 'Building modern web apps.' },
        { id: 's3', name: 'Sushi Making', category: 'Cooking', description: 'Traditional nigiri and rolls.' }
    ],
    balanceHours: 35,
    rating: 4.8,
    reviewCount: 12,
    isAdmin: false,
    isInvited: true,
    avatar: 'https://picsum.photos/seed/sarah/200',
    location: { lat: 40.7300, lng: -73.9352 }
  },
  {
    id: 'u2',
    name: 'Marcus Bell',
    email: 'marcus@example.com',
    phone: '5556667777',
    bio: 'Professional photographer and guitar teacher.',
    skills: [
        { id: 's4', name: 'Photography Basics', category: 'Design', description: 'Master your DSLR.' },
        { id: 's5', name: 'Acoustic Guitar', category: 'Music', description: 'Folk and blues styles.' }
    ],
    balanceHours: 42,
    rating: 4.5,
    reviewCount: 8,
    isAdmin: false,
    isInvited: true,
    avatar: 'https://picsum.photos/seed/marcus/200',
    location: { lat: 40.6782, lng: -73.9442 }
  }
];
