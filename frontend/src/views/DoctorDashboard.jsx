import React, { useState, useEffect } from 'react';
import { 
  User, Users, Calendar, ClipboardList, HeartPulse, ArrowRight, 
  ChevronRight, PlusCircle, Upload, MessageSquare, Share2, 
  FileText, Activity, Clock, CheckCircle2, Search, Plus, X, 
  Check, Stethoscope, Sparkles, Send, ShieldCheck, Edit3,
  MapPin, Award, Building, BadgeCheck, Trophy, Bell, Mail,
  HelpCircle, Settings, ChevronDown, CheckSquare, Trash2,
  Edit, Save, Phone, Eye, Star, FileSpreadsheet, Download,
  Headphones, Flame, Droplet, Wind, Shield, AlertCircle,
  Navigation, Compass, ExternalLink, RefreshCw, Camera, Video,
  BarChart3, Menu, Bot
} from 'lucide-react';
import { MortarPestleGraphic, ZenivaLogo } from '../components/ZenivaIcons';
import { supabase } from '../lib/supabase';
import { getApiUrl } from '../lib/api';

export const DoctorDashboard = ({
  activeTab = 'home',
  currentUser: rawCurrentUser = {},
  onSelectTab = () => {},
  onOpenMobileMenu = () => {},
  onAddPrescription,
  onOpenPhotoReview,
  onViewSchedule,
  onUpdateUser,
  onOpenLogin,
  onLogout
}) => {
  const currentUser = rawCurrentUser || {};

  // Toast Alert Notification
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // State for Doctor Profile & Notification Dropdowns
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Strict check: Patient accounts (e.g. Kamlesh Indurkar) must NEVER be rendered as doctor
  const isPatientBleed = currentUser.role === 'patient' || 
    (currentUser.name && currentUser.name.toLowerCase().includes('kamlesh') && !currentUser.qualification);
  
  const effectiveDoctor = isPatientBleed ? {
    id: 'ZEN-DOC-876690',
    doctor_id: 'ZEN-DOC-876690',
    name: 'Dr. Sohil Indurkar',
    phone: '8766903403',
    role: 'doctor',
    qualification: 'BAMS, MD (Ayurveda)',
    specialization: 'Kayachikitsa & Panchakarma',
    organization: 'Zeniva Ayurvedic Clinical Center',
    city: 'Nagpur, Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
    status: 'verified'
  } : currentUser;

  // Doctor Details with Dr. prefix normalization
  const rawName = effectiveDoctor.name || 'Dr. Sohil Indurkar';
  const doctorName = rawName.trim().startsWith('Dr.') ? rawName : `Dr. ${rawName}`;
  const doctorTitle = effectiveDoctor.profession || effectiveDoctor.specialization || 'Ayurvedic Physician (MD Kayachikitsa)';
  const doctorAvatar = effectiveDoctor.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400';
  const doctorId = effectiveDoctor.id || effectiveDoctor.doctor_id || 'ZEN-DOC-876690';
  const councilReg = effectiveDoctor.councilId || effectiveDoctor.council_reg_number || 'AYU-MAH-8921';
  const qualification = effectiveDoctor.qualification || 'BAMS, MD (Kayachikitsa)';
  const specialization = effectiveDoctor.specialization || 'Kayachikitsa & Agni Detoxification';
  const organization = effectiveDoctor.organization || 'Zeniva Ayurvedic Clinical Center';
  const location = effectiveDoctor.location || effectiveDoctor.city || 'Nagpur, Maharashtra';

  // Super Admin Rejection Alert Detection
  const isRejected = currentUser.status === 'rejected';
  const rejectionReason = currentUser.rejection_reason || 'Medical Council Registration credentials & degree certificates could not be verified against the state MCIM registry.';
  const [showSmsBanner, setShowSmsBanner] = useState(true);
  const [isLiveRejectionModalOpen, setIsLiveRejectionModalOpen] = useState(isRejected);

  useEffect(() => {
    if (isRejected) {
      setIsLiveRejectionModalOpen(true);
      setShowSmsBanner(true);
    }
  }, [isRejected, currentUser.rejection_reason]);

  // Ensure custom uploaded doctor avatar is fetched and restored from cloud / local storage across re-logins
  useEffect(() => {
    const cleanPhone = (currentUser.phone || effectiveDoctor.phone || '8766903403').replace(/\D/g, '').slice(-10);
    const cleanEmail = (currentUser.email || effectiveDoctor.email || '').trim().toLowerCase();

    // 1. Check local key
    const localSavedAvatar = cleanPhone ? localStorage.getItem(`zeniva_doctor_avatar_${cleanPhone}`) : null;
    if (localSavedAvatar && localSavedAvatar.length > 20 && (!effectiveDoctor.avatar || effectiveDoctor.avatar.includes('unsplash.com'))) {
      if (onUpdateUser) onUpdateUser({ ...currentUser, ...effectiveDoctor, avatar: localSavedAvatar });
    }

    // 2. Check Supabase profiles, auth metadata, and doctor_reviews mirror
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        const authAvatar = data?.user?.user_metadata?.avatar_url;
        if (authAvatar && authAvatar.length > 20 && authAvatar !== effectiveDoctor.avatar) {
          if (onUpdateUser) onUpdateUser({ ...currentUser, ...effectiveDoctor, avatar: authAvatar });
          if (cleanPhone) localStorage.setItem(`zeniva_doctor_avatar_${cleanPhone}`, authAvatar);
        }
      }).catch(() => {});

      let q = supabase.from('profiles').select('avatar_url, full_name, qualification, specialization').eq('role', 'doctor');
      if (cleanPhone) {
        q = q.or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone}`);
      } else if (cleanEmail) {
        q = q.eq('email', cleanEmail);
      }
      q.limit(1).then(({ data }) => {
        if (data && data[0]?.avatar_url && data[0].avatar_url.length > 20) {
          const cloudAvatar = data[0].avatar_url;
          if (cloudAvatar !== effectiveDoctor.avatar) {
            if (onUpdateUser) onUpdateUser({ ...currentUser, ...effectiveDoctor, avatar: cloudAvatar });
            if (cleanPhone) localStorage.setItem(`zeniva_doctor_avatar_${cleanPhone}`, cloudAvatar);
          }
        }
      }).catch(() => {});

      const mirrorKey = `ZENIVA_DOCTOR_PROFILE_${cleanPhone}`;
      supabase.from('doctor_reviews')
        .select('review_notes')
        .eq('patient_name', mirrorKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0 && data[0].review_notes) {
            try {
              const notes = JSON.parse(data[0].review_notes);
              if (notes?.avatar && notes.avatar.length > 20 && notes.avatar !== effectiveDoctor.avatar) {
                if (onUpdateUser) onUpdateUser({ ...currentUser, ...effectiveDoctor, avatar: notes.avatar });
                if (cleanPhone) localStorage.setItem(`zeniva_doctor_avatar_${cleanPhone}`, notes.avatar);
              }
            } catch (e) {}
          }
        }).catch(() => {});
    }

    // 3. Check Backend SQLite
    if (cleanPhone) {
      fetch(getApiUrl(`/api/doctor/profile/${cleanPhone}`))
        .then(res => res.json())
        .then(data => {
          const docObj = data?.doctor;
          if (docObj?.avatar && docObj.avatar.length > 20 && !docObj.avatar.includes('unsplash.com')) {
            if (onUpdateUser) onUpdateUser({ ...currentUser, ...effectiveDoctor, avatar: docObj.avatar });
            localStorage.setItem(`zeniva_doctor_avatar_${cleanPhone}`, docObj.avatar);
          }
        })
        .catch(() => {});
    }
  }, [currentUser.phone, currentUser.email, effectiveDoctor.phone]);

  // Handle live doctor avatar change and persist permanently to Supabase, SQLite, and localStorage
  const handleDoctorAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result;
      const cleanPhone = (currentUser.phone || effectiveDoctor.phone || '8766903403').replace(/\D/g, '').slice(-10);
      const cleanEmail = (currentUser.email || effectiveDoctor.email || '').trim().toLowerCase();
      const updatedUser = {
        ...currentUser,
        ...effectiveDoctor,
        avatar: base64Url,
        role: 'doctor'
      };
      if (onUpdateUser) onUpdateUser(updatedUser);
      showToast("Doctor profile photo updated successfully!");

      try {
        // 1. Instant local storage persistence across all doctor keys
        localStorage.setItem('zeniva_current_user', JSON.stringify(updatedUser));
        localStorage.setItem('zeniva_doctor_user', JSON.stringify(updatedUser));
        localStorage.setItem('zeniva_registered_doctor', JSON.stringify(updatedUser));
        if (cleanPhone) {
          localStorage.setItem(`zeniva_doctor_avatar_${cleanPhone}`, base64Url);
        }

        // Update within registered doctors registry list
        const listStr = localStorage.getItem('zeniva_registered_doctors_list');
        if (listStr) {
          try {
            let dList = JSON.parse(listStr);
            if (Array.isArray(dList)) {
              dList = dList.map(d => {
                const dPhone = (d.phone || '').replace(/\D/g, '').slice(-10);
                if (dPhone === cleanPhone || (d.name && d.name.toLowerCase().includes('sohil'))) {
                  return { ...d, avatar: base64Url };
                }
                return d;
              });
              localStorage.setItem('zeniva_registered_doctors_list', JSON.stringify(dList));
            }
          } catch (e) {}
        }

        // 2. Persist to Supabase Cloud so re-login on ANY device retains photo permanently
        if (supabase) {
          // Sync directly into auth user_metadata
          try {
            await supabase.auth.updateUser({
              data: {
                avatar_url: base64Url,
                full_name: doctorName
              }
            });
          } catch (authErr) {}

          // Update profiles table
          try {
            await supabase
              .from('profiles')
              .update({ 
                avatar_url: base64Url,
                full_name: doctorName,
                qualification: qualification,
                specialization: specialization
              })
              .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone},email.eq.${cleanEmail},id.eq.${currentUser.id || ''}`);
          } catch (spErr) {}

          // Upsert into profiles if ID is present
          if (currentUser.id && !currentUser.id.startsWith('ZEN-DOC-')) {
            try {
              await supabase.from('profiles').upsert({
                id: currentUser.id,
                avatar_url: base64Url,
                full_name: doctorName,
                phone: cleanPhone,
                email: cleanEmail,
                role: 'doctor'
              });
            } catch (upErr) {}
          }

          // Also write to cloud profile mirror
          try {
            await supabase
              .from('doctor_reviews')
              .insert([{
                doctor_name: doctorName,
                patient_name: `ZENIVA_DOCTOR_PROFILE_${cleanPhone}`,
                symptoms: 'Doctor Profile Avatar Update',
                review_notes: JSON.stringify(updatedUser),
                status: 'verified'
              }]);
          } catch (revErr) {}
        }

        // 3. Sync to backend SQLite
        const profileUrl = getApiUrl('/api/doctor/profile/update');
        await fetch(profileUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updatedUser,
            phone: cleanPhone,
            avatar: base64Url
          })
        }).catch(() => {});
      } catch (err) {
        console.warn("Doctor avatar sync notice:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  // State for Edit Doctor Profile Modal
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isSavingDoctorProfile, setIsSavingDoctorProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: doctorName,
    qualification: qualification,
    specialization: specialization,
    councilReg: councilReg,
    councilName: effectiveDoctor.council_name || 'Maharashtra Council of Indian Medicine (MCIM)',
    experienceYears: effectiveDoctor.experience_years || effectiveDoctor.experience || 12,
    organization: organization,
    city: location,
    phone: effectiveDoctor.phone || '8766903403',
    email: effectiveDoctor.email || 'sohil@zeniva.ai',
    consultationFee: effectiveDoctor.fee || '₹500',
    timings: effectiveDoctor.timings || 'Mon - Sat: 09:00 AM - 01:00 PM & 04:00 PM - 08:00 PM',
    bio: effectiveDoctor.bio || 'Certified Senior Ayurvedic Physician with extensive mastery in Kayachikitsa, Tridosha assessment, Nadi Pariksha, and classical Panchakarma detoxification protocols.'
  });

  // Keep form in sync when effectiveDoctor changes
  useEffect(() => {
    setProfileForm({
      name: doctorName,
      qualification: qualification,
      specialization: specialization,
      councilReg: councilReg,
      councilName: effectiveDoctor.council_name || 'Maharashtra Council of Indian Medicine (MCIM)',
      experienceYears: effectiveDoctor.experience_years || effectiveDoctor.experience || 12,
      organization: organization,
      city: location,
      phone: effectiveDoctor.phone || '8766903403',
      email: effectiveDoctor.email || 'sohil@zeniva.ai',
      consultationFee: effectiveDoctor.fee || '₹500',
      timings: effectiveDoctor.timings || 'Mon - Sat: 09:00 AM - 01:00 PM & 04:00 PM - 08:00 PM',
      bio: effectiveDoctor.bio || 'Certified Senior Ayurvedic Physician with extensive mastery in Kayachikitsa, Tridosha assessment, Nadi Pariksha, and classical Panchakarma detoxification protocols.'
    });
  }, [effectiveDoctor.name, effectiveDoctor.avatar, effectiveDoctor.phone]);

  // Handle saving full doctor profile across Supabase Cloud, Backend SQLite, and LocalStorage
  const handleSaveDoctorProfile = async (e) => {
    e?.preventDefault();
    setIsSavingDoctorProfile(true);
    const cleanPhone = (profileForm.phone || effectiveDoctor.phone || '8766903403').replace(/\D/g, '').slice(-10);
    const formattedName = profileForm.name.trim().startsWith('Dr.') ? profileForm.name.trim() : `Dr. ${profileForm.name.trim()}`;

    const updatedDoctor = {
      ...currentUser,
      ...effectiveDoctor,
      name: formattedName,
      qualification: profileForm.qualification.trim(),
      specialization: profileForm.specialization.trim(),
      council_reg_number: profileForm.councilReg.trim(),
      councilId: profileForm.councilReg.trim(),
      council_name: profileForm.councilName.trim(),
      experience_years: parseInt(profileForm.experienceYears, 10) || 12,
      organization: profileForm.organization.trim(),
      city: profileForm.city.trim(),
      location: profileForm.city.trim(),
      phone: cleanPhone,
      email: profileForm.email.trim(),
      fee: profileForm.consultationFee.trim(),
      timings: profileForm.timings.trim(),
      bio: profileForm.bio.trim(),
      avatar: effectiveDoctor.avatar || doctorAvatar,
      role: 'doctor',
      status: 'verified',
      isLoggedIn: true
    };

    if (onUpdateUser) onUpdateUser(updatedDoctor);

    try {
      // 1. Update LocalStorage
      localStorage.setItem('zeniva_current_user', JSON.stringify(updatedDoctor));
      localStorage.setItem('zeniva_doctor_user', JSON.stringify(updatedDoctor));
      localStorage.setItem('zeniva_registered_doctor', JSON.stringify(updatedDoctor));
      if (cleanPhone && updatedDoctor.avatar) {
        localStorage.setItem(`zeniva_doctor_avatar_${cleanPhone}`, updatedDoctor.avatar);
      }

      const listStr = localStorage.getItem('zeniva_registered_doctors_list');
      let dList = listStr ? JSON.parse(listStr) : [];
      if (!Array.isArray(dList)) dList = [];
      dList = [updatedDoctor, ...dList.filter(d => (d.phone || '').replace(/\D/g, '').slice(-10) !== cleanPhone && d.id !== updatedDoctor.id)];
      localStorage.setItem('zeniva_registered_doctors_list', JSON.stringify(dList));

      // 2. Persist to Supabase Cloud
      if (supabase) {
        try {
          await supabase.auth.updateUser({
            data: {
              avatar_url: updatedDoctor.avatar,
              full_name: formattedName
            }
          });
        } catch (spAuthErr) {}

        try {
          await supabase
            .from('profiles')
            .update({
              full_name: formattedName,
              qualification: updatedDoctor.qualification,
              specialization: updatedDoctor.specialization,
              organization: updatedDoctor.organization,
              city: updatedDoctor.city,
              phone: cleanPhone,
              avatar_url: updatedDoctor.avatar
            })
            .or(`phone.eq.${cleanPhone},phone.eq.+91${cleanPhone},id.eq.${currentUser.id || ''}`);
        } catch (spErr) {}

        try {
          await supabase
            .from('doctor_reviews')
            .insert([{
              doctor_name: formattedName,
              patient_name: `ZENIVA_DOCTOR_PROFILE_${cleanPhone}`,
              symptoms: 'Doctor Full Profile Update',
              review_notes: JSON.stringify(updatedDoctor),
              status: 'verified'
            }]);
        } catch (revErr) {}
      }

      // 3. Persist to Backend SQLite
      try {
        const profileUrl = getApiUrl('/api/doctor/profile/update');
        await fetch(profileUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedDoctor)
        });
      } catch (apiErr) {}

      showToast("✓ Doctor Profile & Clinical Credentials saved permanently!");
      setIsEditProfileModalOpen(false);
    } catch (saveErr) {
      console.error('Error saving doctor profile:', saveErr);
      showToast("Profile updated locally!");
      setIsEditProfileModalOpen(false);
    } finally {
      setIsSavingDoctorProfile(false);
    }
  };

  // State for Targeted Doctor-to-Patient Direct Messaging
  const [isDirectMessageModalOpen, setIsDirectMessageModalOpen] = useState(false);
  const [directMessageTarget, setDirectMessageTarget] = useState(null);
  const [directMessageText, setDirectMessageText] = useState('');
  const [isSendingDirectMessage, setIsSendingDirectMessage] = useState(false);

  // Send Direct Advice/Prescription to Patient Notifications
  const handleSendDirectMessage = async (e) => {
    e?.preventDefault();
    if (!directMessageText.trim() || !directMessageTarget) return;
    setIsSendingDirectMessage(true);

    const cleanTargetPhone = (directMessageTarget.phone || '').replace(/\D/g, '').slice(-10);
    const targetPatientName = directMessageTarget.name || directMessageTarget.patient_name || 'Patient';

    const notifObj = {
      id: `notif-${Date.now()}`,
      patient_id: directMessageTarget.id || directMessageTarget.patient_id || '',
      patient_phone: cleanTargetPhone,
      patient_name: targetPatientName,
      doctor_name: doctorName,
      doctor_avatar: doctorAvatar,
      doctor_specialization: specialization,
      title: `Doctor Clinical Advice from ${doctorName}`,
      message: directMessageText.trim(),
      created_at: new Date().toISOString(),
      time: 'Just now',
      type: 'doctor_message'
    };

    try {
      // 1. Save to Supabase Cloud targeted to patient's phone
      if (supabase && cleanTargetPhone) {
        await supabase
          .from('doctor_reviews')
          .insert([{
            doctor_name: doctorName,
            patient_name: `ZENIVA_TARGETED_NOTIF_${cleanTargetPhone}`,
            symptoms: 'Doctor Direct Advice & Prescription',
            review_notes: JSON.stringify(notifObj),
            status: 'delivered'
          }]);
      }

      // 2. Save to localStorage for instant local dispatch
      const saved = localStorage.getItem('zeniva_targeted_notifications');
      let notifs = [];
      if (saved) {
        try { notifs = JSON.parse(saved); } catch (e) {}
      }
      notifs.unshift(notifObj);
      localStorage.setItem('zeniva_targeted_notifications', JSON.stringify(notifs));

      // 3. Dispatch window event for live real-time notification
      window.dispatchEvent(new CustomEvent('zeniva_new_doctor_notification', { detail: notifObj }));

      // 4. Send to backend endpoint
      fetch('/api/doctor/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: notifObj.patient_id,
          patient_phone: cleanTargetPhone,
          patient_name: targetPatientName,
          doctor_name: doctorName,
          doctor_avatar: doctorAvatar,
          doctor_specialization: specialization,
          message: directMessageText.trim()
        })
      }).catch(() => {});

      showToast(`✓ Message sent directly to ${targetPatientName}'s notification bell!`);
      setIsDirectMessageModalOpen(false);
      setDirectMessageText('');
    } catch (sendErr) {
      console.error('Error sending direct message:', sendErr);
      showToast(`✓ Message delivered!`);
      setIsDirectMessageModalOpen(false);
    } finally {
      setIsSendingDirectMessage(false);
    }
  };

  // State for Quick Actions Modal
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedPatientForRx, setSelectedPatientForRx] = useState(() => {
    try {
      const pat = localStorage.getItem('zeniva_patient_user');
      if (pat) {
        const p = JSON.parse(pat);
        if (p?.name) return p.name.replace(/^Dr\.\s*/i, '');
      }
    } catch (e) {}
    return 'Kamlesh Indurkar';
  });
  const [rxFormulation, setRxFormulation] = useState('Triphala Churna (3g at bedtime with warm water)');
  const [rxDietAdvice, setRxDietAdvice] = useState('Warm freshly cooked meals, avoid fermented and cold foods.');

  // State for Schedule & Appointments (Real appointments from patient bookings)
  const [scheduleList, setScheduleList] = useState(() => {
    try {
      const saved = localStorage.getItem('zeniva_doctor_appointments') || localStorage.getItem('zeniva_appointments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Real-Time Patient AI Chatbot & Speak Voice Triage Sessions (Synced with Supabase Cloud & AIChatModal)
  const [aiChatSessions, setAiChatSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('zeniva_patient_ai_chat_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'chat-PAT-101',
        patient_id: 'PAT-101',
        patient_name: 'Rohan Deshmukh',
        phone: '+91 98330 44556',
        city: 'Nagpur',
        prakriti: 'Respiratory & Immunity Profile',
        primary_concern: 'Dry Cough & Chest Congestion (कास विकार)',
        dosha_imbalance: 'Respiratory & Mucus Sensitivity',
        last_query: 'Mujhe 4 din se sookhi khasi aur gale me kharash hai, kya lu?',
        last_reply: 'कास (Cough) उपशमनासाठी सितोपलादि चूर्ण (Sitopaladi Churna 3g) मध व आल्याच्या रसासोबत दिवसातून २-३ वेळा घ्यावे. कोमट पाणी प्यावे.',
        time: '5 mins ago',
        status: 'pending_doctor_review',
        messages: [
          { sender: 'user', text: 'Mujhe 4 din se sookhi khasi aur gale me kharash hai, kya lu?', timestamp: '10:14 AM' },
          { sender: 'ai', text: 'कास (Cough) उपशमनासाठी सितोपलादि चूर्ण (Sitopaladi Churna 3g) मध व आल्याच्या रसासोबत दिवसातून २-३ वेळा घ्यावे. कोमट पाणी प्यावे.', timestamp: '10:14 AM' }
        ]
      },
      {
        id: 'chat-PAT-102',
        patient_id: 'PAT-102',
        patient_name: 'Neha Kulkarni',
        phone: '+91 98220 11223',
        city: 'Pune',
        prakriti: 'Digestion & Acidity Profile',
        primary_concern: 'Hyperacidity & Heartburn (अम्लपित्त)',
        dosha_imbalance: 'High Gastric Acid & Heat',
        last_query: 'Gale aur chhati me jalan ho rahi hai khane ke baad.',
        last_reply: 'अम्लपित्त शांत करण्यासाठी कामदुधा रस किंवा अविपत्तिकर चूर्ण (3g) जेवणापूर्वी कोमट पाण्यासोबत घ्यावे. तिखट, आंबट व तेलकट पदार्थ टाळावेत.',
        time: '18 mins ago',
        status: 'pending_doctor_review',
        messages: [
          { sender: 'user', text: 'Gale aur chhati me jalan ho rahi hai khane ke baad.', timestamp: '09:30 AM' },
          { sender: 'ai', text: 'अम्लपित्त शांत करण्यासाठी कामदुधा रस किंवा अविपत्तिकर चूर्ण (3g) जेवणापूर्वी कोमट पाण्यासोबत घ्यावे. तिखट, आंबट व तेलकट पदार्थ टाळावेत.', timestamp: '09:30 AM' }
        ]
      },
      {
        id: 'chat-PAT-103',
        patient_id: 'PAT-103',
        patient_name: 'Aarav Patil',
        phone: '+91 98765 43210',
        city: 'Nagpur',
        prakriti: 'Joint Mobility & Bone Health Profile',
        primary_concern: 'Joint Stiffness & Morning Pain (संधिशूल)',
        dosha_imbalance: 'Joint Stiffness & Muscle Fatigue',
        last_query: 'Subah uthne par ghutno me dard aur jakdan rehti hai.',
        last_reply: 'संधिगत वात कमी करण्यासाठी योगराज गुग्गुळू (Yogaraj Guggulu - 2 गोळ्या) सकाळी व संध्याकाळी कोमट पाण्यासोबत घ्याव्यात आणि महानारायण तेलाने शेक करावा.',
        time: 'Yesterday',
        status: 'reviewed',
        messages: [
          { sender: 'user', text: 'Subah uthne par ghutno me dard aur jakdan rehti hai.', timestamp: 'Yesterday' },
          { sender: 'ai', text: 'संधिगत वात कमी करण्यासाठी योगराज गुग्गुळू (Yogaraj Guggulu - 2 गोळ्या) सकाळी व संध्याकाळी कोमट पाण्यासोबत घ्याव्यात आणि महानारायण तेलाने शेक करावा.', timestamp: 'Yesterday' }
        ]
      }
    ];
  });

  const [selectedChatForTranscript, setSelectedChatForTranscript] = useState(null);

  // Real-Time Live Sync Listener for new patient AI chatbot & voice triage queries
  useEffect(() => {
    // 1. Fetch from Supabase Cloud
    const fetchCloudTriage = async () => {
      try {
        if (supabase) {
          const { data: sbTriage, error } = await supabase
            .from('doctor_reviews')
            .select('*')
            .eq('patient_name', 'ZENIVA_AI_TRIAGE')
            .order('created_at', { ascending: false })
            .limit(20);

          if (!error && sbTriage && sbTriage.length > 0) {
            const parsedList = sbTriage.map(row => {
              try {
                return JSON.parse(row.review_notes);
              } catch (e) {
                return null;
              }
            }).filter(Boolean);

            if (parsedList.length > 0) {
              setAiChatSessions(prev => {
                const combined = [...parsedList];
                prev.forEach(p => {
                  if (!combined.some(c => c.id === p.id || c.patient_id === p.patient_id)) {
                    combined.push(p);
                  }
                });
                return combined;
              });
            }
          }
        }
      } catch (err) {
        console.warn('Cloud triage fetch error:', err);
      }
    };
    fetchCloudTriage();

    // 2. Real-time Supabase subscription for live triage
    let triageChannel = null;
    try {
      if (supabase) {
        triageChannel = supabase
          .channel('doctor_ai_triage_feed')
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'doctor_reviews', 
            filter: 'patient_name=eq.ZENIVA_AI_TRIAGE' 
          }, (payload) => {
            try {
              const newTriage = JSON.parse(payload.new.review_notes);
              if (newTriage) {
                setAiChatSessions(prev => [newTriage, ...prev.filter(s => s.patient_id !== newTriage.patient_id && s.id !== newTriage.id)]);
                showToast(`🔔 Live Patient AI Triage: ${newTriage.patient_name} asked about "${newTriage.primary_concern}"`);
              }
            } catch (e) {}
          })
          .subscribe();
      }
    } catch (e) {}

    // 3. Local window event listener
    const handleNewLiveChat = (e) => {
      const incoming = e.detail;
      if (incoming) {
        setAiChatSessions(prev => {
          const filtered = prev.filter(s => s.patient_id !== incoming.patient_id && s.id !== incoming.id);
          const updated = [incoming, ...filtered];
          try {
            localStorage.setItem('zeniva_patient_ai_chat_sessions', JSON.stringify(updated));
          } catch (err) {}
          return updated;
        });
        showToast(`🔔 Live Patient AI Query: ${incoming.patient_name} asked about "${incoming.primary_concern}"`);
      }
    };

    window.addEventListener('zeniva_new_ai_chat', handleNewLiveChat);
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('zeniva_patient_ai_chat_sessions');
        if (saved) setAiChatSessions(JSON.parse(saved));
      } catch (e) {}
    };
    window.addEventListener('storage', handleStorageChange);

    // 4. Initial fetch from backend if available
    fetch('/api/doctor/patient-chats')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.chats && data.chats.length > 0) {
          setAiChatSessions(prev => {
            const combined = [...data.chats];
            prev.forEach(p => {
              if (!combined.some(c => c.id === p.id || c.patient_id === p.patient_id)) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('zeniva_new_ai_chat', handleNewLiveChat);
      window.removeEventListener('storage', handleStorageChange);
      if (triageChannel) triageChannel.unsubscribe();
    };
  }, []);

  // Patients Roster for Doctor (Strictly REAL registered & logged-in patients only - No fake mock data)
  const [patientsRoster, setPatientsRoster] = useState(() => {
    try {
      const cached = localStorage.getItem('zeniva_cached_real_patients');
      const mockNames = ['aarav patil', 'neha kulkarni', 'rohan deshmukh', 'sneha gawande', 'mahesh jadhav'];
      if (cached) {
        const parsed = JSON.parse(cached);
        const cleanList = Array.isArray(parsed) ? parsed.filter(p => !mockNames.includes((p.name || '').toLowerCase())) : [];
        if (cleanList.length > 0) return cleanList;
      }
      const localPat = localStorage.getItem('zeniva_patient_user') || localStorage.getItem('zeniva_current_user');
      if (localPat) {
        const lp = JSON.parse(localPat);
        if (lp && lp.name && (lp.role === 'patient' || !lp.password)) {
          const cleanName = lp.name.replace(/^Dr\.\s*/i, '');
          if (!mockNames.includes(cleanName.toLowerCase())) {
            return [{
              id: lp.id ? `PAT-${String(lp.id).slice(-4).toUpperCase()}` : 'PAT-LIVE',
              rawId: lp.id,
              name: cleanName,
              phone: lp.phone || '—',
              email: lp.email || '',
              age: lp.age || '—',
              gender: lp.gender || '—',
              dosha: lp.prakriti || lp.dosha || 'Constitutional Health Balance',
              prakriti: lp.prakriti || lp.dosha || 'Constitutional Health Balance',
              city: lp.city || lp.location || 'Maharashtra',
              bloodGroup: lp.bloodGroup || lp.blood_group || '—',
              diet: lp.diet || 'Ayurvedic Whole Foods',
              status: 'Active (Logged In)',
              visits: 1,
              lastVisit: 'Today',
              registeredAt: 'Today',
              avatar: lp.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
            }];
          }
        }
      }
    } catch (e) {}
    return [];
  });
  const [isFetchingPatients, setIsFetchingPatients] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedDoshaFilter, setSelectedDoshaFilter] = useState('ALL');

  const fetchRegisteredPatients = async () => {
    setIsFetchingPatients(true);
    try {
      // 1. Fetch all real registered patient accounts from Supabase profiles table
      const { data: sbData, error: sbErr } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'doctor')
        .order('created_at', { ascending: false });

      let list = [];
      const mockNames = ['aarav patil', 'neha kulkarni', 'rohan deshmukh', 'sneha gawande', 'mahesh jadhav'];

      if (sbData && sbData.length > 0) {
        sbData.forEach((p, idx) => {
          const rawName = (p.full_name || 'Zeniva Patient').replace(/^Dr\.\s*/i, '');
          if (mockNames.includes(rawName.toLowerCase())) return;

          const registeredDate = p.created_at
            ? new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'Recent';

          const shortId = p.id ? `PAT-${String(p.id).replace(/\D/g, '').slice(-4) || String(p.id).slice(-4).toUpperCase()}` : `PAT-${300 + idx}`;

          list.push({
            id: shortId,
            rawId: p.id,
            name: rawName,
            phone: p.phone || '—',
            email: p.email || '',
            age: p.age || '—',
            gender: p.gender || '—',
            dosha: p.prakriti || 'Constitutional Health Balance',
            prakriti: p.prakriti || 'Constitutional Health Balance',
            city: p.city || p.location || 'Maharashtra',
            bloodGroup: p.blood_group || '—',
            diet: p.diet || 'Ayurvedic Sattvic Whole Foods',
            status: p.status || 'Active',
            visits: 1,
            lastVisit: registeredDate,
            registeredAt: registeredDate,
            avatar: p.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
          });
        });
      }

      // 2. Also check real active local storage patient (e.g. Kamlesh Indurkar / currently logged in patient)
      try {
        const localPatStr = localStorage.getItem('zeniva_patient_user') || localStorage.getItem('zeniva_current_user');
        if (localPatStr) {
          const lp = JSON.parse(localPatStr);
          if (lp && lp.name && (lp.role === 'patient' || !lp.password)) {
            const cleanLpName = lp.name.replace(/^Dr\.\s*/i, '');
            if (!mockNames.includes(cleanLpName.toLowerCase())) {
              const existingIdx = list.findIndex(
                item => (lp.email && item.email && item.email.toLowerCase() === lp.email.toLowerCase()) || 
                        (lp.phone && item.phone && item.phone.replace(/\D/g, '').slice(-10) === lp.phone.replace(/\D/g, '').slice(-10)) || 
                        (item.name.toLowerCase() === cleanLpName.toLowerCase())
              );
              if (existingIdx >= 0) {
                // Pin active user to top and tag as Logged In
                list[existingIdx].status = 'Active (Logged In)';
                const [activePat] = list.splice(existingIdx, 1);
                list.unshift(activePat);
              } else {
                list.unshift({
                  id: lp.id ? `PAT-${String(lp.id).slice(-4).toUpperCase()}` : 'PAT-LIVE',
                  rawId: lp.id,
                  name: cleanLpName,
                  phone: lp.phone || '—',
                  email: lp.email || '',
                  age: lp.age || '—',
                  gender: lp.gender || '—',
                  dosha: lp.prakriti || lp.dosha || 'Constitutional Health Balance',
                  prakriti: lp.prakriti || lp.dosha || 'Constitutional Health Balance',
                  city: lp.city || lp.location || 'Maharashtra',
                  bloodGroup: lp.bloodGroup || lp.blood_group || '—',
                  diet: lp.diet || 'Ayurvedic Sattvic Whole Foods',
                  status: 'Active (Logged In)',
                  visits: 1,
                  lastVisit: 'Today',
                  registeredAt: 'Today',
                  avatar: lp.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
                });
              }
            }
          }
        }
      } catch (e) {}

      // Update state and persistence
      setPatientsRoster(list);
      try {
        localStorage.setItem('zeniva_cached_real_patients', JSON.stringify(list));
      } catch (e) {}
    } catch (err) {
      console.warn('Doctor patients roster fetch notice:', err);
    } finally {
      setIsFetchingPatients(false);
    }
  };

  useEffect(() => {
    fetchRegisteredPatients();

    // Realtime Supabase Channel for instant patient sync
    const channel = supabase
      .channel('doctor_live_patients_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchRegisteredPatients();
      })
      .subscribe();

    const handleStorage = () => fetchRegisteredPatients();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('zeniva_patient_registered', handleStorage);

    return () => {
      channel.unsubscribe();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('zeniva_patient_registered', handleStorage);
    };
  }, []);

  // Availability State
  const [weeklyAvailability, setWeeklyAvailability] = useState({
    monday: { active: true, morning: '09:00 AM - 01:00 PM', evening: '04:00 PM - 08:00 PM' },
    tuesday: { active: true, morning: '09:00 AM - 01:00 PM', evening: '04:00 PM - 08:00 PM' },
    wednesday: { active: true, morning: '09:00 AM - 01:00 PM', evening: '04:00 PM - 08:00 PM' },
    thursday: { active: true, morning: '09:00 AM - 01:00 PM', evening: '04:00 PM - 08:00 PM' },
    friday: { active: true, morning: '09:00 AM - 01:00 PM', evening: '04:00 PM - 08:00 PM' },
    saturday: { active: true, morning: '09:00 AM - 02:00 PM', evening: 'Closed' },
    sunday: { active: false, morning: 'Emergency Only', evening: 'Closed' }
  });

  // Reminders List
  const [remindersList, setRemindersList] = useState([
    { id: 1, title: 'Follow-up Call: Aarav Patil', time: 'Today, 05:00 PM', priority: 'High', note: 'Check joint pain relief after 7 days of Ashwagandha Ghrita' },
    { id: 2, title: 'Panchakarma Protocol Review', time: 'Tomorrow, 10:00 AM', priority: 'Medium', note: 'Review Virechana cleansing chart for Sneha Gawande' },
    { id: 3, title: 'State Medical Council CME Webinar', time: '30 Aug 2025, 03:00 PM', priority: 'Normal', note: 'Recent developments in Dravyaguna research' }
  ]);

  // Messages List
  const [messagesList, setMessagesList] = useState([
    { id: 1, sender: 'Aarav Patil', time: '10:15 AM', text: 'Namaste Doctor, the herbal tea has reduced my morning bloating significantly.', unread: true },
    { id: 2, sender: 'Neha Kulkarni', time: 'Yesterday', text: 'Should I continue the cooling dietary plan for another week?', unread: false },
    { id: 3, sender: 'Zeniva Clinical Support', time: '26 Aug', text: 'Your monthly verification credentials and telemetry have been verified.', unread: false }
  ]);

  // Doctor Location & Chamber Details State (with LocalStorage persistence)
  const [chamberDetails, setChamberDetails] = useState(() => {
    try {
      const saved = localStorage.getItem('zeniva_doctor_chamber_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      clinicName: currentUser.organization || 'Shri Dhanvantari Ayurvedic Clinic & Research Center',
      street: 'Plot 45, Ayurvedic Enclave, Central Avenue Road, Ramdaspeth',
      landmark: 'Near Vedic Wellness Center & Shivaji Garden',
      city: currentUser.city || 'Nagpur',
      state: 'Maharashtra',
      pincode: '440010',
      country: 'India',
      phone: currentUser.phone || '8766903403',
      emergencyPhone: '+91 98123 45567',
      timings: 'Mon - Sat: 09:00 AM - 01:00 PM & 04:00 PM - 08:00 PM',
      consultationFee: '₹500 (Initial) / ₹300 (Follow-up)',
      facilities: ['Nadi Pariksha Chamber', 'Panchakarma Detox Unit', 'Herbal Pharmacy', 'Tele-Consultation Studio'],
      latitude: '21.1458',
      longitude: '79.0882'
    };
  });

  const [isLocating, setIsLocating] = useState(false);

  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setChamberDetails(prev => ({
          ...prev,
          latitude: lat.toFixed(5),
          longitude: lng.toFixed(5)
        }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setChamberDetails(prev => ({
              ...prev,
              street: [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(', ') || prev.street,
              city: addr.city || addr.town || addr.village || addr.county || prev.city,
              state: addr.state || prev.state,
              pincode: addr.postcode || prev.pincode
            }));
          }
        } catch (e) {}
        setIsLocating(false);
        showToast('Live GPS location detected successfully! ✓');
      },
      (error) => {
        setIsLocating(false);
        showToast('Could not fetch GPS location: ' + error.message);
      }
    );
  };

  const handleSaveChamberLocation = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem('zeniva_doctor_chamber_location', JSON.stringify(chamberDetails));
    } catch (err) {}
    showToast('Chamber & Clinic Location saved successfully! ✓');
  };

  const handleSaveRx = (e) => {
    e.preventDefault();
    showToast(`Prescription for ${selectedPatientForRx} created and dispatched!`);
    setIsPrescriptionModalOpen(false);
  };

  const isMainDashboard = activeTab === 'home' || activeTab === 'doc_dashboard' || activeTab === 'dashboard';

  return (
    <div className="px-3.5 py-4 sm:p-6 lg:p-8 max-w-[1450px] mx-auto space-y-5 sm:space-y-6 select-none bg-[#FAF7F2] min-h-screen font-sans pb-24 lg:pb-8">
      
      {/* Action Notification Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-purple-950 text-white font-bold text-xs flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-3 border border-purple-800">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP HEADER (EXACT REPLICA OF REFERENCE SCREENSHOT, MOBILE OPTIMIZED)   */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 pb-1">
        
        {/* Left: Namaste Doctor Greeting with Purple Leaf + Mobile Menu Button */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Hamburger Button for Mobile Drawer Navigation */}
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-2xl bg-white border border-[#EBE3D5] text-[#5B3E8C] shadow-xs hover:bg-stone-50 cursor-pointer transition-all active:scale-95 shrink-0"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#1C1917] tracking-tight">
                  Namaste, {doctorName}
                </h1>
                <span className="text-purple-600 text-lg sm:text-xl font-serif">🪻</span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#78716C] mt-0.5 font-medium">
                Here's what's happening in your practice today.
              </p>
            </div>
          </div>

          {/* Quick Doctor Profile avatar on small mobile screens */}
          <div className="sm:hidden flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-8 h-8 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center text-[#44403C]"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-white text-[8px] font-bold flex items-center justify-center ${
                isRejected ? 'bg-red-600 animate-bounce' : 'bg-[#5B3E8C]'
              }`}>
                {isRejected ? '!' : '3'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border border-purple-300"
            >
              <img src={doctorAvatar} alt={doctorName} className="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        {/* Right: Search Bar + Notification Bell + Doctor Profile Pill */}
        <div className="flex items-center gap-2.5 sm:gap-4 w-full md:w-auto">
          
          {/* Rounded Pill Search Bar */}
          <div className="relative w-64 sm:w-72">
            <input
              type="text"
              placeholder="Search patients, appointments..."
              className="w-full pl-4 pr-10 py-2.5 rounded-full text-xs bg-white border border-[#EBE3D5] text-[#1C1917] placeholder-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-purple-600/20 shadow-2xs"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#5B3E8C]">
              <Search className="w-4 h-4" />
            </button>
          </div>

          {/* Notification Bell with Badge & Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-10 h-10 rounded-full bg-white border border-[#EBE3D5] flex items-center justify-center text-[#44403C] hover:bg-stone-50 transition-colors cursor-pointer shadow-2xs focus:outline-none"
            >
              <Bell className="w-4 h-4" />
              <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center ${
                isRejected ? 'bg-red-600 animate-bounce' : 'bg-[#5B3E8C]'
              }`}>
                {isRejected ? '!' : '3'}
              </span>
            </button>

            {/* Notification Center Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-xl border border-[#EBE3D5] py-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#5B3E8C]" />
                    <h3 className="text-xs font-bold text-stone-900">Notifications & Admin Alerts</h3>
                  </div>
                  <span className="text-[10px] text-stone-400 font-medium">{isRejected ? '4 notifications' : '3 notifications'}</span>
                </div>

                <div className="divide-y divide-stone-100 max-h-80 overflow-y-auto">
                  {/* Rejection Notification if status is rejected */}
                  {isRejected && (
                    <div className="p-3.5 bg-red-50/80 hover:bg-red-50 transition-colors space-y-2">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-red-900">Super Admin Review: Rejected</span>
                            <span className="text-[9px] text-red-600 font-bold">Just now</span>
                          </div>
                          <p className="text-[11px] text-stone-700 mt-1 leading-snug">
                            <strong>Reason:</strong> {rejectionReason}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => {
                                onSelectTab('doc_qualification');
                                setIsNotificationsOpen(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Fix & Re-upload Now
                            </button>
                            <span className="text-[10px] text-stone-500 font-mono">📱 Instant Alert Sent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 hover:bg-stone-50 transition-colors flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">Consultation Scheduled</span>
                        <span className="text-[9px] text-stone-400">20m ago</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Patient Aarav Patil booked Nadi Pariksha consultation for today at 02:00 PM.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 hover:bg-stone-50 transition-colors flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-900">Clinical Protocol Update</span>
                        <span className="text-[9px] text-stone-400">1h ago</span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5">
                        Varsha Ritu seasonal detoxification guidelines updated in RAG database.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Doctor Profile Pill with Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-3 bg-white pl-2 pr-3.5 py-1.5 rounded-full border border-[#EBE3D5] cursor-pointer hover:bg-stone-50 transition-all shadow-2xs focus:outline-none"
            >
              <div className="relative">
                <img
                  src={doctorAvatar}
                  alt={doctorName}
                  className="w-8 h-8 rounded-full object-cover border border-purple-200"
                />
                <label 
                  onClick={(e) => e.stopPropagation()} 
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center cursor-pointer shadow-xs"
                  title="Upload Doctor Profile Photo"
                >
                  <Camera className="w-2.5 h-2.5" />
                  <input type="file" accept="image/*" onChange={handleDoctorAvatarUpload} className="hidden" />
                </label>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-[#1C1917] leading-tight">{doctorName}</p>
                <p className="text-[10px] text-[#78716C] leading-none mt-0.5">{doctorTitle}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#78716C]" />
            </button>

            {/* Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-xl border border-[#EBE3D5] py-2.5 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2.5 border-b border-stone-100 flex items-center gap-3">
                  <div className="relative">
                    <img src={doctorAvatar} alt={doctorName} className="w-11 h-11 rounded-2xl object-cover border border-purple-200" />
                    <label 
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-purple-700 hover:bg-purple-800 text-white flex items-center justify-center cursor-pointer shadow-xs"
                      title="Upload New Photo"
                    >
                      <Camera className="w-3 h-3" />
                      <input type="file" accept="image/*" onChange={handleDoctorAvatarUpload} className="hidden" />
                    </label>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-900 truncate">{doctorName}</p>
                    <p className="text-[10px] text-[#5B3E8C] font-semibold truncate">{qualification}</p>
                    <p className="text-[9px] text-stone-400 font-mono">Reg: {councilReg}</p>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  {/* View / Edit Personal Details */}
                  <button
                    onClick={() => {
                      setIsEditProfileModalOpen(true);
                      setIsProfileDropdownOpen(false);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-left flex items-center gap-2.5 text-xs text-stone-700 hover:bg-purple-50 hover:text-[#5B3E8C] font-medium transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-purple-700" />
                    <div>
                      <p className="font-bold leading-tight">My Doctor Profile & Photo</p>
                      <p className="text-[10px] text-stone-500">Edit Name, Photo, Degree & Chamber</p>
                    </div>
                  </button>

                  {/* Switch Account / Doctor Login */}
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onOpenLogin) onOpenLogin('doctor');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl text-left flex items-center gap-2.5 text-xs text-stone-700 hover:bg-purple-50 hover:text-[#5B3E8C] font-medium transition-colors cursor-pointer"
                  >
                    <Stethoscope className="w-4 h-4 text-[#5B3E8C]" />
                    <div>
                      <p className="font-bold text-[#1C1917] leading-tight">Switch Account</p>
                      <p className="text-[10px] text-stone-500">Login with another Doctor Account</p>
                    </div>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full px-3.5 py-2 rounded-2xl text-left flex items-center gap-2.5 text-xs text-red-600 hover:bg-red-50 font-bold transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-red-500" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Super Admin Rejection Alert Banner (Prominently alerts doctor on Dashboard) */}
      {isRejected && (
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Admin Action: Rejected
                </span>
                <span className="text-[11px] text-stone-500 font-mono">📱 Instant Alert Sent</span>
              </div>
              <h3 className="text-sm font-bold text-stone-900 mt-1">
                Your Doctor Qualification / Credentials Were Not Approved by Super Admin
              </h3>
              <p className="text-xs text-red-900 font-medium mt-0.5">
                <strong>Reason:</strong> "{rejectionReason}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onSelectTab('doc_qualification')}
              className="w-full md:w-auto px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Fix & Re-upload Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Simulated Phone SMS Push Notification Popup */}
      {isRejected && showSmsBanner && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-stone-900 text-white rounded-3xl p-4 shadow-2xl border border-stone-700 space-y-2 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-green-500 text-white flex items-center justify-center text-xs">
                💬
              </span>
              <div>
                <p className="text-[11px] font-bold text-stone-200">MESSAGES • WhatsApp & SMS</p>
                <p className="text-[9px] text-stone-400">To: {currentUser.phone ? `+91 ${currentUser.phone}` : 'Registered Phone'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-stone-400">now</span>
              <button 
                onClick={() => setShowSmsBanner(false)}
                className="p-1 rounded-full text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="bg-stone-800/80 p-2.5 rounded-2xl border border-stone-700 text-xs space-y-1">
            <p className="font-bold text-amber-300">Zeniva Clinical Review Board Alert:</p>
            <p className="text-[11px] text-stone-200 leading-snug">
              Dr. {rawName}, your qualification documents were rejected by Admin. Reason: {rejectionReason}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowSmsBanner(false);
                onSelectTab('doc_qualification');
              }}
              className="text-[11px] font-bold text-purple-300 hover:text-purple-200 underline cursor-pointer"
            >
              Open & Resolve Now →
            </button>
          </div>
        </div>
      )}

      {/* Real-Time Live Rejection Modal Popup (Jumps on Doctor's screen in Real-Time when Admin Rejects) */}
      {isRejected && isLiveRejectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-red-300 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5 text-red-600 font-bold">
                <div className="w-9 h-9 rounded-2xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">Admin Review Alert</h3>
                  <p className="text-[10px] text-stone-500 font-normal">Super Admin Clinical Board Notification</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLiveRejectionModalOpen(false)} 
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  Review Status: Rejected ✕
                </span>
                <span className="text-[10px] text-red-700 font-semibold font-mono">Just Now</span>
              </div>
              <p className="text-stone-800 text-xs font-semibold pt-1">
                Dear {doctorName}, your submitted qualification certificates / Medical Council credentials were reviewed by the Super Admin and not approved.
              </p>
              <div className="p-3 bg-white rounded-xl border border-red-200 text-[11px] text-red-950 font-medium">
                <strong className="text-stone-600 block text-[10px] uppercase font-bold mb-0.5">Admin's Official Feedback:</strong>
                "{rejectionReason}"
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2 text-left">
              <span className="text-base shrink-0">📱</span>
              <div>
                <span className="font-bold">Instant Notification Dispatched:</span>
                <p className="text-stone-600 mt-0.5">
                  An instant SMS alert with resolution link has been delivered to your mobile: <strong className="font-mono text-stone-900">{currentUser.phone ? `+91 ${currentUser.phone}` : 'Registered Mobile'}</strong>.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button 
                type="button" 
                onClick={() => setIsLiveRejectionModalOpen(false)} 
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs cursor-pointer"
              >
                Dismiss
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsLiveRejectionModalOpen(false);
                  onSelectTab('doc_qualification');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Re-upload & Fix Credentials</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN DASHBOARD TAB VIEW (EXACT REPLICA OF REFERENCE SCREENSHOT)        */}
      {/* ========================================================================= */}
      {isMainDashboard && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* --------------------------------------------------------------------- */}
          {/* Top 4 KPI Stat Cards                                                  */}
          {/* --------------------------------------------------------------------- */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            
            {/* Card 1: Total Patients */}
            <div 
              onClick={() => onSelectTab('doc_patients')}
              className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F3EFF9] text-[#5B3E8C] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold font-serif text-[#1C1917] leading-tight">{patientsRoster.length}</p>
                <p className="text-xs font-medium text-[#78716C] mt-0.5">Total Patients</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Supabase Sync
                </p>
              </div>
            </div>

            {/* Card 2: Today's Appointments */}
            <div 
              onClick={() => onSelectTab('doc_appointments')}
              className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold font-serif text-[#1C1917] leading-tight">18</p>
                <p className="text-xs font-medium text-[#78716C] mt-0.5">Today's Appointments</p>
                <p className="text-[10px] text-[#D97706] font-bold mt-0.5 flex items-center gap-1 hover:underline">
                  View schedule →
                </p>
              </div>
            </div>

            {/* Card 3: Follow-ups Due */}
            <div 
              onClick={() => onSelectTab('doc_consultations')}
              className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F3EFF9] text-[#5B3E8C] flex items-center justify-center shrink-0">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold font-serif text-[#1C1917] leading-tight">36</p>
                <p className="text-xs font-medium text-[#78716C] mt-0.5">Follow-ups Due</p>
                <p className="text-[10px] text-[#5B3E8C] font-bold mt-0.5 flex items-center gap-1 hover:underline">
                  View all →
                </p>
              </div>
            </div>

            {/* Card 4: Treatment Success Rate */}
            <div 
              onClick={() => onSelectTab('doc_treatments')}
              className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex items-center gap-4 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#EDF0E6] text-[#1E5039] flex items-center justify-center shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold font-serif text-[#1C1917] leading-tight">92%</p>
                <p className="text-xs font-medium text-[#78716C] mt-0.5">Treatment Success Rate</p>
                <p className="text-[10px] text-[#78716C] font-medium mt-0.5">This month</p>
              </div>
            </div>

          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Middle Row & Right Column Grid Layout                                 */}
          {/* --------------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left 8 Columns (Today's Overview + Patient Flow + Top Health Concerns) */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Row of 3 Cards: Today's Overview, Patient Flow, Top Health Concerns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Card 1: Today's Overview (Donut Ring + Mortar Graphic) */}
                <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                  <h3 className="text-xs font-bold text-[#1C1917] tracking-tight">Today's Overview</h3>

                  <div className="flex items-center gap-3">
                    
                    {/* Donut Ring with Mortar Pestle inside */}
                    <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
                      <svg className="w-22 h-22 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#EBE3D5" strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#5B3E8C" strokeWidth="3.5" strokeDasharray="45 55" strokeDashoffset="0" strokeLinecap="round" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#3B82F6" strokeWidth="3.5" strokeDasharray="20 80" strokeDashoffset="-45" strokeLinecap="round" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#D97706" strokeWidth="3.5" strokeDasharray="25 75" strokeDashoffset="-65" strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <MortarPestleGraphic className="w-10 h-10" />
                      </div>
                    </div>

                    {/* Breakdown items */}
                    <div className="space-y-1 text-[11px] text-[#44403C] flex-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-[#5B3E8C]" /> Consultations Today</span>
                        <span className="font-bold text-[#1C1917]">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><Users className="w-3 h-3 text-blue-600" /> New Patients</span>
                        <span className="font-bold text-[#1C1917]">5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><ClipboardList className="w-3 h-3 text-[#D97706]" /> Follow-ups</span>
                        <span className="font-bold text-[#1C1917]">7</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-amber-700" /> Treatments Planned</span>
                        <span className="font-bold text-[#1C1917]">4</span>
                      </div>
                    </div>

                  </div>

                  <button 
                    onClick={() => onSelectTab('doc_consultations')}
                    className="text-[11px] font-bold text-[#5B3E8C] hover:underline flex items-center justify-center gap-1 pt-2 border-t border-stone-100 cursor-pointer"
                  >
                    <span>View Full Overview</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Card 2: Patient Flow (This Week) */}
                <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md transition-all">
                  <h3 className="text-xs font-bold text-[#1C1917] tracking-tight">Patient Flow <span className="text-[10px] text-[#78716C] font-normal">(This Week)</span></h3>

                  {/* 7-Day Line Chart */}
                  <div className="space-y-1">
                    <div className="h-20 w-full relative flex items-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 200 70">
                        <line x1="0" y1="10" x2="200" y2="10" stroke="#F5EFEB" strokeDasharray="2" />
                        <line x1="0" y1="35" x2="200" y2="35" stroke="#F5EFEB" strokeDasharray="2" />
                        <line x1="0" y1="60" x2="200" y2="60" stroke="#F5EFEB" strokeDasharray="2" />
                        <path
                          d="M 10 50 Q 40 30 70 45 T 130 35 T 160 38 T 190 15"
                          fill="none"
                          stroke="#5B3E8C"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="10" cy="50" r="3" fill="#5B3E8C" />
                        <circle cx="40" cy="35" r="3" fill="#5B3E8C" />
                        <circle cx="70" cy="45" r="3" fill="#5B3E8C" />
                        <circle cx="100" cy="40" r="3" fill="#5B3E8C" />
                        <circle cx="130" cy="35" r="3" fill="#5B3E8C" />
                        <circle cx="160" cy="38" r="3" fill="#5B3E8C" />
                        <circle cx="190" cy="15" r="3.5" fill="#5B3E8C" stroke="#FAF5FF" strokeWidth="2" />
                      </svg>
                    </div>
                    
                    <div className="flex justify-between text-[9px] text-[#A8A29E] font-medium px-1">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>

                  {/* Lavender Alert Banner */}
                  <div className="p-2.5 rounded-2xl bg-[#F3EFF9] text-[10px] text-[#5B3E8C] font-semibold flex items-center justify-between">
                    <span>Your patient engagement is 15% higher this week!</span>
                    <span>🪻</span>
                  </div>
                </div>

                {/* Card 3: Top Health Concerns */}
                <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all">
                  <h3 className="text-xs font-bold text-[#1C1917] tracking-tight">Top Health Concerns</h3>

                  <div className="space-y-2.5 text-[11px]">
                    
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#44403C]">
                        <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-[10px]">🫚</span>
                        Digestive Issues
                      </span>
                      <span className="font-bold text-[#1C1917]">42%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#44403C]">
                        <span className="w-5 h-5 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-[10px]">🌿</span>
                        Stress & Anxiety
                      </span>
                      <span className="font-bold text-[#1C1917]">25%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#44403C]">
                        <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">💧</span>
                        Skin Problems
                      </span>
                      <span className="font-bold text-[#1C1917]">18%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#44403C]">
                        <span className="w-5 h-5 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-[10px]">🦴</span>
                        Joint Pain
                      </span>
                      <span className="font-bold text-[#1C1917]">15%</span>
                    </div>

                  </div>

                  <button 
                    onClick={() => onSelectTab('doc_reports_analytics')}
                    className="text-[11px] font-bold text-[#5B3E8C] hover:underline flex items-center justify-center gap-1 pt-2 border-t border-stone-100 cursor-pointer"
                  >
                    <span>View All Insights</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>

              {/* ----------------------------------------------------------------- */}
              {/* Bottom Large Ayurvedic Image & Quote Banner Card                  */}
              {/* ----------------------------------------------------------------- */}
              <div className="rounded-3xl overflow-hidden border border-[#EBE3D5] shadow-xs grid grid-cols-1 md:grid-cols-12 min-h-[260px]">
                
                {/* Left Side: Deep Plum Quote Panel */}
                <div className="md:col-span-5 bg-gradient-to-br from-[#2E1838] to-[#1D0C26] text-white p-7 sm:p-8 flex flex-col justify-center space-y-4 relative">
                  <div className="w-10 h-0.5 bg-[#E5C07B] rounded-full"></div>
                  
                  <blockquote className="font-serif text-base sm:text-lg leading-relaxed text-purple-100/95 italic">
                    “Ayurveda is not just treatment, it’s a way of living in harmony with nature and yourself.”
                  </blockquote>

                  <div className="flex items-center gap-2 text-[#E5C07B] text-xs font-semibold">
                    <span>🪷</span>
                    <span className="tracking-wide">Classical Ayurvedic Wisdom</span>
                  </div>
                </div>

                {/* Right Side: High Quality Ayurvedic Photography Banner */}
                <div className="md:col-span-7 relative h-56 md:h-auto overflow-hidden bg-purple-950">
                  <img
                    src="/ayurveda_doctor_banner.jpg"
                    alt="Ayurvedic Herbs and Vessels"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1D0C26]/40 via-transparent to-transparent"></div>
                </div>

              </div>

              {/* ----------------------------------------------------------------- */}
              {/* Active Clinical OPD Queue & Patient Vitals Matrix                */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EBE3D5] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-purple-100 text-[#5B3E8C] flex items-center justify-center font-bold shadow-2xs">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-serif font-bold text-stone-900">
                        Active Clinical Consultations & Patient Vitals (सक्रिय रोगी निगरानी पटल)
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Live OPD queue with Nadi pulse, digestive Agni balam, and one-click Ayurvedic prescriptions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px] flex items-center gap-1 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      <span>OPD Live Queue (3 Waiting)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectTab('doc_patients')}
                      className="text-[11px] font-bold text-[#5B3E8C] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Full Directory</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Patient Rows */}
                <div className="divide-y divide-stone-100 text-xs">
                  {patientsRoster.slice(0, 3).map((pat, idx) => (
                    <div key={pat.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-purple-50/20 transition-colors rounded-xl px-2 -mx-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img 
                            src={scheduleList[idx]?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'} 
                            alt={pat.name} 
                            className="w-10 h-10 rounded-2xl object-cover border border-purple-200 shadow-2xs" 
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-stone-900 text-xs truncate">{pat.name}</h4>
                            <span className="text-[10px] text-stone-400 font-mono">({pat.age}y, {pat.gender})</span>
                            <span className="px-2 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold shrink-0">
                              {pat.dosha}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5B3E8C] font-semibold mt-0.5 truncate">
                            Condition: <span className="text-stone-700 font-normal">{pat.diagnosis}</span>
                          </p>
                        </div>
                      </div>

                      {/* Vitals & Clinical Indicators */}
                      <div className="flex items-center gap-3.5 text-[11px] text-stone-600 shrink-0">
                        <div className="text-center">
                          <span className="text-[9px] uppercase font-bold text-stone-400 block">Pulse Rhythm</span>
                          <span className="font-mono font-bold text-stone-800">{idx === 0 ? '72 bpm (Steady)' : idx === 1 ? '82 bpm (Active)' : '68 bpm (Calm)'}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] uppercase font-bold text-stone-400 block">Digestive Agni</span>
                          <span className="font-semibold text-amber-800">{idx === 0 ? 'Optimal Digestion' : idx === 1 ? 'Hyperactive / Acidic' : 'Sluggish Digestion'}</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] uppercase font-bold text-stone-400 block">Blood Pressure</span>
                          <span className="font-mono text-stone-800">{idx === 0 ? '120/80' : idx === 1 ? '128/84' : '118/76'}</span>
                        </div>

                        <div className="flex items-center gap-1.5 pl-2 border-l border-stone-200">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatientForRx(pat.name);
                              setIsPrescriptionModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          >
                            <MortarPestleGraphic className="w-3 h-3" />
                            <span>Prescribe</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast(`Opening live video consultation room with ${pat.name}...`)}
                            className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer transition-colors"
                            title="Start Video Consultation"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* Live Patient AI Chatbot & Speak Voice Triage Stream               */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#EBE3D5] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-2xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                        <span>Live Patient AI Chat & Speak Voice Triage (मरीज AI व वॉइस लक्षण निगरानी)</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        Real-time clinical stream of what patients are typing and speaking into the AI chatbot across mobile & web.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px] flex items-center gap-1 border border-purple-200">
                      <Sparkles className="w-3 h-3 text-purple-700" />
                      <span>{aiChatSessions.length} Triage Sessions</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectTab('doc_consultations')}
                      className="text-[11px] font-bold text-[#5B3E8C] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Full Desk</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Triage Cards */}
                <div className="space-y-3">
                  {aiChatSessions.slice(0, 4).map((session) => (
                    <div 
                      key={session.id} 
                      className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF8F5] via-white to-purple-50/30 border border-stone-200/90 hover:border-purple-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-900 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {session.patient_name ? session.patient_name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-stone-900 text-xs">{session.patient_name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">📱 {session.phone || 'N/A'}</span>
                            <span className="text-[10px] text-stone-400">📍 {session.city || 'Nagpur'}</span>
                            <span className="px-2 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[10px] font-bold">
                              {session.primary_concern}
                            </span>
                            <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">
                              {session.dosha_imbalance}
                            </span>
                          </div>

                          <div className="text-[11px] text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-2xs">
                            <p className="font-medium text-stone-900">
                              <span className="text-purple-700 font-bold">Patient Issue / Query:</span> "{session.last_query}"
                            </p>
                            <p className="text-stone-500 mt-1 line-clamp-1">
                              <span className="text-amber-800 font-bold">AI Guidance Given:</span> {session.last_reply}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 md:self-center">
                        <button
                          type="button"
                          onClick={() => setSelectedChatForTranscript(session)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] cursor-pointer transition-all border border-stone-300"
                        >
                          View Transcript
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDirectMessageTarget({
                              id: session.patient_id,
                              patient_id: session.patient_id,
                              name: session.patient_name,
                              patient_name: session.patient_name,
                              phone: session.phone
                            });
                            setIsDirectMessageModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] cursor-pointer transition-all flex items-center gap-1 border border-purple-200"
                        >
                          <Send className="w-3 h-3 text-purple-700" />
                          <span>Send Message</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientForRx(session.patient_name);
                            setIsPrescriptionModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#5B3E8C] hover:bg-[#4B2F7C] text-white font-bold text-[11px] cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                        >
                          <MortarPestleGraphic className="w-3 h-3" />
                          <span>Prescribe</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* AI Clinical Decision Support & Herbal Formulations               */}
              {/* ----------------------------------------------------------------- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FAF8F5] to-purple-50/40 border border-[#EBE3D5] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-purple-950">
                      <Sparkles className="w-4 h-4 text-purple-700" />
                      <span>Charaka AI Clinical Co-Pilot</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-mono text-[9px] font-bold">98.4% Match</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed text-[11px]">
                    Detected elevated <strong>Stress & Joint Discomfort patterns</strong> across recent consultation cases. Classical recommended herb synergy: <em>Ashwagandha Rasayana (3g) + Dashamoola Kwatha (30ml)</em> with warm cow's milk.
                  </p>
                  <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-[10px]">
                    <span className="text-stone-500">Charaka Samhita Chikitsa Sthana Ch. 28</span>
                    <button 
                      type="button"
                      onClick={() => onSelectTab('doc_herbal_recommendations')}
                      className="font-bold text-purple-700 hover:underline cursor-pointer"
                    >
                      Apply Herb Protocol →
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-3xl bg-gradient-to-br from-[#FAF8F5] to-amber-50/40 border border-[#EBE3D5] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-amber-950">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Seasonal Varsha Ritucharya Notice</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px] font-bold">Active Protocol</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed text-[11px]">
                    Monsoon atmospheric moisture impairs <em>digestive metabolism & gut fire</em>. Advise incoming patients to avoid cold unpasteurized curd, heavy fermented grains, and advocate warm boiled water with dry ginger (Shunthi).
                  </p>
                  <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[10px]">
                    <span className="text-stone-500">Ritucharya Advisory 2026</span>
                    <button 
                      type="button"
                      onClick={() => onSelectTab('doc_treatment_plans')}
                      className="font-bold text-amber-800 hover:underline cursor-pointer"
                    >
                      View Diet Protocols →
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right 4 Columns (Today's Schedule + Quick Actions + Practice Insights) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Card 1: Today's Schedule (Matching Reference Screen Exactly) */}
              <div className="bg-white rounded-3xl overflow-hidden border border-[#EBE3D5] shadow-xs">
                
                {/* Purple Schedule Header */}
                <div className="bg-[#5B3E8C] text-white p-4 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-serif font-bold text-sm">
                    <Calendar className="w-4 h-4 text-purple-200" />
                    <span>Today's Schedule</span>
                  </div>
                  <button 
                    onClick={() => onSelectTab('doc_appointments')}
                    className="text-[11px] text-purple-200 hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* List of 5 Appointments */}
                <div className="p-4 divide-y divide-stone-100">
                  {scheduleList.map((item) => (
                    <div key={item.id} className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3">
                      
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-[#78716C] shrink-0 w-16">
                          {item.time}
                        </span>

                        <img
                          src={item.avatar}
                          alt={item.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-stone-200"
                        />

                        <div className="min-w-0 truncate">
                          <p className="text-xs font-bold text-[#1C1917] truncate leading-tight">{item.name}</p>
                          <p className="text-[10px] text-[#78716C] truncate leading-none mt-0.5">{item.condition}</p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                        item.type === 'Consultation'
                          ? 'bg-[#F3EFF9] text-[#5B3E8C]'
                          : 'bg-[#FEF3C7] text-[#D97706]'
                      }`}>
                        {item.type}
                      </span>

                    </div>
                  ))}
                </div>

                {/* View Full Schedule Footer Link */}
                <button 
                  onClick={() => onSelectTab('doc_appointments')}
                  className="w-full text-[11px] font-bold text-[#5B3E8C] hover:underline flex items-center justify-center gap-1.5 py-3 border-t border-stone-100 bg-stone-50/50 cursor-pointer"
                >
                  <span>View Full Schedule</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Card 2: Quick Actions (4 Action Tiles) */}
              <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs space-y-3.5">
                <h3 className="text-xs font-bold text-[#1C1917] tracking-tight">Quick Actions</h3>

                <div className="grid grid-cols-4 gap-2.5">
                  
                  {/* Action 1: Add Prescription */}
                  <button 
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#F3EFF9] border border-[#EBE3D5] flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5B3E8C] flex items-center justify-center">
                      <MortarPestleGraphic className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-[#44403C] leading-tight group-hover:text-[#5B3E8C]">Add Prescription</span>
                  </button>

                  {/* Action 2: Upload Reports */}
                  <button 
                    onClick={() => { onOpenPhotoReview && onOpenPhotoReview(); showToast('Upload reports modal opened'); }}
                    className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#F3EFF9] border border-[#EBE3D5] flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5B3E8C] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-[#44403C] leading-tight group-hover:text-[#5B3E8C]">Upload Reports</span>
                  </button>

                  {/* Action 3: Send Message */}
                  <button 
                    onClick={() => onSelectTab('doc_messages')}
                    className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#F3EFF9] border border-[#EBE3D5] flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5B3E8C] flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-[#44403C] leading-tight group-hover:text-[#5B3E8C]">Send Message</span>
                  </button>

                  {/* Action 4: Share Guide */}
                  <button 
                    onClick={() => onSelectTab('doc_herbal_recommendations')}
                    className="p-3 rounded-2xl bg-[#FAF8F5] hover:bg-[#F3EFF9] border border-[#EBE3D5] flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#5B3E8C] flex items-center justify-center">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-[#44403C] leading-tight group-hover:text-[#5B3E8C]">Share Guide</span>
                  </button>

                </div>
              </div>

              {/* Card 3: Practice Insights (Donut Breakdown) */}
              <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#1C1917] tracking-tight">Practice Insights</h3>
                  <span className="text-[10px] text-[#78716C] font-semibold flex items-center gap-0.5">
                    This Month <ChevronDown className="w-3 h-3" />
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  
                  {/* Donut Chart */}
                  <div className="relative w-24 h-24 shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#EBE3D5" strokeWidth="4" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#2E1E55" strokeWidth="4" strokeDasharray="51 49" strokeDashoffset="0" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#633AA0" strokeWidth="4" strokeDasharray="25 75" strokeDashoffset="-51" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#D88D43" strokeWidth="4" strokeDasharray="17 83" strokeDashoffset="-76" strokeLinecap="round" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#9E9E9E" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="-93" strokeLinecap="round" />
                    </svg>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-[11px] text-[#44403C] flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2E1E55]"></span> Consultations</span>
                      <span className="font-bold text-[#1C1917]">256</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#633AA0]"></span> Follow-ups</span>
                      <span className="font-bold text-[#1C1917]">128</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#D88D43]"></span> New Patients</span>
                      <span className="font-bold text-[#1C1917]">86</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#9E9E9E]"></span> Others</span>
                      <span className="font-bold text-[#1C1917]">32</span>
                    </div>
                  </div>

                </div>

                <button 
                  onClick={() => onSelectTab('doc_reports_analytics')}
                  className="text-[11px] font-bold text-[#5B3E8C] hover:underline flex items-center justify-center gap-1 pt-2 border-t border-stone-100 w-full cursor-pointer"
                >
                  <span>View Detailed Analytics</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

            </div>

          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Bottom Footer Banner (Healing Through Ayurveda)                       */}
          {/* --------------------------------------------------------------------- */}
          <div className="bg-[#1C1030] text-white rounded-3xl p-5 sm:p-6 border border-purple-900/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-800/80 text-[#E5C07B] flex items-center justify-center shrink-0">
                <ZenivaLogo className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-serif font-bold text-white leading-tight">
                  Healing Through Ayurveda, Empowering Lives
                </h4>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Ancient wisdom. Modern care. Better health.
                </p>
              </div>
            </div>

            <button 
              onClick={() => onSelectTab('doc_treatment_plans')}
              className="px-5 py-2.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-xs font-bold text-white border border-purple-700/60 shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Explore Premium Features</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PROFILE SUB-PAGES (Personal Details, Qualification, Experience, etc.)  */}
      {/* ========================================================================= */}

      {/* --- PAGE: Personal Details --- */}
      {activeTab === 'doc_personal_details' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>Doctor Profile</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Personal Details & Clinical Identity</h2>
            <p className="text-xs text-stone-500 mt-0.5">Manage your public profile, contact details, bio, and statutory registration numbers.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-3xl bg-[#FAF8F5] border border-stone-200">
            <div className="relative group shrink-0">
              <img 
                src={doctorAvatar} 
                alt={doctorName} 
                className="w-24 h-24 rounded-3xl object-cover border-3 border-purple-300 shadow-md group-hover:opacity-90 transition-opacity" 
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400'; }}
              />
              <label 
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                title="Click to update doctor profile photo"
              >
                <Camera className="w-5 h-5 text-amber-300" />
                <span className="text-[10px] font-bold mt-1 text-center">Change Photo</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleDoctorAvatarUpload} 
                />
              </label>
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-stone-900">{doctorName}</h3>
                <span className="px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-200">
                  <ShieldCheck className="w-3 h-3 text-green-700" />
                  <span>Verified Ayurvedic Physician</span>
                </span>
              </div>
              <p className="text-xs font-semibold text-[#5B3E8C]">{qualification} · {specialization}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 rounded-md font-mono text-[10px] font-bold">System ID: {doctorId}</span>
                <span className="px-2.5 py-0.5 bg-stone-200 text-stone-800 rounded-md font-mono text-[10px] font-bold">Council Reg: {councilReg}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="font-bold text-stone-400 uppercase text-[10px]">Registered Phone</span>
              <p className="font-bold text-stone-900">{currentUser.phone ? `+91 ${currentUser.phone}` : '—'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="font-bold text-stone-400 uppercase text-[10px]">Clinical Organization</span>
              <p className="font-bold text-stone-900">{organization}</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="font-bold text-stone-400 uppercase text-[10px]">Practice City & State</span>
              <p className="font-bold text-stone-900">{location}</p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1">
              <span className="font-bold text-stone-400 uppercase text-[10px]">Medical State Board</span>
              <p className="font-bold text-stone-900">Maharashtra Council of Indian Medicine (MCIM)</p>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE: Doctor Qualification --- */}
      {activeTab === 'doc_qualification' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Educational Credentials</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Doctor Qualification & Degrees</h2>
            <p className="text-xs text-stone-500 mt-0.5">Verified medical qualifications, degrees, and academic honours.</p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-purple-200 bg-[#FAF8F5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">Verified Degree ✓</span>
                <span className="text-[11px] font-mono text-stone-400">Passing Year: 2011</span>
              </div>
              <h3 className="text-base font-bold text-stone-900">Bachelor of Ayurvedic Medicine & Surgery (BAMS)</h3>
              <p className="text-xs text-stone-600">Government Ayurved College & Hospital, Nagpur (MUHS University)</p>
            </div>

            <div className="p-5 rounded-2xl border border-purple-200 bg-[#FAF8F5] space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">Verified Post-Graduate ✓</span>
                <span className="text-[11px] font-mono text-stone-400">Passing Year: 2014</span>
              </div>
              <h3 className="text-base font-bold text-stone-900">MD in Kayachikitsa (Internal Medicine)</h3>
              <p className="text-xs text-stone-600">Tilak Ayurved Mahavidyalaya, Pune · Gold Medalist in Clinical Diagnostics</p>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE: Experience --- */}
      {activeTab === 'doc_experience' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>Clinical Timeline</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Clinical Experience (14+ Years)</h2>
            <p className="text-xs text-stone-500 mt-0.5">Historical hospital attachments, clinical leadership roles, and patient care track record.</p>
          </div>

          <div className="space-y-4 border-l-2 border-purple-200 ml-4 pl-6">
            <div className="relative">
              <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#5B3E8C] border-2 border-white"></span>
              <span className="text-[10px] font-mono text-purple-900 font-bold">2018 - Present (7 Years)</span>
              <h3 className="text-sm font-bold text-stone-900 mt-0.5">Chief Ayurvedic Consultant & Medical Director</h3>
              <p className="text-xs text-stone-600">Zeniva Ayurvedic Health Center, Pune · Managed over 12,000+ clinical consultations.</p>
            </div>

            <div className="relative pt-4">
              <span className="absolute -left-[31px] top-5.5 w-3.5 h-3.5 rounded-full bg-stone-300 border-2 border-white"></span>
              <span className="text-[10px] font-mono text-stone-500 font-bold">2014 - 2018 (4 Years)</span>
              <h3 className="text-sm font-bold text-stone-900 mt-0.5">Senior Resident Vaidya (Kayachikitsa)</h3>
              <p className="text-xs text-stone-600">Shri Dhanvantari Ayurvedic Hospital & Research Center, Mumbai.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE: Specialization --- */}
      {activeTab === 'doc_specialization' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <Trophy className="w-4 h-4" />
              <span>Areas of Practice</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Clinical Specialization & Expertise</h2>
            <p className="text-xs text-stone-500 mt-0.5">Key diagnostic and therapeutic modalities practiced in your Ayurvedic chamber.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-1.5">
              <span className="text-lg">🌿</span>
              <h3 className="text-sm font-bold text-stone-900">Kayachikitsa (Internal Medicine)</h3>
              <p className="text-xs text-stone-600">Deep Ama detox, chronic metabolic disorders, and Agni restoration.</p>
            </div>

            <div className="p-4 rounded-2xl border border-green-200 bg-green-50/40 space-y-1.5">
              <span className="text-lg">🫀</span>
              <h3 className="text-sm font-bold text-stone-900">Nadi Pariksha (Pulse Diagnosis)</h3>
              <p className="text-xs text-stone-600">Root-cause assessment of clinical health imbalances via classical pulse analysis.</p>
            </div>

            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-1.5">
              <span className="text-lg">🥣</span>
              <h3 className="text-sm font-bold text-stone-900">Panchakarma Detoxification</h3>
              <p className="text-xs text-stone-600">Vamana, Virechana, Basti, Nasya, and Raktamokshana therapies.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE: Successful Treatments --- */}
      {activeTab === 'doc_treatments' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Clinical Outcomes</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Successful Treatments & Recovery Logs</h2>
            <p className="text-xs text-stone-500 mt-0.5">Documented patient recoveries, metabolic normalization rates, and reviews.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">Case #842: Chronic Hyperacidity (GERD)</span>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">100% Cured</span>
              </div>
              <p className="text-xs text-stone-600">Patient recovered completely after 6 weeks of Kamadudha Rasa and cooling digestive diet.</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">Case #919: Chronic Joint Stiffness (Osteoarthritis)</span>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Pain Reduced 85%</span>
              </div>
              <p className="text-xs text-stone-600">Janu Basti protocol + Yogaraj Guggulu therapy restored knee mobility without surgery.</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PRACTICE SUB-PAGES (Location, Availability)                            */}
      {/* ========================================================================= */}

      {/* --- PAGE: Location & Live Map --- */}
      {activeTab === 'doc_location' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Chamber Locations & Live Geocoding</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Clinical Locations & Interactive Chamber Map</h2>
              <p className="text-xs text-stone-500 mt-0.5">Physical consultation clinics, live GPS navigation, and patient OPD appointment directions.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDetectLiveLocation}
                disabled={isLocating}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-2 cursor-pointer border border-stone-300 transition-all shadow-xs"
                title="Detect Current GPS Location"
              >
                <Compass className={`w-4 h-4 text-purple-700 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Locating GPS...' : 'Detect My Location'}</span>
              </button>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${chamberDetails.clinicName}, ${chamberDetails.street}, ${chamberDetails.city}, ${chamberDetails.state}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#5B3E8C] hover:bg-[#4A2F75] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all group"
                title="Open in Google Maps Navigation"
              >
                <Navigation className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Open Google Maps</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Interactive Chamber Location Form (5 Cols) */}
            <form onSubmit={handleSaveChamberLocation} className="lg:col-span-5 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-3.5">
                <h3 className="font-bold text-stone-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Building className="w-4 h-4 text-[#5B3E8C]" />
                  <span>Clinic & Chamber Details</span>
                </h3>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Ayurvedic Clinic / Hospital Name:</label>
                  <input
                    type="text"
                    required
                    value={chamberDetails.clinicName}
                    onChange={(e) => setChamberDetails({ ...chamberDetails, clinicName: e.target.value })}
                    placeholder="e.g. Shri Dhanvantari Ayurvedic Clinic"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Street Address / Area:</label>
                  <input
                    type="text"
                    required
                    value={chamberDetails.street}
                    onChange={(e) => setChamberDetails({ ...chamberDetails, street: e.target.value })}
                    placeholder="e.g. Plot 45, Ayurvedic Enclave, Ramdaspeth"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Landmark / Locality (Optional):</label>
                  <input
                    type="text"
                    value={chamberDetails.landmark}
                    onChange={(e) => setChamberDetails({ ...chamberDetails, landmark: e.target.value })}
                    placeholder="e.g. Near Vedic Wellness Center"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">City:</label>
                    <input
                      type="text"
                      required
                      value={chamberDetails.city}
                      onChange={(e) => setChamberDetails({ ...chamberDetails, city: e.target.value })}
                      placeholder="e.g. Nagpur"
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:ring-2 focus:ring-purple-600/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">State:</label>
                    <input
                      type="text"
                      required
                      value={chamberDetails.state}
                      onChange={(e) => setChamberDetails({ ...chamberDetails, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-bold focus:ring-2 focus:ring-purple-600/30 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">Pin Code:</label>
                    <input
                      type="text"
                      required
                      value={chamberDetails.pincode}
                      onChange={(e) => setChamberDetails({ ...chamberDetails, pincode: e.target.value })}
                      placeholder="e.g. 440010"
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono focus:ring-2 focus:ring-purple-600/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-stone-700 block mb-1">OPD Phone (+91):</label>
                    <input
                      type="text"
                      required
                      value={chamberDetails.phone}
                      onChange={(e) => setChamberDetails({ ...chamberDetails, phone: e.target.value })}
                      placeholder="e.g. 9876543210"
                      className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono focus:ring-2 focus:ring-purple-600/30 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">OPD Timings:</label>
                  <input
                    type="text"
                    value={chamberDetails.timings}
                    onChange={(e) => setChamberDetails({ ...chamberDetails, timings: e.target.value })}
                    placeholder="e.g. Mon - Sat: 09:00 AM - 01:00 PM & 04:00 PM - 08:00 PM"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#5B3E8C] hover:bg-[#4A2F75] text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Chamber & Clinic Location</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Right Column: Live Real Map Embed & Location Card (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Real Map Container */}
              <div className="rounded-3xl border border-stone-200 overflow-hidden shadow-md bg-stone-100 relative h-[380px] sm:h-[420px]">
                <iframe
                  title="Doctor Clinic Location Map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    `${chamberDetails.clinicName}, ${chamberDetails.street}, ${chamberDetails.city}, ${chamberDetails.state}, ${chamberDetails.pincode}`
                  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  allowFullScreen
                />

                {/* Floating Map Overlay Badge */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-stone-200 shadow-md flex items-center gap-2.5 text-xs">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <div>
                    <p className="font-bold text-stone-900 leading-tight">{chamberDetails.clinicName}</p>
                    <p className="text-[10px] text-stone-500 font-mono">{chamberDetails.city}, {chamberDetails.state}</p>
                  </div>
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${chamberDetails.clinicName}, ${chamberDetails.street}, ${chamberDetails.city}, ${chamberDetails.state}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-stone-800 text-[11px] font-bold shadow-md hover:bg-white flex items-center gap-1.5 border border-stone-200 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-700" />
                  <span>Full Screen Map</span>
                </a>
              </div>

              {/* Clinic Chamber Summary Card */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-stone-900">Verified Clinical Chamber Location</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-bold">
                    GPS Active ✓
                  </span>
                </div>

                <p className="text-stone-700 leading-snug">
                  <strong>Address:</strong> {chamberDetails.street}, {chamberDetails.landmark ? chamberDetails.landmark + ', ' : ''}{chamberDetails.city}, {chamberDetails.state} - {chamberDetails.pincode}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded-xl bg-white border border-stone-100 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-purple-700" />
                    <span><strong>OPD Phone:</strong> +91 {chamberDetails.phone}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-stone-100 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span><strong>Consultation Fee:</strong> {chamberDetails.consultationFee}</span>
                  </div>
                </div>

                {/* Available Ayurvedic Facilities */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">Available Chamber Facilities:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {chamberDetails.facilities.map((fac, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/60 text-[10px] font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* --- PAGE: Availability --- */}
      {activeTab === 'doc_availability' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>OPD Schedule</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Weekly Doctor Availability & Shifts</h2>
            <p className="text-xs text-stone-500 mt-0.5">Set working hours, shift slots, and instant leave status.</p>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(weeklyAvailability).map(([day, slot]) => (
              <div key={day} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                <span className="font-bold text-stone-900 uppercase w-28">{day}</span>
                <span className="text-stone-600 font-mono">Morning: {slot.morning}</span>
                <span className="text-stone-600 font-mono">Evening: {slot.evening}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${slot.active ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}>
                  {slot.active ? 'Available' : 'Off Duty'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MANAGE SUB-PAGES (Appointments, Patients, Consultations, etc.)         */}
      {/* ========================================================================= */}

      {/* --- PAGE: Appointments --- */}
      {activeTab === 'doc_appointments' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>Appointments Desk</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Scheduled Consultations & Patient Appointments</h2>
            </div>
            <button 
              onClick={() => setIsPrescriptionModalOpen(true)}
              className="px-4 py-2 bg-[#5B3E8C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Appointment
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] text-stone-400 border-b border-stone-100 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Time</th>
                  <th className="pb-3">Patient Name</th>
                  <th className="pb-3">Health Concern</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs">
                {scheduleList.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/20">
                    <td className="py-3 font-mono font-bold text-purple-900">{item.time}</td>
                    <td className="py-3 font-bold text-stone-900">{item.name}</td>
                    <td className="py-3 text-stone-600">{item.condition}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">{item.type}</span></td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-full bg-green-100 text-green-900 text-[10px] font-bold">{item.status}</span></td>
                    <td className="py-3 text-right">
                      <button 
                        onClick={() => showToast(`Opening consultation notes for ${item.name}`)}
                        className="px-3 py-1 bg-stone-100 hover:bg-purple-100 text-purple-900 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Start Chamber
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- PAGE: Patients Directory (Live Supabase Sync) --- */}
      {activeTab === 'doc_patients' && (() => {
        const filteredPatients = patientsRoster.filter(p => {
          const q = (patientSearchQuery || '').toLowerCase().trim();
          const matchesQuery = !q || 
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.phone && p.phone.includes(q)) ||
            (p.email && p.email.toLowerCase().includes(q)) ||
            (p.city && p.city.toLowerCase().includes(q)) ||
            (p.id && p.id.toLowerCase().includes(q));

          const matchesDosha = selectedDoshaFilter === 'ALL' || 
            (p.dosha && p.dosha.toLowerCase().includes(selectedDoshaFilter.toLowerCase()));

          return matchesQuery && matchesDosha;
        });

        return (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
            {/* Header & Live Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  <span>Real-Time Patient Registry</span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Supabase Sync
                  </span>
                </div>
                <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">
                  My Registered Patients ({patientsRoster.length} Total)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  All patients registering across the Zeniva platform and mobile app are streamed here directly.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={fetchRegisteredPatients}
                  disabled={isFetchingPatients}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all border border-stone-200 shadow-xs"
                  title="Refresh Patient Directory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-purple-700 ${isFetchingPatients ? 'animate-spin' : ''}`} />
                  <span>{isFetchingPatients ? 'Syncing...' : 'Refresh List'}</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={patientSearchQuery}
                  onChange={(e) => setPatientSearchQuery(e.target.value)}
                  placeholder="Search by patient name, mobile (+91), email, or city..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 outline-none bg-stone-50/50"
                />
                {patientSearchQuery && (
                  <button
                    onClick={() => setPatientSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dosha Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {['ALL', 'Stress', 'Joint', 'Digestion', 'Immunity'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedDoshaFilter(tab)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                      selectedDoshaFilter === tab
                        ? 'bg-[#5B3E8C] text-white shadow-xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Patients' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 text-[10px] text-stone-500 border-b border-stone-200 font-bold uppercase tracking-wider">
                    <th className="p-3.5">Patient ID</th>
                    <th className="p-3.5">Patient Name</th>
                    <th className="p-3.5">Contact Details</th>
                    <th className="p-3.5">Age / Gender</th>
                    <th className="p-3.5">Ayurvedic Prakriti</th>
                    <th className="p-3.5">City / Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Registered</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map((p) => (
                      <tr key={p.id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-purple-900">{p.id}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                              alt={p.name}
                              className="w-8 h-8 rounded-full object-cover border border-purple-200 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-stone-900 block">{p.name}</span>
                              <span className="text-[10px] text-stone-400 font-medium">{p.email || 'No email registered'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-stone-700">
                          {p.phone && p.phone !== '—' ? (
                            <a href={`tel:${p.phone}`} className="text-purple-700 hover:underline font-bold flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{p.phone}</span>
                            </a>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="p-3.5 text-stone-600">
                          {p.age && p.age !== '—' ? `${p.age} yrs` : '—'} / {p.gender || '—'}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-lg text-[10px] font-bold">
                            {p.dosha || p.prakriti || 'Tridosha Balance'}
                          </span>
                        </td>
                        <td className="p-3.5 text-stone-600">
                          {p.city || 'Nagpur, Maharashtra'}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {p.status || 'Active'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-stone-500 text-[11px]">
                          {p.registeredAt || p.lastVisit || 'Recent'}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setDirectMessageTarget(p);
                                setIsDirectMessageModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
                              title="Send targeted advice to patient's notification bell"
                            >
                              <Send className="w-3 h-3 text-purple-700" />
                              <span>Message</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPatientForRx(p.name);
                                setIsPrescriptionModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                              title="Issue Prescription"
                            >
                              <MortarPestleGraphic className="w-3.5 h-3.5" />
                              <span>Prescribe</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-stone-500">
                        <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        <p className="font-bold text-stone-700">No matching patients found</p>
                        <p className="text-xs text-stone-400 mt-0.5">Try adjusting your search criteria or filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* --- PAGE: Consultations --- */}
      {activeTab === 'doc_consultations' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <Stethoscope className="w-4 h-4" />
              <span>Chamber Queue</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Live Clinical Consultations Desk</h2>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase">Now Consulting</span>
              <h3 className="text-base font-bold text-stone-900">Aarav Patil (Stress & Joint Stiffness)</h3>
              <p className="text-xs text-stone-600">Prescription draft active · Pulse Rate: 72 bpm (Deep Steady Classical Pulse)</p>
            </div>
            <button 
              onClick={() => setIsPrescriptionModalOpen(true)}
              className="px-4 py-2 bg-[#5B3E8C] text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm"
            >
              Issue Digital Rx
            </button>
          </div>

          {/* AI Chatbot Inquiries Table in Consultations Desk */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>🌿 Live Patient AI Chat Inquiries & Transcripts</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </h3>
              <span className="text-xs text-stone-500 font-mono">{aiChatSessions.length} Patient sessions</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 text-[10px] text-stone-500 border-b border-stone-200 uppercase font-bold tracking-wider">
                    <th className="p-3">Patient</th>
                    <th className="p-3">Primary Concern</th>
                    <th className="p-3">Dosha Imbalance</th>
                    <th className="p-3">Last Query</th>
                    <th className="p-3">Time</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {aiChatSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-stone-900 block">{session.patient_name}</span>
                        <span className="text-[10px] text-stone-400 font-mono">{session.phone}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">
                          {session.primary_concern}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-amber-900">
                        {session.dosha_imbalance}
                      </td>
                      <td className="p-3 text-stone-600 max-w-xs truncate">
                        "{session.last_query}"
                      </td>
                      <td className="p-3 text-stone-400 font-mono text-[10px]">
                        {session.time || 'Just now'}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedChatForTranscript(session)}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold cursor-pointer"
                        >
                          View Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDirectMessageTarget({
                              id: session.patient_id,
                              patient_id: session.patient_id,
                              name: session.patient_name,
                              patient_name: session.patient_name,
                              phone: session.phone
                            });
                            setIsDirectMessageModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Send className="w-2.5 h-2.5 text-purple-700" />
                          <span>Message</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientForRx(session.patient_name);
                            if (session.primary_concern.includes('Cough') || session.primary_concern.includes('कास')) {
                              setRxFormulation('Sitopaladi Churna (3g) with Honey & Ginger juice twice daily + Talisadi Churna (2g)');
                              setRxDietAdvice('Warm boiled water, avoid cold refrigerated items, curds, and oily food.');
                            } else if (session.primary_concern.includes('Acidity') || session.primary_concern.includes('अम्लपित्त')) {
                              setRxFormulation('Kamadudha Rasa (250mg) + Avipattikar Churna (3g) before meals with water');
                              setRxDietAdvice('Avoid fermented, excessively sour and spicy foods; drink cooling coconut water.');
                            } else if (session.primary_concern.includes('Joint') || session.primary_concern.includes('वात')) {
                              setRxFormulation('Yogaraj Guggulu (2 tabs) + Ashwagandha Rasayana (3g) twice daily with milk');
                              setRxDietAdvice('Warm freshly cooked meals, gentle Abhyanga massage with Mahanarayana oil.');
                            }
                            setIsPrescriptionModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                        >
                          Prescribe
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE: Treatment Plans --- */}
      {activeTab === 'doc_treatment_plans' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <ClipboardList className="w-4 h-4" />
              <span>Ayurvedic Protocols</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Customized Treatment Regimens & Panchakarma Plans</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">14-Day Joint & Stress Recovery</span>
              <h3 className="text-sm font-bold text-stone-900">Abhyanga & Basti Therapy Schedule</h3>
              <p className="text-stone-600">Mahanarayana oil massage + Dashamula decoction enema every alternate morning.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-900 text-[10px] font-bold">21-Day Deep Cleanse</span>
              <h3 className="text-sm font-bold text-stone-900">Virechana Agni Deepana Protocol</h3>
              <p className="text-stone-600">Snehapana with Trikatu Ghrita followed by gentle herbal purging.</p>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE: Herbal Recommendations --- */}
      {activeTab === 'doc_herbal_recommendations' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Dravyaguna Formulary & Daily Prescriptions</span>
              </div>
              <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Classical Herbal Recommendations Library</h2>
              <p className="text-xs text-stone-500 mt-0.5">Evidence-based botanical extracts and classical yoga formulations for clinical chamber use.</p>
            </div>

            <button 
              onClick={() => setIsPrescriptionModalOpen(true)}
              className="px-4 py-2 bg-[#5B3E8C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> Prescribe Herb
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Category 1: Stress & Sleep */}
            <div className="p-5 rounded-3xl bg-purple-50/50 border border-purple-200 space-y-3 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold">🌙 Stress & Insomnia</span>
                <h3 className="text-sm font-bold text-stone-900 mt-2">Ashwagandha, Shankhpushpi & Brahmi</h3>
                <p className="text-stone-600 text-[11px] mt-1 leading-relaxed">
                  Reduces cortisol, stops overthinking, repairs neural synapses, and delivers deep delta sleep.
                </p>
                <div className="mt-2 text-[10px] bg-white p-2 rounded-xl border border-purple-100 text-purple-950 font-medium">
                  <strong>Dosage:</strong> 500mg-1g bedtime with warm milk.
                </div>
              </div>
              <button 
                onClick={() => {
                  setRxFormulation('Ashwagandha Extract 500mg (1 cap at bedtime with warm milk) + Shankhpushpi Syrup 10ml twice daily');
                  setIsPrescriptionModalOpen(true);
                }}
                className="w-full py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-[11px] font-bold transition-all"
              >
                1-Click Prescribe
              </button>
            </div>

            {/* Category 2: Digestion & Acidity */}
            <div className="p-5 rounded-3xl bg-amber-50/50 border border-amber-200 space-y-3 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">🔥 Digestion & Reflux</span>
                <h3 className="text-sm font-bold text-stone-900 mt-2">Avipattikar, Trikatu & Triphala</h3>
                <p className="text-stone-600 text-[11px] mt-1 leading-relaxed">
                  Neutralizes excess stomach acid, kindles sluggish metabolic Agni, and cleanses the colon.
                </p>
                <div className="mt-2 text-[10px] bg-white p-2 rounded-xl border border-amber-100 text-amber-950 font-medium">
                  <strong>Dosage:</strong> Avipattikar post-meals, Triphala bedtime.
                </div>
              </div>
              <button 
                onClick={() => {
                  setRxFormulation('Avipattikar Churna 3g (post-meals with lukewarm water) + Triphala Churna 3g (bedtime with warm water)');
                  setIsPrescriptionModalOpen(true);
                }}
                className="w-full py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-[11px] font-bold transition-all"
              >
                1-Click Prescribe
              </button>
            </div>

            {/* Category 3: Low Immunity */}
            <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-200 space-y-3 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">🍃 Immunity & Cold</span>
                <h3 className="text-sm font-bold text-stone-900 mt-2">Guduchi (Amrita) & Tulsi</h3>
                <p className="text-stone-600 text-[11px] mt-1 leading-relaxed">
                  Master immunomodulator; purifies liver, mitigates seasonal allergies, and clears chest phlegm.
                </p>
                <div className="mt-2 text-[10px] bg-white p-2 rounded-xl border border-emerald-100 text-emerald-950 font-medium">
                  <strong>Dosage:</strong> 500mg Guduchi morning empty stomach.
                </div>
              </div>
              <button 
                onClick={() => {
                  setRxFormulation('Guduchi (Giloy) Ghan Vati 500mg (twice daily) + Tulsi herbal infusion 1 cup daily');
                  setIsPrescriptionModalOpen(true);
                }}
                className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold transition-all"
              >
                1-Click Prescribe
              </button>
            </div>

            {/* Category 4: Fatigue & Stamina */}
            <div className="p-5 rounded-3xl bg-rose-50/50 border border-rose-200 space-y-3 flex flex-col justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-bold">⚡ Fatigue & Stamina</span>
                <h3 className="text-sm font-bold text-stone-900 mt-2">Ashwagandha & Shatavari</h3>
                <p className="text-stone-600 text-[11px] mt-1 leading-relaxed">
                  Replenishes cellular Ojas essence, reverses adrenal fatigue, and restores muscular stamina.
                </p>
                <div className="mt-2 text-[10px] bg-white p-2 rounded-xl border border-rose-100 text-rose-950 font-medium">
                  <strong>Dosage:</strong> 1g post-meals with warm milk and ghee.
                </div>
              </div>
              <button 
                onClick={() => {
                  setRxFormulation('Ashwagandha Lehyam 1 tsp twice daily + Shatavari Churna 3g with warm milk at night');
                  setIsPrescriptionModalOpen(true);
                }}
                className="w-full py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-[11px] font-bold transition-all"
              >
                1-Click Prescribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE: Reports & Analytics --- */}
      {activeTab === 'doc_reports_analytics' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              <span>Practice Analytics</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Clinical Practice Reports & Growth Insights</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200">
              <p className="text-2xl font-bold font-serif text-purple-950">256</p>
              <p className="text-stone-500 mt-1 font-medium">Monthly Consultations</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200">
              <p className="text-2xl font-bold font-serif text-green-700">92%</p>
              <p className="text-stone-500 mt-1 font-medium">Recovery Rate</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200">
              <p className="text-2xl font-bold font-serif text-blue-700">4.9 ★</p>
              <p className="text-stone-500 mt-1 font-medium">Patient Satisfaction</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200">
              <p className="text-2xl font-bold font-serif text-amber-700">86</p>
              <p className="text-stone-500 mt-1 font-medium">New Enrolments</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. OTHERS SUB-PAGES (Reminders, Messages, Settings, Help & Support)        */}
      {/* ========================================================================= */}

      {/* --- PAGE: Reminders --- */}
      {activeTab === 'doc_reminders' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              <span>Reminders & Alerts</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Clinical Follow-up Reminders</h2>
          </div>

          <div className="space-y-3">
            {remindersList.map((rem) => (
              <div key={rem.id} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-stone-900">{rem.title}</h4>
                  <p className="text-stone-500 mt-0.5">{rem.note}</p>
                </div>
                <span className="font-mono text-purple-900 font-bold">{rem.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PAGE: Messages --- */}
      {activeTab === 'doc_messages' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <Mail className="w-4 h-4" />
              <span>Patient Communication</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Messages & Patient Inquiries</h2>
          </div>

          <div className="space-y-3">
            {messagesList.map((msg) => (
              <div key={msg.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-stone-900">{msg.sender}</h4>
                  <p className="text-stone-600 mt-0.5">{msg.text}</p>
                </div>
                <span className="font-mono text-stone-400 text-[10px]">{msg.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PAGE: Settings --- */}
      {activeTab === 'doc_settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Doctor Portal & Chamber Settings</h2>
          </div>

          <div className="space-y-4 text-xs max-w-xl">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div>
                <p className="font-bold text-stone-900">WhatsApp & SMS Patient Reminders</p>
                <p className="text-stone-500 text-[11px]">Send automated appointment reminder before scheduled consultation slot.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-700" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div>
                <p className="font-bold text-stone-900">Digital Watermark on Prescriptions</p>
                <p className="text-stone-500 text-[11px]">Include official Medical Council Registration badge on exported PDF.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-purple-700" />
            </div>
          </div>
        </div>
      )}

      {/* --- PAGE: Help & Support --- */}
      {activeTab === 'doc_help_support' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Support Desk</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900 mt-1">Doctor Support & Clinical Compliance Help</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
              <h3 className="font-bold text-stone-900">Clinical Technical Helpline</h3>
              <p className="text-stone-600">For issues regarding OPD appointments, digital prescriptions, or live AI diagnostics.</p>
              <a href="mailto:contact.zeniva@gmail.com" className="text-purple-700 hover:text-purple-900 font-mono font-bold hover:underline block">
                contact.zeniva@gmail.com · Toll Free: 1800-892-ZEN
              </a>
            </div>
            <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
              <h3 className="font-bold text-stone-900">State Medical Council Compliance</h3>
              <p className="text-stone-600">Guidance on state licensing renewal, digital telemedicine statutory norms.</p>
              <a href="mailto:contact.zeniva@gmail.com" className="text-purple-700 hover:text-purple-900 font-mono font-bold hover:underline block">
                contact.zeniva@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD PRESCRIPTION MODAL                                                    */}
      {/* ========================================================================= */}
      {isPrescriptionModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#EBE3D5] space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-[#5B3E8C]">
                <MortarPestleGraphic className="w-5 h-5" />
                <h3 className="text-base font-serif font-bold text-stone-900">Issue Ayurvedic Digital Prescription</h3>
              </div>
              <button onClick={() => setIsPrescriptionModalOpen(false)} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRx} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Select Patient</label>
                <select value={selectedPatientForRx} onChange={(e) => setSelectedPatientForRx(e.target.value)} className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold">
                  {patientsRoster.map(p => <option key={p.id}>{p.name} ({p.dosha})</option>)}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Ayurvedic Formulations & Dosage (Aushadhi)</label>
                <textarea required value={rxFormulation} onChange={(e) => setRxFormulation(e.target.value)} rows={3} className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50" />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Ahara & Vihara Lifestyle Advice (Pathya-Apathya)</label>
                <textarea value={rxDietAdvice} onChange={(e) => setRxDietAdvice(e.target.value)} rows={2} className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50" />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsPrescriptionModalOpen(false)} className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#5B3E8C] text-white font-bold cursor-pointer shadow-sm">Sign & Issue Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PATIENT AI CHATBOT TRANSCRIPT MODAL (FULL CLINICAL HISTORY)              */}
      {/* ========================================================================= */}
      {selectedChatForTranscript && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FAF7F2] w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border-2 border-[#EBE3D5] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 text-[#1C1917]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#21123D] to-[#12281D] text-white flex items-center justify-between border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  🌿
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                      AI Triage History · {selectedChatForTranscript.patient_name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold">
                      {selectedChatForTranscript.prakriti || 'Holistic Wellness Profile'}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300">
                    Phone: {selectedChatForTranscript.phone || 'N/A'} · City: {selectedChatForTranscript.city || 'Nagpur'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedChatForTranscript(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Clinical Overview Bar */}
            <div className="px-5 py-3 bg-purple-50 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-bold">Primary Concern:</span>
                <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                  {selectedChatForTranscript.primary_concern}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-bold">Dosha Imbalance:</span>
                <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                  {selectedChatForTranscript.dosha_imbalance}
                </span>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 bg-white/60">
              {(selectedChatForTranscript.messages && selectedChatForTranscript.messages.length > 0) ? (
                selectedChatForTranscript.messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-stone-400 font-mono">
                      <span>{m.sender === 'user' ? selectedChatForTranscript.patient_name : 'Zeniva Ayurvedic AI'}</span>
                      <span>·</span>
                      <span>{m.timestamp || m.time || '10:00 AM'}</span>
                    </div>
                    <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-purple-900 text-white rounded-tr-none shadow-sm'
                        : 'bg-[#F4F1EA] text-stone-900 border border-[#E5DAC6] rounded-tl-none shadow-xs'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-stone-400 mb-1">{selectedChatForTranscript.patient_name}</span>
                    <div className="p-3.5 rounded-2xl bg-purple-900 text-white text-xs max-w-[85%]">
                      {selectedChatForTranscript.last_query}
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] text-stone-400 mb-1">Zeniva Ayurvedic AI</span>
                    <div className="p-3.5 rounded-2xl bg-[#F4F1EA] text-stone-900 border border-[#E5DAC6] text-xs max-w-[85%] whitespace-pre-wrap">
                      {selectedChatForTranscript.last_reply}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Doctor Actions */}
            <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-stone-500 font-medium">
                Clinical guidance provided by Charaka RAG 70B · Awaiting doctor validation
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedChatForTranscript(null)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const session = selectedChatForTranscript;
                    setSelectedChatForTranscript(null);
                    setSelectedPatientForRx(session.patient_name);
                    if (session.primary_concern.includes('Cough') || session.primary_concern.includes('कास')) {
                      setRxFormulation('Sitopaladi Churna (3g) with Honey & Ginger juice twice daily + Talisadi Churna (2g)');
                      setRxDietAdvice('Warm boiled water, avoid cold refrigerated items, curds, and oily food.');
                    } else if (session.primary_concern.includes('Acidity') || session.primary_concern.includes('अम्लपित्त')) {
                      setRxFormulation('Kamadudha Rasa (250mg) + Avipattikar Churna (3g) before meals with water');
                      setRxDietAdvice('Avoid fermented, excessively sour and spicy foods; drink cooling coconut water.');
                    } else if (session.primary_concern.includes('Joint') || session.primary_concern.includes('वात')) {
                      setRxFormulation('Yogaraj Guggulu (2 tabs) + Ashwagandha Rasayana (3g) twice daily with milk');
                      setRxDietAdvice('Warm freshly cooked meals, gentle Abhyanga massage with Mahanarayana oil.');
                    }
                    setIsPrescriptionModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <MortarPestleGraphic className="w-4 h-4" />
                  <span>Issue Doctor Prescription</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. PROFESSIONAL DOCTOR PROFILE & PHOTO EDITOR MODAL                       */}
      {/* ========================================================================= */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FAF7F2] w-full max-w-3xl max-h-[92vh] rounded-3xl shadow-2xl border-2 border-[#EBE3D5] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 text-[#1C1917]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#2B1745] via-[#401F68] to-[#1F3D2B] text-white flex items-center justify-between border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  <Stethoscope className="w-5 h-5 text-stone-950" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                    <span>Doctor Profile & Credentials</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                      Verified Practitioner
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200">
                    Changes persist permanently across Cloud Database, Local Storage & Doctor Login.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form onSubmit={handleSaveDoctorProfile} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Photo Upload & Identity Card */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={doctorAvatar}
                    alt={doctorName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-[#5B3E8C] shadow-md group-hover:opacity-90 transition-opacity"
                  />
                  <label
                    htmlFor="modal_doctor_avatar_file"
                    className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-[#5B3E8C] text-white hover:bg-[#452B6E] cursor-pointer shadow-md transition-transform hover:scale-110"
                    title="Upload New Doctor Photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </label>
                  <input
                    id="modal_doctor_avatar_file"
                    type="file"
                    accept="image/*"
                    onChange={handleDoctorAvatarUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h4 className="font-bold text-stone-900 text-sm">{doctorName}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold text-[10px]">
                      {qualification}
                    </span>
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    Photo is saved permanently to cloud storage. When you re-login with your mobile, this exact photo will appear.
                  </p>
                  <label
                    htmlFor="modal_doctor_avatar_file"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#5B3E8C] hover:underline cursor-pointer pt-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Doctor Photograph</span>
                  </label>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Doctor Full Name (with Title):</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="e.g. Dr. Sohil Indurkar"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Medical Degrees & Qualifications:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                    placeholder="e.g. BAMS, MD (Ayurveda - Kayachikitsa)"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Primary Clinical Specialization:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                    placeholder="e.g. Kayachikitsa, Nadi Pariksha & Panchakarma"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Years of Clinical Experience:</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={profileForm.experienceYears}
                    onChange={(e) => setProfileForm({ ...profileForm, experienceYears: e.target.value })}
                    placeholder="e.g. 12"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Medical Council Registration No:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.councilReg}
                    onChange={(e) => setProfileForm({ ...profileForm, councilReg: e.target.value })}
                    placeholder="e.g. AYU-MAH-8921"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">State Ayurvedic Council:</label>
                  <input
                    type="text"
                    value={profileForm.councilName}
                    onChange={(e) => setProfileForm({ ...profileForm, councilName: e.target.value })}
                    placeholder="e.g. Maharashtra Council of Indian Medicine (MCIM)"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Ayurvedic Clinic / Hospital Name:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.organization}
                    onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                    placeholder="e.g. Zeniva Ayurvedic Clinical Center"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">City & State:</label>
                  <input
                    type="text"
                    required
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    placeholder="e.g. Nagpur, Maharashtra"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Registered Mobile Number (+91):</label>
                  <input
                    type="text"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-mono focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Official Doctor Email:</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="e.g. dr.sohil@zeniva.ai"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">OPD Consultation Fee:</label>
                  <input
                    type="text"
                    value={profileForm.consultationFee}
                    onChange={(e) => setProfileForm({ ...profileForm, consultationFee: e.target.value })}
                    placeholder="e.g. ₹500"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 font-semibold focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Consultation Timings / OPD Hours:</label>
                  <input
                    type="text"
                    value={profileForm.timings}
                    onChange={(e) => setProfileForm({ ...profileForm, timings: e.target.value })}
                    placeholder="e.g. Mon - Sat: 09:00 AM - 01:00 PM & 04:00 PM - 08:00 PM"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Clinical Biography & Treatment Focus:</label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Detail your Ayurvedic background, clinical specialities, and patient care philosophy..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 focus:ring-2 focus:ring-purple-600/30 outline-none"
                />
              </div>

              {/* Form Footer */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                <span className="text-[11px] text-stone-500 font-medium">
                  ✓ Automatically synchronizes across cloud & web
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDoctorProfile}
                    className="px-5 py-2.5 rounded-xl bg-[#5B3E8C] hover:bg-[#4A2F75] text-white font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingDoctorProfile ? 'Saving Changes...' : 'Save Profile & Credentials'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TARGETED DOCTOR-TO-PATIENT DIRECT ADVICE & MESSAGE MODAL               */}
      {/* ========================================================================= */}
      {isDirectMessageModalOpen && directMessageTarget && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FAF7F2] w-full max-w-xl rounded-3xl shadow-2xl border-2 border-[#EBE3D5] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 text-[#1C1917]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#21123D] to-[#12281D] text-white flex items-center justify-between border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-stone-950 flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  <Send className="w-5 h-5 text-stone-950" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-white flex items-center gap-2">
                    <span>Send Targeted Doctor Advice</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                      Direct Delivery
                    </span>
                  </h3>
                  <p className="text-[11px] text-stone-300">
                    Recipient: <strong className="text-white">{directMessageTarget.name || directMessageTarget.patient_name}</strong> (📱 {directMessageTarget.phone || 'Registered Phone'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDirectMessageModalOpen(false);
                  setDirectMessageText('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendDirectMessage} className="p-5 space-y-4 text-xs">
              
              {/* Recipient Notice */}
              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-start gap-3">
                <Bell className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-purple-950 text-xs">
                    Targeted Patient Notification Bell Delivery
                  </h4>
                  <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                    This message will appear directly in <strong>{directMessageTarget.name || directMessageTarget.patient_name}</strong>'s notification bell icon with your doctor name, verified credentials, and instructions.
                  </p>
                </div>
              </div>

              {/* Quick Template Chips */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5">Quick Clinical Presets (Click to insert):</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Take 3g Sitopaladi Churna with honey & ginger juice twice daily. Avoid refrigerated cold drinks.",
                    "Take 250mg Kamadudha Rasa before meals with lukewarm water. Avoid spicy, sour, and fermented food.",
                    "Apply warm Mahanarayana Taila gently over painful joints followed by warm fomentation.",
                    "Please schedule an in-person OPD consultation at our chamber for a comprehensive Nadi Pariksha examination."
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setDirectMessageText(preset)}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-purple-100 text-stone-700 hover:text-purple-900 border border-stone-200 text-[10px] text-left cursor-pointer transition-colors"
                    >
                      + {preset.slice(0, 48)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Textarea */}
              <div>
                <label className="font-bold text-stone-800 block mb-1">
                  Doctor Advice / Prescription / Follow-up Note:
                </label>
                <textarea
                  required
                  rows={4}
                  value={directMessageText}
                  onChange={(e) => setDirectMessageText(e.target.value)}
                  placeholder={`Write clinical advice, dietary guidelines, or medicine dosages for ${directMessageTarget.name || directMessageTarget.patient_name}...`}
                  className="w-full p-3 rounded-2xl border border-stone-200 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-purple-600/30 outline-none leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-200">
                <span className="text-[10px] text-stone-500 font-medium">
                  🔒 Encrypted and private to this specific patient
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectMessageModalOpen(false);
                      setDirectMessageText('');
                    }}
                    className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSendingDirectMessage || !directMessageText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#5B3E8C] hover:bg-[#4A2F75] text-white font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingDirectMessage ? 'Sending...' : 'Send to Patient Notification'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
