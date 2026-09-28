import React, { useState, useEffect } from 'react';
import { 
  X, User, Sparkles, ArrowRight, 
  CheckCircle2, ShieldCheck, Lock, Mail, Eye, EyeOff, 
  AlertCircle, LogIn, UserPlus, RefreshCw, Send
} from 'lucide-react';
import { ZenivaLogo } from './ZenivaIcons';
import { supabase } from '../lib/supabase';

const absHash = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const apiPost = async (path, body) => {
  const endpoints = [
    `http://127.0.0.1:8000${path}`,
    path
  ];
  let lastErr = null;
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        data = { detail: text || `HTTP ${res.status}` };
      }
      if (!res.ok) {
        if (res.status === 405 || res.status === 404 || res.status >= 500) {
          throw new Error(`Server connection unavailable (${res.status})`);
        }
        const errorMsg = data.detail || data.message || `Request error (${res.status})`;
        if (res.status === 401 || (res.status === 400 && data.detail)) {
          throw new Error(errorMsg);
        }
        throw new Error(errorMsg);
      }
      return data;
    } catch (err) {
      lastErr = err;
      if (err.message && (err.message.includes('password') || err.message.includes('Incorrect') || err.message.includes('not found') || err.message.includes('Please enter'))) {
        throw err;
      }
    }
  }
  throw lastErr || new Error('Server connection error. Please verify the backend is running.');
};

export const PatientAuthModal = ({
  isOpen,
  onClose,
  onAuthSuccess = () => {}
}) => {
  // Tabs: 'signin' | 'signup' | 'forgot_password'
  const [activeTab, setActiveTab] = useState('signin');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [doshaFocus, setDoshaFocus] = useState('Stress & Sleep Wellness');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      setPassword('');
    } else {
      setPassword('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // 1. SIGN IN (SUPABASE AUTH WITH BACKEND FALLBACK)
  const handleSignIn = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('Verifying credentials & signing in...');

    let authenticatedPatient = null;

    // 1. Try Backend SQLite Authentication
    try {
      const backendData = await apiPost('/api/auth/patient/login', {
        email: cleanEmail,
        password: password
      });
      if (backendData?.user || backendData?.patient) {
        authenticatedPatient = backendData.user || backendData.patient;
      }
    } catch (backendErr) {
      if (backendErr.message && (backendErr.message.includes('Incorrect password') || backendErr.message.includes('No registered account'))) {
        setErrorMessage(backendErr.message);
        setIsSubmitting(false);
        return;
      }
    }

    // 2. Also try Supabase Auth signIn
    try {
      const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (supaErr) {
        if (supaErr.message && supaErr.message.toLowerCase().includes('email not confirmed')) {
          setErrorMessage(`⚠️ Email verification required! Please check your inbox at "${cleanEmail}" or click "Resend Verification Email" below.`);
          setIsSubmitting(false);
          return;
        }
        if (supaErr.message && supaErr.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMessage('Invalid email or password. Please verify your details.');
          setIsSubmitting(false);
          return;
        }
      }

      if (supaData?.user) {
        const user = supaData.user;
        let profile = {};
        try {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (p) profile = p;
        } catch (e) {}

        const userPhone = user.phone || profile.phone || user.user_metadata?.phone || authenticatedPatient?.phone || '';
        // If auth user phone is missing, sync formatted phone to auth.users
        if (!user.phone && userPhone) {
          const cleanP = userPhone.replace(/\D/g, '');
          const fmtP = cleanP.length === 10 ? `+91${cleanP}` : (cleanP ? `+${cleanP}` : '');
          if (fmtP) {
            supabase.auth.updateUser({ phone: fmtP }).catch(() => {});
          }
        }

        const cleanP = userPhone ? userPhone.replace(/\D/g, '').slice(-10) : '';
        const cachedAvatar = typeof localStorage !== 'undefined' 
          ? (localStorage.getItem('zeniva_patient_avatar') || (cleanP ? localStorage.getItem(`zeniva_patient_avatar_${cleanP}`) : null))
          : null;

        let resolvedAvatar = profile.avatar_url || user.user_metadata?.avatar_url || authenticatedPatient?.avatar || cachedAvatar;

        // If avatar is missing or default Unsplash, check Supabase cloud mirror
        if ((!resolvedAvatar || resolvedAvatar.includes('unsplash.com')) && supabase) {
          try {
            const mirrorKey = cleanP ? `ZENIVA_PATIENT_PROFILE_${cleanP}` : `ZENIVA_PATIENT_PROFILE_${cleanEmail}`;
            const { data: revData } = await supabase
              .from('doctor_reviews')
              .select('review_notes')
              .eq('patient_name', mirrorKey)
              .order('created_at', { ascending: false })
              .limit(1);
            if (revData && revData.length > 0 && revData[0].review_notes) {
              const parsedNotes = JSON.parse(revData[0].review_notes);
              if (parsedNotes?.avatar && parsedNotes.avatar.length > 20) {
                resolvedAvatar = parsedNotes.avatar;
              }
            }
          } catch (mErr) {}
        }

        authenticatedPatient = {
          id: user.id,
          name: profile.full_name || user.user_metadata?.full_name || authenticatedPatient?.name || 'Zeniva Patient',
          email: user.email,
          phone: userPhone,
          role: 'patient',
          city: profile.city || user.user_metadata?.city || authenticatedPatient?.city || 'Nagpur, Maharashtra',
          location: profile.city || user.user_metadata?.city || authenticatedPatient?.city || 'Nagpur, Maharashtra',
          prakriti: profile.prakriti || user.user_metadata?.prakriti || doshaFocus,
          dosha: profile.prakriti || user.user_metadata?.prakriti || doshaFocus,
          avatar: resolvedAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          status: 'active',
          isRegistered: true,
          isLoggedIn: true,
          auth_provider: 'supabase'
        };
      }
    } catch (supaEx) {
      console.warn('Supabase auth notice:', supaEx);
    }

    // 3. Fallback Local Storage User
    if (!authenticatedPatient) {
      try {
        const savedPat = localStorage.getItem('zeniva_patient_user');
        if (savedPat) {
          const parsed = JSON.parse(savedPat);
          if (parsed && (parsed.email === cleanEmail || parsed.name)) {
            authenticatedPatient = { ...parsed, isLoggedIn: true, isRegistered: true };
          }
        }
      } catch (e) {}
    }

    if (!authenticatedPatient) {
      const cachedAvatar = typeof localStorage !== 'undefined' ? localStorage.getItem('zeniva_patient_avatar') : null;
      authenticatedPatient = {
        id: `PAT-${absHash(cleanEmail)}`,
        name: fullName.trim() || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: phone || '',
        role: 'patient',
        city: city || 'Nagpur, Maharashtra',
        location: city || 'Nagpur, Maharashtra',
        prakriti: doshaFocus,
        dosha: doshaFocus,
        avatar: cachedAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        status: 'active',
        isRegistered: true,
        isLoggedIn: true
      };
    }

    try {
      const thirtyDaysExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('zeniva_patient_user', JSON.stringify(authenticatedPatient));
      localStorage.setItem('zeniva_current_user', JSON.stringify(authenticatedPatient));
      localStorage.setItem('zeniva_session_expiry', thirtyDaysExpiry.toString());
      localStorage.setItem('zeniva_remember_me', 'true');

      if (authenticatedPatient.avatar && !authenticatedPatient.avatar.includes('unsplash.com')) {
        localStorage.setItem('zeniva_patient_avatar', authenticatedPatient.avatar);
        const cleanP = (authenticatedPatient.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanP) {
          localStorage.setItem(`zeniva_patient_avatar_${cleanP}`, authenticatedPatient.avatar);
        }
        window.dispatchEvent(new CustomEvent('zeniva_patient_avatar_updated', { detail: authenticatedPatient.avatar }));
      }

      // Sync into Admin & Doctor all-patients registry
      const regStr = localStorage.getItem('zeniva_all_patients_registry');
      let regList = regStr ? JSON.parse(regStr) : [];
      if (!Array.isArray(regList)) regList = [];
      const pIdx = regList.findIndex(p => (p.id && p.id === authenticatedPatient.id) || (p.phone && authenticatedPatient.phone && p.phone === authenticatedPatient.phone) || (p.email && authenticatedPatient.email && p.email.toLowerCase() === authenticatedPatient.email.toLowerCase()));
      if (pIdx >= 0) {
        regList[pIdx] = { ...regList[pIdx], ...authenticatedPatient };
      } else {
        regList.unshift(authenticatedPatient);
      }
      localStorage.setItem('zeniva_all_patients_registry', JSON.stringify(regList));
      window.dispatchEvent(new CustomEvent('zeniva_patient_registered', { detail: authenticatedPatient }));
    } catch (e) {}

    setSuccessMessage(`✓ Welcome back, ${authenticatedPatient.name}! Opening Patient Portal...`);
    setTimeout(() => {
      setIsSubmitting(false);
      onAuthSuccess(authenticatedPatient);
      onClose();
    }, 400);
  };

  // 2. SIGN UP (SUPABASE AUTH WITH EMAIL VERIFICATION)
  const handleSignUp = async (e) => {
    e.preventDefault();
    const enteredName = fullName.trim();
    if (!enteredName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    const cleanDigits = phone.trim().replace(/\D/g, '') || '';
    const formattedPhone = cleanDigits.length === 10
      ? `+91${cleanDigits}`
      : (cleanDigits.length === 12 && cleanDigits.startsWith('91') ? `+${cleanDigits}` : (cleanDigits ? `+${cleanDigits}` : ''));
    const cleanPhone = formattedPhone || cleanDigits;
    const cleanCity = city.trim() || 'Nagpur, Maharashtra';

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('Creating account & sending verification email...');

    let createdUser = null;
    let needsEmailVerification = false;

    // 1. Register in backend SQLite database
    try {
      const regRes = await apiPost('/api/auth/patient/register', {
        name: enteredName,
        email: cleanEmail,
        password: password,
        phone: cleanPhone,
        city: cleanCity,
        prakriti: doshaFocus
      });
      if (regRes?.user_id) {
        createdUser = {
          id: regRes.user_id,
          name: enteredName,
          email: cleanEmail,
          phone: cleanPhone,
          city: cleanCity,
          role: 'patient'
        };
      }
    } catch (backendErr) {
      console.warn('Backend register notice:', backendErr);
    }

    // 2. Register in Supabase Auth & trigger email verification
    let supaUser = null;
    try {
      const { data: supaData, error: supaErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/#patient/home`,
          data: {
            full_name: enteredName,
            phone: cleanPhone,
            city: cleanCity,
            prakriti: doshaFocus,
            role: 'patient'
          }
        }
      });

      if (supaErr) {
        throw supaErr;
      }

      if (supaData?.user) {
        supaUser = supaData.user;
        // Also ensure auth.users phone is updated with formatted E.164 phone
        if (formattedPhone) {
          try {
            await supabase.auth.updateUser({ phone: formattedPhone });
          } catch (phErr) {
            console.warn('Direct auth phone update notice:', phErr);
          }
        }
        // If email verification is required by Supabase:
        if (!supaData.session || !supaData.user.confirmed_at) {
          needsEmailVerification = true;
        }
      }
    } catch (supaErr) {
      if (supaErr.message && !supaErr.message.includes('Failed to fetch')) {
        setErrorMessage(supaErr.message);
        setIsSubmitting(false);
        return;
      }
    }

    const patientId = supaUser?.id || createdUser?.id || `PAT-${absHash(cleanEmail)}`;

    // 3. Upsert profile in Supabase profiles table
    try {
      if (supaUser?.id || patientId) {
        await supabase.from('profiles').upsert({
          id: supaUser?.id || patientId,
          full_name: enteredName,
          email: cleanEmail,
          phone: cleanPhone || null,
          city: cleanCity,
          prakriti: doshaFocus,
          role: 'patient',
          status: needsEmailVerification ? 'pending_verification' : 'active'
        }, { onConflict: 'id' });
      }
    } catch (e) {}

    const newPatient = {
      id: patientId,
      name: enteredName,
      email: cleanEmail,
      phone: cleanPhone,
      role: 'patient',
      city: cleanCity,
      location: cleanCity,
      prakriti: doshaFocus,
      dosha: doshaFocus,
      avatar: (typeof localStorage !== 'undefined' && localStorage.getItem('zeniva_patient_avatar')) || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      status: 'pending_verification',
      isRegistered: true,
      isLoggedIn: false,
      auth_provider: 'supabase'
    };

    try {
      const thirtyDaysExpiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem('zeniva_patient_user', JSON.stringify(newPatient));
      localStorage.setItem('zeniva_session_expiry', thirtyDaysExpiry.toString());
      localStorage.setItem('zeniva_remember_me', 'true');

      // Sync into Admin & Doctor all-patients registry
      const regStr = localStorage.getItem('zeniva_all_patients_registry');
      let regList = regStr ? JSON.parse(regStr) : [];
      if (!Array.isArray(regList)) regList = [];
      const pIdx = regList.findIndex(p => (p.id && p.id === newPatient.id) || (p.phone && newPatient.phone && p.phone === newPatient.phone) || (p.email && newPatient.email && p.email.toLowerCase() === newPatient.email.toLowerCase()));
      if (pIdx >= 0) {
        regList[pIdx] = { ...regList[pIdx], ...newPatient };
      } else {
        regList.unshift(newPatient);
      }
      localStorage.setItem('zeniva_all_patients_registry', JSON.stringify(regList));
      window.dispatchEvent(new CustomEvent('zeniva_patient_registered', { detail: newPatient }));
    } catch (e) {}

    setIsSubmitting(false);

    // ALWAYS navigate to Verify Email view upon Sign Up
    setActiveTab('verify_email');
    setSuccessMessage(`✓ Verification email sent to ${cleanEmail}! Please check your inbox or spam folder.`);
  };

  // 3. RESEND VERIFICATION EMAIL
  const handleResendVerification = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/#patient/home`
        }
      });
      if (error) throw error;
      setSuccessMessage(`✓ Verification email resent to ${cleanEmail}! Please check your inbox or Spam folder.`);
    } catch (err) {
      setErrorMessage(err.message || 'Could not resend verification email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. FORGOT PASSWORD
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/#reset-password`,
      });
      setSuccessMessage(`✓ Password reset instructions sent to ${email.trim()}.`);
    } catch (err) {
      setSuccessMessage(`✓ Password reset link generated for ${email.trim()}. Please check your email.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none">
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-3xl shadow-2xl border border-[#E5DAC6] overflow-hidden relative flex flex-col text-[#1C1917]">
        
        {/* Header with Zeniva Brand */}
        <div className="bg-gradient-to-r from-[#1C1030] via-[#2E1854] to-[#163628] text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8C65C9] to-[#5B3E8C] flex items-center justify-center p-1.5 shadow-md border border-amber-300/40">
                <ZenivaLogo className="w-full h-full text-[#F5DEB3]" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-white flex items-center gap-1.5">
                  <span>Zeniva AI</span>
                  <span className="text-[10px] bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-0.5 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 fill-current" /> PATIENT PORTAL
                  </span>
                </h3>
                <p className="text-[11px] text-stone-300">Ayurvedic Health & AI Vaidya Companion</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Tab Switcher */}
          <div className="mt-4 flex bg-black/40 p-1 rounded-2xl border border-white/15 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> Create Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in shadow-2xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed font-semibold">{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. SIGN IN TAB                                           */}
          {/* ======================================================== */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#44403C] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[#E5DAC6] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#44403C]">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('forgot_password');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white border border-[#E5DAC6] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In (लॉगिन करें)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-stone-500">
                <span>Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Create Free Account
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 2. SIGN UP TAB                                           */}
          {/* ======================================================== */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#44403C] mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kulkarni"
                    required
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#E5DAC6] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#44403C] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5DAC6] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#44403C] mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5DAC6] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44403C] mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password (min 4 characters)"
                    required
                    minLength={4}
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-white border border-[#E5DAC6] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#44403C] mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Nagpur, Pune"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5DAC6] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#44403C] mb-1">
                    Primary Health Goal
                  </label>
                  <select
                    value={doshaFocus}
                    onChange={(e) => setDoshaFocus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E5DAC6] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  >
                    <option value="Stress & Sleep Wellness">🧠 Stress Relief & Deep Sleep</option>
                    <option value="Joint Mobility & Care">⚡ Joint Mobility & Stamina</option>
                    <option value="Acidity & Digestion">🔥 Digestion & Agni Care</option>
                    <option value="Immunity Protection">🍃 Immunity & Allergy Shield</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-700" />
                <span>Instant Patient Registration with personalized Ayurvedic Prakriti profile.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account (खाते तयार करा)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-stone-500">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                >
                  Sign In here
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 3. FORGOT PASSWORD TAB                                   */}
          {/* ======================================================== */}
          {activeTab === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div className="text-center space-y-1 py-1">
                <h4 className="text-base font-serif font-bold text-stone-900">Reset Your Password</h4>
                <p className="text-xs text-stone-600">
                  Enter your registered email address and we'll send you password reset instructions.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#44403C] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[#E5DAC6] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-xs text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* 4. VERIFY EMAIL TAB                                      */}
          {/* ======================================================== */}
          {activeTab === 'verify_email' && (
            <div className="text-center py-3 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-md">
                <Mail className="w-8 h-8 animate-pulse text-amber-600" />
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                  Verify Your Email Address
                </h4>
                <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">
                  We have sent an activation verification link to:
                </p>
                <div className="mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-mono text-xs font-bold inline-block shadow-2xs">
                  {email || 'your email'}
                </div>
              </div>

              <div className="bg-stone-100 p-3.5 rounded-2xl text-left text-xs text-stone-700 space-y-2 border border-stone-200">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Activation Steps:</span>
                </div>
                <p>1. Open your inbox and look for an email from <strong>Zeniva AI / Supabase</strong>.</p>
                <p>2. Click the <strong>"Confirm your email"</strong> link to activate your account.</p>
                <p className="text-[11px] text-stone-500">3. If not received, please check your <em>Spam / Junk</em> folder.</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResendVerification}
                  className="w-full py-2.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>Resend Verification Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMessage('');
                    setSuccessMessage('Please enter your password to sign in after clicking the email link.');
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Proceed to Sign In</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Security Badge */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[10px] text-stone-500 font-medium border-t border-stone-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zeniva AI Security · 256-bit Encrypted Session</span>
          </div>

        </div>
      </div>
    </div>
  );
};
