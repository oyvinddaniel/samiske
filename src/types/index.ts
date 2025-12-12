// Type definitions for samiske.no

// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'member' | 'moderator' | 'admin';
  created_at: string;
  updated_at: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  created_at: string;
}

// Post types
export type PostType = 'standard' | 'event';
export type PostVisibility = 'public' | 'members';

export interface Post {
  id: string;
  user_id: string;
  category_id: string;
  type: PostType;
  visibility: PostVisibility;
  title: string;
  content: string;
  image_url?: string;

  // Event-specific fields
  event_date?: string;
  event_time?: string;
  event_location?: string;

  created_at: string;
  updated_at: string;

  // Relations (optional, for joined queries)
  user?: User;
  category?: Category;
  comments?: Comment[];
  likes?: Like[];
  _count?: {
    comments: number;
    likes: number;
  };
}

// Comment types
export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
}

// Like types
export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

// Form types
export interface CreatePostInput {
  category_id: string;
  type: PostType;
  visibility: PostVisibility;
  title: string;
  content: string;
  image_url?: string;
  event_date?: string;
  event_time?: string;
  event_location?: string;
}

export interface CreateCommentInput {
  post_id: string;
  content: string;
}
