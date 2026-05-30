export default function StatusPill({ status }) {
  const styles = {
    done:    'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${styles[status] || ''}`}>
      {status === 'done' ? '✓ Done' : '⏳ Pending'}
    </span>
  );
}
