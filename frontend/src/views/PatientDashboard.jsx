import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ArrowRight, Activity, Calendar, HeartPulse, Stethoscope, 
  BookOpen, CheckCircle2, Leaf, Users, Edit3, Save, X, 
  Plus, Check, Sliders, Flame, Droplet, Wind, ShieldCheck,
  MapPin, Navigation, Compass, ExternalLink, Phone, Building, Clock, Star,
  Play, Pause, RefreshCw, Video, Eye, Volume2, VolumeX, Scan,
  MessageSquare, Send, Mic, Bot, Globe, ShieldAlert, Paperclip, Languages,
  FileText, Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export const PatientDashboard = ({ 
  currentUser = {},
  isSplashFinished = true,
  onUpdateUser = () => {},
  onSelectTab = () => {},
  onOpenQuickScan = () => {},
  onOpenAIChat = () => {}
}) => {
  // Nearby Ayurvedic Chambers & Verified Clinics Data
  const defaultClinics = [
    {
      id: 'clinic-1',
      name: 'Shri Dhanvantari Ayurvedic Clinic & Research Center',
      doctor: 'Dr. Vikramaditya Vaidya (Vaidya)',
      qualification: 'BAMS, MD (Kayachikitsa)',
      street: 'Plot 45, Ayurvedic Enclave, Central Avenue Road, Ramdaspeth',
      landmark: 'Near Vedic Wellness Center & Shivaji Garden',
      city: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440010',
      phone: '+91 87669 03403',
      timings: 'Mon - Sat: 09:00 AM - 01:00 PM & 04:00 PM - 08:00 PM',
      rating: '4.9 ★ (148 reviews)',
      fee: '₹500',
      facilities: ['Nadi Pariksha', 'Panchakarma Detox Unit', 'Herbal Pharmacy', 'Tele-OPD'],
      latitude: '21.1458',
      longitude: '79.0882'
    },
    {
      id: 'clinic-2',
      name: 'Patanjali & Samhita Holistic Ayur-Veda Kendra',
      doctor: 'Dr. Meera Joshi',
      qualification: 'BAMS, MD Kayachikitsa',
      street: 'Lane 7, FC Road, Deccan Gymkhana, Shivaji Nagar',
      landmark: 'Opp. Ferguson College Gate',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
      phone: '+91 98123 45567',
      timings: 'Mon - Sat: 10:00 AM - 07:00 PM',
      rating: '4.8 ★ (212 reviews)',
      fee: '₹600',
      facilities: ['Nadi Pariksha', 'Shirodhara Room', 'Ayurvedic Pharmacy', 'Diet Counseling'],
      latitude: '18.5204',
      longitude: '73.8567'
    },
    {
      id: 'clinic-3',
      name: 'Arya Vaidya Sala Kottakkal Consultation Bureau',
      doctor: 'Dr. Arjun Patil',
      qualification: 'BAMS, PG Diploma Panchakarma',
      street: 'Shop 12, Heritage Plaza, Dadar West',
      landmark: 'Near Shivaji Park',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400028',
      phone: '+91 98220 11223',
      timings: 'Mon - Sat: 09:30 AM - 08:30 PM',
      rating: '4.9 ★ (340 reviews)',
      fee: '₹700',
      facilities: ['Classical Kottakkal Medicines', 'Kati Basti', 'Janu Basti', 'Pulse Diagnostics'],
      latitude: '19.0178',
      longitude: '72.8478'
    }
  ];

  const [selectedClinic, setSelectedClinic] = useState(defaultClinics[0]);
  const [selectedCityFilter, setSelectedCityFilter] = useState('All');
  const [isLocating, setIsLocating] = useState(false);
  const [userLocationText, setUserLocationText] = useState(() => currentUser.location || currentUser.city || 'Location not set');

  // Sync with user's profile location in real-time
  useEffect(() => {
    const loc = currentUser.location || currentUser.city;
    if (loc) {
      setUserLocationText(loc);
      const locLower = loc.toLowerCase();
      const matched = defaultClinics.find(c => locLower.includes(c.city.toLowerCase()));
      if (matched) {
        setSelectedClinic(matched);
        setSelectedCityFilter(matched.city);
      }
    }
  }, [currentUser.location, currentUser.city]);

  const handleDetectLiveLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.county || 'Maharashtra';
            const state = addr.state || 'India';
            const fullLoc = `${city}, ${state}`;
            setUserLocationText(fullLoc);
            
            // Sync to global currentUser & localStorage
            if (onUpdateUser) {
              onUpdateUser({
                ...currentUser,
                location: fullLoc,
                city: city
              });
            }

            const matched = defaultClinics.find(c => c.city.toLowerCase() === city.toLowerCase());
            if (matched) {
              setSelectedClinic(matched);
              setSelectedCityFilter(matched.city);
            }
          }
        } catch (e) {}
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      }
    );
  };
  // Ambient Ayurvedic Cinematic Video Backgrounds (Automatic Smooth Scene Rotation)
  const ambientVideos = [
    {
      id: 'vid_forest',
      name: 'Sacred Herbal Forest',
      sanskrit: '॥ वन शान्ति ॥',
      title: 'Vedic Forest Dew & Prana Breeze (प्राण वायु)',
      desc: 'Awakening metabolic vitality with morning sunlight through sacred sal groves.',
      dosha: 'Stress Relief',
      url: 'https://assets.codepen.io/3364143/7btrrd.mp4'
    },
    {
      id: 'vid_lotus',
      name: 'Blooming Botanical Flower',
      sanskrit: '॥ पुष्प विकास ॥',
      title: 'Ayurvedic Lotus & Botanical Bloom (पद्म विकास)',
      desc: 'Sattvic tranquility for mental Ojas and restorative pineal activation.',
      dosha: 'Holistic Vitality',
      url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
    },
    {
      id: 'vid_river',
      name: 'Himalayan Ganga Stream',
      sanskrit: '॥ पवित्र प्रवाह ॥',
      title: 'Sacred Himalayan River Flow (पवित्र गंगा प्रवाह)',
      desc: 'Soothing mental tension through crystalline glacial stream acoustics.',
      dosha: 'Deep Relaxation',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    }
  ];

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = React.useRef(null);

  // Automatic Scene Rotation: Smoothly cycles between Forest -> Flower -> Stream every 12 seconds
  useEffect(() => {
    if (!isVideoPlaying) return;
    const interval = setInterval(() => {
      setCurrentVideoIndex(prev => (prev + 1) % ambientVideos.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [isVideoPlaying, ambientVideos.length]);

  // Dedicated Flash / Splash Screen Video State (Always triggers on every page refresh / entry)
  const [isPopupVideoOpen, setIsPopupVideoOpen] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [broadcastVideo, setBroadcastVideo] = useState({
    title: 'Zeniva AI Video Project: Classical Introduction',
    sanskrit: '॥ आयुर्वेद एवं आधुनिक विज्ञान परिचय ॥',
    duration: '0:10 sec · High Definition',
    url: '/assets/project_video.mp4',
    desc: 'Zeniva AI Classical Ayurvedic Introduction & Clinical Platform Overview.',
    enabled: true
  });
  const [videoError, setVideoError] = useState(false);
  const modalVideoRef = React.useRef(null);

  // Cough Care & Medicine Reminder Schedule
  const [coughSchedule, setCoughSchedule] = useState(() => {
    try {
      const saved = localStorage.getItem('zeniva_cough_medicine_schedule');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      morning: false,
      afternoon: false,
      night: false,
      lastUpdated: new Date().toDateString()
    };
  });

  const toggleCoughDose = (slot) => {
    setCoughSchedule(prev => {
      const next = { ...prev, [slot]: !prev[slot], lastUpdated: new Date().toDateString() };
      try {
        localStorage.setItem('zeniva_cough_medicine_schedule', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Automatic Voice / Audio Playback Handler
  useEffect(() => {
    if (isPopupVideoOpen && modalVideoRef.current) {
      const vid = modalVideoRef.current;
      vid.muted = false;
      vid.volume = 1.0;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser strictly blocks unmuted autoplay without prior gesture:
          vid.muted = true;
          vid.play().catch(() => {});
          const unmuteOnUserGesture = () => {
            if (modalVideoRef.current) {
              modalVideoRef.current.muted = false;
              modalVideoRef.current.volume = 1.0;
            }
            window.removeEventListener('click', unmuteOnUserGesture);
            window.removeEventListener('touchstart', unmuteOnUserGesture);
          };
          window.addEventListener('click', unmuteOnUserGesture, { once: true });
          window.addEventListener('touchstart', unmuteOnUserGesture, { once: true });
        });
      }
    }
  }, [isPopupVideoOpen, broadcastVideo?.url]);

  const normalizeVideoUrl = (url) => {
    if (!url) return '/assets/project_video.mp4';
    if (
      url.includes('127.0.0.1') ||
      url.includes('localhost:8000') ||
      url.includes('broadcast_771e9e1e') ||
      url.includes('broadcast_db5be5d0')
    ) {
      return '/assets/project_video.mp4';
    }
    return url;
  };

  const handleCloseFlashScreen = () => {
    if (modalVideoRef.current) {
      try {
        modalVideoRef.current.pause();
      } catch (e) {}
    }
    setIsPopupVideoOpen(false);
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
    }
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    if (url.includes('drive.google.com/file/d/')) {
      const id = url.split('/d/')[1]?.split('/')[0];
      return `https://drive.google.com/file/d/${id}/preview`;
    }
    if (url.includes('vimeo.com/')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  };

  // Sync Broadcast video across all platforms (Mobile, Desktop, PWA)
  useEffect(() => {
    const checkBroadcast = async () => {
      // 1. Try relative backend database (Vite dev proxy or Vercel production)
      try {
        const res = await fetch('/api/broadcast-video');
        if (res.ok) {
          const data = await res.json();
          if (data && data.enabled && data.url) {
            setBroadcastVideo({
              ...data,
              url: normalizeVideoUrl(data.url)
            });
            return;
          }
        }
      } catch (err) {}

      // 2. Try Supabase system_broadcasts table
      try {
        const { data } = await supabase.from('system_broadcasts').select('*').eq('key', 'video_announcement').maybeSingle();
        if (data && data.enabled && data.url) {
          setBroadcastVideo({
            title: data.title,
            sanskrit: data.sanskrit,
            duration: data.duration,
            url: normalizeVideoUrl(data.url),
            desc: data.description,
            enabled: true
          });
          return;
        }
      } catch (err) {}

      // 3. Fallback to localStorage
      try {
        const saved = localStorage.getItem('zeniva_broadcast_video');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.enabled && parsed.url) {
            setBroadcastVideo({
              ...parsed,
              url: normalizeVideoUrl(parsed.url)
            });
            return;
          }
        }
      } catch (e) {}

      // 4. Default Verified Broadcast Video (guarantees mobile phone displays active player immediately)
      setBroadcastVideo({
        title: 'Zeniva AI Video Project: Classical Introduction',
        sanskrit: '॥ आयुर्वेद एवं आधुनिक विज्ञान परिचय ॥',
        duration: '0:10 sec · High Definition',
        url: '/assets/project_video.mp4',
        desc: 'Zeniva AI Classical Ayurvedic Introduction & Clinical Platform Overview.',
        enabled: true
      });
    };

    const handleBroadcastStorage = (e) => {
      if (e && e.key && e.key !== 'zeniva_broadcast_video' && e.key !== 'zeniva_broadcast_updated') {
        return;
      }
      checkBroadcast();
    };

    let channel;
    try {
      channel = new BroadcastChannel('zeniva_broadcast');
      channel.onmessage = (e) => {
        if (e.data && e.data.enabled && e.data.url) {
          setBroadcastVideo(e.data);
        }
      };
    } catch (e) {}

    const timer = setTimeout(checkBroadcast, 200);
    window.addEventListener('zeniva_broadcast_updated', checkBroadcast);
    window.addEventListener('storage', handleBroadcastStorage);

    return () => {
      clearTimeout(timer);
      if (channel) channel.close();
      window.removeEventListener('zeniva_broadcast_updated', checkBroadcast);
      window.removeEventListener('storage', handleBroadcastStorage);
    };
  }, []);

  // Direct Reliable Audio Playback Engine (Only triggers once Splash is gone)
  useEffect(() => {
    if (isPopupVideoOpen && modalVideoRef.current && broadcastVideo && isSplashFinished) {
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.muted = false; // Direct Unmuted Sound
      const playPromise = modalVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser requires user interaction for unmuted media:
          const playWithSound = () => {
            if (modalVideoRef.current) {
              modalVideoRef.current.muted = false;
              modalVideoRef.current.play().catch(() => {});
            }
            window.removeEventListener('click', playWithSound);
            window.removeEventListener('keydown', playWithSound);
          };
          window.addEventListener('click', playWithSound, { once: true });
          window.addEventListener('keydown', playWithSound, { once: true });

          if (modalVideoRef.current) {
            modalVideoRef.current.play().catch(() => {});
          }
        });
      }
    }
  }, [isPopupVideoOpen, broadcastVideo, isSplashFinished]);

  useEffect(() => {
    if (videoRef.current && isVideoPlaying && isSplashFinished) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentVideoIndex, isVideoPlaying, isSplashFinished]);

  const handleNextVideo = () => {
    setCurrentVideoIndex(prev => (prev + 1) % ambientVideos.length);
  };

  // Interactive / Editable State
  const [stressScore, setStressScore] = useState(25);
  const [vitalityScore, setVitalityScore] = useState(85);
  const [sleepQuality, setSleepQuality] = useState(90);
  const [wellnessScore, setWellnessScore] = useState(78);
  const [panchakarmaTip, setPanchakarmaTip] = useState('Start your day with warm water and lemon to stimulate Agni.');
  const [isEditingTip, setIsEditingTip] = useState(false);
  const [tempTip, setTempTip] = useState(panchakarmaTip);

  // Interactive Dinacharya Routine Tasks
  const [routineTasks, setRoutineTasks] = useState([
    { id: 1, name: 'Brahma Muhurta Wakeup (6:00 AM)', done: true },
    { id: 2, name: 'Warm Lemon & Cumin Agni Water', done: true },
    { id: 3, name: 'Sesame Oil Abhyanga (Self Massage)', done: true },
    { id: 4, name: 'Midday Pranayama (Anulom Vilom)', done: false },
    { id: 5, name: 'Triphala Night Detox Routine', done: false }
  ]);

  const completedRoutineCount = routineTasks.filter(t => t.done).length;

  const toggleTask = (id) => {
    setRoutineTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleSaveTip = () => {
    setPanchakarmaTip(tempTip);
    setIsEditingTip(false);
  };

  const activeVideo = ambientVideos[currentVideoIndex];

  return (
    <div className="p-6 sm:p-8 max-w-[1500px] mx-auto space-y-6 bg-[#FAF7F2] min-h-screen select-none">
      
      {/* Top Grid: Hero with Tree of Life + Right 3 Sidebar Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 8.5 Columns: Hero Banner with Ambient Video + Tree of Life + 3 Stat Badges */}
        <div className="lg:col-span-8 rounded-3xl p-7 border border-[#EBE3D5] shadow-lg relative flex flex-col justify-between overflow-hidden group min-h-[380px] bg-stone-900">
          
          {/* ========================================================================= */}
          {/* LIVE CINEMATIC AYURVEDIC VIDEO BACKGROUND ENGINE                          */}
          {/* ========================================================================= */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {isVideoPlaying && (
              <video
                ref={videoRef}
                key={activeVideo.id}
                autoPlay
                muted
                playsInline
                onEnded={() => setCurrentVideoIndex(prev => (prev + 1) % ambientVideos.length)}
                className="w-full h-full object-cover scale-105 transition-all duration-1000 opacity-85"
              >
                <source src={activeVideo.url} type="video/mp4" />
              </video>
            )}

            {/* Subtle Frosted Glassmorphism Overlay (Preserves Rich Video Motion & Text Contrast) */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/70 via-stone-900/40 to-emerald-950/30 backdrop-blur-[0.5px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
          </div>

          {/* Top Floating Vedic Ambience Controller Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isVideoPlaying ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isVideoPlaying ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              </span>
              <span className="text-[11px] font-bold text-white tracking-wide flex items-center gap-1.5 drop-shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Live Vedic Ambience:</span>
                <span className="text-amber-200 font-serif font-bold transition-all">{activeVideo.name}</span>
                <span className="text-[10px] text-emerald-300 font-serif">({activeVideo.sanskrit})</span>
              </span>
            </div>

            {/* Subtle Minimalist Scene Indicator Dots */}
            <div className="flex items-center gap-1.5">
              {ambientVideos.map((v, idx) => (
                <button
                  key={v.id}
                  onClick={() => setCurrentVideoIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    currentVideoIndex === idx
                      ? 'w-5 bg-amber-300 shadow-sm'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`${v.name} (${v.sanskrit})`}
                />
              ))}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Hero Left Text */}
            <div className="md:col-span-5 space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-200 border border-emerald-400/40 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md">
                  <Leaf className="w-3 h-3 text-emerald-300" />
                  <span>Classical Ayurvedic AI Intelligence</span>
                </div>
                <h1 className="text-2xl sm:text-[32px] font-serif font-bold text-white leading-[1.15] drop-shadow-md">
                  Relieve Stress & Restore Balance,<br />
                  <span className="font-serif font-normal text-stone-200">Elevate Your </span>
                  <span className="italic font-serif font-normal text-emerald-300">Life</span>
                </h1>
                <p className="text-xs text-stone-200/90 leading-relaxed pr-1 font-medium drop-shadow-sm">
                  Zeniva blends ancient Charaka & Sushruta wisdom with modern AI to guide you to a healthier, balanced life.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => onSelectTab('dosha')}
                  className="px-5 py-2.5 rounded-full bg-[#1E5039] hover:bg-[#163E2C] text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg hover:shadow-xl transition-all group cursor-pointer shrink-0 border border-emerald-400/30"
                >
                  <span>Start Your Analysis</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={onOpenQuickScan}
                  className="px-4 py-2.5 rounded-full bg-[#5B3E8C] hover:bg-[#4A2F75] text-white text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-lg hover:shadow-xl transition-all group cursor-pointer shrink-0 border border-purple-400/40"
                  title="Ayurvedic AI Skin Diagnostic Scanner (त्वक् परीक्षा)"
                >
                  <Scan className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-90 transition-transform" />
                  <span>AI Skin Scan</span>
                </button>

                <div 
                  onClick={() => onSelectTab('profile')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/20 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md transition-all cursor-pointer group"
                  title="Click to edit your location in profile"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate max-w-[160px] text-stone-100">{currentUser.location || userLocationText}</span>
                  <span className="text-[10px] text-amber-300 font-bold">Edit</span>
                </div>
              </div>
            </div>

            {/* Central Tree of Life with 3 Orbiting Interactive Clinical Nodes */}
            <div className="md:col-span-7 flex items-center justify-center relative py-4">
              <div className="relative w-72 sm:w-80 aspect-square flex items-center justify-center">
                
                {/* Orbital connecting circle */}
                <div className="absolute inset-4 rounded-full border border-dashed border-[#D6CBB8]/80 pointer-events-none"></div>

                {/* Orbiting colored connection dots */}
                <div className="absolute top-1/2 left-4 w-2 h-2 rounded-full bg-purple-500 -translate-x-1/2"></div>
                <div className="absolute top-1/4 right-8 w-2 h-2 rounded-full bg-sky-500"></div>
                <div className="absolute bottom-1/4 right-8 w-2 h-2 rounded-full bg-amber-500"></div>

                {/* Center Sacred Vedic Meditating Yogi with Glowing Heart & Aura */}
                <div 
                  onClick={() => onSelectTab('dosha')}
                  className="relative z-10 w-44 h-44 sm:w-48 sm:h-48 rounded-full overflow-hidden border-2 border-amber-300/60 shadow-[0_0_25px_rgba(234,179,8,0.35)] flex items-center justify-center group cursor-pointer transition-transform duration-500 hover:scale-105 bg-[#140A24]"
                  title="Click to explore Holistic Health & Stress Balance (आरोग्य परीक्षा)"
                >
                  <img 
                    src="/assets/vedic_meditating_yogi.png" 
                    alt="Vedic Meditating Yogi"
                    className="w-full h-full object-cover filter contrast-110 brightness-105 group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle ethereal glow overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-950/40 via-transparent to-amber-400/10 pointer-events-none"></div>
                </div>

                {/* Top Node: STRESS & MIND */}
                <button
                  onClick={() => onSelectTab('dosha')}
                  className="absolute -top-1 left-1/2 -translate-x-1/2 flex flex-col items-center group transition-all duration-300 hover:scale-105 cursor-pointer"
                  title="Click to view Stress, Sleep & Mental Balance"
                >
                  <div className="w-16 h-16 rounded-full bg-[#FAF5FF] border-2 border-purple-600 flex flex-col items-center justify-center shadow-md group-hover:shadow-lg">
                    <span className="text-xl leading-none">🌙</span>
                    <span className="text-[10px] font-bold text-purple-700 tracking-wider mt-0.5">STRESS</span>
                  </div>
                </button>

                {/* Bottom Left Node: JOINTS */}
                <button
                  onClick={() => onSelectTab('dosha')}
                  className="absolute bottom-2 left-2 flex flex-col items-center group transition-all duration-300 hover:scale-105 cursor-pointer"
                  title="Click to view Joint Mobility & Muscle Care"
                >
                  <div className="w-16 h-16 rounded-full bg-[#F0F9FF] border-2 border-sky-600 flex flex-col items-center justify-center shadow-md group-hover:shadow-lg">
                    <span className="text-xl leading-none">⚡</span>
                    <span className="text-[10px] font-bold text-sky-700 tracking-wider mt-0.5">JOINTS</span>
                  </div>
                </button>

                {/* Bottom Right Node: DIGESTION */}
                <button
                  onClick={() => onSelectTab('dosha')}
                  className="absolute bottom-2 right-2 flex flex-col items-center group transition-all duration-300 hover:scale-105 cursor-pointer"
                  title="Click to view Digestion & Gut Health"
                >
                  <div className="w-16 h-16 rounded-full bg-[#FFFBEB] border-2 border-amber-600 flex flex-col items-center justify-center shadow-md group-hover:shadow-lg">
                    <span className="text-xl leading-none">🔥</span>
                    <span className="text-[10px] font-bold text-amber-700 tracking-wider mt-0.5">GUT</span>
                  </div>
                </button>

              </div>
            </div>
          </div>

          {/* 3 Bottom Stat Cards (High Contrast Frosted Glass) */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-white/20 mt-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 hover:bg-white border border-white/80 shadow-md backdrop-blur-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold font-serif text-stone-900 leading-none">92%</p>
                <p className="text-[11px] text-stone-600 font-semibold mt-1">AI Accuracy</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 hover:bg-white border border-white/80 shadow-md backdrop-blur-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold font-serif text-stone-900 leading-none">1200+</p>
                <p className="text-[11px] text-stone-600 font-semibold mt-1">Herbal Insights</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 hover:bg-white border border-white/80 shadow-md backdrop-blur-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold font-serif text-stone-900 leading-none">500+</p>
                <p className="text-[11px] text-stone-600 font-semibold mt-1">Happy Users</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right 3.5 Columns: Side Cards (Panchakarma, Reminder, Seasonal Guide) */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          
          {/* 1. Daily Panchakarma Tip Card */}
          <div className="bg-[#FAF4EB] rounded-3xl p-5 border border-[#EBE3D5] shadow-xs relative group">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-serif font-bold text-[#292524]">
                Daily Panchakarma Tip
              </h3>
              <button 
                onClick={() => { setIsEditingTip(!isEditingTip); setTempTip(panchakarmaTip); }}
                className="text-stone-400 hover:text-purple-700 p-1 cursor-pointer"
                title="Edit Daily Tip"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {isEditingTip ? (
              <div className="space-y-2">
                <textarea
                  value={tempTip}
                  onChange={(e) => setTempTip(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-amber-300 bg-white font-medium focus:outline-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTip}
                    className="px-3 py-1 rounded-lg bg-amber-800 text-white text-[10px] font-bold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingTip(false)}
                    className="px-3 py-1 rounded-lg bg-stone-200 text-stone-700 text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-[#E5DAC6]">
                  <img 
                    src="/assets/panchakarma.jpg" 
                    alt="Panchakarma mortar and oil" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed">
                  {panchakarmaTip}
                </p>
              </div>
            )}
          </div>

          {/* 2. Upcoming Reminder Card */}
          <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#78716C]">
                <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Upcoming Reminder</span>
              </div>
              <p className="text-xs text-[#44403C]">Consultation with</p>
              <p className="text-xs font-bold text-[#1C1917]">Dr. Meera Joshi</p>
              <p className="text-[11px] text-[#78716C]">Tomorrow, 11:00 AM</p>
            </div>

            <button
              onClick={() => onSelectTab('consultation')}
              className="w-8 h-8 rounded-full bg-[#F5EBE1] hover:bg-[#EBDDCF] text-[#78350F] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
              title="View Consultation"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. Seasonal Guide Card (Varsha Ritu Monsoon) */}
          <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-[#EBE3D5] shadow-xs relative overflow-hidden flex items-center justify-between">
            <div className="space-y-1.5 z-10 max-w-[180px]">
              <span className="text-[11px] font-bold text-[#44403C] block">Seasonal Guide</span>
              <h4 className="text-sm font-serif font-bold text-[#1C1917]">
                Varsha Ritu <br />
                <span className="text-xs font-sans font-normal text-[#57534E]">(Monsoon)</span>
              </h4>
              <p className="text-[11px] text-[#78716C] leading-snug">
                Best time to focus on digestion and immunity.
              </p>
              <button
                onClick={() => onSelectTab('planner')}
                className="text-[11px] font-bold text-[#1C1917] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>View Guide</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-[#E5DAC6]">
              <img 
                src="/assets/varsha_ritu.jpg" 
                alt="Varsha Ritu monsoon" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>

      </div>

      {/* Dedicated Ayurvedic Cough Care & Medicine Protocol Reminder */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A] border-2 border-amber-300 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-700 text-white tracking-wide uppercase shadow-2xs">
                  Active Clinical Care
                </span>
                <span className="text-[11px] font-bold text-amber-900">
                  कास व प्रतिश्याय (Cough & Respiratory Protocol)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 pt-0.5">
                खोकला व घसा निगा — औषध व दिनचर्या स्मरणिका (Medicine Reminder)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenAIChat('मला खोकल्यासाठी आयुर्वेदिक औषध हवे आहे')}
            className="px-4 py-2 rounded-2xl bg-[#5B3E8C] hover:bg-[#4A2F75] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Ask Zeniva AI for Cough</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3 Medicine Slots for the Day with Interactive Checkboxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Slot 1: Morning */}
          <div 
            onClick={() => toggleCoughDose('morning')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2 shadow-2xs ${
              coughSchedule.morning 
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                : 'bg-white/80 border-amber-200 hover:border-amber-400 text-stone-900'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>सकाळी (Morning Dose)</span>
              </div>
              <p className="text-xs font-bold text-stone-900">सितोपलादी चूर्ण + १ चमचा मध</p>
              <p className="text-[11px] text-stone-600 leading-snug">
                १/२ चमचा चूर्ण चाटून घ्यावे (कफ विरघळवून श्वसनमार्ग मोकळा होतो).
              </p>
            </div>
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
              coughSchedule.morning 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'border-stone-300 bg-stone-50'
            }`}>
              {coughSchedule.morning && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Slot 2: Afternoon */}
          <div 
            onClick={() => toggleCoughDose('afternoon')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2 shadow-2xs ${
              coughSchedule.afternoon 
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                : 'bg-white/80 border-amber-200 hover:border-amber-400 text-stone-900'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>दुपारी (Afternoon Dose)</span>
              </div>
              <p className="text-xs font-bold text-stone-900">तुळशी-आले काढा किंवा कंठसुधारक वटी</p>
              <p className="text-[11px] text-stone-600 leading-snug">
                घशातील खवखव व कोरडी उबळ थांबवण्यासाठी अत्यंत गुणकारी.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
              coughSchedule.afternoon 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'border-stone-300 bg-stone-50'
            }`}>
              {coughSchedule.afternoon && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* Slot 3: Night */}
          <div 
            onClick={() => toggleCoughDose('night')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-2 shadow-2xs ${
              coughSchedule.night 
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                : 'bg-white/80 border-amber-200 hover:border-amber-400 text-stone-900'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>रात्री (Night Dose)</span>
              </div>
              <p className="text-xs font-bold text-stone-900">हळदीचे कोमट दूध + निलगिरी वाफ</p>
              <p className="text-[11px] text-stone-600 leading-snug">
                रात्री झोपताना खोकल्याची उबळ न येण्यासाठी आणि शांत झोपेसाठी.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border ${
              coughSchedule.night 
                ? 'bg-emerald-600 border-emerald-600 text-white' 
                : 'border-stone-300 bg-stone-50'
            }`}>
              {coughSchedule.night && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        {/* Quick Precautions Strip */}
        <div className="p-3 rounded-2xl bg-amber-900/10 border border-amber-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0"></span>
            <span className="font-semibold">
              <strong>पथ्य (Care):</strong> थंड पाणी, फ्रीजमधील अन्न, दही, केळी व तेलकट पदार्थ टाळा. दिवसभर कोमट पाणी प्या.
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-md shrink-0">
            {Object.values(coughSchedule).filter(Boolean).length - 1}/3 Doses Taken Today ✓
          </span>
        </div>
      </div>

      {/* Middle Section: "Your Health Dashboard" 4 Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#5B3E8C]" />
            <h2 className="text-xs font-bold tracking-wider text-[#44403C] uppercase">Your Health Dashboard</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Constitutional Care & Daily Herbal Protocols */}
          <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#1C1917]">Constitutional Health Care</h3>
                  <p className="text-[10px] text-[#A8A29E]">Daily Ayurvedic Protocol</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Active SOP
                </span>
              </div>

              {/* Verified Daily Clinical Formulations Strip */}
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100 text-[11px]">
                  <span className="font-semibold text-purple-950 flex items-center gap-1.5">
                    <span>🌙</span> Stress & Sleep:
                  </span>
                  <span className="font-bold text-purple-800">Ashwagandha</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-[11px]">
                  <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                    <span>🔥</span> Agni & Acidity:
                  </span>
                  <span className="font-bold text-amber-800">Avipattikar Churna</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px]">
                  <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                    <span>🍃</span> Immunity & Ojas:
                  </span>
                  <span className="font-bold text-emerald-800">Giloy + Tulsi</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('dosha')}
              className="pt-3 text-[11px] font-bold text-[#5B3E8C] hover:text-[#3B255E] flex items-center justify-between border-t border-[#F5EFEB] mt-2 cursor-pointer w-full"
            >
              <span>View Full Daily Protocols</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Wellness Score */}
          <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div>
                <h3 className="text-xs font-bold text-[#1C1917]">Wellness Score</h3>
                <p className="text-[10px] text-[#A8A29E]">This Week</p>
              </div>

              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-3xl font-serif font-bold text-[#1C1917]">{wellnessScore}</span>
                <span className="text-xs font-semibold text-[#A8A29E]">/100</span>
              </div>

              {/* Purple Ascending Trend Curve */}
              <div className="h-10 w-full">
                <svg className="w-full h-full" viewBox="0 0 120 40" preserveAspectRatio="none">
                  <path
                    d="M 5,30 Q 30,30 50,22 T 90,14 T 115,8"
                    fill="none"
                    stroke="#7C3AED"
                    strokeWidth="2"
                  />
                  <circle cx="115" cy="8" r="3" fill="#7C3AED" />
                </svg>
              </div>

              <div>
                <p className="text-[11px] font-bold text-[#27AE60]">Good</p>
                <p className="text-[10px] text-[#78716C] leading-snug">
                  Keep going! Small steps lead to big changes.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('reports')}
              className="pt-3 text-[11px] font-bold text-[#5B3E8C] hover:text-[#3B255E] flex items-center gap-1 border-t border-[#F5EFEB] mt-2 cursor-pointer"
            >
              <span>View Insights</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 3: Daily Routine */}
          <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#1C1917]">Daily Routine</h3>
                  <p className="text-[10px] text-[#A8A29E]">Consistency</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 pt-1">
                <span className="text-3xl font-serif font-bold text-[#1C1917]">3</span>
                <span className="text-xs font-semibold text-[#A8A29E]">/5</span>
              </div>

              {/* 5 Distinct Progress Bars */}
              <div className="flex items-center gap-1.5 py-1">
                <div className="h-1.5 flex-1 rounded-full bg-[#4A90E2]"></div>
                <div className="h-1.5 flex-1 rounded-full bg-[#27AE60]"></div>
                <div className="h-1.5 flex-1 rounded-full bg-[#1E5039]"></div>
                <div className="h-1.5 flex-1 rounded-full bg-[#E5E7EB]"></div>
                <div className="h-1.5 flex-1 rounded-full bg-[#E5E7EB]"></div>
              </div>

              <p className="text-[10px] text-[#78716C] leading-snug pt-1">
                Maintain a consistent dinacharya for best results.
              </p>
            </div>

            <button
              onClick={() => onSelectTab('planner')}
              className="pt-2 text-[11px] font-bold text-[#5B3E8C] hover:text-[#3B255E] flex items-center gap-1 border-t border-[#F5EFEB] mt-1 cursor-pointer"
            >
              <span>View Planner</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 4: Top Recommendation (Triphala) */}
          <div className="bg-white rounded-3xl p-5 border border-[#EBE3D5] shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div>
                <h3 className="text-xs font-bold text-[#1C1917]">Top Recommendation</h3>
                <p className="text-[10px] text-[#A8A29E]">For You</p>
              </div>

              <div className="flex items-center justify-center py-1">
                <div className="w-20 h-20 rounded-full overflow-hidden shadow-xs border border-[#EBE3D5]">
                  <img 
                    src="/assets/triphala.jpg" 
                    alt="Triphala herbal formulation" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <p className="text-[11px] font-bold text-[#1C1917] text-center leading-snug">
                Triphala for digestion and detox.
              </p>
            </div>

            <button
              onClick={() => onSelectTab('herbs')}
              className="pt-3 text-[11px] font-bold text-[#5B3E8C] hover:text-[#3B255E] flex items-center gap-1 border-t border-[#F5EFEB] mt-2 cursor-pointer"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* PATIENT NEARBY AYURVEDIC CLINICS & CHAMBERS REAL LIVE MAP                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE3D5] shadow-xs space-y-6 animate-in fade-in">
        
        {/* Section Header with City Filter & Detect Location */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#5B3E8C] uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <span>Verified Ayurvedic Care Network</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 mt-1">
              Find Verified Ayurvedic Clinics & Vaidya Chambers Near You
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Locate authentic Panchakarma centers, certified BAMS/MD Vaidyas, and book physical OPD or video visits.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDetectLiveLocation}
              disabled={isLocating}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-2 cursor-pointer border border-stone-300 transition-all shadow-xs"
              title="Detect Current Live GPS Location"
            >
              <Compass className={`w-4 h-4 text-purple-700 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating GPS...' : 'Detect Near Me'}</span>
            </button>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${selectedClinic.name}, ${selectedClinic.street}, ${selectedClinic.city}, ${selectedClinic.state}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#1E5039] hover:bg-[#163E2C] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all group"
              title="Open Selected Clinic in Google Maps Navigation"
            >
              <Navigation className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Open in Google Maps</span>
            </a>
          </div>
        </div>

        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1">Select Region / City:</span>
          {['All', 'Nagpur', 'Pune', 'Mumbai'].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setSelectedCityFilter(city);
                if (city !== 'All') {
                  const target = defaultClinics.find(c => c.city === city);
                  if (target) setSelectedClinic(target);
                }
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCityFilter === city
                  ? 'bg-[#5B3E8C] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>

        {/* 2-Column Responsive Layout: Clinic Cards List & Live Real Map */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Clinic Chambers Cards (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {defaultClinics
              .filter(c => selectedCityFilter === 'All' || c.city === selectedCityFilter)
              .map((clinic) => {
                const isSelected = selectedClinic.id === clinic.id;
                return (
                  <div
                    key={clinic.id}
                    onClick={() => setSelectedClinic(clinic)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-purple-50/50 border-[#5B3E8C] ring-2 ring-[#5B3E8C]/15 shadow-md'
                        : 'bg-[#FAF8F5] border-stone-200 hover:bg-white hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-stone-900 text-xs leading-snug">{clinic.name}</h4>
                        <p className="text-[11px] text-purple-900 font-semibold">{clinic.doctor} · <span className="text-stone-500 font-normal">{clinic.qualification}</span></p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                        {clinic.city}
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 leading-snug">
                      <MapPin className="w-3.5 h-3.5 inline text-emerald-700 mr-1" />
                      {clinic.street}, {clinic.landmark}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1 text-stone-500 border-t border-stone-200/60">
                      <span>{clinic.rating}</span>
                      <span className="font-bold text-stone-800">{clinic.fee} / visit</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTab('consultation');
                        }}
                        className="flex-1 py-2 rounded-xl bg-[#5B3E8C] hover:bg-[#4A2F75] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Book Appointment</span>
                      </button>

                      <a
                        href={`tel:${clinic.phone.replace(/\s+/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 cursor-pointer border border-stone-300 transition-all"
                        title="Call Clinic Helpline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Right Column: Live Real Map Embed with Pinpoint (7 Cols) */}
          <div className="lg:col-span-7 space-y-3 flex flex-col">
            <div className="rounded-3xl border border-stone-200 overflow-hidden shadow-md bg-stone-100 relative flex-1 min-h-[380px] sm:min-h-[440px]">
              <iframe
                title="Patient Nearby Clinics Real Map"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  `${selectedClinic.name}, ${selectedClinic.street}, ${selectedClinic.city}, ${selectedClinic.state}, ${selectedClinic.pincode}`
                )}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-full border-0 absolute inset-0"
                loading="lazy"
                allowFullScreen
              />

              {/* Floating Real-Time Clinic Information Badge */}
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200 shadow-md max-w-xs text-xs space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <p className="font-bold text-stone-900 leading-tight">{selectedClinic.name}</p>
                </div>
                <p className="text-[10px] text-stone-600">{selectedClinic.street}, {selectedClinic.city}</p>
                <p className="text-[10px] text-emerald-800 font-semibold font-mono">OPD: {selectedClinic.timings}</p>
              </div>

              {/* Fullscreen Direction Anchor */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${selectedClinic.name}, ${selectedClinic.street}, ${selectedClinic.city}, ${selectedClinic.state}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-stone-800 text-[11px] font-bold shadow-md hover:bg-white flex items-center gap-1.5 border border-stone-200 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-700" />
                <span>Navigate on Google Maps</span>
              </a>
            </div>

            {/* Selected Clinic Facilities Strip */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-stone-800">Available Treatments:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedClinic.facilities.map((fac, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200/60 text-[10px] font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {fac}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Row: Sage Green 5 Actions Panel & Lavender Charaka Quote */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 8.5 Columns: Sage Green Actions Card */}
        <div className="lg:col-span-8 bg-[#EDF0E6] rounded-3xl p-6 border border-[#DFE3D5] shadow-xs flex flex-col justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
            
            {/* 1. Symptom Checker */}
            <button
              onClick={() => onSelectTab('symptoms')}
              className="flex flex-col items-center p-2 rounded-2xl hover:bg-white/60 transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#E2E7D5] text-[#2E7D32] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h4 className="text-[11px] font-bold text-[#1C1917]">Symptom Checker</h4>
              <p className="text-[9px] text-[#57534E] mt-1 leading-snug">
                Tell us how you feel and get AI-powered Ayurvedic insights.
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#44403C] flex items-center gap-0.5 group-hover:text-[#1E5039]">
                Check Symptoms →
              </span>
            </button>

            {/* 2. Doctor Consultation */}
            <button
              onClick={() => onSelectTab('consultation')}
              className="flex flex-col items-center p-2 rounded-2xl hover:bg-white/60 transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#E2E7D5] text-[#2E7D32] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h4 className="text-[11px] font-bold text-[#1C1917]">Doctor Consultation</h4>
              <p className="text-[9px] text-[#57534E] mt-1 leading-snug">
                Connect with verified Ayurvedic doctors anytime.
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#44403C] flex items-center gap-0.5 group-hover:text-[#1E5039]">
                Book Consultation →
              </span>
            </button>

            {/* 3. Herbal Recommendations */}
            <button
              onClick={() => onSelectTab('herbs')}
              className="flex flex-col items-center p-2 rounded-2xl hover:bg-white/60 transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#E2E7D5] text-[#2E7D32] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Leaf className="w-5 h-5" />
              </div>
              <h4 className="text-[11px] font-bold text-[#1C1917]">Herbal Recommendations</h4>
              <p className="text-[9px] text-[#57534E] mt-1 leading-snug">
                Get personalized herbal suggestions based on your health assessment.
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#44403C] flex items-center gap-0.5 group-hover:text-[#1E5039]">
                See Recommendations →
              </span>
            </button>

            {/* 4. Lifestyle Planner */}
            <button
              onClick={() => onSelectTab('planner')}
              className="flex flex-col items-center p-2 rounded-2xl hover:bg-white/60 transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#E2E7D5] text-[#2E7D32] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="text-[11px] font-bold text-[#1C1917]">Lifestyle Planner</h4>
              <p className="text-[9px] text-[#57534E] mt-1 leading-snug">
                Personalize your diet, exercise, and daily routine.
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#44403C] flex items-center gap-0.5 group-hover:text-[#1E5039]">
                Open Planner →
              </span>
            </button>

            {/* 5. Knowledge Library */}
            <button
              onClick={() => onSelectTab('library')}
              className="flex flex-col items-center p-2 rounded-2xl hover:bg-white/60 transition-all group cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#E2E7D5] text-[#2E7D32] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="text-[11px] font-bold text-[#1C1917]">Knowledge Library</h4>
              <p className="text-[9px] text-[#57534E] mt-1 leading-snug">
                Explore Ayurveda articles, therapies & ancient texts.
              </p>
              <span className="mt-2 text-[9px] font-bold text-[#44403C] flex items-center gap-0.5 group-hover:text-[#1E5039]">
                Browse Library →
              </span>
            </button>

          </div>
        </div>

        {/* Right 3.5 Columns: Lavender Charaka Samhita Quote Card with Lotus */}
        <div className="lg:col-span-4 bg-[#E8DFEE] rounded-3xl p-6 border border-[#D9CDE3] shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-2.5 z-10 max-w-[220px]">
            <span className="text-4xl text-[#7E57C2] font-serif leading-none block">“</span>
            <p className="text-xs text-[#311B92] font-serif leading-relaxed">
              When diet is wrong, medicine is of no use.
            </p>
            <p className="text-xs text-[#311B92] font-serif leading-relaxed">
              When diet is correct, medicine is of no need.
            </p>
            <p className="text-[10px] font-serif italic text-[#5E35B1] pt-1">
              — Charaka Samhita
            </p>
          </div>

          <div className="absolute right-0 bottom-0 w-36 h-36 pointer-events-none opacity-90">
            <img 
              src="/assets/lotus.jpg" 
              alt="Sacred lotus blossom" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* FLASH SCREEN INTRO VIDEO MODAL (MOBILE & DESKTOP SPLASH PRESENTATION)      */}
      {/* ========================================================================= */}
      {isPopupVideoOpen && broadcastVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-stone-950 rounded-3xl max-w-2xl w-full border border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[96vh] text-white">
            
            {/* Modal Top Header with Vedic Badges */}
            <div className="px-4 py-3 sm:px-6 sm:py-3.5 bg-stone-900/95 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-900/70 border border-purple-500/50 text-amber-300 flex items-center justify-center shadow-md">
                  <Video className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-red-600 text-white tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> Live Broadcast
                    </span>
                    <span className="text-[11px] text-amber-300 font-serif font-semibold">
                      {broadcastVideo.sanskrit || '॥ आयुर्वेद एवं आधुनिक विज्ञान परिचय ॥'}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold font-serif text-stone-100 mt-0.5 leading-tight">
                    {broadcastVideo.title || 'Zeniva AI Video Project: Classical Introduction'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseFlashScreen}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer transition-all shrink-0"
                title="प्रवेश करा / Skip to Dashboard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Box with Direct Autoplay, PlaysInline & Sound Controls for Mobile */}
            <div className="relative bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
              {getEmbedUrl(broadcastVideo.url) ? (
                <iframe
                  src={getEmbedUrl(broadcastVideo.url)}
                  title={broadcastVideo.title || 'Zeniva AI Video'}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : !videoError ? (
                <video
                  ref={modalVideoRef}
                  key={normalizeVideoUrl(broadcastVideo.url)}
                  controls
                  autoPlay
                  playsInline
                  webkit-playsinline="true"
                  preload="auto"
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-contain"
                >
                  <source src={normalizeVideoUrl(broadcastVideo.url)} type="video/mp4" />
                  <source src={normalizeVideoUrl(broadcastVideo.url)} type="video/webm" />
                  Your browser does not support HTML5 video.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-900/60 border border-purple-500/40 text-purple-300 flex items-center justify-center">
                    <Video className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-200">Video source is loading</p>
                    <p className="text-[10px] text-stone-400">Click below to play the verified classical introduction stream.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoError(false);
                      setBroadcastVideo(prev => ({ ...prev, url: '/assets/project_video.mp4' }));
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Intro Stream</span>
                  </button>
                </div>
              )}
            </div>

            {/* Flash Screen Bottom Action Bar */}
            <div className="p-3.5 sm:p-5 bg-stone-900/95 space-y-3">
              
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-300">
                <p className="text-xs text-stone-300 leading-relaxed font-sans max-w-md">
                  {broadcastVideo.desc || 'Zeniva AI Classical Ayurvedic Introduction & Clinical Platform Overview.'}
                </p>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {broadcastVideo.duration || '0:10 sec · High Definition'}
                </span>
              </div>

              {/* Action Buttons: Primary Enter Dashboard CTA */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleCloseFlashScreen}
                  className="text-xs text-stone-400 hover:text-amber-300 transition-colors font-medium cursor-pointer"
                >
                  Skip Intro
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseFlashScreen();
                      onSelectTab('dosha');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold cursor-pointer transition-all hidden sm:flex items-center gap-1"
                  >
                    <span>Start Analysis</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseFlashScreen}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-[1.02] border border-emerald-400/40"
                  >
                    <span>प्रवेश करा / Enter Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
