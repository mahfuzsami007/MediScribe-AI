import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../lib/auth';

const FEATURES = [
  { icon: '🎙️', title: 'Voice-to-Prescription',        desc: 'Dictate naturally. AI converts speech into structured clinical prescriptions in real-time.' },
  { icon: '🧠', title: 'Automated Medical Structuring', desc: 'Symptoms, vitals, medications auto-classified with clinical precision.' },
  { icon: '📤', title: 'Instant Sharing',               desc: 'Generate PDFs, share via WhatsApp or email with a single tap.' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (session) navigate('/dashboard');
  }, [navigate]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1e293b 100%)', color: 'white' }}
    >
      <nav className="flex items-center justify-between px-4 py-4 md:px-8 lg:px-12 border-b border-white/10">
        <div className="flex items-center gap-2 md:gap-3 text-base md:text-[18px] font-bold">
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-blue-600 text-sm md:text-base">⚕</div>
          <span className="hidden sm:inline">MediScribe AI</span>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button onClick={() => navigate('/login')} className="rounded-xl border border-white/25 px-4 py-1.5 md:px-6 md:py-2.5 text-xs md:text-[13px] font-medium transition hover:bg-white/10">
            Sign In
          </button>
          <button onClick={() => navigate('/register')} className="rounded-xl bg-blue-600 px-4 py-1.5 md:px-6 md:py-2.5 text-xs md:text-[13px] font-semibold transition hover:bg-blue-700">
            Register
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 md:py-20 text-center">
        <div className="mb-6 md:mb-8 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-600/20 px-3 py-1 md:px-5 md:py-2 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-blue-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
          AI-Powered Clinical Documentation
        </div>

        <h1 className="mb-4 md:mb-6 max-w-2xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
          The Future of <span className="text-blue-400">Clinical</span> Documentation.
        </h1>
        <p className="mb-8 md:mb-12 max-w-lg text-sm md:text-base font-light leading-relaxed text-slate-400">
          Dictate prescriptions naturally. MediScribe AI structures your voice into professional medical records instantly.
        </p>

        <div className="mb-12 md:mb-20 flex flex-wrap justify-center gap-3 md:gap-4">
          <button onClick={() => navigate('/register')} className="rounded-2xl bg-blue-600 px-6 py-2.5 md:px-10 md:py-4 text-sm md:text-[15px] font-bold shadow-lg transition hover:bg-blue-700 hover:-translate-y-0.5">
            🏥 Doctor Registration
          </button>
          <button onClick={() => navigate('/login')} className="rounded-2xl border border-white/30 px-6 py-2.5 md:px-10 md:py-4 text-sm md:text-[15px] font-medium transition hover:bg-white/10">
            Sign In
          </button>
        </div>

        <div className="grid w-full max-w-3xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-4">
          {FEATURES.map(f => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 md:p-7 text-left transition hover:bg-white/8 hover:border-blue-500/40">
              <div className="mb-3 md:mb-4 text-2xl md:text-[28px]">{f.icon}</div>
              <div className="mb-2 text-sm md:text-[14px] font-semibold">{f.title}</div>
              <div className="text-xs md:text-[12px] leading-relaxed text-slate-400">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}