import { supabase, getSession } from './auth';

export async function saveResearchData(rxData) {
  const session = getSession();
  if (!session?.user?.id) return;

  const researchEntry = {
    doctor_id: session.user.id,
    patient_age: rxData.patient?.age || null,
    patient_gender: rxData.patient?.gender || null,
    symptoms_chief: rxData.symptoms?.chief || null,
    symptoms_findings: rxData.symptoms?.findings || null,
    medications: rxData.medications?.meds || null,
    investigations: rxData.investigations?.tests || null,
    advice: rxData.habits?.advice || null,
    vitals: {
      bp: rxData.vitals?.bp || null,
      weight: rxData.vitals?.weight || null,
      temp: rxData.vitals?.temp || null,
      hr: rxData.vitals?.hr || null,
    },
  };

  const { error } = await supabase.from('research_data').insert(researchEntry);
  if (error) console.error('Failed to save research data:', error);
}