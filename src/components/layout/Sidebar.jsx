import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { supabase, getSession, logout } from '../../lib/auth';

const NAV = [
  { path: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard'       },
  { path: '/history',     icon: Users,           label: 'Patient History'  },
  { path: '/templates',   icon: FileText,        label: 'Templates'        },
  { path: '/profile',     icon: Settings,        label: 'Profile Settings' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(true);
        setMobileOpen(false);
      } else {
        setOpen(false);
        setMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch profile for avatar and name
  useEffect(() => {
    const fetchProfile = async () => {
      const session = getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const name = profile?.full_name || 'Doctor';
  const specialty = profile?.speciality || 'Physician';
  const initials = name.replace('Dr. ', '').split(' ').map(w => w[0]).slice(0, 2).join('');

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) setOpen(!open);
    else setMobileOpen(!mobileOpen);
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    // Changed expanded width from w-64 (256px) to w-[220px]
    <div className={`flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300 ${open ? 'w-[220px]' : 'w-20'} ${mobileOpen ? 'fixed inset-y-0 left-0 z-50 w-[220px] shadow-xl' : ''}`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-5">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-[15px]">⚕</div>
          {(open || mobileOpen) && <span className="truncate text-[15px] font-bold text-slate-800">MediScribe AI</span>}
        </div>
        <button onClick={toggleSidebar} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200">
          {open || mobileOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = pathname === path || (path === '/dashboard' && pathname === '/prescription');
          return (
            <button
              key={path}
              onClick={() => { navigate(path); closeMobile(); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium transition-all ${
                active ? 'bg-blue-50 font-semibold text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Icon size={17} className="shrink-0" />
              {(open || mobileOpen) && <span className="truncate">{label}</span>}
            </button>
          );
        })}

        {/* Research Data link – visible to all authenticated users */}
        <button
          onClick={() => { navigate('/research'); closeMobile(); }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium transition-all ${
            pathname === '/research' ? 'bg-blue-50 font-semibold text-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
          }`}
        >
          <FileText size={17} className="shrink-0" />
          {(open || mobileOpen) && <span>Research Data</span>}
        </button>
      </nav>

      <div className="border-t border-slate-100 px-2 py-3 space-y-1">
        <button
          onClick={() => { navigate('/profile'); closeMobile(); }}
          className="flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition hover:bg-slate-100"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="avatar" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[12px] font-bold text-white">
              {initials}
            </div>
          )}
          {(open || mobileOpen) && (
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-slate-800">{name}</div>
              <div className="truncate text-[10px] text-slate-400">{specialty}</div>
            </div>
          )}
        </button>

        <button
          onClick={() => { logout(); closeMobile(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-medium text-red-500 transition hover:bg-red-50"
        >
          <LogOut size={17} className="shrink-0" />
          {(open || mobileOpen) && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {!mobileOpen && window.innerWidth < 1024 && (
        <button onClick={toggleSidebar} className="fixed left-4 top-4 z-40 rounded-lg bg-white p-2 shadow-md lg:hidden">
          <Menu size={20} />
        </button>
      )}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobile} />}
      {sidebarContent}
    </>
  );
}