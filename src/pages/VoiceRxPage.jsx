import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getSession } from '../lib/auth';
import { saveResearchData } from '../lib/research';
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

  useEffect(() => {
    const fetchProfile = async () => {
      const session = getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
    };
    fetchProfile();
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

  const resetAll = async () => {
    // Save anonymized research data before resetting
    if (rx && (rx.patient?.age || rx.medications?.meds)) {
      await saveResearchData(rx);
    }
    setCur(0);
    setRec('idle');
    setPreview(false);
    setDone(new Set());
    setRx(EMPTY_RX);
  };

  const doctorData = profile ? { name: profile.full_name, reg: profile.reg_number, specialty: profile.speciality } : { name: 'Dr. Name', reg: 'REG-0000', specialty: 'Physician' };

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
              <VoiceStep step={RX_STEPS[cur]} idx={cur} total={RX_STEPS.length} data={rx[sk]} onData={handleData} onNext={handleNext} onPrev={handlePrev} rec={rec} setRec={setRec} />
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
                <h4 className="text-base md:text-[16px] font-bold tracking-tight text-slate-800">Start a New Prescription</h4>
                <p className="text-xs md:text-[13px] leading-relaxed text-slate-500">Ready for your next patient? All sections will reset.</p>
              </div>
              <button onClick={resetAll} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 md:px-7 md:py-3.5 text-sm md:text-[14px] font-bold text-white shadow transition hover:bg-blue-700">
                🎙️ + New Prescription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}