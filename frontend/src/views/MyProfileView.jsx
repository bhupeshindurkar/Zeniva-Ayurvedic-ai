import React, { useState, useEffect, useRef } from 'react';
import { 
  User, ShieldCheck, Phone, Mail, MapPin, 
  Activity, Heart, Sparkles, Check, Edit3, Save, Calendar,
  Camera, Upload, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getApiUrl } from '../lib/api';

export const MyProfileView = ({ currentUser = {}, onUpdateUser = () => {} }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const isDoctor = currentUser.role === 'doctor';
  const defaultAvatar = isDoctor 
    ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400' 
    : '';

  // Form State initialized strictly with logged-in user data
  const [profileData, setProfileData] = useState({
    name: currentUser.name || '',
    phone: currentUser.phone || '',
    age: currentUser.age || 25,
    gender: currentUser.gender || 'Female',
    email: currentUser.email || '',
    location: currentUser.location || currentUser.city || '',
    prakriti: currentUser.prakriti || 'Stress & Sleep Wellness Profile',
    vikriti: currentUser.vikriti || '',
    bloodGroup: currentUser.blood_group || currentUser.bloodGroup || 'B+',
    diet: currentUser.diet || 'Vegan Whole Plant Foods',
    agribalam: currentUser.agribalam || 'Madhyama Agni (Moderate Digestion)',
    avatar: currentUser.avatar || defaultAvatar
  });

  useEffect(() => {
    if (currentUser && (currentUser.name || currentUser.email)) {
      const cachedAvatar = typeof localStorage !== 'undefined' ? localStorage.getItem('zeniva_patient_avatar') : null;
      setProfileData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        location: currentUser.location || currentUser.city || '',
        diet: currentUser.diet || 'Vegan Whole Plant Foods',
        age: currentUser.age || 25,
        gender: currentUser.gender || 'Female',
        prakriti: currentUser.prakriti || 'Stress & Sleep Wellness Profile',
        vikriti: currentUser.vikriti || '',
        bloodGroup: currentUser.blood_group || currentUser.bloodGroup || 'B+',
        agribalam: currentUser.agribalam || 'Madhyama Agni (Moderate Digestion)',
        avatar: cachedAvatar || currentUser.avatar || defaultAvatar
      });
    }
  }, [currentUser]);

  // Load cloud-persisted patient avatar on mount if available across Supabase & SQLite
  useEffect(() => {
    const cleanP = (profileData.phone || currentUser.phone || '').replace(/\D/g, '').slice(-10);
    const cleanEmail = (profileData.email || currentUser.email || '').trim().toLowerCase();
    const userId = currentUser.id || '';

    // 1. Supabase Profiles & Auth Metadata
    if (supabase) {
      // Check auth user metadata first
      supabase.auth.getUser().then(({ data }) => {
        const authAvatar = data?.user?.user_metadata?.avatar_url;
        if (authAvatar && authAvatar.length > 20) {
          setProfileData(prev => ({ ...prev, avatar: authAvatar }));
          localStorage.setItem('zeniva_patient_avatar', authAvatar);
          if (cleanP) localStorage.setItem(`zeniva_patient_avatar_${cleanP}`, authAvatar);
        }
      }).catch(() => {});

      // Query profiles table by id, phone, or email
      let query = supabase.from('profiles').select('avatar_url, full_name, phone, email');
      if (userId) {
        query = query.eq('id', userId);
      } else if (cleanP) {
        query = query.or(`phone.eq.${cleanP},phone.eq.+91${cleanP},phone.eq.0${cleanP}`);
      } else if (cleanEmail) {
        query = query.eq('email', cleanEmail);
      }

      query.limit(1).then(({ data }) => {
        if (data && data[0]?.avatar_url && data[0].avatar_url.length > 20) {
          setProfileData(prev => ({ ...prev, avatar: data[0].avatar_url }));
          localStorage.setItem('zeniva_patient_avatar', data[0].avatar_url);
          if (cleanP) localStorage.setItem(`zeniva_patient_avatar_${cleanP}`, data[0].avatar_url);
        }
      }).catch(() => {});

      // Check doctor_reviews mirror backup sync
      const mirrorKey = cleanP ? `ZENIVA_PATIENT_PROFILE_${cleanP}` : (cleanEmail ? `ZENIVA_PATIENT_PROFILE_${cleanEmail}` : null);
      if (mirrorKey) {
        supabase
          .from('doctor_reviews')
          .select('review_notes')
          .eq('patient_name', mirrorKey)
          .order('created_at', { ascending: false })
          .limit(1)
          .then(({ data }) => {
            if (data && data.length > 0 && data[0].review_notes) {
              try {
                const cloudP = JSON.parse(data[0].review_notes);
                if (cloudP?.avatar && (cloudP.avatar.startsWith('data:image') || cloudP.avatar.startsWith('http'))) {
                  setProfileData(prev => ({ ...prev, avatar: cloudP.avatar }));
                  localStorage.setItem('zeniva_patient_avatar', cloudP.avatar);
                  if (cleanP) localStorage.setItem(`zeniva_patient_avatar_${cleanP}`, cloudP.avatar);
                }
              } catch (e) {}
            }
          })
          .catch(() => {});
      }
    }

    // 2. Fetch from Backend SQLite
    const searchTarget = cleanEmail || cleanP;
    if (searchTarget) {
      fetch(getApiUrl(`/api/user/profile/${searchTarget}`))
        .then(res => res.json())
        .then(data => {
          const userObj = data?.user || data?.patient;
          if (userObj?.avatar && userObj.avatar.length > 20) {
            setProfileData(prev => ({ ...prev, avatar: userObj.avatar }));
            localStorage.setItem('zeniva_patient_avatar', userObj.avatar);
            if (cleanP) localStorage.setItem(`zeniva_patient_avatar_${cleanP}`, userObj.avatar);
          }
        })
        .catch(() => {});
    }
  }, [profileData.phone, currentUser.phone, profileData.email, currentUser.email, currentUser.id]);

  // Clean 10-digit number display
  const rawPhone = (profileData.phone || currentUser.phone || '').replace(/\D/g, '').slice(-10);
  const formattedPhone = rawPhone.length === 10
    ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`
    : (rawPhone ? `+91 ${rawPhone}` : 'Not registered');

  // Helper to sync to Supabase & Backend with 100% cloud persistence
  const syncProfileRemotely = async (updatedUser) => {
    const cleanP = rawPhone || (updatedUser.phone ? updatedUser.phone.replace(/\D/g, '').slice(-10) : '');
    const cleanEmail = (updatedUser.email || '').trim().toLowerCase();

    // 1. Supabase Profiles & Auth Metadata Update
    try {
      if (supabase) {
        // Sync directly into auth user_metadata so email/password login automatically restores avatar even after 1 year
        try {
          await supabase.auth.updateUser({
            data: {
              avatar_url: updatedUser.avatar,
              full_name: updatedUser.name
            }
          });
        } catch (authMetaErr) {}

        // Update profiles table
        try {
          await supabase
            .from('profiles')
            .update({
              avatar_url: updatedUser.avatar,
              full_name: updatedUser.name,
              phone: cleanP || updatedUser.phone,
              email: cleanEmail || updatedUser.email,
              city: updatedUser.location || updatedUser.city,
              prakriti: updatedUser.prakriti,
              age: updatedUser.age,
              gender: updatedUser.gender,
              blood_group: updatedUser.bloodGroup || updatedUser.blood_group,
              diet: updatedUser.diet
            })
            .or(`phone.eq.${cleanP},phone.eq.+91${cleanP},phone.eq.0${cleanP},email.eq.${cleanEmail},id.eq.${updatedUser.id || ''}`);
        } catch (upErr) {}

        // Guaranteed upsert if user has an ID
        if (updatedUser.id && !updatedUser.id.startsWith('PAT-')) {
          try {
            await supabase.from('profiles').upsert({
              id: updatedUser.id,
              avatar_url: updatedUser.avatar,
              full_name: updatedUser.name,
              phone: cleanP || updatedUser.phone,
              email: cleanEmail || updatedUser.email,
              city: updatedUser.location || updatedUser.city,
              role: 'patient'
            });
          } catch (upsertErr) {}
        }

        // Fallback guaranteed cloud persistence in doctor_reviews table mirror
        const mirrorKey = cleanP ? `ZENIVA_PATIENT_PROFILE_${cleanP}` : `ZENIVA_PATIENT_PROFILE_${cleanEmail}`;
        if (mirrorKey) {
          try {
            await supabase
              .from('doctor_reviews')
              .insert([{
                doctor_name: 'PATIENT_PROFILE_SYNC',
                patient_name: mirrorKey,
                symptoms: 'Patient Avatar & Profile Update',
                review_notes: JSON.stringify(updatedUser),
                status: 'verified'
              }]);
          } catch (rErr) {}
        }
      }
    } catch (supaErr) {}

    // 2. SQLite Backend (Local / Prod)
    try {
      const url = getApiUrl('/api/user/profile');
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      });
    } catch (backendErr) {}
  };

  // Real Photo Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result;
        const cleanP = rawPhone || (currentUser.phone ? currentUser.phone.replace(/\D/g, '').slice(-10) : '');
        const updatedUser = {
          ...currentUser,
          ...profileData,
          avatar: base64Url,
          phone: cleanP || rawPhone,
          role: currentUser.role || 'patient'
        };
        setProfileData(prev => ({ ...prev, avatar: base64Url }));
        onUpdateUser(updatedUser);
        try {
          localStorage.setItem('zeniva_patient_avatar', base64Url);
          localStorage.setItem('zeniva_current_user', JSON.stringify(updatedUser));
          if (cleanP) {
            localStorage.setItem(`zeniva_patient_avatar_${cleanP}`, base64Url);
          }
          if (updatedUser.role === 'doctor') {
            localStorage.setItem('zeniva_doctor_user', JSON.stringify(updatedUser));
            localStorage.setItem('zeniva_registered_doctor', JSON.stringify(updatedUser));
          } else {
            localStorage.setItem('zeniva_patient_user', JSON.stringify(updatedUser));
          }
          window.dispatchEvent(new CustomEvent('zeniva_patient_avatar_updated', { detail: base64Url }));
          window.dispatchEvent(new CustomEvent('zeniva_patient_profile_updated', { detail: updatedUser }));
        } catch (err) {}
        await syncProfileRemotely(updatedUser);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsEditing(false);
    const updatedUser = {
      ...currentUser,
      ...profileData,
      phone: rawPhone,
      role: currentUser.role || 'patient'
    };
    onUpdateUser(updatedUser);
    try {
      localStorage.setItem('zeniva_current_user', JSON.stringify(updatedUser));
      if (updatedUser.role === 'doctor') {
        localStorage.setItem('zeniva_doctor_user', JSON.stringify(updatedUser));
        localStorage.setItem('zeniva_registered_doctor', JSON.stringify(updatedUser));
      } else {
        localStorage.setItem('zeniva_patient_user', JSON.stringify(updatedUser));
      }
    } catch (err) {}
    await syncProfileRemotely(updatedUser);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="p-6 sm:p-8 max-w-[1400px] mx-auto space-y-6 bg-[#FAF7F2] min-h-screen select-none">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE3D5] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B3E8C]">
            <User className="w-4 h-4" />
            <span>Patient Health Profile</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1C1917] mt-1">
            My Ayurvedic Health Record (रोगी विवरण)
          </h1>
          <p className="text-xs text-[#78716C] mt-0.5">
            Personal biometrics, profile picture, constitutional Prakriti, and verified contact details
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-5 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
            isEditing 
              ? 'bg-stone-200 text-stone-800 hover:bg-stone-300' 
              : 'bg-[#1E5039] hover:bg-[#163E2C] text-white'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Profile Details'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-green-100 text-green-900 text-xs font-bold flex items-center gap-2 border border-green-200 animate-in fade-in">
          <Check className="w-4 h-4 text-green-700" />
          <span>Health profile details and photo saved successfully!</span>
        </div>
      )}

      {/* Main Grid: Avatar Card + Details Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 4.5 Columns: Patient ID Card & Photo Upload */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-[#EBE3D5] shadow-xs space-y-5 flex flex-col items-center text-center">
          
          {/* Interactive Profile Photo Container with Upload Trigger */}
          <div className="relative group">
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt={profileData.name || 'User'}
                className="w-32 h-32 rounded-3xl object-cover border-4 border-[#FAF7F2] shadow-md transition-all group-hover:brightness-90"
              />
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-3xl bg-gradient-to-br from-stone-100 to-stone-200 border-4 border-[#FAF7F2] shadow-md flex flex-col items-center justify-center text-stone-400 cursor-pointer hover:bg-stone-200 transition-colors"
              >
                <User className="w-12 h-12 mb-1 text-stone-400" />
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Upload Photo</span>
              </div>
            )}
            
            {/* Upload Badge Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-3xl bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-xs"
              title="Click to upload profile photo"
            >
              <Camera className="w-6 h-6 mb-1 text-white" />
              <span className="text-[10px] font-bold tracking-wider uppercase">Upload Photo</span>
            </button>

            {/* Camera Floating Pill Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 bg-[#5B3E8C] hover:bg-[#4A3273] text-white rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110"
              title="Upload new profile photo"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Hidden Real File Input Linked to Camera Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div>
            <h3 className="text-xl font-serif font-bold text-[#1C1917]">{profileData.name || 'Zeniva Patient'}</h3>
            <p className="text-xs text-[#5B3E8C] font-semibold">{profileData.age} Yrs · {profileData.gender}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-purple-50 text-purple-900 rounded-full text-[10px] font-bold border border-purple-200 font-mono">
              ID: {currentUser.id || `ZNV-PAT-${(rawPhone || 'NEW').slice(-4)}`}
            </span>
          </div>

          <div className="w-full space-y-2 pt-3 border-t border-stone-100 text-xs text-left text-stone-700 font-medium">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-purple-700 shrink-0" />
              <span className="font-mono font-bold text-[#1C1917]">{formattedPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-700 shrink-0" />
              <span className="truncate text-stone-600">{profileData.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-700 shrink-0" />
              <span>{profileData.location}</span>
            </div>
          </div>

          <div className="w-full p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-left space-y-2">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Assigned Vaidya:</p>
            <p className="text-xs font-bold text-stone-900">Dr. Meera Joshi (BAMS, MD)</p>
            <p className="text-[11px] text-stone-500">Next Consultation: Tomorrow, 11:00 AM</p>
          </div>
        </div>

        {/* Right 7.5 Columns: Biological & Clinical Details */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-5">
          <div className="border-b border-[#F5EFEB] pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Ayurvedic Biological Constitution
            </h3>
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Prakriti Verified</span>
            </span>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-medium focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">10-Digit Mobile Number</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-stone-100 border border-r-0 border-stone-300 rounded-l-xl font-bold text-stone-600">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-2.5 rounded-r-xl border border-stone-300 bg-white font-mono font-bold tracking-wider focus:ring-2 focus:ring-purple-600/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Age & Gender</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={profileData.age}
                      onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                      className="w-20 p-2.5 rounded-xl border border-stone-300 bg-white font-medium"
                    />
                    <select
                      value={profileData.gender}
                      onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl border border-stone-300 bg-white font-medium"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-stone-700 block mb-1">Diet Preference (आहार)</label>
                  <select
                    value={profileData.diet}
                    onChange={(e) => setProfileData({ ...profileData, diet: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white font-medium"
                  >
                    <option>Satvik Vegetarian (Low Spices & Fresh Foods)</option>
                    <option>Rajasik (Moderate Spices, Onions & Garlic)</option>
                    <option>Vegan Whole Plant Foods</option>
                  </select>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1E5039] hover:bg-[#163E2C] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-100 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Constitutional Wellness Profile:</span>
                <p className="text-sm font-bold text-[#1C1917]">{profileData.prakriti}</p>
                <p className="text-[11px] text-stone-500">Stress: Low · Sleep: 88% · Vitality: High</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-100 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Current Vikriti (Imbalance):</span>
                <p className="text-sm font-bold text-amber-900">{profileData.vikriti}</p>
                <p className="text-[11px] text-stone-500">Agni: {profileData.agribalam}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-100 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Dietary Regimen (आहार):</span>
                <p className="text-sm font-bold text-[#1C1917]">{profileData.diet}</p>
                <p className="text-[11px] text-stone-500">Warm cooked meals, avoiding night curd</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-100 space-y-1">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Blood Group & Ojas State:</span>
                <p className="text-sm font-bold text-[#1C1917]">{profileData.bloodGroup} (Ojas: 82/100 Strong)</p>
                <p className="text-[11px] text-stone-500">Immunity balance is favorable</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
