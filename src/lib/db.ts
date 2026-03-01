import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { FoodPost, GeminiPostAnalysis } from '../types';
import { NEWARK_CENTER } from '../data/seed';

// ── Types matching Supabase schema ──
interface DBPost {
  id: string;
  restaurant_name: string;
  food_description: string;
  portions: number;
  pickup_by: string;
  condition: string;
  restaurant_address: string | null;
  claimed: boolean;
  claimed_by: string | null;
  gemini_summary: GeminiPostAnalysis | null;
  created_at: string;
}

function dbToPost(row: DBPost): FoodPost {
  return {
    id: row.id,
    restaurantName: row.restaurant_name,
    foodDescription: row.food_description,
    portions: row.portions,
    pickupBy: row.pickup_by,
    condition: row.condition as FoodPost['condition'],
    restaurantAddress: row.restaurant_address ?? '',
    restaurantLocation: NEWARK_CENTER,
    claimed: row.claimed,
    claimedBy: row.claimed_by ?? undefined,
    geminiSummary: row.gemini_summary ?? undefined,
    postedAt: new Date(row.created_at),
  };
}

// ── Hook: real-time posts feed ──
export function usePosts() {
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data.map(dbToPost));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();

    // Real-time subscription — updates instantly when anyone posts or claims
    const channel = supabase
      .channel('posts-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return { posts, loading, refetch: fetchPosts };
}

// ── Add a new post ──
export async function addPostToDb(
  post: Omit<FoodPost, 'id' | 'postedAt' | 'claimed' | 'claimedBy'>
): Promise<FoodPost | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      restaurant_name: post.restaurantName,
      food_description: post.foodDescription,
      portions: post.portions,
      pickup_by: post.pickupBy,
      condition: post.condition,
      restaurant_address: post.restaurantAddress,
      gemini_summary: post.geminiSummary ?? null,
      claimed: false,
    })
    .select()
    .single();

  if (error) { console.error('Insert error:', error); return null; }
  return dbToPost(data as DBPost);
}

// ── Claim a post ──
export async function claimPostInDb(id: string, claimedBy: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .update({ claimed: true, claimed_by: claimedBy })
    .eq('id', id);

  if (error) { console.error('Claim error:', error); return false; }
  return true;
}

// ── Save volunteer signup ──
export async function saveVolunteer(volunteer: {
  firstName: string;
  lastName: string;
  phone: string;
  vehicle: string;
  maxDistanceMiles: number;
  availability: string[];
}): Promise<boolean> {
  const { error } = await supabase
    .from('volunteers')
    .insert({
      first_name: volunteer.firstName,
      last_name: volunteer.lastName,
      phone: volunteer.phone,
      vehicle: volunteer.vehicle,
      max_distance_miles: volunteer.maxDistanceMiles,
      availability: volunteer.availability,
    });

  if (error) { console.error('Volunteer insert error:', error); return false; }
  return true;
}