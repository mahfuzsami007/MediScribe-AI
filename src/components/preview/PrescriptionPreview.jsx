export default function PrescriptionPreview({ data, doctor, fullPage = false }) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const pid   = `RX-${Date.now().toString().slice(-6)}`;

  const Section = ({ title, children }) => (
    <div className={fullPage ? 'mb-4 md:mb-5' : 'mb-2 md:mb-3'}>
      <div className={`mb-1.5 flex items-center gap-2 font-bold uppercase tracking-wider text-slate-400 ${fullPage ? 'text-[9px] md:text-[10px]' : 'text-[8px] md:text-[9px]'}`}>
        {title}
        <div className="flex-1 border-t border-slate-100" />
      </div>
      <div className={`leading-relaxed whitespace-pre-wrap text-slate-700 ${fullPage ? 'text-xs md:text-[13px]' : 'text-[10px] md:text-[11px]'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${fullPage ? 'shadow-md' : ''}`}>
      <div className={`flex items-center gap-2 md:gap-3 bg-blue-600 ${fullPage ? 'px-5 py-4 md:px-8 md:py-5' : 'px-4 py-3 md:px-5 md:py-3.5'}`}>
        <span className={fullPage ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}>📋</span>
        <div>
          <h4 className={`font-bold text-white ${fullPage ? 'text-sm md:text-[16px]' : 'text-xs md:text-[13px]'}`}>
            {fullPage ? 'Prescription' : 'Live Preview'}
          </h4>
          <p className={`text-blue-200 ${fullPage ? 'text-[10px] md:text-[12px]' : 'text-[8px] md:text-[10px]'}`}>
            {fullPage ? 'Review before sharing' : 'Updates as you speak'}
          </p>
        </div>
      </div>

      <div id="rx-doc-print" className={fullPage ? 'p-6 md:p-9' : 'p-4 md:p-5'}>
        <div className={`border-b-2 border-blue-600 ${fullPage ? 'mb-5 pb-4 md:mb-6 md:pb-5' : 'mb-3 pb-3'}`}>
          <h3 className={`font-bold text-slate-800 ${fullPage ? 'text-base md:text-[18px]' : 'text-sm md:text-[13px]'}`}
            style={{ fontFamily: 'IBM Plex Serif, serif' }}>
            {doctor.name}
          </h3>
          <p className={`mt-0.5 text-slate-500 ${fullPage ? 'text-[11px] md:text-[12px]' : 'text-[9px] md:text-[10px]'}`}>
            {doctor.specialty} · Reg: {doctor.reg}
          </p>
          <p className={`text-slate-500 ${fullPage ? 'text-[11px] md:text-[12px]' : 'text-[9px] md:text-[10px]'}`}>
            MediScribe Clinic · +880 1700-000000
          </p>
        </div>

        <div className={`mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 rounded-xl bg-slate-50 ${fullPage ? 'p-4 md:p-4' : 'p-3'}`}>
          {[
            { l: 'Patient',    v: data.patient?.name || '—' },
            { l: 'Age/Gender', v: `${data.patient?.age ? data.patient.age + 'Y' : '—'} / ${data.patient?.gender || '—'}` },
            { l: 'Date',       v: today },
            { l: 'BP',         v: data.vitals?.bp     || '—' },
            { l: 'Weight',     v: data.vitals?.weight || '—' },
            { l: 'Rx No.',     v: pid },
          ].map(item => (
            <div key={item.l}>
              <span className="block text-[7px] md:text-[8px] font-bold uppercase tracking-wider text-slate-400">{item.l}</span>
              <strong className={`font-semibold text-slate-800 ${fullPage ? 'text-xs md:text-[13px]' : 'text-[10px] md:text-[11px]'}`}>{item.v}</strong>
            </div>
          ))}
        </div>

        {data.symptoms?.chief      && <Section title="Chief Complaints">{data.symptoms.chief}</Section>}
        {data.symptoms?.findings   && <Section title="Examination">{data.symptoms.findings}</Section>}

        {data.medications?.meds && (
          <div className={fullPage ? 'mb-5' : 'mb-3'}>
            <span className={`block font-semibold italic text-blue-600 ${fullPage ? 'mb-2 text-2xl md:text-[28px]' : 'mb-1 text-xl md:text-[18px]'}`}
              style={{ fontFamily: 'IBM Plex Serif, serif' }}>℞</span>
            <div className={`leading-relaxed whitespace-pre-wrap text-slate-700 ${fullPage ? 'text-xs md:text-[13px]' : 'text-[10px] md:text-[11px]'}`}>
              {data.medications.meds}
            </div>
          </div>
        )}

        {data.investigations?.tests && <Section title="Investigations">{data.investigations.tests}</Section>}
        {data.habits?.advice        && <Section title="Advice">{data.habits.advice}</Section>}

        <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-t border-slate-200 ${fullPage ? 'mt-5 pt-5 md:mt-6 md:pt-6' : 'mt-4 pt-4'}`}>
          <div className={`text-slate-400 ${fullPage ? 'text-[10px] md:text-[11px]' : 'text-[8px] md:text-[9px]'}`}>
            Date: {today}<br />
            <span className={fullPage ? 'text-[9px] md:text-[10px]' : 'text-[7px] md:text-[8px]'}>Next visit: 7 days</span>
          </div>
          <div className={`border-t-[1.5px] border-slate-700 pt-2 text-center text-slate-500 ${fullPage ? 'w-36 md:w-44 text-[10px] md:text-[11px]' : 'w-24 md:w-28 text-[8px] md:text-[9px]'}`}>
            {doctor.name}<br />
            <span className={fullPage ? 'text-[8px] md:text-[9px]' : 'text-[7px] md:text-[8px]'}>{doctor.specialty}</span>
          </div>
        </div>
      </div>

      <div className={`border-t border-slate-100 ${fullPage ? 'p-6 md:px-9 md:py-6' : 'p-4 md:px-5 md:py-4'}`}>
        {fullPage && <p className="mb-4 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400">Share Prescription</p>}
        <div className={`gap-3 ${fullPage ? 'grid grid-cols-1 sm:grid-cols-3' : 'flex flex-col sm:flex-row sm:gap-3'}`}>
          {[
            { label: '📄 Save as PDF', cls: 'border-red-200 bg-red-50 text-red-600', action: () => window.print() },
            { label: '💬 WhatsApp',    cls: 'border-green-200 bg-green-50 text-green-700', action: () => {} },
            { label: '✉️  Email',      cls: 'border-blue-200 bg-blue-50 text-blue-600', action: () => {} },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[11px] md:text-[12px] font-bold transition hover:brightness-95 ${btn.cls}`}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}