import { useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader, CheckCircle } from 'lucide-react';
import WaveForm from '../ui/WaveForm';
import { MOCK_AI, RX_STEPS } from '../../data/mockData';

/*
 * rec state lives in VoiceRxPage and is passed as a prop.
 * This component never remounts on typing — no focus-loss bug.
 *
 * The fix for the original "reset recorder on step change" is now handled
 * by VoiceRxPage calling setRec('idle') in handleNext / handlePrev / handleStepClick.
 */
export default function VoiceStep({ step, idx, total, data, onData, onNext, onPrev, rec, setRec }) {
  const tmr = useRef(null);

  useEffect(() => () => clearTimeout(tmr.current), []);

  // useCallback so populate's reference is stable within a render cycle.
  // It reads `data` via the ref below to avoid stale-closure issues.
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const populate = useCallback(() => {
    // Use dataRef.current so we always merge into the latest data,
    // even if the setTimeout fires after a re-render changed `data`.
    onData({ ...dataRef.current, ...MOCK_AI[step.key]() });
    setRec('done');
  }, [onData, setRec, step.key]);

  const handleMic = () => {
    if (rec === 'processing') return;
    if (rec === 'recording') {
      clearTimeout(tmr.current);
      setRec('processing');
      setTimeout(populate, 1300);
      return;
    }
    // idle or done → start new recording
    setRec('recording');
    tmr.current = setTimeout(() => {
      setRec('processing');
      setTimeout(populate, 1300);
    }, 2000);
  };

  const editVoice = () => {
    setRec('processing');
    setTimeout(populate, 900);
  };

  const STATE = {
    idle:       { label: 'Ready to Record', hint: 'Tap the microphone to start voice capture',    btnCls: 'bg-blue-600 hover:bg-blue-700 shadow-[0_6px_20px_rgba(37,99,235,0.4)]', Icon: Mic,         iconCls: 'text-white' },
    recording:  { label: 'Recording…',      hint: 'Listening… speak clearly. Tap ⏹ to stop.',     btnCls: 'bg-red-500 animate-mpulse',                                            Icon: Square,      iconCls: 'text-white' },
    processing: { label: 'AI Processing',   hint: 'Transcribing and structuring your voice…',     btnCls: 'bg-amber-500',                                                         Icon: Loader,      iconCls: 'text-white animate-spin-slow' },
    done:       { label: 'Captured ✓',      hint: 'Captured! Review fields below or re-record.',  btnCls: 'bg-green-600 shadow-[0_4px_14px_rgba(22,163,74,0.35)]',                Icon: CheckCircle, iconCls: 'text-white' },
  };
  const { label, hint, btnCls, Icon, iconCls } = STATE[rec];

  const badgeCls = {
    idle:       'bg-blue-100 text-blue-700',
    recording:  'bg-red-100 text-red-700 animate-blink',
    processing: 'bg-amber-100 text-amber-700',
    done:       'bg-green-100 text-green-700',
  }[rec];

  const isSingle = step.fields.length === 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-start justify-between border-b border-slate-100 px-8 py-6">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-slate-800">
            Step {idx + 1} of {total} — {step.label}
          </h3>
          <p className="mt-1 text-[12px] text-slate-400">{step.hint}</p>
        </div>
        <span className={`ml-4 shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${badgeCls}`}>
          {label}
        </span>
      </div>

      {/* ── Microphone zone ── */}
      <div className={`mx-8 mt-6 mb-6 flex flex-col items-center gap-4 rounded-2xl bg-slate-50 px-6 py-8 transition-all duration-300 ${
        rec === 'recording' ? 'border-2 border-red-400 bg-red-50' : 'border-2 border-transparent'
      }`}>
        <button
          onClick={handleMic}
          className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 ${btnCls}`}
        >
          <Icon size={30} className={iconCls} />
        </button>
        {rec === 'recording' && <WaveForm active />}
        <p className="max-w-xs text-center text-[12px] font-medium leading-relaxed text-slate-500">
          {hint}
        </p>
      </div>

      {/* ── Input fields ── */}
      <div className={`mx-8 mb-6 grid gap-4 ${isSingle ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {step.fields.map(f => (
          <div key={f.key} className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {f.label}
            </label>
            <div className="relative">
              {f.multi ? (
                <textarea
                  className="ms-textarea pr-10"
                  rows={4}
                  value={data[f.key] || ''}
                  onChange={e => onData({ ...data, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                />
              ) : (
                <input
                  className="ms-input pr-10"
                  value={data[f.key] || ''}
                  onChange={e => onData({ ...data, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                />
              )}
              <button
                onClick={editVoice}
                title="Edit via Voice"
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[12px] text-slate-500 transition hover:bg-blue-100 hover:text-blue-600"
              >
                🎙
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Navigation ── */}
      <div className="flex gap-3 border-t border-slate-100 px-8 py-5">
        {idx > 0 && (
          <button
            onClick={onPrev}
            className="rounded-xl bg-slate-100 px-6 py-3 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            ← Back
          </button>
        )}
        <button
          onClick={onNext}
          className="flex-1 rounded-xl bg-blue-600 px-6 py-3 text-[13px] font-bold text-white transition hover:bg-blue-700"
        >
          {idx < total - 1 ? `Next: ${RX_STEPS[idx + 1].label} →` : 'View Prescription Preview →'}
        </button>
      </div>
    </div>
  );
}
