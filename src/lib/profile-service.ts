import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl } from './storage';
import { getAvatarUrl } from './avatar';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  country_code: string;
  phone: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  links: Array<{ label: string; url: string }>;
}

export interface UpdateProfileData {
  full_name?: string;
  username?: string;
  bio?: string | null;
  website?: string | null;
  links?: Array<{ label: string; url: string }>;
  avatar_url?: string | null;
}

/**
 * Fetch the current user's profile.
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as Profile | null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to load profile';
    toast.error(message);
    return null;
  }
}

/**
 * Update the user's profile.
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileData,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating profile:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update profile';
    toast.error(message);
    return false;
  }
}

/**
 * Upload an avatar for the user.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return null;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) throw error;
    return path;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    const message =
      error instanceof Error ? error.message : 'Upload failed';
    toast.error(message);
    return null;
  }
}

/**
 * Get the display avatar URL for a profile.
 */
export async function getProfileAvatarUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null;
  return await getAvatarUrl(avatarPath);
}

/**
 * Fetch all posts for a user with their media URLs.
 */
export async function fetchUserPosts(userId: string) {
  try {
    const { data, count, error } = await supabase
      .from('posts')
      .select('id,media_path,media_type', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const photos = (data ?? [])
      .filter((p) => p.media_type === 'image' && p.media_path)
      .map((p) => ({ id: p.id, path: p.media_path }));

    const videos = (data ?? [])
      .filter((p) => p.media_type === 'video' && p.media_path)
      .map((p) => ({ id: p.id, path: p.media_path }));

    // Resolve signed URLs in parallel
    const [resolvedPhotos, resolvedVideos] = await Promise.all([
      Promise.all(
        photos.map(async (p) => ({
          id: p.id,
          url: (await getSignedUrl('post-media', p.path)) ?? '',
        })),
      ),
      Promise.all(
        videos.map(async (v) => ({
          id: v.id,
          url: (await getSignedUrl('post-media', v.path)) ?? '',
        })),
      ),
    ]);

    return {
      postCount: count ?? 0,
      photos: resolvedPhotos.filter((p) => p.url),
      videos: resolvedVideos.filter((v) => v.url),
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      postCount: 0,
      photos: [],
      videos: [],
    };
  }
}
