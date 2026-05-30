import { TEMPLATES } from '../data/mockData';

export default function TemplatesPage() {
  return (
    <div>
      <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-8 md:py-5">
        <h1 className="text-base md:text-[18px] font-bold tracking-tight text-slate-800">Prescription Templates</h1>
        <p className="mt-1 text-xs md:text-[12px] text-slate-400">Quick-start with clinical templates</p>
      </div>

      <div className="p-4 md:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {TEMPLATES.map(t => (
            <div key={t.title} className="cursor-pointer rounded-2xl border-[1.5px] border-slate-100 bg-white p-5 md:p-6 shadow-sm transition hover:border-blue-400 hover:shadow-md">
              <div className="mb-3 md:mb-4 text-2xl md:text-[28px]">{t.icon}</div>
              <h3 className="mb-2 text-sm md:text-[14px] font-bold tracking-tight text-slate-800">{t.title}</h3>
              <p className="text-xs md:text-[12px] leading-relaxed text-slate-500">{t.desc}</p>
              <p className="mt-3 text-[10px] md:text-[11px] font-medium text-slate-400">📊 {t.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}