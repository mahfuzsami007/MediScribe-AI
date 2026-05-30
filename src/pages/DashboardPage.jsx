import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getSession } from '../lib/auth';
import { PATIENTS } from '../data/mockData';
import StatusPill from '../components/ui/StatusPill';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const session = getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const tp = PATIENTS.filter(p => p.date === '09 May 2026');
  const examined = tp.filter(p => p.status === 'done').length;

  const stats = [
    { label: "Today's Patients", value: tp.length, color: '#2563eb', fill: 70 },
    { label: 'Examined', value: examined, color: '#16a34a', fill: Math.round(examined / tp.length * 100) },
    { label: 'Remaining', value: tp.length - examined, color: '#d97706', fill: Math.round((tp.length - examined) / tp.length * 100) },
  ];

  const startRx = () => navigate('/prescription');
  const doctorName = profile?.full_name || 'Doctor';
  const firstName = doctorName.split(' ').pop() || 'Doctor';

  if (loading) return <div className="flex h-full items-center justify-center">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 md:px-8 md:py-5">
        <div>
          <h1 className="text-base md:text-[18px] font-bold tracking-tight text-slate-800">
            Good morning, {firstName} 👋
          </h1>
          <p className="mt-1 text-xs md:text-[12px] text-slate-400">{today}</p>
        </div>
        <button onClick={startRx} className="rounded-xl bg-blue-600 px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-[13px] font-semibold text-white transition hover:bg-blue-700">
          + New Prescription
        </button>
      </div>

      <div className="p-4 md:p-8">
        {/* Stats grid - responsive */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 md:p-6 shadow-sm">
              <p className="mb-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400">{s.label}</p>
              <p className="text-3xl md:text-[36px] font-bold leading-none tracking-tight" style={{ color: s.color }}>{s.value}</p>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: s.fill + '%', background: s.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner - responsive */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 md:p-7 shadow-sm">
          <div>
            <h3 className="mb-1 text-base md:text-[17px] font-bold tracking-tight text-slate-800">Create Digital Prescription</h3>
            <p className="text-xs md:text-[13px] leading-relaxed text-slate-500">Use AI-powered voice capture to document patient visits in under 2 minutes.</p>
          </div>
          <button onClick={startRx} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 md:px-6 md:py-4 text-sm md:text-[14px] font-bold text-white shadow transition hover:bg-blue-700 hover:-translate-y-0.5">
            🎙️ Start Voice Prescription
          </button>
        </div>

        {/* Patient table - scroll on mobile */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 md:px-6 md:py-5">
            <h4 className="text-sm md:text-[14px] font-bold tracking-tight text-slate-800">Recent Patients</h4>
            <button onClick={() => navigate('/history')} className="text-xs md:text-[12px] font-semibold text-blue-600 hover:underline">View All →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Patient', 'Age', 'Time', 'Diagnosis', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 md:px-6 md:py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PATIENTS.slice(0, 4).map(p => (
                  <tr key={p.id} className="group border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-[13px] font-semibold text-slate-800 group-hover:bg-slate-50">{p.name}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-[13px] text-slate-500 group-hover:bg-slate-50">{p.age}Y, {p.gender}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-[13px] text-slate-500 group-hover:bg-slate-50">{p.time}</td>
                    <td className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3 md:px-6 md:py-4 text-xs md:text-[13px] text-slate-500 group-hover:bg-slate-50">{p.diagnosis}</td>
                    <td className="px-4 py-3 md:px-6 md:py-4 group-hover:bg-slate-50"><StatusPill status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}