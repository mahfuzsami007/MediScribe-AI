export const DEMO_DOCTOR = {
  name: 'Dr. Arjun Sharma',
  reg: 'MCI-2019-48823',
  specialty: 'General Physician',
  email: 'arjun.sharma@mediscribe.ai',
  education: 'MBBS - AIIMS Delhi, MD - PGI Chandigarh',
};

export const PATIENTS = [
  { id: 1, name: 'Reza Ahmed',     age: 45, gender: 'Male',   date: '09 May 2026', time: '09:15 AM', status: 'done',    diagnosis: 'Hypertension, Type 2 Diabetes' },
  { id: 2, name: 'Fatima Khatun',  age: 32, gender: 'Female', date: '09 May 2026', time: '10:00 AM', status: 'done',    diagnosis: 'Acute Pharyngitis' },
  { id: 3, name: 'Karim Hassan',   age: 58, gender: 'Male',   date: '09 May 2026', time: '11:30 AM', status: 'pending', diagnosis: 'Pending' },
  { id: 4, name: 'Layla Begum',    age: 27, gender: 'Female', date: '08 May 2026', time: '03:00 PM', status: 'done',    diagnosis: 'Iron Deficiency Anemia' },
  { id: 5, name: 'Omar Chowdhury', age: 61, gender: 'Male',   date: '08 May 2026', time: '04:30 PM', status: 'done',    diagnosis: 'COPD Exacerbation' },
];

export const MOCK_AI = {
  patient:        () => ({ name: 'Karim Hassan', age: '58', gender: 'Male' }),
  vitals:         () => ({ weight: '72 kg', height: '168 cm', temp: '98.6°F', bp: '142/88 mmHg', hr: '82 bpm' }),
  symptoms:       () => ({ chief: 'Chest tightness and shortness of breath on exertion for 3 weeks. Worsening in mornings. Associated mild cough, no fever.', findings: 'Bilateral basal crepitations. Reduced air entry right base. SpO₂ 94% on room air.' }),
  medications:    () => ({ meds: '1. Tab. Salbutamol 4mg — 1 tab TID × 10 days\n2. Syp. Ambroxol 30mg/5ml — 10ml TID × 7 days\n3. Tab. Montelukast 10mg — OD at night × 14 days' }),
  investigations: () => ({ tests: 'CBC with differential\nChest X-Ray (PA view)\nSpirometry (PFT)\nECG 12-lead' }),
  habits:         () => ({ advice: 'Avoid dust, smoke, cold air. Pursed lip breathing TID. Limit exertion. Stay hydrated ≥2L/day. No smoking.' }),
};

export const RX_STEPS = [
  {
    key: 'patient', label: 'Patient Info', hint: 'Name, age, gender',
    fields: [
      { key: 'name',   label: 'Patient Name', placeholder: 'Full name' },
      { key: 'age',    label: 'Age',          placeholder: 'Years' },
      { key: 'gender', label: 'Gender',       placeholder: 'Male / Female' },
    ],
  },
  {
    key: 'vitals', label: 'Vitals', hint: 'Weight, height, temp, BP, HR',
    fields: [
      { key: 'weight', label: 'Weight',         placeholder: 'kg' },
      { key: 'height', label: 'Height',         placeholder: 'cm' },
      { key: 'temp',   label: 'Temperature',    placeholder: '°F' },
      { key: 'bp',     label: 'Blood Pressure', placeholder: 'mmHg' },
      { key: 'hr',     label: 'Heart Rate',     placeholder: 'bpm' },
    ],
  },
  {
    key: 'symptoms', label: 'Symptoms', hint: 'Chief complaints & findings',
    fields: [
      { key: 'chief',    label: 'Chief Complaints', placeholder: 'Main symptoms...', multi: true },
      { key: 'findings', label: 'Clinical Findings', placeholder: 'Exam findings...', multi: true },
    ],
  },
  {
    key: 'medications', label: 'Medications', hint: 'Drug, dosage, instructions',
    fields: [
      { key: 'meds', label: 'Prescriptions', placeholder: 'List medications...', multi: true },
    ],
  },
  {
    key: 'investigations', label: 'Investigations', hint: 'Lab tests & imaging',
    fields: [
      { key: 'tests', label: 'Tests Ordered', placeholder: 'List tests...', multi: true },
    ],
  },
  {
    key: 'habits', label: 'Advice', hint: 'Lifestyle & follow-up',
    fields: [
      { key: 'advice', label: 'Patient Instructions', placeholder: 'Lifestyle advice...', multi: true },
    ],
  },
];

export const SPECIALTIES = [
  'General Physician', 'Cardiologist', 'Neurologist', 'Pediatrician',
  'Orthopedics', 'Dermatologist', 'Gynecologist', 'Psychiatrist',
];

export const TEMPLATES = [
  { icon: '🫀', title: 'Cardiology Follow-up',  desc: 'Hypertension, CAD, heart failure management', count: '142 uses' },
  { icon: '🤧', title: 'Acute URTI',            desc: 'Cold, cough, fever, pharyngitis protocol',    count: '89 uses'  },
  { icon: '🩸', title: 'Diabetes Management',   desc: 'Type 1/2 DM, insulin, HbA1c review',          count: '67 uses'  },
  { icon: '🧠', title: 'Neurology Assessment',  desc: 'Headache, migraine, dizziness workup',        count: '34 uses'  },
  { icon: '🦴', title: 'Orthopedic Injury',     desc: 'Fractures, sprains, arthritis management',    count: '28 uses'  },
  { icon: '👶', title: 'Pediatric Consult',     desc: 'Child growth, vaccination, fever protocol',   count: '56 uses'  },
];
