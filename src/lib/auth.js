import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const saveSession = (session) => {
  if (session) {
    localStorage.setItem('supabase_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('supabase_session');
  }
};

export const getSession = () => {
  const data = localStorage.getItem('supabase_session');
  return data ? JSON.parse(data) : null;
};

export const manualLogin = async (email, password) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  // Check for error in response
  if (!response.ok || data.error) {
    const errorMsg = data.error_description || data.error?.message || 'Invalid login credentials';
    throw new Error(errorMsg);
  }

  // Ensure we have a valid token
  if (!data.access_token) {
    throw new Error('No access token received');
  }

  // Set session in supabase client and localStorage
  await supabase.auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  saveSession(data);
  return data;
};

export const logout = () => {
  localStorage.removeItem('supabase_session');
  supabase.auth.signOut();
  window.location.href = '/login';
};

export const register = async (email, password, userData) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: userData },
  });
  if (error) throw new Error(error.message);
  return data;
};