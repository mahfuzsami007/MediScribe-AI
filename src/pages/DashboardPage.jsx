import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getSession } from '../lib/auth';
import StatusPill from '../components/ui/StatusPill';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [avgCreationTime, setAvgCreationTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const session = getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      try {
        // Fetch doctor profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch last 5 research records for this doctor
        const { data: researchData, error: researchError } = await supabase
          .from('research_data')
          .select('*')
          .eq('doctor_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (researchError) throw researchError;

        // Transform with sequential patient numbers
        const transformed = researchData.map((record, index) => ({
          id: record.id,
          patientNumber: index + 1,
          age: record.patient_age || '?',
          gender: record.patient_gender || '?',
          date: new Date(record.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'done',
          diagnosis: record.symptoms_chief?.substring(0, 50) || 'N/A',
        }));
        setRecentPrescriptions(transformed);

        // Count today's prescriptions
        const today = new Date().toISOString().split('T')[0];
        const { count, error: countError } = await supabase
          .from('research_data')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', session.user.id)
          .gte('created_at', today);
        if (countError) throw countError;
        setTodayCount(count || 0);

        // Calculate average creation time from records that have started_at
        const { data: timeData, error: timeError } = await supabase
          .from('research_data')
          .select('created_at, started_at')
          .eq('doctor_id', session.user.id)
          .not('started_at', 'is', null);
        if (!timeError && timeData && timeData.length > 0) {
          let totalSeconds = 0;
          let validCount = 0;
          timeData.forEach(record => {
            const start = new Date(record.started_at);
            const end = new Date(record.created_at);
            const diffSeconds = (end - start) / 1000;
            if (diffSeconds > 0 && diffSeconds < 3600) { // ignore unrealistic values (>1 hour)
              totalSeconds += diffSeconds;
              validCount++;
            }
          });
          if (validCount > 0) {
            const avgSeconds = totalSeconds / validCount;
            const minutes = Math.floor(avgSeconds / 60);
            const seconds = Math.round(avgSeconds % 60);
            setAvgCreationTime(`${minutes}m ${seconds}s`);
          }
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const startRx = () => navigate('/prescription');

  const doctorName = profile?.name || profile?.full_name || 'Doctor';
  const firstName = doctorName.split(' ')[0] || 'Doctor';

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">Error loading dashboard: {error}</div>
      </div>
    );
  }

  const stats = [
    { label: "Today's Patients", value: todayCount, color: '#2563eb', fill: 100 },
    { label: 'Examined', value: todayCount, color: '#16a34a', fill: todayCount === 0 ? 0 : 100 },
    { label: 'Avg. Creation Time', value: avgCreationTime || '—', color: '#d97706', fill: 0 },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 md:px-8 md:py-5">
        <div>
          <h1 className="text-base md:text-[18px] font-bold tracking-tight text-slate-800">
            Good morning, {firstName} 👋
          </h1>
          <p className="mt-1 text-xs md:text-[12px] text-slate-400">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={startRx} className="rounded-xl bg-blue-600 px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-[13px] font-semibold text-white transition hover:bg-blue-700">
          + New Prescription
        </button>
      </div>

      <div className="p-4 md:p-8">
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

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 md:p-7 shadow-sm">
          <div>
            <h3 className="mb-1 text-base md:text-[17px] font-bold tracking-tight text-slate-800">Create Digital Prescription</h3>
            <p className="text-xs md:text-[13px] leading-relaxed text-slate-500">Use AI-powered voice capture to document patient visits in under 2 minutes.</p>
          </div>
          <button onClick={startRx} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 md:px-6 md:py-4 text-sm md:text-[14px] font-bold text-white shadow transition hover:bg-blue-700 hover:-translate-y-0.5">
            🎙️ Start Voice Prescription
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 md:px-6 md:py-5">
            <h4 className="text-sm md:text-[14px] font-bold tracking-tight text-slate-800">Recent Patients</h4>
            <button onClick={() => navigate('/history')} className="text-xs md:text-[12px] font-semibold text-blue-600 hover:underline">
              View All →
            </button>
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
                {recentPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">No recent prescriptions yet.</td>
                  </tr>
                ) : (
                  recentPrescriptions.map(p => (
                    <tr key={p.id} className="group border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-[13px] font-semibold text-slate-800">Patient {p.patientNumber}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-[13px] text-slate-500">{p.age}Y, {p.gender}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-[13px] text-slate-500">{p.time}</td>
                      <td className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap px-4 py-3 md:px-6 md:py-4 text-xs md:text-[13px] text-slate-500">{p.diagnosis}</td>
                      <td className="px-4 py-3 md:px-6 md:py-4"><StatusPill status="done" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}