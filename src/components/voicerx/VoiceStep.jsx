import { useRef, useState, useEffect } from 'react';
import { Mic, Square, Loader, CheckCircle } from 'lucide-react';
import WaveForm from '../ui/WaveForm';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Helper to extract data based on step key (improved patterns)
const extractForStep = (text, stepKey) => {
  const result = {};
  const lowerText = text.toLowerCase();

  if (stepKey === 'patient') {
    // Name: "patient John Doe" or "name John Doe"
    const nameMatch = text.match(/(?:patient(?:'s)? name|name)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i) ||
                      text.match(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b(?=\s+(?:is|,|\.|$))/);
    if (nameMatch) result.name = nameMatch[1];
    // Age: any number followed by "years", "yrs", "y"
    const ageMatch = text.match(/(\d{1,3})\s*(?:years?|yrs?|y)/i);
    if (ageMatch) result.age = ageMatch[1];
    // Gender: male/female/man/woman
    const genderMatch = text.match(/\b(male|female|man|woman)\b/i);
    if (genderMatch) result.gender = genderMatch[0].toLowerCase();
  } 
  else if (stepKey === 'vitals') {
    // BP: 120/80 or 120 over 80
    const bpMatch = text.match(/(\d{2,3})\/(\d{2,3})|(\d{2,3})\s*over\s*(\d{2,3})/i);
    if (bpMatch) result.bp = bpMatch[1] ? `${bpMatch[1]}/${bpMatch[2]}` : `${bpMatch[3]}/${bpMatch[4]}`;
    // Weight: number + kg/kilogram
    const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)/i);
    if (weightMatch) result.weight = `${weightMatch[1]} kg`;
    // Temperature: number + F/C or degrees
    const tempMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:°?\s*(?:F|f|C|c|degrees?))/i);
    if (tempMatch) result.temp = tempMatch[0];
    // Heart rate: pulse or hr + number
    const hrMatch = text.match(/(?:pulse|heart rate|hr)[:\s]*(\d{2,3})/i);
    if (hrMatch) result.hr = `${hrMatch[1]} bpm`;
  }
  else if (stepKey === 'symptoms') {
    // Chief complaint: anything after "chief complaint", "complaints", "symptoms" until end of sentence
    let chiefMatch = text.match(/(?:chief complaint|complaints?|symptoms?)[:\s]+(.+?)(?:\.|$)/i);
    if (!chiefMatch) chiefMatch = text.match(/(?:patient (?:has|presents with)) (.+?)(?:\.|$)/i);
    if (chiefMatch) result.chief = chiefMatch[1].trim();
    // Findings: after "examination", "findings", "on exam"
    const findingsMatch = text.match(/(?:examination|findings|on exam)[:\s]+(.+?)(?:\.|$)/i);
    if (findingsMatch) result.findings = findingsMatch[1].trim();
  }
  else if (stepKey === 'medications') {
    // Medications: after "prescribe", "medication", "meds", "give", "start"
    let medsMatch = text.match(/(?:prescribe|medication|meds?|give|start)[:\s]+(.+?)(?:\.|$)/i);
    if (!medsMatch) medsMatch = text.match(/([a-z]+ \d+ (?:mg|mcg|g|ml) .+?)(?:\.|$)/i); // catches "amlodipine 5 mg once daily"
    if (medsMatch) result.meds = medsMatch[1].trim();
  }
  else if (stepKey === 'investigations') {
    // Investigations: after "order", "investigations", "tests", "lab", "imaging"
    let invMatch = text.match(/(?:order|investigations?|tests?|lab|imaging)[:\s]+(.+?)(?:\.|$)/i);
    if (!invMatch) invMatch = text.match(/(?:CBC|X-ray|ECG|MRI|CT|blood work|urinalysis)/i);
    if (invMatch) result.tests = invMatch[0].trim(); // use full match if no clear pattern
  }
  else if (stepKey === 'habits') {
    // Advice: after "advise", "recommend", "instructions", "lifestyle", "diet"
    let adviceMatch = text.match(/(?:advise|recommend|instructions?|lifestyle|diet)[:\s]+(.+?)(?:\.|$)/i);
    if (!adviceMatch) adviceMatch = text.match(/(?:avoid|take|exercise|increase|decrease|stop).+?(?:\.|$)/i);
    if (adviceMatch) result.advice = adviceMatch[1] ? adviceMatch[1].trim() : adviceMatch[0].trim();
  }

  // Log extracted data for debugging (remove in production)
  console.log(`Extracted for ${stepKey}:`, result);
  return result;
};

export default function VoiceStep({ step, idx, total, data, onData, onNext, onPrev, rec, setRec }) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  useEffect(() => {
    if (cooldown) {
      const timer = setTimeout(() => setCooldown(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const startRecording = async () => {
    if (isRecording || cooldown || rec === 'processing') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'speech.webm');
        formData.append('model', 'whisper-large-v3-turbo');
        formData.append('response_format', 'json');
        formData.append('language', 'en');

        setRec('processing');
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
            body: formData,
          });
          if (groqRes.status === 429) {
            setCooldown(true);
            alert('Voice limit reached. Please wait 2 seconds.');
            setRec('idle');
            return;
          }
          if (!groqRes.ok) throw new Error(`Groq error: ${groqRes.status}`);
          const { text: rawTranscript } = await groqRes.json();

          console.log(`Raw transcript for ${step.key}:`, rawTranscript); // debug

          const extracted = extractForStep(rawTranscript, step.key);
          // Merge with existing data for this step
          onData({ ...data, ...extracted });
          setRec('done');
        } catch (err) {
          console.error('Transcription error:', err);
          alert(`Voice failed: ${err.message}. Please type manually.`);
          setRec('idle');
        } finally {
          setIsRecording(false);
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRec('recording');
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') stopRecording();
      }, 15000);
    } catch (err) {
      console.error('Microphone error:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const STATE = {
    idle:       { label: 'Ready to Record', hint: 'Tap the microphone to start', btnCls: 'bg-blue-600 hover:bg-blue-700 shadow-lg', Icon: Mic, iconCls: 'text-white' },
    recording:  { label: 'Recording…',      hint: 'Speak clearly. Tap ⏹ to stop.', btnCls: 'bg-red-500 animate-mpulse', Icon: Square, iconCls: 'text-white' },
    processing: { label: 'Transcribing',    hint: 'AI is converting your speech...', btnCls: 'bg-amber-500', Icon: Loader, iconCls: 'text-white animate-spin-slow' },
    done:       { label: 'Captured ✓',      hint: 'Fields filled! Review or re-record.', btnCls: 'bg-green-600', Icon: CheckCircle, iconCls: 'text-white' },
  };
  const { label, hint, btnCls, Icon, iconCls } = STATE[rec];
  const badgeCls = {
    idle: 'bg-blue-100 text-blue-700',
    recording: 'bg-red-100 text-red-700 animate-blink',
    processing: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
  }[rec];
  const isSingle = step.fields.length === 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-slate-100 px-8 py-6">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-slate-800">Step {idx + 1} of {total} — {step.label}</h3>
          <p className="mt-1 text-[12px] text-slate-400">{step.hint}</p>
        </div>
        <span className={`ml-4 shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${badgeCls}`}>{label}</span>
      </div>

      <div className={`mx-8 mt-6 mb-6 flex flex-col items-center gap-4 rounded-2xl bg-slate-50 px-6 py-8 transition-all duration-300 ${rec === 'recording' ? 'border-2 border-red-400 bg-red-50' : 'border-2 border-transparent'}`}>
        <button
          onClick={rec === 'recording' ? stopRecording : startRecording}
          disabled={cooldown || rec === 'processing'}
          className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${btnCls} ${(cooldown || rec === 'processing') ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Icon size={30} className={iconCls} />
        </button>
        {rec === 'recording' && <WaveForm active />}
        <p className="max-w-xs text-center text-[12px] font-medium leading-relaxed text-slate-500">{hint}</p>
        {cooldown && <p className="text-xs text-amber-600">⏳ Cooldown – please wait 2 seconds</p>}
      </div>

      <div className={`mx-8 mb-6 grid gap-4 ${isSingle ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {step.fields.map(f => (
          <div key={f.key} className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{f.label}</label>
            {f.multi ? (
              <textarea
                className="ms-textarea"
                rows={4}
                value={data[f.key] || ''}
                onChange={e => onData({ ...data, [f.key]: e.target.value })}
                placeholder={f.placeholder}
              />
            ) : (
              <input
                className="ms-input"
                value={data[f.key] || ''}
                onChange={e => onData({ ...data, [f.key]: e.target.value })}
                placeholder={f.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 border-t border-slate-100 px-8 py-5">
        {idx > 0 && (
          <button
            onClick={() => { if (rec === 'recording') stopRecording(); onPrev(); }}
            className="rounded-xl bg-slate-100 px-6 py-3 text-[13px] font-semibold text-slate-600"
          >
            ← Back
          </button>
        )}
        <button
          onClick={() => { if (rec === 'recording') stopRecording(); onNext(); }}
          className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-[13px] font-bold text-white"
        >
          {idx < total - 1 ? `Next: ${step.label} →` : 'View Prescription Preview →'}
        </button>
      </div>
    </div>
  );
}