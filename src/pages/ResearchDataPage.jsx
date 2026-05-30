import { useState, useEffect } from 'react';
import { supabase, getSession } from '../lib/auth';

export default function ResearchDataPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const session = getSession();
      if (!session) return;
      const { data: research, error } = await supabase
        .from('research_data')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setData(research);
      setLoading(false);
    };
    fetchData();
  }, []);

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = ['created_at', 'patient_age', 'patient_gender', 'symptoms_chief', 'symptoms_findings', 'medications', 'investigations', 'advice', 'vitals_bp', 'vitals_weight', 'vitals_temp', 'vitals_hr'];
    const rows = data.map(row => [
      row.created_at,
      row.patient_age,
      row.patient_gender,
      row.symptoms_chief,
      row.symptoms_findings,
      row.medications,
      row.investigations,
      row.advice,
      row.vitals?.bp || '',
      row.vitals?.weight || '',
      row.vitals?.temp || '',
      row.vitals?.hr || '',
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research_data_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-8 md:py-5">
        <h1 className="text-base md:text-[18px] font-bold tracking-tight text-slate-800">Clinical Research Data</h1>
        <p className="text-xs md:text-[12px] text-slate-400">Anonymized aggregated data from all prescriptions</p>
      </div>
      <div className="p-4 md:p-8">
        <div className="mb-4 flex justify-end">
          <button onClick={exportCSV} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            📥 Export as CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[800px] w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Age</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Chief Complaints</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Findings</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Medications</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">Vitals</th>
              </tr>
            </thead>
            <tbody>
              {data.map(row => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{new Date(row.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{row.patient_age || '—'}</td>
                  <td className="px-4 py-3 text-sm">{row.patient_gender || '—'}</td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">{row.symptoms_chief || '—'}</td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">{row.symptoms_findings || '—'}</td>
                  <td className="px-4 py-3 text-sm max-w-[200px] truncate">{row.medications || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    {row.vitals?.bp ? `BP: ${row.vitals.bp}` : ''}
                    {row.vitals?.weight ? ` Wt: ${row.vitals.weight}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <div className="p-8 text-center text-slate-400">No research data yet. Complete a prescription to contribute.</div>}
        </div>
      </div>
    </div>
  );
}