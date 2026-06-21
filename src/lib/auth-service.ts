import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SignUpData {
  full_name: string;
  username: string;
  country_code: string;
  phone: string;
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Creates a profile in the profiles table after successful Supabase auth signup.
 * This is called automatically in the signup flow.
 */
export async function createProfile(userId: string, data: SignUpData) {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          full_name: data.full_name,
          username: data.username,
          country_code: data.country_code,
          phone: data.phone,
          email: data.email,
          bio: '',
          website: '',
          links: [],
          avatar_url: null,
        },
      ]);
    if (error) throw error;
  } catch (error) {
    console.error('Profile creation error:', error);
    toast.error('Failed to create profile. Please try again.');
    throw error;
  }
}

/**
 * Sign up a new user with Supabase Auth and create their profile.
 */
export async function signUp(data: SignUpData) {
  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: data.full_name,
          username: data.username,
          country_code: data.country_code,
          phone: data.phone,
        },
      },
    });

    if (signUpError) throw signUpError;

    if (authData.user) {
      // Create profile immediately after signup
      await createProfile(authData.user.id, data);
      return authData;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Signup failed. Please try again.';
    toast.error(message);
    throw error;
  }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(data: SignInData) {
  try {
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Sign in failed. Please try again.';
    toast.error(message);
    throw error;
  }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Sign out failed.';
    toast.error(message);
    throw error;
  }
}

/**
 * Get the current session.
 */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
