import { supabase } from '../../lib/supabase';

async function handleRegister(email, password, doctorDetails) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: doctorDetails.name,
        reg_number: doctorDetails.reg,
        speciality: doctorDetails.specialty,
      },
    },
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  // Profile row will be auto-created by database trigger AFTER email confirmation.
  // User must click confirmation link in email before logging in.
  return { success: true, user: data.user };
}