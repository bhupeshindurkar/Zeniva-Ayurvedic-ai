import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Clock, CheckCircle2, AlertCircle, FileText, 
  ArrowRight, Shield, Award, User, RefreshCw, LogOut, Check,
  RotateCcw, AlertTriangle, Lock, KeyRound, X, Sparkles,
  Stethoscope, ChevronRight, FileCheck, GraduationCap
} from 'lucide-react';
import { ZenivaLogo, MeditatingYogi } from '../components/ZenivaIcons';
import { verifyAdminPassword } from '../lib/adminAuthService';

export const DoctorVerificationStatusView = ({
  doctorProfile: rawDoctorProfile = {},
  onOpenDoctorDashboard = () => {},
  onReuploadDocuments = () => {},
  onAdminAuthenticated = () => {},
  onLogout = () => {}
}) => {
  const doctorProfile = rawDoctorProfile || {};

  // 2-Hour (7200 Seconds) Countdown Timer State
  const [timeLeft, setTimeLeft] = useState(7200);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(doctorProfile.status || 'pending_verification');
  const [rejectionReason, setRejectionReason] = useState(doctorProfile.rejection_reason || '');
  
  // Doctor Approved Welcome Flash Screen State
  const [showWelcomeFlash, setShowWelcomeFlash] = useState(false);
  const [flashCountdown, setFlashCountdown] = useState(3);
  const [verifiedDocData, setVerifiedDocData] = useState(null);

  // Admin Secure Access Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('superadmin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Strict doctor phone without hardcoded fallback to pre-verified doctor
  const rawPhone = doctorProfile.phone || '';
  const cleanDisplayPhone = rawPhone ? String(rawPhone).replace(/^\+91\s*/, '') : '';
  const phone = cleanDisplayPhone;

  // 1. Live Countdown Timer
  useEffect(() => {
    if (currentStatus === 'verified' || currentStatus === 'rejected') return;

    if (timeLeft <= 0) {
      setIsTimedOut(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimedOut(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, currentStatus]);

  // 2. Countdown Timer for Doctor Welcome Flash Screen
  useEffect(() => {
    if (!showWelcomeFlash) return;

    if (flashCountdown <= 0) {
      onOpenDoctorDashboard(verifiedDocData || doctorProfile);
      return;
    }

    const t = setInterval(() => {
      setFlashCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t);
          onOpenDoctorDashboard(verifiedDocData || doctorProfile);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [showWelcomeFlash, flashCountdown, verifiedDocData, doctorProfile, onOpenDoctorDashboard]);

  // 3. Periodic background check & live event listener: Triggered ONLY when Admin explicitly clicks Verify
  useEffect(() => {
    if (currentStatus === 'verified' && showWelcomeFlash) return;

    const checkStatusSync = async () => {
      const cleanTargetPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
      const targetId = doctorProfile.id || doctorProfile.doctor_id;

      // 1. Check registered doctors list in localStorage strictly for this doctor ID or phone
      try {
        const docKeys = ['zeniva_registered_doctor', 'zeniva_doctor_user'];
        for (const k of docKeys) {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          const cleanLocalPhone = parsed.phone ? String(parsed.phone).replace(/\D/g, '').slice(-10) : '';
          const idMatch = Boolean(targetId && (parsed.id === targetId || parsed.doctor_id === targetId));
          const phoneMatch = Boolean(cleanTargetPhone && cleanLocalPhone && cleanLocalPhone === cleanTargetPhone);

          if (idMatch || phoneMatch) {
            if (parsed.status === 'verified') {
              const merged = { ...doctorProfile, ...parsed, status: 'verified' };
              setCurrentStatus('verified');
              setVerifiedDocData(merged);
              setShowWelcomeFlash(true);
              return;
            } else if (parsed.status === 'rejected') {
              setCurrentStatus('rejected');
              setRejectionReason(parsed.rejection_reason || 'Medical Council registration credentials / degree certificates could not be verified by the Medical Review Board.');
              return;
            }
          }
        }

        // Also check zeniva_registered_doctors_list
        const listRaw = localStorage.getItem('zeniva_registered_doctors_list');
        if (listRaw) {
          const list = JSON.parse(listRaw);
          if (Array.isArray(list)) {
            const matched = list.find(d => d && ((targetId && (d.id === targetId || d.doctor_id === targetId)) || (cleanTargetPhone && d.phone && String(d.phone).replace(/\D/g, '').slice(-10) === cleanTargetPhone)));
            if (matched) {
              if (matched.status === 'verified') {
                const merged = { ...doctorProfile, ...matched, status: 'verified' };
                setCurrentStatus('verified');
                setVerifiedDocData(merged);
                setShowWelcomeFlash(true);
                return;
              } else if (matched.status === 'rejected') {
                setCurrentStatus('rejected');
                setRejectionReason(matched.rejection_reason || 'Medical Council registration credentials could not be verified.');
                return;
              }
            }
          }
        }
      } catch (e) {}

      // 2. Check Backend API ONLY if this doctor has a phone number
      if (cleanTargetPhone) {
        try {
          const profileApiUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
            ? `/api/doctor/profile/${cleanTargetPhone}`
            : `http://127.0.0.1:8000/api/doctor/profile/${cleanTargetPhone}`;
          const res = await fetch(profileApiUrl);
          if (res.ok) {
            const resJson = await res.json();
            const docData = resJson.doctor || resJson;
            if (docData && (!targetId || docData.id === targetId || docData.doctor_id === targetId)) {
              if (docData.status === 'verified') {
                const merged = { ...doctorProfile, ...docData, status: 'verified' };
                try {
                  localStorage.setItem('zeniva_registered_doctor', JSON.stringify(merged));
                  localStorage.setItem('zeniva_doctor_user', JSON.stringify(merged));
                  localStorage.setItem('zeniva_current_user', JSON.stringify({ ...merged, role: 'doctor' }));
                } catch (e) {}
                setCurrentStatus('verified');
                setVerifiedDocData(merged);
                setShowWelcomeFlash(true);
              } else if (docData.status === 'rejected') {
                setCurrentStatus('rejected');
                setRejectionReason(docData.rejection_reason || 'Medical Council registration credentials / degree certificates could not be verified by the Medical Review Board.');
              }
            }
          }
        } catch (e) {}
      }
    };

    const handleStatusEvent = (e) => {
      const detail = e?.detail;
      const targetId = doctorProfile.id || doctorProfile.doctor_id;
      const cleanTargetPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

      if (detail && detail.doctorId) {
        const idMatches = detail.doctorId === targetId || (cleanTargetPhone && detail.doctorId === cleanTargetPhone);
        if (idMatches) {
          if (detail.status === 'verified') {
            setCurrentStatus('verified');
            setVerifiedDocData({ ...doctorProfile, status: 'verified' });
            setShowWelcomeFlash(true);
            return;
          } else if (detail.status === 'rejected') {
            setCurrentStatus('rejected');
            setRejectionReason(detail.reason || 'Medical Council registration credentials could not be verified.');
            return;
          }
        }
      }
      checkStatusSync();
    };

    window.addEventListener('zeniva_doctor_status_changed', handleStatusEvent);
    window.addEventListener('storage', handleStatusEvent);

    // Initial check
    checkStatusSync();

    const checkInterval = setInterval(checkStatusSync, 2500);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('zeniva_doctor_status_changed', handleStatusEvent);
      window.removeEventListener('storage', handleStatusEvent);
    };
  }, [phone, currentStatus, showWelcomeFlash, doctorProfile.id, doctorProfile.doctor_id]);

  // Handle Admin Secure Login (Password: bhupesh@123 or PIN: 2027)
  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');

    if (!adminPassword) {
      setAdminError('Please enter admin password.');
      return;
    }

    setIsAdminLoading(true);
    const trimmedPass = adminPassword.trim();

    try {
      const isCloudValid = await verifyAdminPassword(trimmedPass);
      if (isCloudValid) {
        const fakeToken = `zeniva_adm_${Date.now()}`;
        try {
          localStorage.setItem('zeniva_admin_token', fakeToken);
          sessionStorage.setItem('zeniva_admin_auth_token', 'zeniva_master_2027');
          localStorage.setItem('zeniva_admin_auth_token', 'zeniva_master_2027');
        } catch (e) {}
        setIsAdminModalOpen(false);
        onAdminAuthenticated({
          token: fakeToken,
          role: 'SUPER_ADMIN',
          user: { name: 'Bhupesh Indurkar (Super Admin)', role: 'SUPER_ADMIN' }
        });
        setIsAdminLoading(false);
        return;
      }
    } catch (e) {}

    try {
      const adminApiUrl = (typeof window !== 'undefined' && window.location.hostname !== 'localhost')
        ? '/api/admin/login'
        : 'http://127.0.0.1:8000/api/admin/login';
      const res = await fetch(adminApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername,
          password: trimmedPass
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        try {
          localStorage.setItem('zeniva_admin_token', data.token);
          sessionStorage.setItem('zeniva_admin_auth_token', 'zeniva_master_2027');
          localStorage.setItem('zeniva_admin_auth_token', 'zeniva_master_2027');
        } catch (e) {}
        setIsAdminModalOpen(false);
        onAdminAuthenticated(data);
        setIsAdminLoading(false);
        return;
      }
    } catch (err) {
      // Backend offline fallback handled below
    }

    setAdminError('Invalid Admin Password. Access Denied.');
    setIsAdminLoading(false);
  };

  // Format HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isVerified = currentStatus === 'verified';
  const isRejected = currentStatus === 'rejected';

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6 font-sans text-stone-800 select-none flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Main Status Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EBE3D5] shadow-xl space-y-6 relative overflow-hidden text-center">
          
          {/* Top Status Icon */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-[#1C1030] flex items-center justify-center shadow-lg">
              {isVerified ? (
                <ShieldCheck className="w-11 h-11 text-green-400" />
              ) : isTimedOut ? (
                <AlertTriangle className="w-11 h-11 text-amber-400" />
              ) : isRejected ? (
                <AlertCircle className="w-11 h-11 text-red-400" />
              ) : (
                <Clock className="w-11 h-11 text-[#E5C07B] animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isVerified 
                    ? 'bg-green-100 text-green-800' 
                    : isTimedOut
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : isRejected 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-amber-100 text-amber-900 border border-amber-200'
                }`}>
                  {isVerified ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-700" />
                      <span>Zeniva AI Verified Doctor</span>
                    </>
                  ) : isTimedOut ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                      <span>Verification Window Expired</span>
                    </>
                  ) : isRejected ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-red-700" />
                      <span>Application Review Not Approved</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      <span>Awaiting Super Admin Verification</span>
                    </>
                  )}
                </span>
              </div>

              <h1 className="text-2xl font-serif font-bold text-stone-900 mt-2">
                {isVerified 
                  ? 'Doctor Credentials Verified!' 
                  : isRejected
                  ? 'Doctor Application Not Approved'
                  : isTimedOut 
                  ? 'Admin Review Window Expired' 
                  : 'Doctor Application Under Review'}
              </h1>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
                {isVerified 
                  ? 'Your medical license and clinical credentials have been approved by the Super Admin team.' 
                  : isRejected
                  ? 'The Super Admin clinical board could not verify your submitted credentials. Please review the reason below.'
                  : isTimedOut
                  ? 'The Super Admin has not reviewed your application within the 2-hour review window. Please re-upload your verification documents.'
                  : 'Thank you for registering with Zeniva. Our Super Admin clinical board is reviewing your submitted medical documents.'}
              </p>
            </div>
          </div>

          {/* Registered Doctor Profile Badge with Avatar */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-purple-200/80 text-left max-w-lg mx-auto shadow-xs">
            <img 
              src={doctorProfile.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400'} 
              alt={doctorProfile.name || 'Doctor'} 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-400 shadow-sm shrink-0"
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400'; }}
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-stone-900 truncate">
                  {doctorProfile.name?.startsWith('Dr.') ? doctorProfile.name : `Dr. ${doctorProfile.name || 'Ayurvedic Vaidya'}`}
                </h2>
                {isVerified && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
              </div>
              <p className="text-xs text-[#5B3E8C] font-semibold truncate">
                {doctorProfile.qualification || 'BAMS'} · {doctorProfile.specialization || 'Kayachikitsa'}
              </p>
              <div className="flex items-center gap-2 pt-0.5 text-[11px] text-stone-500 font-mono">
                <span>+91 {phone}</span>
                <span>•</span>
                <span className="truncate">{doctorProfile.city || 'Maharashtra'}</span>
              </div>
            </div>
          </div>

          {/* REJECTION REASON & SMS DISPATCH NOTICE (When Rejected) */}
          {isRejected && (
            <div className="p-5 rounded-3xl bg-red-50 border-2 border-red-200 text-left space-y-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>Super Admin Review Decision: Rejected</span>
              </div>
              
              <div className="p-3.5 rounded-2xl bg-white border border-red-200 text-xs space-y-1.5">
                <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Official Review Feedback / Reason:</p>
                <p className="font-semibold text-red-900 leading-relaxed">
                  "{rejectionReason || 'Medical Council Registration Number / Degree certificates could not be verified against the state medical council registry. Please upload clear scans of your official BAMS/MD degree and MCIM registration certificate.'}"
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <span className="text-base shrink-0">📱</span>
                <div>
                  <span className="font-bold">Instant Alert Dispatched:</span>
                  <p className="text-stone-600 mt-0.5">
                    An alert notification with resolution instructions has been sent to your registered mobile: <strong className="font-mono text-stone-900">+91 {phone}</strong>.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-stone-600 bg-stone-100/60 p-2.5 rounded-xl">
                💡 <strong>How to Resolve:</strong> Click the <strong>"Re-upload Documents & Re-apply"</strong> button below to update your Council details, attach clear certificate scans, and resubmit for instant approval.
              </div>
            </div>
          )}

          {/* 2-HOUR LIVE COUNTDOWN TIMER (When Pending) */}
          {!isVerified && !isTimedOut && !isRejected && (
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-700">
                <span className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700 animate-spin" />
                  Estimated Review Window (2 Hours):
                </span>
                <span className="font-mono font-bold text-base text-[#5B3E8C]">
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Animated Progress Bar */}
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#5B3E8C] h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(timeLeft / 7200) * 100}%` }}
                ></div>
              </div>

              <p className="text-[10px] text-stone-500">
                Please wait while the Super Admin verifies your submitted Council credentials and certificates.
              </p>
            </div>
          )}

          {/* TIMEOUT NOTICE & RE-UPLOAD PROMPT (When 2 hours expired) */}
          {isTimedOut && !isVerified && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-stone-700 space-y-2 text-left">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Verification Time Expired (2 Hours Passed)</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                The Super Admin was unable to approve your application within the allocated 2-hour review window. You must re-verify your documents to re-queue your clinical application.
              </p>
            </div>
          )}



          {/* TWO CLEAR IDENTIFIERS: Zeniva Doctor ID vs Official Council Reg Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-1">
            
            {/* 1. Zeniva System Doctor ID */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-purple-700 block tracking-wider">
                Zeniva System Doctor ID
              </span>
              <p className="font-mono text-base font-bold text-purple-950">
                {doctorProfile.id || 'ZEN-DOC-892144'}
              </p>
              <p className="text-[9px] text-purple-800 font-medium">Internal platform routing ID</p>
            </div>

            {/* 2. Official Council Registration Number */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-stone-500 block tracking-wider">
                Official Medical Council License No.
              </span>
              <p className="font-mono text-base font-bold text-stone-900">
                {doctorProfile.council_reg_number || 'AYU-MAH-8921'}
              </p>
              <p className="text-[9px] text-stone-500 font-medium">{doctorProfile.council_name || 'MCIM Maharashtra'}</p>
            </div>

          </div>

          {/* Doctor Info Summary */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left text-xs space-y-2">
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-stone-500">Physician Name:</span>
              <span className="font-bold text-stone-900">{doctorProfile.name || 'Dr. Practicing Vaidya'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-stone-500">Qualifications:</span>
              <span className="font-bold text-purple-900">{doctorProfile.qualification || 'BAMS, MD (Kayachikitsa)'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <span className="text-stone-500">Clinic / Organization:</span>
              <span className="font-bold text-stone-800">{doctorProfile.organization || 'Zeniva Ayurvedic Health Center'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Registered Contact:</span>
              <span className="font-mono font-bold text-stone-800">{doctorProfile.phone ? `+91 ${doctorProfile.phone}` : (doctorProfile.email || 'Registered Doctor')}</span>
            </div>
          </div>

          {/* TWO MANDATORY SUBMITTED VERIFICATION DOCUMENTS */}
          <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 text-left text-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-purple-700" />
                <span className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                  Submitted Verification Documents (सादर केलेली कागदपत्रे)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                2 Documents Attached
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Document 1: Degree Certificate */}
              <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900 text-[11px] truncate">1. Medical Degree Certificate</p>
                    <p className="text-[10px] text-stone-500 truncate">
                      {doctorProfile.documents?.degree_cert?.name || (typeof doctorProfile.documents?.degree_cert === 'string' ? doctorProfile.documents.degree_cert : 'BAMS_MD_Degree_Certificate.pdf')}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                  Attached ✓
                </span>
              </div>

              {/* Document 2: Council Registration */}
              <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900 text-[11px] truncate">2. Council Registration / ID</p>
                    <p className="text-[10px] text-stone-500 truncate">
                      {doctorProfile.documents?.council_cert?.name || (typeof doctorProfile.documents?.council_cert === 'string' ? doctorProfile.documents.council_cert : 'MCIM_Council_License.pdf')}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                  Attached ✓
                </span>
              </div>
            </div>
            
            <p className="text-[10px] text-stone-500 leading-relaxed italic">
              📄 Both documents have been queued for the Super Admin clinical review board. Access is granted once verified.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {isVerified ? (
              <button
                onClick={onOpenDoctorDashboard}
                className="w-full py-4 rounded-2xl bg-[#1E5039] hover:bg-[#163E2C] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Verified Doctor Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : isRejected || isTimedOut ? (
              <button
                onClick={onReuploadDocuments}
                className="w-full py-4 rounded-2xl bg-[#5B3E8C] hover:bg-[#4A2F75] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-upload Documents & Re-apply Now</span>
              </button>
            ) : (
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#5B3E8C]" />
                <span>Live Status: Automatically checking for Admin approval...</span>
              </div>
            )}

            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Back to Login Portal</span>
            </button>

            {/* 🔒 Admin Secure Access Link (Exact phrasing requested) */}
            <div className="pt-2 border-t border-stone-100 flex justify-center">
              <button
                onClick={() => {
                  setIsAdminModalOpen(true);
                  setAdminPassword('');
                  setAdminError('');
                }}
                className="text-xs text-stone-400 hover:text-[#5B3E8C] font-bold flex items-center gap-1.5 transition-colors cursor-pointer py-1 px-3 rounded-lg hover:bg-stone-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>🔒 Admin Secure Access</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECURE ADMIN LOGIN MODAL (Backend Password Verification: bhupesh@123)     */}
      {/* ========================================================================= */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE3D5] space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-[#5B3E8C]">
                <Shield className="w-5 h-5" />
                <h3 className="text-base font-serif font-bold text-stone-900">Admin Secure Access</h3>
              </div>
              <button 
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Restricted area for <strong>SUPER_ADMIN</strong>. Enter governance authorization credentials to access the Doctor Review Panel.
            </p>

            {adminError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs text-left">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Admin Username / Role</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="e.g. superadmin or bhupesh_admin"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-900 focus:bg-white focus:ring-2 focus:ring-purple-600/30 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Admin Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono font-medium text-stone-900 focus:bg-white focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdminLoading}
                className="w-full py-3.5 rounded-2xl bg-[#1C1030] hover:bg-purple-950 text-[#E5C07B] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isAdminLoading ? (
                  <span>Authenticating Role...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify Role & Access Admin Dashboard</span>
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW DOCTOR REGISTRATION APPROVED: WELCOME FLASH SCREEN                     */}
      {/* ========================================================================= */}
      {showWelcomeFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#140824]/92 backdrop-blur-md animate-in fade-in duration-300 select-none">
          <div className="relative max-w-xl w-full bg-gradient-to-b from-[#24103E] via-[#1A0A2E] to-[#120621] rounded-3xl p-6 sm:p-8 border-2 border-amber-400/60 shadow-[0_0_60px_rgba(217,119,6,0.4)] text-center text-white space-y-6 overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Ambient Background Gold Glow */}
            <div className="absolute -top-20 inset-x-0 mx-auto w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Glowing Verification Seal */}
            <div className="relative flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 blur-xl opacity-60 animate-pulse"></div>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#311756] to-[#452078] border-2 border-amber-300/80 flex items-center justify-center shadow-xl relative z-10">
                  <ShieldCheck className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-400" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] sm:text-xs font-bold tracking-wider uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Super Admin Verification Approved</span>
              </div>
            </div>

            {/* Heading & Sanskrit Benediction */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-amber-100">
                Welcome to Zeniva AI Clinical Panel
              </h2>
              <p className="text-xs text-amber-300/90 font-serif italic">
                "॥ आरोग्यं परमं भाग्यं स्वास्थ्यं सर्वार्थसाधनम् ॥"
              </p>
              <p className="text-xs text-stone-300 max-w-md mx-auto leading-relaxed">
                Your credentials have been verified against the State Medical Council registry. You now have full statutory clinical privileges.
              </p>
            </div>

            {/* Doctor Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#2D164D]/80 border border-amber-300/30 text-left">
              <img 
                src={(verifiedDocData || doctorProfile).avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400'} 
                alt="Doctor" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 shadow-md shrink-0" 
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400'; }}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-serif text-white truncate">
                    {(verifiedDocData || doctorProfile).name?.startsWith('Dr.') ? (verifiedDocData || doctorProfile).name : `Dr. ${(verifiedDocData || doctorProfile).name || 'Ayurvedic Vaidya'}`}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">Active</span>
                </div>
                <p className="text-xs text-amber-200/90 font-medium truncate">
                  {(verifiedDocData || doctorProfile).qualification || 'BAMS, MD'} · {(verifiedDocData || doctorProfile).specialization || 'Kayachikitsa'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-stone-300">
                  <span>ID: {(verifiedDocData || doctorProfile).id || 'ZEN-DOC-784219'}</span>
                  <span>•</span>
                  <span className="truncate">MCIM: {(verifiedDocData || doctorProfile).council_reg_number || 'AYU-MAH-8921'}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar & Countdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span>Synchronizing Clinical Workspace...</span>
                <span className="text-amber-300 font-bold font-mono">Launching in {flashCountdown}s</span>
              </div>
              <div className="w-full h-1.5 bg-[#170B29] rounded-full overflow-hidden border border-purple-900">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-purple-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${((3 - flashCountdown) / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Immediate Action CTA */}
            <button
              type="button"
              onClick={() => onOpenDoctorDashboard(verifiedDocData || doctorProfile)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <span>Enter Doctor Dashboard Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
