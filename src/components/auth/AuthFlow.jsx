import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, manualLogin, register, getSession } from '../../lib/auth';
import { SPECIALTIES } from '../../data/mockData';

const validateReg = (v) => /^[A-Za-z]{2,4}-\d{4}-\d{4,6}$/.test(v);
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function StepDots({ steps, current }) {
  const idx = steps.indexOf(current);
  return (
    <div className="mb-8 flex items-center gap-1.5">
      {steps.map((s, i) => [
        <div
          key={s}
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: i === idx ? 22 : 8,
            background: i === idx ? '#2563eb' : i < idx ? '#16a34a' : '#e2e8f0',
          }}
        />,
        i < steps.length - 1 && (
          <div
            key={'l' + i}
            className="mx-1 h-0.5"
            style={{ width: 18, background: i < idx ? '#16a34a' : '#e2e8f0' }}
          />
        ),
      ])}
    </div>
  );
}

function FieldWrap({ label, error, children }) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export default function AuthFlow({ defaultMode = 'login' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(defaultMode === 'login' ? 'login' : 'register');
  const [resetSent, setResetSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [form, setForm] = useState({
    name: '',
    reg: '',
    specialty: '',
    email: '',
    password: '',
  });

  // Redirect if already logged in (cross‑tab)
  useEffect(() => {
    const session = getSession();
    if (session) {
      window.location.href = '/dashboard';
    }
  }, []);

  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      alert('Email confirmed! You can now log in.');
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = async () => {
    setLoginError('');
    const e = {};
    if (step === 'register') {
      if (!form.name.trim()) e.name = 'Full name required';
      if (!validateReg(form.reg)) e.reg = 'Format: MCI-2019-48823';
      if (!form.specialty) e.specialty = 'Select speciality';
      if (!validateEmail(form.email)) e.email = 'Valid email required';
      if (form.password.length < 8) e.password = 'Minimum 8 characters';
    } else {
      if (!validateEmail(form.email)) e.email = 'Valid email required';
      if (!form.password) e.password = 'Password required';
    }
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      if (step === 'register') {
        const { error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
              reg_number: form.reg,
              speciality: form.specialty,
            },
            emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
          },
        });
        if (error) throw error;
        setStep('checkEmail');
      } else {
        await manualLogin(form.email, form.password);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      if (step === 'login') {
        let msg = err.message;
        if (msg === 'Email not confirmed')
          msg = 'Please confirm your email address (check spam folder).';
        else if (msg === 'Invalid login credentials')
          msg = 'Incorrect email or password.';
        setLoginError(msg);
      } else {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(form.email)) {
      alert('Enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (err) {
      alert(`Failed to send reset email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset password confirmation screen
  if (resetSent) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <div
          className="hidden w-80 flex-col justify-center bg-gradient-to-br from-slate-900 to-blue-950 px-12 py-16 text-white md:flex"
          style={{ minWidth: 340 }}
        >
          <div className="mb-14 flex items-center gap-3 text-[18px] font-bold">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base">⚕</div>
            MediScribe AI
          </div>
          <h2 className="mb-4 text-[28px] font-bold leading-snug tracking-tight">
            Transforming how doctors document patient care.
          </h2>
          <p className="text-[14px] font-light leading-relaxed text-slate-400">
            Join 10,000+ physicians saving 2+ hours daily with AI-powered voice
            prescriptions.
          </p>
          <div className="mt-12 space-y-4">
            {[
              '🔒 HIPAA-compliant & secure',
              '⚡ Any language, any accent',
              '📊 Auto-generates structured EMR',
            ].map((f) => (
              <div key={f} className="text-[13px] text-slate-300">
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl text-center">
            <div className="animate-pop mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
              📧
            </div>
            <h2 className="mb-2 text-[22px] font-bold tracking-tight">
              Check Your Email
            </h2>
            <p className="mb-4 text-[13px] leading-relaxed text-slate-500">
              We sent a password reset link to <strong>{form.email}</strong>.
              <br />
              Follow the instructions in the email to reset your password.
            </p>
            <button
              onClick={() => {
                setResetSent(false);
                setForm((p) => ({ ...p, password: '' }));
              }}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-[14px] font-bold text-white hover:bg-blue-700"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main login / register form
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left panel */}
      <div
        className="hidden w-80 flex-col justify-center bg-gradient-to-br from-slate-900 to-blue-950 px-12 py-16 text-white md:flex"
        style={{ minWidth: 340 }}
      >
        <div className="mb-14 flex items-center gap-3 text-[18px] font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-base">⚕</div>
          MediScribe AI
        </div>
        <h2 className="mb-4 text-[28px] font-bold leading-snug tracking-tight">
          Transforming how doctors document patient care.
        </h2>
        <p className="text-[14px] font-light leading-relaxed text-slate-400">
          Join 10,000+ physicians saving 2+ hours daily with AI-powered voice
          prescriptions.
        </p>
        <div className="mt-12 space-y-4">
          {[
            '🔒 HIPAA-compliant & secure',
            '⚡ Any language, any accent',
            '📊 Auto-generates structured EMR',
          ].map((f) => (
            <div key={f} className="text-[13px] text-slate-300">
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl">
          {step === 'login' && (
            <>
              <StepDots steps={['login']} current="login" />
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-800">
                Welcome back, Doctor
              </h2>
              <p className="mb-8 text-[13px] leading-relaxed text-slate-500">
                Sign in to your MediScribe account
              </p>

              <FieldWrap label="Email Address" error={errors.email}>
                <input
                  type="email"
                  className={`ms-input ${errors.email ? 'error' : ''}`}
                  value={form.email}
                  onChange={set('email')}
                  placeholder="doctor@hospital.com"
                />
              </FieldWrap>
              <FieldWrap label="Password" error={errors.password}>
                <input
                  type="password"
                  className={`ms-input ${errors.password ? 'error' : ''}`}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                />
              </FieldWrap>

              <div className="text-right mb-4">
                <button
                  onClick={handleForgotPassword}
                  className="text-[12px] text-blue-600 hover:underline"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>

              {loginError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-[13px] font-medium text-red-600 border border-red-200">
                  ⚠️ {loginError}
                </div>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 text-[14px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
              <p className="mt-5 text-center text-[13px] text-slate-500">
                New here?{' '}
                <button
                  onClick={() => setStep('register')}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Register as Doctor
                </button>
              </p>
            </>
          )}

          {step === 'register' && (
            <>
              <StepDots steps={['register']} current="register" />
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-800">
                Doctor Registration
              </h2>
              <p className="mb-8 text-[13px] leading-relaxed text-slate-500">
                Create your professional clinical account
              </p>

              <FieldWrap label="Full Name" error={errors.name}>
                <input
                  className={`ms-input ${errors.name ? 'error' : ''}`}
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Dr. Full Name"
                />
              </FieldWrap>

              <div className="mb-5 grid grid-cols-2 gap-4">
                <FieldWrap label="Medical Reg. No." error={errors.reg}>
                  <input
                    className={`ms-input ${errors.reg ? 'error' : ''}`}
                    value={form.reg}
                    onChange={set('reg')}
                    placeholder="MCI-2019-48823"
                  />
                </FieldWrap>
                <FieldWrap label="Speciality" error={errors.specialty}>
                  <select
                    className={`ms-input ${errors.specialty ? 'error' : ''}`}
                    value={form.specialty}
                    onChange={set('specialty')}
                  >
                    <option value="">Select...</option>
                    {SPECIALTIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </FieldWrap>
              </div>

              <FieldWrap label="Email Address" error={errors.email}>
                <input
                  type="email"
                  className={`ms-input ${errors.email ? 'error' : ''}`}
                  value={form.email}
                  onChange={set('email')}
                  placeholder="doctor@hospital.com"
                />
              </FieldWrap>
              <FieldWrap label="Password" error={errors.password}>
                <input
                  type="password"
                  className={`ms-input ${errors.password ? 'error' : ''}`}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Minimum 8 characters"
                />
              </FieldWrap>

              <button
                onClick={submit}
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 text-[14px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Creating account…' : 'Register →'}
              </button>
              <p className="mt-5 text-center text-[13px] text-slate-500">
                Already registered?{' '}
                <button
                  onClick={() => setStep('login')}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Sign In
                </button>
              </p>
            </>
          )}

          {step === 'checkEmail' && (
            <div className="py-8 text-center">
              <div className="animate-pop mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
                📧
              </div>
              <h2 className="mb-2 text-[22px] font-bold tracking-tight">
                Check Your Email
              </h2>
              <p className="mb-4 text-[13px] leading-relaxed text-slate-500">
                We sent a confirmation link to <strong>{form.email}</strong>.
                <br />
                Click the link in the email to activate your account, then you
                can log in.
              </p>
              <button
                onClick={() => setStep('login')}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-[14px] font-bold text-white hover:bg-blue-700"
              >
                Go to Sign In →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}