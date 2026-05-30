import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATIENTS } from '../data/mockData';
import StatusPill from '../components/ui/StatusPill';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const list = filter === 'all' ? PATIENTS : PATIENTS.filter(p => p.status === filter);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 md:px-8 md:py-5">
        <div>
          <h1 className="text-base md:text-[18px] font-bold tracking-tight text-slate-800">Patient History</h1>
          <p className="text-xs md:text-[12px] text-slate-400">{PATIENTS.length} total records</p>
        </div>
        <button onClick={() => navigate('/prescription')} className="rounded-xl bg-blue-600 px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-[13px] font-semibold text-white transition hover:bg-blue-700">
          + New Prescription
        </button>
      </div>

      <div className="p-4 md:p-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {[['all', 'All Patients'], ['done', 'Examined'], ['pending', 'Pending']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`rounded-xl border px-4 py-1.5 md:px-5 md:py-2 text-[11px] md:text-[12px] font-semibold transition ${
                filter === v
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}>
              {l}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {list.map(p => (
            <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:p-5 shadow-sm transition hover:shadow-md">
              <div className="min-w-0">
                <p className="mb-1 text-sm md:text-[14px] font-semibold text-slate-800">{p.name}</p>
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] md:text-[12px] text-slate-400">
                  <span>🎂 {p.age}Y, {p.gender}</span>
                  <span>📅 {p.date}</span>
                  <span>🕐 {p.time}</span>
                  {p.diagnosis !== 'Pending' && <span>🩺 {p.diagnosis}</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusPill status={p.status} />
                <button className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-[10px] md:text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50">
                  View Rx
                </button>
                <button className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[10px] md:text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100">
                  📤 Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}