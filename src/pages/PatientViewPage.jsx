import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { decodePrescriptionData } from '../lib/urlEncoder';

export default function PatientViewPage() {
  const [searchParams] = useSearchParams();
  const [prescription, setPrescription] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const encoded = searchParams.get('data');
      if (!encoded) throw new Error('No prescription data provided.');
      const decoded = decodePrescriptionData(encoded);
      setPrescription(decoded);
    } catch (err) {
      console.error(err);
      setError('Invalid or corrupted prescription link.');
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">Loading prescription...</div>
      </div>
    );
  }

  const { patient, vitals, symptoms, medications, investigations, habits } = prescription;
  const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  const pid = `RX-${Date.now().toString().slice(-6)}`;

  return (
    <div className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
      <div className="max-w-2xl mx-auto">
        {/* Print / PDF button – hidden when printing */}
        <div className="text-center mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold shadow hover:bg-blue-700"
          >
            📄 Download / Print PDF
          </button>
        </div>

        {/* Prescription card – same style as doctor preview, but standalone */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 print:shadow-none print:border-0">
          <div className="bg-blue-600 px-5 py-4 text-white">
            <h1 className="text-xl font-bold">MediScribe AI</h1>
            <p className="text-blue-100 text-sm">Prescription • {today}</p>
          </div>

          <div className="p-5">
            {/* Doctor info – static or from prescription? For simplicity, show a generic doctor */}
            {/* Since no login, we use placeholders; you could also pass doctor info via URL if needed */}
            <div className="border-b pb-3 mb-4">
              <h3 className="font-bold text-slate-800">Prescribing Physician</h3>
              <p className="text-slate-500 text-sm">MediScribe Clinic · +880 1700-000000</p>
            </div>

            {/* Patient summary grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl mb-4 text-sm">
              <div><span className="font-semibold">Patient:</span> {patient?.name || '—'}</div>
              <div><span className="font-semibold">Age/Gender:</span> {patient?.age || '—'} / {patient?.gender || '—'}</div>
              <div><span className="font-semibold">Date:</span> {today}</div>
              <div><span className="font-semibold">Rx No.:</span> {pid}</div>
              <div><span className="font-semibold">BP:</span> {vitals?.bp || '—'}</div>
              <div><span className="font-semibold">Weight:</span> {vitals?.weight || '—'}</div>
              <div><span className="font-semibold">Temp:</span> {vitals?.temp || '—'}</div>
              <div><span className="font-semibold">HR:</span> {vitals?.hr || '—'}</div>
            </div>

            {/* Symptoms */}
            {symptoms?.chief && (
              <div className="mb-3">
                <div className="text-xs font-bold uppercase text-slate-400">Chief Complaint</div>
                <div className="text-sm">{symptoms.chief}</div>
              </div>
            )}
            {symptoms?.findings && (
              <div className="mb-3">
                <div className="text-xs font-bold uppercase text-slate-400">Examination Findings</div>
                <div className="text-sm">{symptoms.findings}</div>
              </div>
            )}

            {/* Medications */}
            {medications?.meds && (
              <div className="mb-3">
                <div className="text-sm font-bold text-blue-600 flex items-center gap-1">℞ Medications</div>
                <pre className="bg-amber-50 p-3 rounded-lg text-sm whitespace-pre-wrap font-mono mt-1">{medications.meds}</pre>
              </div>
            )}

            {/* Investigations */}
            {investigations?.tests && (
              <div className="mb-3">
                <div className="text-xs font-bold uppercase text-slate-400">Investigations</div>
                <div className="text-sm">{investigations.tests}</div>
              </div>
            )}

            {/* Advice */}
            {habits?.advice && (
              <div className="mb-3">
                <div className="text-xs font-bold uppercase text-slate-400">Advice</div>
                <div className="text-sm">{habits.advice}</div>
              </div>
            )}

            <div className="border-t pt-3 mt-2 text-xs text-slate-400 text-center">
              This is an AI‑generated prescription. Please verify before dispensing.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}