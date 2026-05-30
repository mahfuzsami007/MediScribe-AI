import { supabase } from '../lib/supabase';

export async function validateAndConvertAvatar(file) {
  if (file.size > 102400) {
    throw new Error('Image must be ≤ 100KB');
  }

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Check dimensions
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = base64;
  });

  if (img.width !== 100 || img.height !== 100) {
    throw new Error('Image must be exactly 100x100 pixels');
  }

  return base64;
}

export async function updateAvatar(base64String) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: base64String })
    .eq('id', user.id);

  if (error) throw error;
  return true;
}