import { useEffect } from 'react';

export default function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2700);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="animate-slidein fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-3 text-xs font-medium text-white shadow-2xl">
      <span className="text-green-400">✓</span>
      {msg}
    </div>
  );
}
