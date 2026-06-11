import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getSession } from '../../lib/auth';

export default function AppLayout() {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        {/* No padding here – each page will handle its own inner padding */}
        <Outlet />
      </main>
    </div>
  );
}