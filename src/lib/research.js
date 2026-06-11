import { supabase } from './auth';

/**
 * Submit de‑identified research data after a prescription is finalized.
 * @param {Object} prescriptionData - The prescription state from your form.
 * @param {string} prescriptionData.patient_age - Patient's age (as text).
 * @param {string} prescriptionData.patient_gender - Patient's gender.
 * @param {string} prescriptionData.symptoms_chief - Chief complaint.
 * @param {string} prescriptionData.symptoms_findings - Examination findings.
 * @param {string} prescriptionData.medications - Medications text.
 * @param {string} prescriptionData.investigations - Tests ordered.
 * @param {string} prescriptionData.advice - Lifestyle advice.
 * @param {Object} prescriptionData.vitals - Vital signs (e.g., { bp: "120/80", hr: 72, temp: 98.6, spo2: 98 }).
 * @returns {Promise<{ success: boolean, error: Error | null }>}
 */
export async function submitResearchData(prescriptionData) {
  // Get current authenticated doctor
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('Research submission error: No authenticated user', userError);
    return { success: false, error: new Error('Not authenticated') };
  }

  // Build payload using exact column names from your schema
  const payload = {
    doctor_id: user.id,
    patient_age: prescriptionData.patient_age || null,
    patient_gender: prescriptionData.patient_gender || null,
    symptoms_chief: prescriptionData.symptoms_chief || null,
    symptoms_findings: prescriptionData.symptoms_findings || null,
    medications: prescriptionData.medications || null,
    investigations: prescriptionData.investigations || null,
    advice: prescriptionData.advice || null,
    vitals: prescriptionData.vitals && Object.keys(prescriptionData.vitals).length > 0
      ? prescriptionData.vitals
      : null,
  };

  try {
    const { error } = await supabase
      .from('research_data')
      .insert([payload]);
    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to insert research data:', error);
    return { success: false, error };
  }
}