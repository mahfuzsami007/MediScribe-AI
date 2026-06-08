import { useState, useEffect } from 'react';

export default function WaveForm({ active }) {
  const [heights, setH] = useState([4, 6, 4, 8, 4, 6, 4, 6, 4]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setH(h => h.map(() => Math.random() * 22 + 4)), 100);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="flex items-center gap-1" style={{ height: 28 }}>
      {heights.map((v, i) => (
        <div key={i} className="rounded-sm bg-blue-600 transition-all duration-100" style={{ width: 3, height: active ? v : 4 }} />
      ))}
    </div>
  );
}