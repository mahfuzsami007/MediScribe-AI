import { useRef, useState, useEffect } from 'react';
import { Mic, Square, Loader, CheckCircle } from 'lucide-react';
import WaveForm from '../ui/WaveForm';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const getSystemPrompt = (stepKey) => {
  const baseInstructions = `You are a clinical data extractor. Convert the doctor's dictation into a JSON object.
Use the following clinical standards:
- Vitals: add units (BP → "120/80 mmHg", HR → "72 bpm", Temp → "98.6 °F", Weight → "70 kg").
- Medication frequency: output both a shorthand (BID, TID, QD, PRN, HS) AND an array of dosing times.
  * "twice a day" → frequency_shorthand: "BID", times: ["morning", "night"]
  * "three times a day" → "TID", times: ["morning", "afternoon", "night"]
  * "four times a day" → "QID", times: ["morning", "afternoon", "evening", "night"]
  * "once daily" → "QD", times: ["morning"]
  * "every other day" → "QOD", times: ["every other day"]
  * "as needed" → "PRN", times: []
  * "at bedtime" → "HS", times: ["night"]
  * "before meals" → "AC", times: ["before meals"]
  * "after meals" → "PC", times: ["after meals"]
- For medications, output an object with fields: name, dosage, frequency_shorthand, times (array of strings), duration.
- For investigations, output an array of strings.
- If a field is missing, use empty string or empty array.
- Output ONLY valid JSON, no markdown, no extra text.`;

  const stepSchemas = {
    patient: `Extract patient info. Return JSON: { "name": "", "age": "", "gender": "" }`,
    vitals: `Extract vitals. Return JSON: { "bp": "", "weight": "", "temp": "", "hr": "" }`,
    symptoms: `Extract chief complaint and findings. Return JSON: { "chief": "", "findings": "" }`,
    medications: `Extract medications. Return JSON: { "meds": [{"name":"","dosage":"","frequency_shorthand":"","times":[],"duration":""}] }`,
    investigations: `Extract ordered tests. Return JSON: { "tests": [] }`,
    habits: `Extract lifestyle advice, patient instructions, or recommendations. The doctor may say "advise", "recommend", "instructions", "lifestyle changes", "diet", "exercise", "avoid", "take", etc. Return JSON: { "advice": "" }`,
  };

  return `${baseInstructions}\n\n${stepSchemas[stepKey]}`;
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
        let rawTranscript = '';
        try {
          // ---- Whisper transcription ----
          const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
            body: formData,
          });
          if (whisperRes.status === 429) {
            setCooldown(true);
            alert('Voice limit reached. Please wait 2 seconds.');
            setRec('idle');
            return;
          }
          if (!whisperRes.ok) throw new Error(`Whisper error: ${whisperRes.status}`);
          const whisperData = await whisperRes.json();
          rawTranscript = whisperData.text;
          console.log(`[${step.key}] Raw transcript:`, rawTranscript); // debug

          // ---- Chat completion with structured extraction ----
          const systemPrompt = getSystemPrompt(step.key);
          const userMessage = `Doctor's dictation: ${rawTranscript}\n\nExtract the clinical data according to the schema.`;

          const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.1,
              max_tokens: 1024,
            }),
          });

          if (!chatRes.ok) {
            const errText = await chatRes.text();
            throw new Error(`Chat LLM error (${chatRes.status}): ${errText}`);
          }
          const chatData = await chatRes.json();
          const assistantMessage = chatData.choices[0]?.message?.content || '{}';
          const cleanJson = assistantMessage.replace(/```json\s*|\s*```/g, '').trim();
          console.log(`[${step.key}] LLM raw response:`, cleanJson); // debug
          const parsed = JSON.parse(cleanJson);

          // Map to current step's fields
          let stepData = {};
          if (step.key === 'patient') {
            stepData = { name: parsed.name, age: parsed.age, gender: parsed.gender };
          } else if (step.key === 'vitals') {
            stepData = { bp: parsed.bp, weight: parsed.weight, temp: parsed.temp, hr: parsed.hr };
          } else if (step.key === 'symptoms') {
            stepData = { chief: parsed.chief, findings: parsed.findings };
          } else if (step.key === 'medications') {
            let medsString = '';
            if (parsed.meds && Array.isArray(parsed.meds)) {
              medsString = parsed.meds.map(m => {
                let timesStr = '';
                if (m.times && m.times.length) {
                  timesStr = ` – take in ${m.times.join(', ')}`;
                } else if (m.frequency_shorthand) {
                  timesStr = ` (${m.frequency_shorthand})`;
                }
                return `${m.name} ${m.dosage}${timesStr}${m.duration ? ` × ${m.duration}` : ''}`;
              }).join('; ');
            }
            stepData = { meds: medsString };
          } else if (step.key === 'investigations') {
            const testsString = (parsed.tests && Array.isArray(parsed.tests)) ? parsed.tests.join(', ') : '';
            stepData = { tests: testsString };
          } else if (step.key === 'habits') {
            // Ensure advice field is extracted even if the LLM uses a different key
            let adviceText = parsed.advice || parsed.instructions || parsed.recommendations || '';
            if (!adviceText && typeof parsed === 'string') adviceText = parsed;
            stepData = { advice: adviceText };
          }

          onData({ ...data, ...stepData });
          setRec('done');
        } catch (err) {
          console.error('Pipeline error:', err);
          alert(`Voice extraction failed: ${err.message}. Please type manually.`);
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

  // UI state mapping (unchanged)
  const STATE = {
    idle:       { label: 'Ready to Record', hint: 'Tap the microphone to start', btnCls: 'bg-blue-600 hover:bg-blue-700 shadow-lg', Icon: Mic, iconCls: 'text-white' },
    recording:  { label: 'Recording…',      hint: 'Speak clearly. Tap ⏹ to stop.', btnCls: 'bg-red-500 animate-mpulse', Icon: Square, iconCls: 'text-white' },
    processing: { label: 'Transcribing & Extracting', hint: 'AI is processing your speech...', btnCls: 'bg-amber-500', Icon: Loader, iconCls: 'text-white animate-spin-slow' },
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