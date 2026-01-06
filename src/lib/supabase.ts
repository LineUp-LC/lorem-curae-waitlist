import { createClient } from '@supabase/supabase-js';

// Environment variables from Vite
// In development, these come from .env file
// In production, these should be set in your hosting platform (Vercel, Netlify, etc.)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging (remove in production)
if (import.meta.env.DEV) {
  console.log('Supabase URL defined:', !!supabaseUrl);
  console.log('Supabase Anon Key defined:', !!supabaseAnonKey);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'defined' : 'undefined');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'defined' : 'undefined');
  console.error('');
  console.error('Please ensure:');
  console.error('1. You have a .env file in the project root');
  console.error('2. The .env file contains:');
  console.error('   VITE_SUPABASE_URL=your_supabase_url');
  console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('3. You have restarted the Vite dev server after adding/modifying .env');
  throw new Error('Missing Supabase environment variables. Check console for details.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Types
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'plus' | 'premium';
  created_at: string;
  updated_at: string;
  profile_theme?: string;
  profile_layout?: string;
  show_badges?: boolean;
  show_routines?: boolean;
  show_communities?: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  cover_image: string;
  member_count: number;
  post_count: number;
  created_by: string;
  created_at: string;
  rules?: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface CommunityPost {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_profile?: UserProfile;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_communities: number;
  can_create_communities: boolean;
  storage_limit_mb: number;
  marketplace_discount: number;
  cashback_percentage: number;
}

export interface DataImpactContribution {
  id: string;
  user_id: string;
  opted_in: boolean;
  contribution_count: number;
  last_contribution_at?: string;
  created_at: string;
}

export interface MarketplaceStorefront {
  id: string;
  seller_name: string;
  description: string;
  logo_url?: string;
  tier: 'standard' | 'premium';
  transaction_fee_percentage: number;
  monthly_gmv: number;
  created_at: string;
}

export interface MarketplaceTransaction {
  id: string;
  storefront_id: string;
  user_id: string;
  amount: number;
  fee_amount: number;
  status: 'pending' | 'completed' | 'refunded';
  created_at: string;
}

export interface AffiliateTransaction {
  id: string;
  user_id: string;
  brand_name: string;
  amount: number;
  commission_percentage: number;
  cashback_amount: number;
  status: 'pending' | 'completed';
  created_at: string;
}