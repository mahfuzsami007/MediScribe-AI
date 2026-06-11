import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useResearchData } from '../hooks/useResearchData';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

// Map gender strings to standard categories
function mapGender(gender) {
  if (!gender) return 'Unknown';
  const g = gender.toString().toLowerCase();
  if (g === 'male' || g === 'm') return 'Male';
  if (g === 'female' || g === 'f') return 'Female';
  return 'Other';
}

// Classify BP: high if systolic >= 140 OR diastolic >= 90
function classifyBloodPressure(bpString) {
  if (!bpString || typeof bpString !== 'string') return 'unknown';
  const numbers = bpString.match(/\d+/g);
  if (!numbers || numbers.length < 2) return 'unknown';
  const systolic = parseInt(numbers[0], 10);
  const diastolic = parseInt(numbers[1], 10);
  if (isNaN(systolic) || isNaN(diastolic)) return 'unknown';
  return (systolic >= 140 || diastolic >= 90) ? 'high' : 'normal';
}

// Extract symptoms as comma‑separated phrases, remove common filler words and standardise
function getTopSymptoms(symptomTexts, topN = 5) {
  const fillerWords = new Set([
    'patient', 'has', 'have', 'had', 'reports', 'complains', 'complaining',
    'denies', 'denying', 'history', 'past', 'present', 'also', 'then', 'there',
    'their', 'they', 'we', 'she', 'he', 'it', 'them', 'for', 'with', 'without',
    'very', 'quite', 'rather', 'some', 'any', 'more', 'most', 'such', 'than',
    'then', 'now', 'only', 'other', 'over', 'under', 'during', 'through',
    'throughout', 'along', 'behind', 'beneath', 'beside', 'beyond', 'near',
    'off', 'outside', 'inside', 'above', 'below', 'down', 'up', 'so', 'like',
    'seems', 'feels', 'feeling', 'looks', 'appears'
  ]);

  const symptomCount = new Map();

  symptomTexts.forEach(text => {
    if (!text) return;
    // Split by comma, then by 'and' and '&' to separate individual symptoms
    let parts = text.split(/[，,、]/); // split by Chinese or English commas
    const newParts = [];
    for (let part of parts) {
      // Further split by ' and ' or ' & '
      const subParts = part.split(/\s+(?:and|&)\s+/i);
      newParts.push(...subParts);
    }
    parts = newParts;
    for (let part of parts) {
      // Clean up: trim, lower case, remove filler words, collapse spaces
      let phrase = part.trim().toLowerCase();
      if (!phrase) continue;
      // Remove filler words that are isolated (but keep if part of a phrase)
      const words = phrase.split(/\s+/);
      const filtered = words.filter(w => !fillerWords.has(w));
      phrase = filtered.join(' ');
      if (!phrase) continue;
      // Remove trailing punctuation like . , ; : etc.
      phrase = phrase.replace(/[.,;:!?]$/, '');
      if (phrase) {
        symptomCount.set(phrase, (symptomCount.get(phrase) || 0) + 1);
      }
    }
  });

  const sorted = Array.from(symptomCount.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topN);
  return top.map(([symptom, count]) => ({ word: symptom, count }));
}

// Group heart rate data by month for trend line
function groupByMonthForHeartRate(records) {
  const months = {};
  records.forEach(record => {
    if (!record.created_at || !record.vitals?.hr) return;
    const date = new Date(record.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    if (!months[monthKey]) months[monthKey] = { total: 0, count: 0 };
    months[monthKey].total += record.vitals.hr;
    months[monthKey].count += 1;
  });
  return Object.entries(months)
    .map(([month, { total, count }]) => ({ month, avgHR: Math.round(total / count) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export default function ResearchDataPage() {
  const { rawRecords, loading, error, aggregates } = useResearchData();

  // Compute gender counts directly from raw records using mapping
  const genderCounts = useMemo(() => {
    const counts = { Male: 0, Female: 0, Other: 0, Unknown: 0 };
    rawRecords.forEach(record => {
      const mapped = mapGender(record.patient_gender);
      if (mapped === 'Male') counts.Male++;
      else if (mapped === 'Female') counts.Female++;
      else if (mapped === 'Other') counts.Other++;
      else counts.Unknown++;
    });
    return counts;
  }, [rawRecords]);

  const genderData = {
    labels: ['Male', 'Female', 'Other/Unknown'],
    datasets: [
      {
        label: 'Count',
        data: [genderCounts.Male, genderCounts.Female, genderCounts.Other + genderCounts.Unknown],
        backgroundColor: ['#2563eb', '#16a34a', '#9333ea'],
        borderWidth: 0,
      },
    ],
  };

  const bpData = useMemo(() => {
    let normal = 0, high = 0;
    rawRecords.forEach(record => {
      const classification = classifyBloodPressure(record.vitals?.bp);
      if (classification === 'normal') normal++;
      else if (classification === 'high') high++;
    });
    return {
      labels: ['Normal BP', 'High BP'],
      datasets: [
        {
          label: 'Number of Cases',
          data: [normal, high],
          backgroundColor: '#2563eb',
          borderRadius: 8,
        },
      ],
    };
  }, [rawRecords]);

  const topSymptomsData = useMemo(() => {
    const symptomTexts = rawRecords.map(r => r.symptoms_chief).filter(Boolean);
    const top = getTopSymptoms(symptomTexts, 5);
    return {
      labels: top.map(t => t.word),
      datasets: [
        {
          label: 'Frequency',
          data: top.map(t => t.count),
          backgroundColor: '#16a34a',
          borderRadius: 8,
        },
      ],
    };
  }, [rawRecords]);

  const heartRateTrendData = useMemo(() => {
    const trend = groupByMonthForHeartRate(rawRecords);
    return {
      labels: trend.map(t => t.month),
      datasets: [
        {
          label: 'Average Heart Rate (bpm)',
          data: trend.map(t => t.avgHR),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointRadius: 5,
        },
      ],
    };
  }, [rawRecords]);

  const exportToCSV = () => {
    if (!rawRecords.length) {
      alert('No data to export.');
      return;
    }
    const headers = [
      'created_at', 'patient_age', 'patient_gender', 'symptoms_chief',
      'symptoms_findings', 'medications', 'investigations', 'advice',
      'vitals_bp', 'vitals_hr', 'vitals_temp', 'vitals_weight'
    ];
    const rows = rawRecords.map(record => {
      const vitals = record.vitals || {};
      return [
        record.created_at || '',
        record.patient_age || '',
        record.patient_gender || '',
        record.symptoms_chief || '',
        record.symptoms_findings || '',
        record.medications || '',
        record.investigations || '',
        record.advice || '',
        vitals.bp || '',
        vitals.hr || '',
        vitals.temp || '',
        vitals.weight || '',
      ];
    });
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `research_data_${new Date().toISOString().slice(0, 19)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="text-slate-500">Loading research data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header with CSV export */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Research Data</h1>
          <p className="text-slate-500 text-sm">Anonymised clinical insights with visual analytics</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
        >
          📥 Save as CSV
        </button>
      </div>

      {/* Raw data table – first, scrollable */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 font-semibold text-slate-800">
          Raw Research Records
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Age</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Chief Complaint</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">BP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rawRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No research data yet. Complete prescriptions and contribute.
                  </td>
                </tr>
              ) : (
                rawRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{record.patient_age || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{record.patient_gender || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[250px] truncate">
                      {record.symptoms_chief || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{record.vitals?.bp || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{record.vitals?.hr || '—'} bpm</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="text-sm text-slate-500 font-medium">Total Cases</div>
          <div className="text-3xl font-bold text-slate-800 mt-1">{aggregates.totalCases}</div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="text-sm text-slate-500 font-medium">Gender Distribution</div>
          <div className="mt-2 space-y-1 text-sm">
            <div>♂ Male: {genderCounts.Male}</div>
            <div>♀ Female: {genderCounts.Female}</div>
            <div>⚧ Other: {genderCounts.Other}</div>
            <div>❓ Unknown: {genderCounts.Unknown}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="text-sm text-slate-500 font-medium">Most Common Symptom</div>
          <div className="text-lg font-semibold text-blue-600 mt-1 break-words">
            {aggregates.mostCommonSymptom}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="text-sm text-slate-500 font-medium">Clinical Insights</div>
          <div className="mt-2 space-y-1 text-sm">
            <div>❤️ Avg. Heart Rate: {aggregates.averageHeartRate ?? '—'} bpm</div>
            <div>🩺 High BP Readings: {bpData.datasets[0].data[1]}</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-md font-semibold text-slate-700 mb-4">Gender Distribution</h3>
          <Pie data={genderData} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-md font-semibold text-slate-700 mb-4">Blood Pressure Classification</h3>
          <Bar data={bpData} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-md font-semibold text-slate-700 mb-4">Top 5 Most Frequent Symptoms</h3>
          <Bar data={topSymptomsData} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-md font-semibold text-slate-700 mb-4">Average Heart Rate Over Time</h3>
          {heartRateTrendData.labels.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-400">No heart rate data available</div>
          ) : (
            <Line data={heartRateTrendData} />
          )}
        </div>
      </div>
    </div>
  );
}