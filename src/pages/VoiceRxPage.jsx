import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getSession } from '../lib/auth';
import { submitResearchData } from '../lib/research';
import { RX_STEPS } from '../data/mockData';
import RxStepper from '../components/voicerx/RxStepper';
import VoiceStep from '../components/voicerx/VoiceStep';
import PrescriptionPreview from '../components/preview/PrescriptionPreview';

const EMPTY_RX = {
  patient: {}, vitals: {}, symptoms: {},
  medications: {}, investigations: {}, habits: {},
};

export default function VoiceRxPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState(new Set());
  const [preview, setPreview] = useState(false);
  const [rx, setRx] = useState(EMPTY_RX);
  const [rec, setRec] = useState('idle');
  const [isSubmittingResearch, setIsSubmittingResearch] = useState(false);
  const [startedAt, setStartedAt] = useState(new Date()); // track start time

  // Fetch doctor profile including clinic info
  useEffect(() => {
    const fetchProfile = async () => {
      const session = getSession();
      if (session?.user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('*') // includes clinic_name, clinic_phone, clinic_address
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  // Reset started_at when component mounts (new session)
  useEffect(() => {
    setStartedAt(new Date());
  }, []);

  const sk = RX_STEPS[cur].key;
  const handleData = useCallback((d) => {
    setRx(prev => ({ ...prev, [RX_STEPS[cur].key]: d }));
  }, [cur]);

  const handleNext = () => {
    setDone(p => new Set([...p, cur]));
    setRec('idle');
    if (cur < RX_STEPS.length - 1) setCur(c => c + 1);
    else setPreview(true);
  };
  const handlePrev = () => { setRec('idle'); setCur(c => c - 1); };
  const handleStepClick = (i) => { if (done.has(i) || i === cur) { setRec('idle'); setCur(i); setPreview(false); } };

  const handleContributeToResearch = async () => {
    if (isSubmittingResearch) return;
    const hasData = rx.patient?.age || rx.medications?.meds || rx.symptoms?.chief;
    if (!hasData) {
      alert('No prescription data to contribute.');
      return;
    }

    setIsSubmittingResearch(true);
    const researchPayload = {
      patient_age: rx.patient?.age ?? null,
      patient_gender: rx.patient?.gender ?? null,
      symptoms_chief: rx.symptoms?.chief ?? null,
      symptoms_findings: rx.symptoms?.findings ?? null,
      medications: rx.medications?.meds ?? null,
      investigations: rx.investigations?.tests ?? null,
      advice: rx.habits?.advice ?? null,
      vitals: {
        bp: rx.vitals?.bp ?? null,
        hr: rx.vitals?.hr ?? null,
        temp: rx.vitals?.temp ?? null,
        weight: rx.vitals?.weight ?? null,
      },
      started_at: startedAt.toISOString(), // include start time
    };
    const { success, error } = await submitResearchData(researchPayload);
    if (success) {
      alert('✓ Prescription data contributed to research successfully.');
    } else {
      alert(`Failed to contribute: ${error?.message || 'Unknown error'}`);
    }
    setIsSubmittingResearch(false);
  };

  const resetAll = () => {
    setCur(0);
    setRec('idle');
    setPreview(false);
    setDone(new Set());
    setRx(EMPTY_RX);
    setStartedAt(new Date()); // reset start time for new prescription
  };

  // Build complete doctor object with clinic info
  const doctorData = profile ? {
    name: profile.name || profile.full_name || 'Doctor',
    reg: profile.reg_number || 'REG-0000',
    specialty: profile.speciality || 'Physician',
    email: profile.email || '',
    clinic_name: profile.clinic_name || 'MediScribe Clinic',
    clinic_phone: profile.clinic_phone || '+880 1700-000000',
    clinic_address: profile.clinic_address || '123 Medical Quarter, Dhaka 1200',
  } : {
    name: 'Dr. Name',
    reg: 'REG-0000',
    specialty: 'Physician',
    email: '',
    clinic_name: 'MediScribe Clinic',
    clinic_phone: '+880 1700-000000',
    clinic_address: '123 Medical Quarter, Dhaka 1200',
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 md:px-8 md:py-5">
        <div>
          <h1 className="text-base md:text-[18px] font-bold tracking-tight text-slate-800">Voice-to-Prescription</h1>
          <p className="text-xs md:text-[12px] text-slate-400">Speak to capture — AI structures your clinical data</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="rounded-xl bg-slate-100 px-4 py-2 text-xs md:text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200">
          ← Dashboard
        </button>
      </div>

      <div className="overflow-x-auto">
        <RxStepper steps={RX_STEPS} current={cur} done={done} preview={preview} onStepClick={handleStepClick} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {!preview ? (
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-6 items-start">
            <div className="w-full">
              <VoiceStep
                step={RX_STEPS[cur]}
                idx={cur}
                total={RX_STEPS.length}
                data={rx[sk]}
                onData={handleData}
                onNext={handleNext}
                onPrev={handlePrev}
                rec={rec}
                setRec={setRec}
              />
            </div>
            <div className="w-full lg:sticky lg:top-0">
              <PrescriptionPreview data={rx} doctor={doctorData} fullPage={false} />
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 md:px-8 md:py-10 text-center shadow-sm">
              <div className="mb-4 text-4xl md:text-5xl">✅</div>
              <h3 className="mb-2 text-xl md:text-[22px] font-bold tracking-tight text-slate-800">Prescription Complete!</h3>
              <p className="text-sm md:text-[14px] leading-relaxed text-slate-500">All {RX_STEPS.length} sections captured. Review and share below.</p>
            </div>
            <PrescriptionPreview data={rx} doctor={doctorData} fullPage={true} />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm">
              <div>
                <h4 className="text-base md:text-[16px] font-bold tracking-tight text-slate-800">Contribute to Research</h4>
                <p className="text-xs md:text-[13px] leading-relaxed text-slate-500">Help advance medical knowledge – anonymously share this prescription data.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleContributeToResearch}
                  disabled={isSubmittingResearch}
                  className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSubmittingResearch ? '⏳ Submitting...' : '📊 Contribute to Research'}
                </button>
                <button
                  onClick={resetAll}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow hover:bg-blue-700"
                >
                  🎙️ + New Prescription
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}