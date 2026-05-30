import { useState, useEffect, useRef } from 'react';
import { supabase, getSession } from '../lib/auth';
import { SPECIALTIES } from '../data/mockData';

function SectionTitle({ children }) {
  return <div className="mb-5 mt-8 border-t border-slate-100 pt-6"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{children}</p></div>;
}
function FieldGroup({ label, children }) {
  return <div className="mb-5"><label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>{children}</div>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    reg_number: '',
    speciality: '',
    email: '',
    clinic_name: '',
    clinic_phone: '',
    clinic_address: '',
  });
  const [saved, setSaved] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();

  useEffect(() => {
    const fetchProfile = async () => {
      const session = getSession();
      if (session?.user?.id) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
        setForm({
          full_name: data?.full_name || '',
          reg_number: data?.reg_number || '',
          speciality: data?.speciality || '',
          email: session.user.email || '',
          clinic_name: data?.clinic_name || '',
          clinic_phone: data?.clinic_phone || '',
          clinic_address: data?.clinic_address || '',
        });
        setPhoto(data?.avatar_url || null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const save = async () => {
    const session = getSession();
    if (!session?.user?.id) return;
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name,
      speciality: form.speciality,
      clinic_name: form.clinic_name,
      clinic_phone: form.clinic_phone,
      clinic_address: form.clinic_address,
      // reg_number and email are NOT updated
    }).eq('id', session.user.id);
    if (error) alert(error.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 102400) return alert('Image must be ≤100KB');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = new Image();
      img.onload = async () => {
        if (img.width !== 100 || img.height !== 100) return alert('Image must be exactly 100x100 pixels');
        const session = getSession();
        if (session?.user?.id) {
          await supabase.from('profiles').update({ avatar_url: ev.target.result }).eq('id', session.user.id);
          setPhoto(ev.target.result);
          alert('Avatar updated');
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div>
      <div className="border-b border-slate-200 bg-white px-8 py-5">
        <h1 className="text-[18px] font-bold tracking-tight text-slate-800">Profile Settings</h1>
        <p className="mt-1 text-[12px] text-slate-400">Manage your professional information</p>
      </div>
      <div className="p-8">
        <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Avatar and name section */}
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div onClick={() => fileRef.current.click()} className="group relative flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-[10px] font-semibold text-slate-400 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-500">
              {photo ? <img src={photo} alt="profile" className="absolute inset-0 h-full w-full rounded-full object-cover" /> : <><span className="text-2xl">📸</span><span className="mt-1">Upload</span></>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <div>
              <p className="text-[20px] font-bold tracking-tight text-slate-800">{form.full_name}</p>
              <p className="mt-1 text-[13px] text-slate-500">{form.speciality}</p>
              <span className="mt-2 inline-block rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">Reg: {form.reg_number}</span>
            </div>
          </div>

          <SectionTitle>Professional Details</SectionTitle>
          <div className="grid grid-cols-2 gap-5">
            <FieldGroup label="Full Name">
              <input className="ms-input" value={form.full_name} onChange={set('full_name')} />
            </FieldGroup>
            <FieldGroup label="Speciality">
              <select className="ms-input" value={form.speciality} onChange={set('speciality')}>
                {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FieldGroup>
          </div>
          <FieldGroup label="Medical Registration Number">
            <input className="ms-input bg-slate-100" value={form.reg_number} disabled />
          </FieldGroup>
          <FieldGroup label="Email Address">
            <input type="email" className="ms-input bg-slate-100" value={form.email} disabled />
          </FieldGroup>

          <SectionTitle>Clinic Information</SectionTitle>
          <div className="grid grid-cols-2 gap-5">
            <FieldGroup label="Clinic Name">
              <input className="ms-input" value={form.clinic_name} onChange={set('clinic_name')} placeholder="e.g. MediScribe Clinic" />
            </FieldGroup>
            <FieldGroup label="Contact Number">
              <input className="ms-input" value={form.clinic_phone} onChange={set('clinic_phone')} placeholder="+880 1700-000000" />
            </FieldGroup>
          </div>
          <FieldGroup label="Clinic Address">
            <textarea className="ms-textarea" rows="2" value={form.clinic_address} onChange={set('clinic_address')} placeholder="Full clinic address" />
          </FieldGroup>

          <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-6">
            <button onClick={save} className="rounded-xl bg-blue-600 px-7 py-3 text-[13px] font-bold text-white transition hover:bg-blue-700">Save Changes</button>
            {saved && <span className="animate-fadein flex items-center gap-1.5 text-[12px] font-semibold text-green-600">✓ Saved successfully</span>}
          </div>
        </div>
      </div>
    </div>
  );
}