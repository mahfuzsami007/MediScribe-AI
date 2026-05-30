export default function RxStepper({ steps, current, done, preview, onStepClick }) {
  return (
    <div className="flex shrink-0 items-center overflow-x-auto border-b border-slate-200 bg-white px-8">
      {steps.map((s, i) => {
        const isDone   = done.has(i);
        const isActive = i === current && !preview;
        return (
          <div key={s.key} className="flex items-center">
            {i > 0 && (
              <div className="h-0.5 w-8 shrink-0 transition-colors duration-300"
                style={{ background: done.has(i - 1) ? '#16a34a' : '#e2e8f0' }} />
            )}
            <button onClick={() => onStepClick(i)}
              className={`flex items-center gap-2 border-b-2 px-3 py-4 text-[12px] font-medium whitespace-nowrap transition-all ${
                isActive  ? 'border-blue-600 font-bold text-blue-600' :
                isDone    ? 'border-transparent font-semibold text-green-600 cursor-pointer' :
                            'border-transparent text-slate-400 cursor-default'
              }`}>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300"
                style={{
                  borderColor: isActive ? '#2563eb' : isDone ? '#16a34a' : '#e2e8f0',
                  background:  isActive ? '#2563eb' : isDone ? '#16a34a' : 'white',
                  color:       isActive || isDone ? 'white' : '#94a3b8',
                }}>
                {isDone ? '✓' : i + 1}
              </div>
              {s.label}
            </button>
          </div>
        );
      })}

      {/* Preview step */}
      <div className="flex items-center">
        <div className="h-0.5 w-8 shrink-0 transition-colors duration-300"
          style={{ background: preview ? '#16a34a' : '#e2e8f0' }} />
        <div className={`flex items-center gap-2 border-b-2 px-3 py-4 text-[12px] whitespace-nowrap transition-all ${
          preview ? 'border-blue-600 font-bold text-blue-600' : 'border-transparent font-medium text-slate-400'
        }`}>
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all"
            style={{
              borderColor: preview ? '#2563eb' : '#e2e8f0',
              background:  preview ? '#2563eb' : 'white',
              color:       preview ? 'white' : '#94a3b8',
            }}>
            ✓
          </div>
          Preview & Share
        </div>
      </div>
    </div>
  );
}
