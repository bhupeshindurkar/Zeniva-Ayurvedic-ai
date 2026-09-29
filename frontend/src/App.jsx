import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PatientDashboard } from './views/PatientDashboard';
import { DoctorDashboard } from './views/DoctorDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { LoginPortal } from './views/LoginPortal';
import { DoctorRegistrationView } from './views/DoctorRegistrationView';
import { DoctorVerificationStatusView } from './views/DoctorVerificationStatusView';
import { MyProfileView } from './views/MyProfileView';
import { DoshaAnalysisView } from './views/DoshaAnalysisView';
import { SymptomCheckerView } from './views/SymptomCheckerView';
import { ConsultationView } from './views/ConsultationView';
import { HerbalRecommendationsView } from './views/HerbalRecommendationsView';
import { LifestylePlannerView } from './views/LifestylePlannerView';
import { KnowledgeLibraryView } from './views/KnowledgeLibraryView';
import { ReportsHistoryView } from './views/ReportsHistoryView';
import { SettingsView } from './views/SettingsView';
import { WebsiteInsightsView } from './views/WebsiteInsightsView';
import { PublicLandingView } from './views/PublicLandingView';
import { TeamContributorsView } from './views/TeamContributorsView';
import { OpportunitiesView } from './views/OpportunitiesView';
import { HospitalErpView } from './views/HospitalErpView';
import { ContactUsView } from './views/ContactUsView';
import { PatientAuthModal } from './components/PatientAuthModal';
import { AppointmentModal } from './components/AppointmentModal';
import { QuickScanModal } from './components/QuickScanModal';
import { NotificationPopover } from './components/NotificationPopover';
import { SplashScreen } from './components/SplashScreen';
import { ZenivaLLMWidget } from './components/ZenivaLLMWidget';
import { AyurvedicAIChatModal } from './components/AyurvedicAIChatModal';
import { supabase } from './lib/supabase';
import { Home, Activity, Phone, Sparkles, User, Users, Menu, Stethoscope, Briefcase } from 'lucide-react';

// Strict isolation utility: Ensures Patient sessions (e.g. Kamlesh Indurkar) NEVER bleed into Doctor accounts (Dr. Sohil Indurkar)
const sanitizeRoleStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    // 1. Clean contaminated doctor keys if patient Kamlesh leaked there
    const docKeys = ['zeniva_doctor_user', 'zeniva_registered_doctor'];
    for (const k of docKeys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const p = JSON.parse(raw);
        const isPatientLeak = p?.phone?.includes('9011942126') || (p?.name && p.name.toLowerCase().includes('kamlesh') && !p.password);
        if (isPatientLeak) {
          localStorage.removeItem(k);
        }
      }
    }

    // 2. Also clean zeniva_registered_doctors_list
    const listRaw = localStorage.getItem('zeniva_registered_doctors_list');
    let list = listRaw ? JSON.parse(listRaw) : [];
    if (Array.isArray(list)) {
      list = list.filter(d => {
        if (!d) return false;
        if (d.role === 'patient') return false;
        if (d.phone && String(d.phone).includes('9011942126')) return false;
        if (d.name && d.name.toLowerCase().includes('kamlesh') && !d.password) return false;
        return true;
      });
    } else {
      list = [];
    }

    // 3. Ensure Dr. Sohil Indurkar is permanently registered and verified in the doctors registry
    const hasSohil = list.some(d => d.phone && String(d.phone).includes('8766903403'));
    if (!hasSohil) {
      list.push({
        role: 'doctor',
        id: 'ZEN-DOC-876690',
        doctor_id: 'ZEN-DOC-876690',
        name: 'Dr. Sohil Indurkar',
        email: 'sohil@zeniva.ai',
        phone: '8766903403',
        password: 'sohil123',
        council_reg_number: 'AYU-MAH-8921',
        council_name: 'Maharashtra Council of Indian Medicine (MCIM)',
        qualification: 'BAMS, MD (Ayurveda)',
        specialization: 'Kayachikitsa & Panchakarma',
        organization: 'Zeniva Ayurvedic Clinical Center',
        city: 'Nagpur, Maharashtra',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
        status: 'verified',
        isRegistered: true,
        isLoggedIn: true
      });
    }
    localStorage.setItem('zeniva_registered_doctors_list', JSON.stringify(list));

    // 4. Ensure patient Kamlesh Indurkar (+91 9011942126) is preserved cleanly in zeniva_patient_user
    const patRaw = localStorage.getItem('zeniva_patient_user');
    if (!patRaw) {
      const curRaw = localStorage.getItem('zeniva_current_user');
      if (curRaw) {
        const cur = JSON.parse(curRaw);
        if (cur?.phone?.includes('9011942126') || cur?.name?.toLowerCase().includes('kamlesh')) {
          localStorage.setItem('zeniva_patient_user', JSON.stringify({
            ...cur,
            role: 'patient',
            name: cur.name ? cur.name.replace(/^Dr\.\s*/i, '') : 'kamlesh Indurkar'
          }));
        }
      }
    }

    // 5. If currently viewing Doctor routes (#doctor), ensure zeniva_current_user is NEVER a patient!
    const hash = (typeof window !== 'undefined' ? window.location.hash : '').toLowerCase();
    if (hash.startsWith('#doctor')) {
      const curRaw = localStorage.getItem('zeniva_current_user');
      if (curRaw) {
        const cur = JSON.parse(curRaw);
        if (cur?.role === 'patient' || cur?.phone?.includes('9011942126') || (cur?.name && cur.name.toLowerCase().includes('kamlesh') && !cur.password)) {
          const docObj = {
            role: 'doctor',
            id: 'ZEN-DOC-876690',
            doctor_id: 'ZEN-DOC-876690',
            name: 'Dr. Sohil Indurkar',
            email: 'sohil@zeniva.ai',
            phone: '8766903403',
            password: 'sohil123',
            council_reg_number: 'AYU-MAH-8921',
            council_name: 'Maharashtra Council of Indian Medicine (MCIM)',
            qualification: 'BAMS, MD (Ayurveda)',
            specialization: 'Kayachikitsa & Panchakarma',
            organization: 'Zeniva Ayurvedic Clinical Center',
            city: 'Nagpur, Maharashtra',
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
            status: 'verified',
            isRegistered: true,
            isLoggedIn: true
          };
          localStorage.setItem('zeniva_current_user', JSON.stringify(docObj));
          localStorage.setItem('zeniva_doctor_user', JSON.stringify(docObj));
        }
      }
    }
  } catch (e) {
    console.warn('Storage sanitization notice:', e);
  }
};
sanitizeRoleStorage();

// Helper to inspect URL hash / tab-scoped state
const parseUrlState = () => {
  const hash = window.location.hash.replace('#', '').toLowerCase();
  
  // Secure Admin URL verification: Direct typing of admin in URL requires verified token
  if (hash.startsWith('admin')) {
    const adminToken = sessionStorage.getItem('zeniva_admin_auth_token') || localStorage.getItem('zeniva_admin_auth_token');
    if (adminToken === 'zeniva_master_2027') {
      const parts = hash.split('/');
      return {
        role: 'admin',
        authView: 'authenticated',
        tab: parts[1] || 'admin_dashboard'
      };
    }
    try {
      window.history.replaceState(null, '', '#overview/home');
    } catch (e) {}
    window.location.hash = 'overview/home';
    return {
      role: 'public',
      authView: 'authenticated',
      tab: 'home'
    };
  }

  if (hash.startsWith('doctor')) {
    const parts = hash.split('/');
    const subRoute = parts[1] || 'home';
    if (subRoute === 'register') {
      return { role: 'doctor', authView: 'doctor_registration', tab: 'home' };
    }
    if (subRoute === 'status') {
      return { role: 'doctor', authView: 'doctor_status', tab: 'home' };
    }
    return { role: 'doctor', authView: 'authenticated', tab: subRoute };
  }

  if (hash.startsWith('patient')) {
    const parts = hash.split('/');
    return {
      role: 'patient',
      authView: 'authenticated',
      tab: parts[1] || 'home'
    };
  }

  if (hash.startsWith('overview')) {
    const parts = hash.split('/');
    return {
      role: 'public',
      authView: 'authenticated',
      tab: parts[1] || 'home'
    };
  }

  if (hash === 'erp' || hash === 'hospital_erp' || hash === 'hospital-erp') {
    return {
      role: 'public',
      authView: 'authenticated',
      tab: 'hospital_erp'
    };
  }

  if (hash === 'login' || hash === 'login/doctor') {
    return {
      role: 'doctor',
      authView: 'login',
      tab: 'home',
      loginRoleTarget: 'doctor'
    };
  }

  if (hash === 'login/patient') {
    return {
      role: 'patient',
      authView: 'authenticated',
      tab: 'home',
      loginRoleTarget: 'patient',
      openAuthModal: true
    };
  }

  if (hash.startsWith('login/')) {
    const parts = hash.split('/');
    if (parts[1] === 'patient') {
      return {
        role: 'patient',
        authView: 'authenticated',
        tab: 'home',
        loginRoleTarget: 'patient',
        openAuthModal: true
      };
    }
    return {
      role: 'doctor',
      authView: 'login',
      tab: 'home',
      loginRoleTarget: 'doctor'
    };
  }

  if (hash === 'insights') {
    return {
      role: 'public',
      authView: 'authenticated',
      tab: 'insights'
    };
  }

  // Default: Zeniva Public Overview Dashboard
  return { role: 'public', authView: 'authenticated', tab: 'home' };
};

export default function App() {
  const initialState = parseUrlState();
  // Show the grand golden Vedic splash screen on initial visit to the Zeniva Overview Dashboard!
  // Patient dashboard, Doctor dashboard, and Admin dashboard do not show splash screen!
  const [showSplash, setShowSplash] = useState(() => {
    return initialState.role === 'public' && initialState.authView === 'authenticated';
  });
  
  const [currentRole, setCurrentRole] = useState(initialState.role);
  const [authView, setAuthView] = useState(initialState.authView);
  const [activeTab, setActiveTab] = useState(initialState.tab);
  const [loginRoleTarget, setLoginRoleTarget] = useState(() => initialState.loginRoleTarget || 'doctor');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => !!initialState.openAuthModal);
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');

  // Authenticated User State (isolated per role so multi-tabs don't collide)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (initialState.role === 'doctor') {
        const savedDoc = localStorage.getItem('zeniva_doctor_user') || localStorage.getItem('zeniva_registered_doctor');
        if (savedDoc) {
          const parsed = JSON.parse(savedDoc);
          const isPatient = parsed?.role === 'patient' || parsed?.phone?.includes('9011942126') || (parsed?.name && parsed.name.toLowerCase().includes('kamlesh') && !parsed.password);
          if (!isPatient && parsed && (parsed.role === 'doctor' || parsed.qualification)) {
            const cleanDocP = (parsed.phone || '').replace(/\D/g, '').slice(-10);
            const cachedDocAvatar = cleanDocP ? localStorage.getItem(`zeniva_doctor_avatar_${cleanDocP}`) : null;
            return {
              ...parsed,
              avatar: cachedDocAvatar || parsed.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400'
            };
          }
        }
        // Fallback to verified doctor from list (e.g. Dr. Sohil Indurkar)
        const listStr = localStorage.getItem('zeniva_registered_doctors_list');
        if (listStr) {
          const dList = JSON.parse(listStr);
          const legitDoctor = dList.find(d => d.role === 'doctor' && !d.phone?.includes('9011942126') && !d.name?.toLowerCase().includes('kamlesh'));
          if (legitDoctor) {
            const cleanDocP = (legitDoctor.phone || '').replace(/\D/g, '').slice(-10);
            const cachedDocAvatar = cleanDocP ? localStorage.getItem(`zeniva_doctor_avatar_${cleanDocP}`) : null;
            return {
              ...legitDoctor,
              avatar: cachedDocAvatar || legitDoctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400'
            };
          }
        }
      } else if (initialState.role === 'patient') {
        const savedPat = localStorage.getItem('zeniva_patient_user');
        if (savedPat) {
          const parsed = JSON.parse(savedPat);
          if (parsed && (parsed.role === 'patient' || parsed.name || parsed.email)) {
            // 30-day session persistence check
            const expiry = localStorage.getItem('zeniva_session_expiry');
            if (expiry && Date.now() > parseInt(expiry, 10)) {
              localStorage.removeItem('zeniva_patient_user');
              localStorage.removeItem('zeniva_current_user');
              localStorage.removeItem('zeniva_session_expiry');
            } else {
              const cleanPatP = (parsed.phone || '').replace(/\D/g, '').slice(-10);
              const cachedAvatar = typeof localStorage !== 'undefined' 
                ? (localStorage.getItem('zeniva_patient_avatar') || (cleanPatP ? localStorage.getItem(`zeniva_patient_avatar_${cleanPatP}`) : null))
                : null;
              return {
                ...parsed,
                avatar: cachedAvatar || parsed.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
                role: 'patient',
                isLoggedIn: parsed.isLoggedIn ?? true
              };
            }
          }
        }
      } else if (initialState.role === 'admin') {
        return {
          id: 'usr_admin',
          name: 'Bhupesh Indurkar (Super Admin)',
          phone: '8766903403',
          role: 'admin',
          title: 'Super Administrator'
        };
      }
    } catch (e) {}

    const cachedSohilAvatar = typeof localStorage !== 'undefined' ? (localStorage.getItem('zeniva_doctor_avatar_8766903403') || null) : null;
    return initialState.role === 'doctor' ? {
      id: 'ZEN-DOC-876690',
      doctor_id: 'ZEN-DOC-876690',
      name: 'Dr. Sohil Indurkar',
      phone: '8766903403',
      role: 'doctor',
      qualification: 'BAMS, MD (Ayurveda)',
      specialization: 'Kayachikitsa & Panchakarma',
      avatar: cachedSohilAvatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
      status: 'verified',
      isLoggedIn: true
    } : initialState.role === 'admin' ? {
      id: 'usr_admin',
      name: 'Bhupesh Indurkar (Super Admin)',
      phone: '8766903403',
      role: 'admin',
      title: 'Super Administrator'
    } : initialState.role === 'public' ? {
      id: 'guest_visitor',
      name: 'Guest Visitor',
      role: 'public',
      isLoggedIn: false
    } : {
      id: 'usr_patient',
      name: 'Patient',
      phone: '',
      role: 'patient',
      prakriti: 'Stress & Sleep Wellness',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      location: '',
      city: '',
      isLoggedIn: true
    };
  });

  const [doctorTempAuth, setDoctorTempAuth] = useState({
    phone: '',
    email: '',
    name: '',
    qualification: '',
    specialization: ''
  });

  const [registeredDoctorProfile, setRegisteredDoctorProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('zeniva_registered_doctor') || localStorage.getItem('zeniva_doctor_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const isPatient = parsed?.role === 'patient' || parsed?.phone?.includes('9011942126') || (parsed?.name && parsed.name.toLowerCase().includes('kamlesh') && !parsed.password);
        if (!isPatient && parsed && (parsed.name || parsed.phone || parsed.email)) {
          return parsed;
        }
      }
      const listStr = localStorage.getItem('zeniva_registered_doctors_list');
      if (listStr) {
        const dList = JSON.parse(listStr);
        const legit = dList.find(d => d.role === 'doctor' && !d.phone?.includes('9011942126') && !d.name?.toLowerCase().includes('kamlesh'));
        if (legit) return legit;
      }
    } catch (e) {}
    return null;
  });

  // Sync state with URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '').toLowerCase();
      if (rawHash.startsWith('admin')) {
        const adminToken = sessionStorage.getItem('zeniva_admin_auth_token') || localStorage.getItem('zeniva_admin_auth_token');
        if (adminToken !== 'zeniva_master_2027') {
          try {
            window.history.replaceState(null, '', '#overview/home');
          } catch (e) {}
          window.location.hash = 'overview/home';
          setCurrentRole('public');
          setAuthView('authenticated');
          setActiveTab('home');
          return;
        }
      }

      const nextState = parseUrlState();
      setCurrentRole(nextState.role);
      setAuthView(nextState.authView);
      setActiveTab(nextState.tab);
      if (nextState.loginRoleTarget) {
        setLoginRoleTarget(nextState.loginRoleTarget);
      }
      if (nextState.openAuthModal) {
        setIsAuthModalOpen(true);
      }
      // Only public dashboard displays splash screen initially
      if (nextState.role !== 'public') {
        setShowSplash(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when activeTab, currentRole, or authView change
  useEffect(() => {
    if (authView === 'login') {
      window.location.hash = 'login/doctor';
    } else if (authView === 'doctor_registration') {
      window.location.hash = 'doctor/register';
    } else if (authView === 'doctor_status') {
      window.location.hash = 'doctor/status';
    } else if (currentRole === 'admin') {
      window.location.hash = `admin/${activeTab || 'admin_dashboard'}`;
    } else if (currentRole === 'doctor') {
      window.location.hash = `doctor/${activeTab}`;
    } else if (currentRole === 'public') {
      window.location.hash = `overview/${activeTab}`;
    } else {
      window.location.hash = `patient/${activeTab}`;
    }
  }, [currentRole, authView, activeTab, loginRoleTarget]);

  // Real-time synchronization of patient profile & avatar updates across the whole app
  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      const newAvatar = e.detail;
      if (newAvatar) {
        setCurrentUser(prev => ({
          ...prev,
          avatar: newAvatar
        }));
      }
    };
    const handleProfileUpdate = (e) => {
      const updatedProfile = e.detail;
      if (updatedProfile) {
        setCurrentUser(prev => ({
          ...prev,
          ...updatedProfile
        }));
      }
    };
    window.addEventListener('zeniva_patient_avatar_updated', handleAvatarUpdate);
    window.addEventListener('zeniva_patient_profile_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('zeniva_patient_avatar_updated', handleAvatarUpdate);
      window.removeEventListener('zeniva_patient_profile_updated', handleProfileUpdate);
    };
  }, []);

  // Supabase Auth State & Profile Sync
  // Supabase Auth State & Profile Sync with Strict Multi-Role Isolation
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const metaRole = session.user.user_metadata?.role;
          const isDoctorInMeta = metaRole === 'doctor';
          const isDoctorInDb = profile?.role === 'doctor' || isDoctorInMeta;
          const isPatientInDb = profile?.role === 'patient' || metaRole === 'patient';
          const isKamlesh = profile?.full_name?.toLowerCase().includes('kamlesh') || 
                            profile?.phone?.includes('9011942126') || 
                            session.user.email?.toLowerCase().includes('kamleshindurkar');

          const isDoctorRoute = (typeof window !== 'undefined' ? window.location.hash : '').toLowerCase().startsWith('#doctor') || currentRole === 'doctor' || isDoctorInMeta;

          // 1. If this Supabase session belongs to a Patient:
          if ((isPatientInDb || isKamlesh) && !isDoctorInMeta && !isDoctorInDb) {
            let localPat = {};
            try {
              const raw = localStorage.getItem('zeniva_patient_user');
              if (raw) localPat = JSON.parse(raw);
            } catch (e) {}

            const cleanPatientName = (profile?.full_name || session.user.user_metadata?.full_name || localPat.name || 'kamlesh Indurkar').replace(/^Dr\.\s*/i, '');
            const updatedPatient = {
              ...localPat,
              id: session.user.id,
              name: cleanPatientName,
              email: profile?.email || session.user.email || localPat.email,
              phone: profile?.phone || session.user.user_metadata?.phone || localPat.phone || '9011942126',
              role: 'patient',
              city: profile?.city || localPat.city || localPat.location || 'Nagpur, Maharashtra',
              location: profile?.city || localPat.location || localPat.city || 'Nagpur, Maharashtra',
              prakriti: profile?.prakriti || localPat.prakriti || 'Stress & Sleep Wellness Profile',
              dosha: profile?.prakriti || localPat.dosha || 'Stress & Sleep Wellness Profile',
              age: profile?.age || localPat.age || 48,
              gender: profile?.gender || localPat.gender || 'Male',
              bloodGroup: profile?.blood_group || localPat.bloodGroup || localPat.blood_group || 'B+',
              diet: profile?.diet || localPat.diet || 'Vegan Whole Plant Foods',
              agribalam: profile?.agribalam || localPat.agribalam || 'Madhyama Agni (Moderate Digestion)',
              vikriti: profile?.vikriti || localPat.vikriti || '',
              avatar: (profile?.avatar_url && profile.avatar_url.length > 20) 
                ? profile.avatar_url 
                : (session.user.user_metadata?.avatar_url || (typeof localStorage !== 'undefined' && localStorage.getItem('zeniva_patient_avatar')) || localPat.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
              status: profile?.status || localPat.status || 'active',
              isLoggedIn: true,
              isRegistered: true,
              auth_provider: 'supabase'
            };

            // Purely store in patient storage
            localStorage.setItem('zeniva_patient_user', JSON.stringify(updatedPatient));
            if (updatedPatient.avatar && !updatedPatient.avatar.includes('unsplash.com')) {
              localStorage.setItem('zeniva_patient_avatar', updatedPatient.avatar);
              const patCleanP = (updatedPatient.phone || '').replace(/\D/g, '').slice(-10);
              if (patCleanP) {
                localStorage.setItem(`zeniva_patient_avatar_${patCleanP}`, updatedPatient.avatar);
              }
            }

            // CRITICAL: Clean any contaminated doctor storage
            localStorage.removeItem('zeniva_doctor_user');
            localStorage.removeItem('zeniva_registered_doctor');

            // NEVER update currentUser if the active screen is doctor!
            if (!isDoctorRoute && currentRole === 'patient') {
              setCurrentUser(updatedPatient);
              localStorage.setItem('zeniva_current_user', JSON.stringify(updatedPatient));
            }
            return;
          }

          // 2. If this Supabase session belongs to a Doctor:
          if (isDoctorInDb || isDoctorInMeta) {
            const rawDocName = profile?.full_name || session.user.user_metadata?.full_name || 'Dr. Ayurvedic Vaidya';
            const formattedDocName = rawDocName.startsWith('Dr.') ? rawDocName : `Dr. ${rawDocName}`;
            const docCleanP = (profile?.phone || session.user.user_metadata?.phone || '').replace(/\D/g, '').slice(-10);
            const docCachedAv = docCleanP ? localStorage.getItem(`zeniva_doctor_avatar_${docCleanP}`) : null;
            const docCloudAv = (profile?.avatar_url && profile.avatar_url.length > 20) ? profile.avatar_url : (session.user.user_metadata?.avatar_url || null);
            const resolvedDocAvatar = docCloudAv || docCachedAv || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400';

            const updatedDoctor = {
              id: session.user.id,
              doctor_id: `ZEN-DOC-${session.user.id.slice(-6).toUpperCase()}`,
              name: formattedDocName,
              email: profile?.email || session.user.email,
              phone: profile?.phone || session.user.user_metadata?.phone || '',
              role: 'doctor',
              qualification: profile?.qualification || session.user.user_metadata?.qualification || 'BAMS, MD (Ayurveda)',
              specialization: profile?.specialization || session.user.user_metadata?.specialization || 'Kayachikitsa & Panchakarma',
              organization: profile?.organization || 'Zeniva Ayurvedic Clinical Center',
              city: profile?.city || 'Nagpur, Maharashtra',
              avatar: resolvedDocAvatar,
              status: profile?.status || 'pending_verification',
              isLoggedIn: true,
              isRegistered: true,
              auth_provider: 'supabase'
            };

            localStorage.setItem('zeniva_doctor_user', JSON.stringify(updatedDoctor));
            localStorage.setItem('zeniva_registered_doctor', JSON.stringify(updatedDoctor));
            if (docCleanP && resolvedDocAvatar && !resolvedDocAvatar.includes('unsplash.com')) {
              localStorage.setItem(`zeniva_doctor_avatar_${docCleanP}`, resolvedDocAvatar);
            }
            if (isDoctorRoute && updatedDoctor.status === 'verified') {
              setCurrentUser(updatedDoctor);
              localStorage.setItem('zeniva_current_user', JSON.stringify(updatedDoctor));
            }
          }
        } catch (e) {
          console.warn('Supabase auth state listener error:', e);
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [currentRole]);

  // Real-time synchronization when Admin updates or deletes patient profile
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const updated = e?.detail;
      if (!updated) return;
      if (currentRole === 'patient') {
        setCurrentUser(prev => {
          const match = (prev.id && prev.id === updated.id) ||
                        (prev.phone && updated.phone && String(prev.phone).replace(/\D/g, '').slice(-10) === String(updated.phone).replace(/\D/g, '').slice(-10)) ||
                        (prev.email && updated.email && String(prev.email).toLowerCase() === String(updated.email).toLowerCase());
          if (match) {
            const merged = { ...prev, ...updated, role: 'patient' };
            try {
              localStorage.setItem('zeniva_patient_user', JSON.stringify(merged));
              localStorage.setItem('zeniva_current_user', JSON.stringify(merged));
            } catch (err) {}
            return merged;
          }
          return prev;
        });
      }
    };

    const handlePatientDeleted = (e) => {
      const deletedId = e?.detail?.id;
      if (!deletedId) return;
      if (currentRole === 'patient') {
        setCurrentUser(prev => {
          if (prev.id === deletedId || prev.phone === deletedId) {
            localStorage.removeItem('zeniva_patient_user');
            localStorage.removeItem('zeniva_current_user');
            return {
              id: 'guest_visitor',
              name: 'Guest Visitor',
              role: 'public',
              isLoggedIn: false
            };
          }
          return prev;
        });
      }
    };

    window.addEventListener('zeniva_patient_profile_updated', handleProfileUpdate);
    window.addEventListener('zeniva_patient_deleted', handlePatientDeleted);

    return () => {
      window.removeEventListener('zeniva_patient_profile_updated', handleProfileUpdate);
      window.removeEventListener('zeniva_patient_deleted', handlePatientDeleted);
    };
  }, [currentRole]);

  // Sync persistent user profile on role change (Strict role boundary protection)
  useEffect(() => {
    if (currentRole === 'public') {
      setCurrentUser({
        id: 'guest_visitor',
        name: 'Guest Visitor',
        role: 'public',
        isLoggedIn: false
      });
      return;
    }

    let activeIdentifier = '';

    if (currentRole === 'patient') {
      try {
        const savedPat = localStorage.getItem('zeniva_patient_user');
        if (savedPat) {
          const parsed = JSON.parse(savedPat);
          if (parsed && (parsed.role === 'patient' || !parsed.qualification)) {
            setCurrentUser(prev => ({ ...prev, ...parsed, role: 'patient' }));
            activeIdentifier = parsed.phone || parsed.email || '';
          }
        }
      } catch (e) {}
    } else if (currentRole === 'doctor') {
      try {
        // STRICT: Never fall back to patient-controlled zeniva_current_user!
        const savedDoc = localStorage.getItem('zeniva_doctor_user') || localStorage.getItem('zeniva_registered_doctor');
        let legitDoc = null;
        if (savedDoc) {
          const parsed = JSON.parse(savedDoc);
          const isPatient = parsed?.role === 'patient' || parsed?.phone?.includes('9011942126') || (parsed?.name?.toLowerCase().includes('kamlesh') && !parsed?.password);
          if (!isPatient && parsed && (parsed.role === 'doctor' || parsed.qualification)) {
            legitDoc = parsed;
          }
        }
        if (!legitDoc) {
          const listStr = localStorage.getItem('zeniva_registered_doctors_list');
          if (listStr) {
            const dList = JSON.parse(listStr);
            legitDoc = dList.find(d => d.role === 'doctor' && !d.phone?.includes('9011942126') && !d.name?.toLowerCase().includes('kamlesh'));
          }
        }
        if (legitDoc) {
          setCurrentUser(prev => ({ ...prev, ...legitDoc, role: 'doctor' }));
          activeIdentifier = legitDoc.phone || legitDoc.email || '';
        }
      } catch (e) {}
    }

    const rawPhone = currentUser?.phone ? currentUser.phone.replace(/\D/g, '') : '';
    const identifier = activeIdentifier || rawPhone || currentUser?.email || '';

    if (!identifier) return;

    const profileUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
      ? `/api/user/profile/${encodeURIComponent(identifier)}?role=${currentRole}`
      : `http://127.0.0.1:8000/api/user/profile/${encodeURIComponent(identifier)}?role=${currentRole}`;

    fetch(profileUrl)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        const dbRecord = currentRole === 'doctor' 
          ? data.doctor
          : (data.patient || (data.user?.role === 'patient' ? data.user : null));

        if (dbRecord) {
          // Reject cross-role contamination
          if (currentRole === 'doctor' && (dbRecord.role === 'patient' || dbRecord.phone?.includes('9011942126') || dbRecord.name?.toLowerCase().includes('kamlesh'))) return;
          if (currentRole === 'patient' && dbRecord.role === 'doctor') return;

          setCurrentUser(prev => {
            const effectiveAvatar = dbRecord.avatar || prev.avatar;
            const cleanName = currentRole === 'patient'
              ? (dbRecord.name || prev.name || 'Patient').replace(/^Dr\.\s*/i, '')
              : (dbRecord.name?.startsWith('Dr.') ? dbRecord.name : `Dr. ${dbRecord.name || prev.name || 'Doctor'}`);

            const merged = {
              ...prev,
              ...dbRecord,
              name: cleanName,
              avatar: effectiveAvatar,
              role: currentRole
            };

            try {
              if (currentRole === 'doctor') {
                localStorage.setItem('zeniva_doctor_user', JSON.stringify(merged));
                localStorage.setItem('zeniva_registered_doctor', JSON.stringify(merged));
                localStorage.setItem('zeniva_current_user', JSON.stringify(merged));
              } else if (currentRole === 'patient') {
                localStorage.setItem('zeniva_patient_user', JSON.stringify(merged));
                localStorage.setItem('zeniva_current_user', JSON.stringify(merged));
              }
            } catch (e) {}
            return merged;
          });
        }
      })
      .catch(err => {
        // Silent catch for offline or static cloud deployments
      });
  }, [currentRole]);

  const handleUpdateUser = (updated) => {
    setCurrentUser(updated);
    try {
      localStorage.setItem('zeniva_current_user', JSON.stringify(updated));
      if (updated.role === 'doctor' || currentRole === 'doctor') {
        localStorage.setItem('zeniva_doctor_user', JSON.stringify(updated));
        localStorage.setItem('zeniva_registered_doctor', JSON.stringify(updated));
      } else if (updated.role === 'patient' || currentRole === 'patient') {
        localStorage.setItem('zeniva_patient_user', JSON.stringify(updated));
      }
    } catch (e) {}
  };

  const handleLoginSuccess = (userData) => {
    const role = userData.role || 'patient';
    if (role === 'admin') {
      try {
        sessionStorage.setItem('zeniva_admin_auth_token', 'zeniva_master_2027');
        localStorage.setItem('zeniva_admin_auth_token', 'zeniva_master_2027');
      } catch (e) {}
    }
    setCurrentRole(role);
    setCurrentUser(userData);
    setAuthView('authenticated');
    setActiveTab(role === 'admin' ? 'admin_dashboard' : 'home');
    try {
      localStorage.setItem('zeniva_current_user', JSON.stringify(userData));
      if (role === 'doctor') {
        localStorage.setItem('zeniva_doctor_user', JSON.stringify(userData));
        localStorage.setItem('zeniva_registered_doctor', JSON.stringify(userData));
        setRegisteredDoctorProfile(userData);
      } else if (role === 'patient') {
        localStorage.setItem('zeniva_patient_user', JSON.stringify(userData));
      }
    } catch (e) {}
  };

  const handleDoctorProceedToRegister = (docAuth) => {
    setDoctorTempAuth(docAuth);
    if (docAuth.isRegistered && docAuth.status === 'verified') {
      handleLoginSuccess({
        ...docAuth.user,
        role: 'doctor'
      });
    } else if (docAuth.isRegistered) {
      const docUser = docAuth.user || docAuth;
      setRegisteredDoctorProfile(docUser);
      try {
        localStorage.setItem('zeniva_registered_doctor', JSON.stringify(docUser));
        localStorage.setItem('zeniva_doctor_user', JSON.stringify(docUser));
      } catch (e) {}
      window.location.hash = 'doctor/status';
      setAuthView('doctor_status');
    } else {
      setAuthView('doctor_registration');
    }
  };

  const handleDoctorRegistrationSubmitted = (profile) => {
    setRegisteredDoctorProfile(profile);
    setAuthView('doctor_status');
  };

  // 1. Doctor Registration Form View (No splash screen)
  if (authView === 'doctor_registration') {
    const safeAuth = doctorTempAuth || {};
    return (
      <DoctorRegistrationView
        verifiedPhone={safeAuth.phone || safeAuth.email || ''}
        initialName={safeAuth.name || ''}
        initialQualification={safeAuth.qualification || ''}
        initialSpecialization={safeAuth.specialization || ''}
        onRegistrationSubmitted={handleDoctorRegistrationSubmitted}
        onCancel={() => setAuthView('login')}
      />
    );
  }

  // 2. Doctor Verification Status View (Countdown & Secure Access - Uses its own clean verified badge / flash)
  if (authView === 'doctor_status') {
    const safeAuth = doctorTempAuth || {};
    const activeDoc = registeredDoctorProfile || (() => {
      try {
        const saved = localStorage.getItem('zeniva_registered_doctor') || localStorage.getItem('zeniva_doctor_user');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return null;
    })() || {
      id: `ZEN-DOC-${Math.floor(100000 + Math.random() * 900000)}`,
      name: safeAuth.name || 'Ayurvedic Vaidya',
      phone: safeAuth.phone || safeAuth.email || '',
      qualification: safeAuth.qualification || 'BAMS, MD (Ayurveda)',
      specialization: safeAuth.specialization || 'Kayachikitsa & Panchakarma',
      organization: 'Zeniva Ayurvedic Clinical Center',
      council_reg_number: 'AYU-MAH-8921',
      council_name: 'Maharashtra Council of Indian Medicine (MCIM)',
      status: 'pending_verification',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400'
    };

    return (
      <DoctorVerificationStatusView
        doctorProfile={activeDoc}
        onOpenDoctorDashboard={(docData) => {
          const doc = docData || activeDoc;
          handleLoginSuccess({
            role: 'doctor',
            id: doc.id || `ZEN-DOC-${Math.floor(100000 + Math.random() * 900000)}`,
            doctor_id: doc.doctor_id || doc.id || `ZEN-DOC-${Math.floor(100000 + Math.random() * 900000)}`,
            name: doc.name || 'Doctor',
            phone: doc.phone || '',
            councilId: doc.council_reg_number || 'AYU-MAH-8921',
            council_reg_number: doc.council_reg_number || 'AYU-MAH-8921',
            qualification: doc.qualification || 'BAMS, MD (Ayurveda)',
            specialization: doc.specialization || 'Kayachikitsa & Panchakarma',
            organization: doc.organization || 'Zeniva Ayurvedic Clinical Center',
            city: doc.city || 'Nagpur, Maharashtra',
            avatar: doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
            status: 'verified'
          });
        }}
        onReuploadDocuments={() => {
          setAuthView('doctor_registration');
        }}
        onAdminAuthenticated={() => {
          setCurrentRole('admin');
          setActiveTab('admin_doctor_verification');
          setAuthView('authenticated');
        }}
        onLogout={() => {
          try {
            localStorage.removeItem('zeniva_registered_doctor');
            localStorage.removeItem('zeniva_doctor_user');
          } catch (e) {}
          setRegisteredDoctorProfile(null);
          setAuthView('login');
        }}
      />
    );
  }

  // 3. Login Portal View (No splash screen)
  if (authView === 'login') {
    return (
      <LoginPortal
        defaultRole={loginRoleTarget}
        onLoginSuccess={handleLoginSuccess}
        onDoctorProceedToRegister={handleDoctorProceedToRegister}
        onBackToDashboard={() => {
          setAuthView('authenticated');
        }}
      />
    );
  }

  // 4. Main Authenticated Application
  return (
    <div className="flex h-screen bg-[#ECE6DD] text-[#1C1917] font-sans antialiased overflow-hidden">
      
      {/* Dynamic Role-Based Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        currentRole={currentRole}
        activeTab={activeTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onSelectTab={(tabId) => {
          setActiveTab(tabId);
          setIsMobileMenuOpen(false);
        }}
        onOpenProfile={() => {
          setActiveTab('profile');
          setIsMobileMenuOpen(false);
        }}
        onOpenSettings={() => {
          setActiveTab('settings');
          setIsMobileMenuOpen(false);
        }}
        onOpenConsultation={() => {
          setActiveTab('consultation');
          setIsMobileMenuOpen(false);
        }}
        onOpenQuickScan={() => {
          setIsQuickScanOpen(true);
          setIsMobileMenuOpen(false);
        }}
        onOpenAuth={() => {
          setIsAuthModalOpen(true);
          setIsMobileMenuOpen(false);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Dynamic Header (rendered for public, patient & admin; doctor dashboard has its own dedicated header) */}
        {currentRole !== 'doctor' && (
          <Header
            currentRole={currentRole}
            activeTab={activeTab}
            currentUser={currentUser}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenQuickScan={() => setIsQuickScanOpen(true)}
            onSelectRole={(role) => {
              setCurrentRole(role);
              setActiveTab('home');
            }}
            onOpenLogin={(role) => {
              if (role === 'patient') {
                setIsAuthModalOpen(true);
              } else {
                setLoginRoleTarget(role || 'doctor');
                setAuthView('login');
              }
            }}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={() => {
              try {
                sessionStorage.removeItem('zeniva_admin_auth_token');
                localStorage.removeItem('zeniva_admin_auth_token');
                localStorage.removeItem('zeniva_patient_user');
                localStorage.removeItem('zeniva_current_user');
              } catch (e) {}
              setCurrentRole('public');
              setCurrentUser({
                id: 'guest_visitor',
                name: 'Guest Visitor',
                role: 'public',
                isLoggedIn: false
              });
              setAuthView('authenticated');
              setActiveTab('home');
              window.location.hash = 'overview/home';
            }}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            unreadCount={currentRole === 'admin' ? 5 : 2}
          />
        )}

        {/* Views Router */}
        <main className="flex-1">
          {activeTab === 'hospital_erp' || activeTab === 'erp' ? (
            <HospitalErpView
              currentUser={currentUser}
              currentRole={currentRole}
              onSelectTab={(tabId) => setActiveTab(tabId)}
            />
          ) : currentRole === 'public' ? (
            activeTab === 'insights' ? (
              <WebsiteInsightsView
                currentUser={currentUser}
                onSelectTab={(tabId) => setActiveTab(tabId)}
              />
            ) : activeTab === 'opportunities' ? (
              <OpportunitiesView
                userProfile={currentUser}
                currentRole={currentRole}
              />
            ) : activeTab === 'consultation' ? (
              <ConsultationView
                currentUser={currentUser}
                onSelectTab={(tabId) => setActiveTab(tabId)}
              />
            ) : activeTab === 'library' ? (
              <KnowledgeLibraryView
                currentUser={currentUser}
                onSelectTab={(tabId) => setActiveTab(tabId)}
              />
            ) : activeTab === 'team' ? (
              <TeamContributorsView
                onBackToOverview={() => setActiveTab('home')}
              />
            ) : activeTab === 'contact' ? (
              <ContactUsView
                currentUser={currentUser}
                onSelectTab={(tabId) => setActiveTab(tabId)}
                onOpenAIChat={(prompt) => {
                  setChatInitialPrompt(prompt || '');
                  setIsAIChatOpen(true);
                }}
              />
            ) : (
              <PublicLandingView
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenAIChat={(prompt) => {
                  setChatInitialPrompt(prompt || '');
                  setIsAIChatOpen(true);
                }}
                onSelectDoctorPortal={() => {
                  setLoginRoleTarget('doctor');
                  setAuthView('login');
                }}
                onOpenTeam={() => setActiveTab('team')}
                onOpenContact={() => setActiveTab('contact')}
                onSelectTab={(tabId) => setActiveTab(tabId)}
              />
            )
          ) : activeTab === 'insights' || activeTab === 'doc_insights' ? (
            <WebsiteInsightsView
              currentUser={currentUser}
              onSelectTab={(tabId) => {
                setActiveTab(tabId);
              }}
            />
          ) : currentRole === 'doctor' ? (
            <DoctorDashboard
              activeTab={activeTab}
              currentUser={currentUser}
              onSelectTab={(tabId) => {
                setActiveTab(tabId);
              }}
              onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              onAddPrescription={() => setIsAppointmentOpen(true)}
              onOpenPhotoReview={() => setIsAppointmentOpen(true)}
              onViewSchedule={() => setIsAppointmentOpen(true)}
              onUpdateUser={handleUpdateUser}
              onOpenLogin={(role) => {
                setLoginRoleTarget(role || 'doctor');
                setAuthView('login');
              }}
              onLogout={() => {
                setLoginRoleTarget('doctor');
                setAuthView('login');
              }}
            />
          ) : currentRole === 'admin' ? (
            <AdminDashboard
              activeTab={activeTab}
              currentUser={currentUser}
              onSelectTab={(tabId) => {
                setActiveTab(tabId);
              }}
              onOpenQuickScan={() => setIsQuickScanOpen(true)}
              onScheduleAppointment={() => setIsAppointmentOpen(true)}
              onLockAdmin={() => {
                try {
                  sessionStorage.removeItem('zeniva_admin_auth_token');
                  localStorage.removeItem('zeniva_admin_auth_token');
                } catch (e) {}
                setCurrentRole('public');
                setAuthView('authenticated');
                setActiveTab('home');
                window.location.hash = 'overview/home';
              }}
            />
          ) : (
            /* Patient Direct Real-Data Pages */
            <>
              {activeTab === 'home' && (
                <PatientDashboard
                  currentUser={currentUser}
                  isSplashFinished={true}
                  onOpenQuickScan={() => setIsQuickScanOpen(true)}
                  onUpdateUser={handleUpdateUser}
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                  onOpenAIChat={(prompt) => {
                    setChatInitialPrompt(prompt || '');
                    setIsAIChatOpen(true);
                  }}
                />
              )}

              {activeTab === 'profile' && (
                <MyProfileView
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUser}
                />
              )}

              {activeTab === 'dosha' && (
                <DoshaAnalysisView
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                />
              )}

              {activeTab === 'symptoms' && (
                <SymptomCheckerView
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                />
              )}

              {activeTab === 'opportunities' && (
                <OpportunitiesView
                  userProfile={currentUser}
                  currentRole={currentRole}
                />
              )}

              {activeTab === 'consultation' && (
                <ConsultationView
                  currentUser={currentUser}
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                />
              )}

              {activeTab === 'herbs' && (
                <HerbalRecommendationsView
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                />
              )}

              {activeTab === 'planner' && (
                <LifestylePlannerView
                  currentUser={currentUser}
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                />
              )}

              {activeTab === 'library' && (
                <KnowledgeLibraryView
                  currentUser={currentUser}
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsHistoryView
                  currentUser={currentUser}
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                />
              )}

              {activeTab === 'insights' && (
                <WebsiteInsightsView
                  currentUser={currentUser}
                  onSelectTab={(tabId) => {
                    setActiveTab(tabId);
                  }}
                />
              )}

              {activeTab === 'contact' && (
                <ContactUsView
                  currentUser={currentUser}
                  onSelectTab={(tabId) => setActiveTab(tabId)}
                  onOpenAIChat={(prompt) => {
                    setChatInitialPrompt(prompt || '');
                    setIsAIChatOpen(true);
                  }}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  currentUser={currentUser}
                  onUpdateUser={handleUpdateUser}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Popovers & Modals */}
      <NotificationPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        currentRole={currentRole}
        currentUser={currentUser}
        onOpenConsultation={() => setActiveTab('consultation')}
        onOpenAIChat={() => setActiveTab('library')}
      />

      <AppointmentModal
        isOpen={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        onBookSuccess={() => {
          setIsAppointmentOpen(false);
        }}
      />

      <QuickScanModal
        isOpen={isQuickScanOpen}
        onClose={() => setIsQuickScanOpen(false)}
        patientName={currentUser?.name || 'Aarav Patil'}
      />

      {/* Direct Instant Patient Auth Modal (Create Account & Fast Login) */}
      <PatientAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(userData) => {
          handleLoginSuccess(userData);
          setIsAuthModalOpen(false);
        }}
      />

      {showSplash && currentRole === 'public' && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}

      {/* Global Floating Vertical "KHADA WALA" ZENIVA LLM Assistant for Patient Portal & Public */}
      {(currentRole === 'patient' || currentRole === 'public') && authView === 'authenticated' && !showSplash && (
        <ZenivaLLMWidget
          onClick={() => {
            setChatInitialPrompt('');
            setIsAIChatOpen(true);
          }}
          currentUser={currentUser}
        />
      )}

      {/* Global Ayurvedic AI RAG Chat Dialog Modal */}
      <AyurvedicAIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        currentUser={currentUser}
        initialQuery={chatInitialPrompt}
        onSelectTab={(tabId) => setActiveTab(tabId)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Modern Floating Mobile Bottom Navigation Bar (Doctor, Patient & Public) */}
      {(currentRole === 'patient' || currentRole === 'public' || currentRole === 'doctor') && authView === 'authenticated' && !showSplash && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#160B28]/95 backdrop-blur-lg border-t border-[#311E54] py-1.5 px-3 flex items-center justify-around z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          {currentRole === 'doctor' ? (
            <>
              <button
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'home' || activeTab === 'doc_dashboard' ? 'text-amber-300 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="text-[10px]">Home</span>
              </button>

              <button
                onClick={() => setActiveTab('doc_patients')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer relative ${
                  activeTab === 'doc_patients' ? 'text-amber-300 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="text-[10px]">Patients</span>
                <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </button>

              <button
                onClick={() => {
                  setChatInitialPrompt('');
                  setIsAIChatOpen(true);
                }}
                className="flex flex-col items-center justify-center -mt-5 w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)] border-2 border-amber-300 cursor-pointer transition-transform hover:scale-110"
                title="Ayurvedic AI Clinical Assistant"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('doc_consultations')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'doc_consultations' ? 'text-amber-300 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span className="text-[10px]">Consults</span>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-stone-300 hover:text-white transition-colors cursor-pointer"
                title="Open Doctor Menu"
              >
                <Menu className="w-4 h-4" />
                <span className="text-[10px]">Menu</span>
              </button>
            </>
          ) : currentRole === 'public' ? (
            <>
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'opportunities' ? 'text-amber-300 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span className="text-[10px]">Opportunities</span>
              </button>

              <button
                onClick={() => {
                  setChatInitialPrompt('');
                  setIsAIChatOpen(true);
                }}
                className="flex flex-col items-center justify-center -mt-5 w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] border-2 border-cyan-300 cursor-pointer transition-transform hover:scale-110"
                title="Open AI Vaidya Chat"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('contact')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'contact' ? 'text-amber-300 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span className="text-[10px]">Contact</span>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <Menu className="w-4 h-4" />
                <span className="text-[10px]">Menu</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('dosha')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'dosha' ? 'text-amber-300 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="text-[10px]">Assessment</span>
              </button>

              <button
                onClick={() => {
                  setChatInitialPrompt('');
                  setIsAIChatOpen(true);
                }}
                className="flex flex-col items-center justify-center -mt-5 w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)] border-2 border-amber-300 cursor-pointer transition-transform hover:scale-110"
                title="Open AI Vaidya Chat"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
                  activeTab === 'profile' ? 'text-amber-300 font-bold' : 'text-stone-300 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-[10px]">Profile</span>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <Menu className="w-4 h-4" />
                <span className="text-[10px]">Menu</span>
              </button>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
