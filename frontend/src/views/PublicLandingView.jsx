import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, ShieldCheck, HeartPulse, Stethoscope, 
  Leaf, Activity, BookOpen, Star, Calendar, Users, Award,
  CheckCircle2, Compass, MapPin, PhoneCall, Volume2, Clock,
  ChevronRight, Flame, Wind, Droplets, UserCheck, Shield, Zap,
  FileText, Download, Database, Building, Receipt, Package
} from 'lucide-react';
import { ZenivaLogo } from '../components/ZenivaIcons';

export const PublicLandingView = ({
  onOpenAuth = () => {},
  onOpenAIChat = () => {},
  onSelectDoctorPortal = () => {},
  onOpenTeam = () => {},
  onOpenContact = () => {},
  onSelectTab = () => {}
}) => {
  const [activeConcernTab, setActiveConcernTab] = useState('stress');

  const healthConcernDetails = {
    stress: {
      name: 'Mental Wellbeing & Stress Care (मानसिक स्वास्थ्य व तणाव निवारण)',
      elements: 'Cortisol Regulation · Neuro-Endocrine Balance',
      sub: 'Relieves Anxiety, Mental Burnout, Stress & Overthinking (चित्त व मनःशांती)',
      color: 'from-purple-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-purple-400/40',
      badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-400/30',
      barColor: 'from-purple-500 to-indigo-600',
      percentage: '38%',
      qualities: ['Brahmi (ब्राह्मी)', 'Ashwagandha (अश्वगंधा)', 'Jatamansi (जटामांसी)', 'Medhya Rasayana (मेध्य रसायन)', 'Pranayama (प्राणायाम)'],
      protocolTip: 'Favor Brahmi Ghrita, gentle warm sesame head massage (Shiroabhyanga), Nadi Shodhana breathing, and regular restful sleep before 10 PM.',
      icon: Activity
    },
    joints: {
      name: 'Joint Mobility & Orthopedic Care (सांधेदुखी व हाडांचे विकार)',
      elements: 'Musculoskeletal Strength · Cartilage Lubrication',
      sub: 'Alleviates Knee Stiffness, Arthritis, Cervical & Chronic Back Pain (अस्थि-मज्जा स्वास्थ्य)',
      color: 'from-sky-500/20 via-cyan-500/10 to-transparent',
      borderColor: 'border-sky-400/40',
      badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-400/30',
      barColor: 'from-sky-400 to-cyan-500',
      percentage: '44%',
      qualities: ['Shallaki (सलाई गुग्गुळ)', 'Nirgundi Taila', 'Rasna (रास्ना)', 'Warm Sesame Oil Massage', 'Ashwagandha'],
      protocolTip: 'Daily warm Mahanarayan or sesame oil Abhyanga over stiff joints, warm water fomentation, and gentle Sukshma Vyayama movement.',
      icon: Zap
    },
    digestion: {
      name: 'Digestive Health & Acidity (पाचन, ऍसिडिटी व गॅस)',
      elements: 'Metabolic Agni Fire · Gut Microbiome Equilibrium',
      sub: 'Treats Hyperacidity, Bloating, Constipation & Indigestion (अन्नवह स्रोतस)',
      color: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'border-amber-400/40',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-400/30',
      barColor: 'from-amber-400 to-orange-500',
      percentage: '32%',
      qualities: ['Triphala (त्रिफळा)', 'Amla (आवळ)', 'Jeera-Dhaniya Water', 'Shankh Bhasma', 'Deepana-Pachana Herbs'],
      protocolTip: 'Drink warm cumin-coriander water post meals, avoid deep-fried spicy foods after sundown, and maintain a 3-hour gap before bedtime.',
      icon: Flame
    },
    immunity: {
      name: 'Immunity & Seasonal Vitality (रोगप्रतिकारक शक्ती व ओजस)',
      elements: 'Cellular Immunity · Vital Ojas Restoration',
      sub: 'Shields Against Chronic Fatigue, Frequent Colds, Low Energy & Allergies',
      color: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'border-emerald-400/40',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-400/30',
      barColor: 'from-emerald-400 to-teal-500',
      percentage: '24%',
      qualities: ['Guduchi / Giloy (गुळवेल)', 'Chyawanprash', 'Tulsi (तुळस)', 'Golden Turmeric Milk', 'Shatavari'],
      protocolTip: 'Drink warm golden turmeric milk with black pepper at night, 1 spoonful Chyawanprash each morning, and 20 minutes of morning sunlight.',
      icon: Shield
    }
  };

  const selectedConcern = healthConcernDetails[activeConcernTab];
  const ConcernIcon = selectedConcern.icon;

  return (
    <div className="p-3 sm:p-5 space-y-6 max-w-7xl mx-auto select-none animate-in fade-in duration-500">
      
      {/* ========================================================================= */}
      {/* 1. GRAND HERO SHOWCASE SECTION                                            */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7 lg:p-8 bg-gradient-to-br from-[#1A0C2E] via-[#2A1248] to-[#0E281C] text-white border border-[#E5DAC6]/30 shadow-2xl">
        {/* Glow Spheres */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-purple-500/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Left Text & Actions */}
          <div className="max-w-2xl xl:max-w-3xl space-y-4">
            {/* Professional Clinical Intelligence Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/40 text-[11px] font-mono font-bold tracking-wide shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>Clinical Ayur-Intelligence 2.0 · Evidence-Based Care</span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-[1.15] tracking-tight">
              Authentic Ayurvedic Wisdom, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-emerald-200 to-teal-300">
                Powered by Neural AI Intelligence
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-2xl font-normal">
              Welcome to India's premier digital Ayurveda platform. Discover personalized wellness pathways, assess stress and health imbalances, consult certified BAMS/MD Vaidyas, and consult our 24/7 Charaka-trained AI Voice Doctor.
            </p>

            {/* Call-To-Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenAuth}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:scale-105 transition-all cursor-pointer border border-emerald-300"
              >
                <UserCheck className="w-4 h-4" />
                <span>Create Free Account / Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAIChat('')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer border border-cyan-400/40"
              >
                <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>Talk with Zeniva AI Voice</span>
              </button>

              <button
                onClick={onSelectDoctorPortal}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white font-semibold text-xs transition-colors cursor-pointer border border-white/20 flex items-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5 text-amber-300" />
                <span>Doctor Portal</span>
              </button>

              {/* Subtle Small Project PPT Button (Mobile Friendly & Non-intrusive) */}
              <a
                href="/zeniva_presentation.pptx"
                download="Zeniva_AI_Presentation.pptx"
                className="px-3.5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white font-medium text-xs transition-colors cursor-pointer border border-white/20 flex items-center gap-1.5 shadow-xs shrink-0 active:scale-95"
                title="Download Zeniva AI Presentation (PPTX)"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>Project PPT</span>
                <Download className="w-3 h-3 text-stone-400" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-stone-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Charaka & Sushruta Samhita RAG Indexed</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>OpenRouter 70B Clinical Engine</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Certified Ayurvedic Vaidyas</span>
              </span>
            </div>
          </div>

          {/* Right Hero Artwork: Authentic Ayurvedic Wisdom + Neural AI Brain */}
          <div className="relative shrink-0 w-64 h-64 sm:w-76 sm:h-76 lg:w-[350px] lg:h-[350px] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-purple-600/30 to-emerald-500/25 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] border border-purple-400/30 group">
              <img
                src="/assets/ayurveda_neural_hero.png"
                alt="Ayurvedic Mortar and Pestle with Neural AI Brain"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A0C2E]/60 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>

        </div>

        {/* Floating KPI Stat Strip at bottom of Hero */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-5 text-left">
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">12,850+</p>
            <p className="text-xs text-stone-300 font-medium flex items-center gap-1.5 mt-1">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Happy Patients</span>
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">150+</p>
            <p className="text-xs text-stone-300 font-medium flex items-center gap-1.5 mt-1">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Certified Vaidyas</span>
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-sky-400">0.8s</p>
            <p className="text-xs text-stone-300 font-medium flex items-center gap-1.5 mt-1">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>AI Response Time</span>
            </p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-400">100%</p>
            <p className="text-xs text-stone-300 font-medium flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Evidence-Based</span>
            </p>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. INTERACTIVE EVIDENCE-BASED CLINICAL HEALTH CATEGORIES                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 border border-[#E5DAC6] shadow-sm space-y-5 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
              <p className="text-[10px] uppercase font-bold tracking-wider text-purple-800">
                Evidence-Based Clinical Intelligence
              </p>
            </div>
            <h2 className="text-base sm:text-xl font-serif font-bold text-[#1C1917] tracking-tight mt-0.5 leading-snug">
              Explore Key Clinical Health Categories (आरोग्य समस्या व वैदिक उपाय)
            </h2>
            <p className="text-xs text-[#78716C] mt-1 leading-relaxed">
              Comprehensive holistic care protocols for stress, joint mobility, digestion, and immunity. Click below to inspect each clinical domain.
            </p>
          </div>

          {/* Health Concern Selector Tabs (Smooth horizontal scroll on mobile, wrap on desktop) */}
          <div className="w-full lg:w-auto overflow-x-auto pb-1 -mx-1 px-1">
            <div className="inline-flex items-center gap-1.5 p-1 bg-[#E5DFD4] rounded-2xl border border-[#D5CDBC] min-w-max">
              <button
                onClick={() => setActiveConcernTab('stress')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeConcernTab === 'stress' 
                    ? 'bg-white text-purple-900 shadow-xs border border-purple-300' 
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-purple-600" />
                <span>Stress & Mind (38%)</span>
              </button>
              <button
                onClick={() => setActiveConcernTab('joints')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeConcernTab === 'joints' 
                    ? 'bg-white text-sky-900 shadow-xs border border-sky-300' 
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-sky-600" />
                <span>Joint Care (44%)</span>
              </button>
              <button
                onClick={() => setActiveConcernTab('digestion')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeConcernTab === 'digestion' 
                    ? 'bg-white text-amber-900 shadow-xs border border-amber-300' 
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span>Digestion (32%)</span>
              </button>
              <button
                onClick={() => setActiveConcernTab('immunity')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeConcernTab === 'immunity' 
                    ? 'bg-white text-emerald-900 shadow-xs border border-emerald-300' 
                    : 'text-[#78716C] hover:text-[#1C1917]'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Immunity (24%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Health Concern Detailed Card */}
        <div className={`rounded-2xl p-5 sm:p-6 bg-gradient-to-r ${selectedConcern.color} border ${selectedConcern.borderColor} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${selectedConcern.badgeBg}`}>
                <ConcernIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1C1917]">{selectedConcern.name}</h3>
                <p className="text-xs font-semibold text-[#57534E]">{selectedConcern.elements} • {selectedConcern.sub}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#57534E]">Reported Patient Incidence:</span>
              <span className="text-sm font-mono font-bold text-[#1C1917] bg-white/80 px-2.5 py-1 rounded-lg border border-stone-200">
                {selectedConcern.percentage}
              </span>
            </div>
          </div>

          {/* Key Formulations & Therapeutic Herbs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#44403C]">Therapeutic Formulations & Herbs (औषधी):</span>
            {selectedConcern.qualities.map((q, idx) => (
              <span key={idx} className="text-xs bg-white/90 text-[#1C1917] px-2.5 py-1 rounded-full border border-stone-200 font-medium">
                {q}
              </span>
            ))}
          </div>

          {/* Clinical Balance Guidance */}
          <div className="p-3.5 bg-white/90 rounded-xl border border-stone-200 flex items-start gap-2.5">
            <Leaf className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#1C1917]">Evidence-Based Clinical Protocol (शमन व दिनचर्या उपाय):</p>
              <p className="text-xs text-[#57534E] leading-relaxed mt-0.5">{selectedConcern.protocolTip}</p>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between">
            <p className="text-[11px] text-[#78716C] italic font-serif">
              "प्रयोजनं चास्य स्वस्थस्य स्वास्थ्यरक्षणमातुरस्य विकारप्रशमनं च" — Health preservation and alleviation of disease (Charaka Samhita).
            </p>
            <button
              onClick={onOpenAuth}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-emerald-300 shadow-xs"
            >
              <span>Get Personalized Care Plan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2.5 ZENIVA AYURVEDIC HOSPITAL ERP & PHARMACY SHOWCASE BANNER             */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#140824] via-[#1C1030] to-[#2B1245] p-6 sm:p-8 text-white border border-[#482878]/60 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(#7c3aed20_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-mono tracking-wider uppercase font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Hospital Operating System
              </span>
              <span className="text-[11px] text-stone-300 font-mono">ERP v2.4 · AYUSH Ready</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-black text-[#F5EEDC] tracking-tight">
              Zeniva Ayurvedic Hospital ERP & Pharmacy Suite
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Complete computerized clinical operations: Classical Aushadhi Inventory with batch expiry tracking, GST Billing with instant print receipts, Panchakarma Bed Scheduler, and IPD Ward Management.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-stone-300 font-mono">
              <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-300" />
                <span>Herbals & Vatis Catalog</span>
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>GST Tax Invoicing</span>
              </span>
              <span className="bg-white/10 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-300" />
                <span>Panchakarma & IPD Beds</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onSelectTab('hospital_erp')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-stone-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102 active:scale-95"
            >
              <Database className="w-4 h-4 text-stone-950" />
              <span>Explore Hospital ERP →</span>
            </button>
            <span className="text-[11px] text-center text-stone-400 font-mono">
              🔒 Live Read-Only Preview for Visitors
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CORE AYURVEDIC CLINICAL SOLUTIONS (6 PILLARS)                           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1C1917] tracking-tight">
              Comprehensive Ayurvedic Care Suite (षड्विध आरोग्य सेवा)
            </h2>
            <p className="text-xs text-[#78716C]">
              Explore clinical solutions backed by genuine Ayurvedic diagnostics and validated AI algorithms.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="text-xs font-bold text-[#5B3E8C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Unlock All 11 Services</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Stress & Clinical Health Assessment */}
          <div 
            onClick={onOpenAuth}
            className="bg-white rounded-3xl p-5 border border-[#E5DAC6] shadow-xs hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-purple-800 transition-colors">
                Stress & Clinical Health Assessment
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Evaluate stress levels, sleep cycles, joint mobility, and digestive balance through structured clinical questionnaires, vital signs mapping, and AI health scoring.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-purple-700 flex items-center gap-1">
              <span>Explore Health Assessment</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Card 2: Symptom & Roganidana Checker */}
          <div 
            onClick={onOpenAuth}
            className="bg-white rounded-3xl p-5 border border-[#E5DAC6] shadow-xs hover:shadow-lg hover:border-rose-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-rose-800 transition-colors">
                Symptom & Roganidana Checker
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Identify root causes (Hetu) of bodily complaints rather than suppressing symptoms. Understand Ama (toxin) accumulation and digestive fire.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-rose-700 flex items-center gap-1">
              <span>Analyze Symptoms</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Card 3: Charaka Samhita RAG Intelligence */}
          <div 
            onClick={() => onOpenAIChat('')}
            className="bg-white rounded-3xl p-5 border border-[#E5DAC6] shadow-xs hover:shadow-lg hover:border-cyan-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-cyan-800 transition-colors">
                Charaka Samhita 70B AI
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                RAG-powered conversational neural engine referencing Charaka, Sushruta, and Ashtanga Hridaya shlokas with sweet voice feedback in Hindi and English.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-cyan-700 flex items-center gap-1">
              <span>Talk to Zeniva AI</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Card 4: Herbal Formulations & Aushadhi */}
          <div 
            onClick={onOpenAuth}
            className="bg-white rounded-3xl p-5 border border-[#E5DAC6] shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-emerald-800 transition-colors">
                Herbal Formulations & Agni Ahara
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Personalized dietary guidelines (Pathya/Apathya) and classical herbs (Ashwagandha, Triphala, Brahmi, Guduchi) balanced for your Agni state.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1">
              <span>View Formulations</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Card 5: Verified Ayurvedic Vaidyas */}
          <div 
            onClick={onOpenAuth}
            className="bg-white rounded-3xl p-5 border border-[#E5DAC6] shadow-xs hover:shadow-lg hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-amber-800 transition-colors">
                Verified Ayurvedic Vaidya Network
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Book in-clinic or HD video consultations with licensed BAMS and MD practitioners across Nagpur, Pune, and Mumbai with digital prescriptions.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-amber-700 flex items-center gap-1">
              <span>Find Vaidyas</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Card 6: Health Records & Dincharya */}
          <div 
            onClick={onOpenAuth}
            className="bg-white rounded-3xl p-5 border border-[#E5DAC6] shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1C1917] group-hover:text-indigo-800 transition-colors">
                EHR Health History & Dincharya
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Maintain longitudinal wellness logs, track pulse trends over seasons (Ritucharya), and follow daily Ayurvedic circadian clocks.
              </p>
            </div>
            <span className="mt-4 text-xs font-bold text-indigo-700 flex items-center gap-1">
              <span>View Health Records</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VERIFIED PRACTICING VAIDYAS SHOWCASE                                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#DED7CB] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1C1917] tracking-tight">
              Featured Verified Ayurvedic Physicians (वैद्य मण्डल)
            </h2>
            <p className="text-xs text-[#78716C]">
              Every physician on Zeniva is verified with state Ayurvedic councils (MCIM / CCIM).
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="text-xs font-bold text-[#5B3E8C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Practicing Doctors</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Doctor 1 */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5DAC6] shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200"
                alt="Dr. Vikramaditya Vaidya"
                className="w-12 h-12 rounded-full object-cover border border-[#D6CBB8]"
              />
              <div>
                <h4 className="text-xs font-bold text-[#1C1917]">Dr. Vikramaditya Vaidya</h4>
                <p className="text-[11px] text-[#78716C]">BAMS, MD (Kayachikitsa)</p>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>4.95 (140+ reviews)</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#57534E]">
              Specialist in Agni detoxification, metabolic disorders, and chronic joint care at Nagpur Clinic.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 cursor-pointer transition-colors"
            >
              Book Consultation
            </button>
          </div>

          {/* Doctor 2 */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5DAC6] shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200"
                alt="Dr. Ananya Kulkarni"
                className="w-12 h-12 rounded-full object-cover border border-[#D6CBB8]"
              />
              <div>
                <h4 className="text-xs font-bold text-[#1C1917]">Dr. Ananya Kulkarni</h4>
                <p className="text-[11px] text-[#78716C]">BAMS, D.Ayur (Panchakarma)</p>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>4.92 (95+ reviews)</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#57534E]">
              Renowned practitioner in women's hormonal balance (Stri Roga) and Panchakarma therapies in Pune.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 cursor-pointer transition-colors"
            >
              Book Consultation
            </button>
          </div>

          {/* Doctor 3 */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5DAC6] shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200"
                alt="Dr. Rajeshwar Sharma"
                className="w-12 h-12 rounded-full object-cover border border-[#D6CBB8]"
              />
              <div>
                <h4 className="text-xs font-bold text-[#1C1917]">Dr. Rajeshwar Sharma</h4>
                <p className="text-[11px] text-[#78716C]">BAMS, Nadi Pariksha Vidwan</p>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>4.98 (220+ reviews)</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#57534E]">
              15+ years experience in classical Nadi Pariksha and personalized rasayana longevity regimens in Mumbai.
            </p>
            <button
              onClick={onOpenAuth}
              className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 cursor-pointer transition-colors"
            >
              Book Consultation
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CLASSICAL SHLOKA WISDOM BANNER                                          */}
      {/* ========================================================================= */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#1C1030] to-[#2D184E] text-white border border-amber-400/30 text-center space-y-3 shadow-xl">
        <p className="text-amber-300 font-serif text-sm sm:text-base tracking-widest uppercase font-bold">
          ॥ सुश्रुतसंहिता सूत्रस्थानम् ॥
        </p>
        <blockquote className="text-base sm:text-xl font-serif italic text-[#F5DEB3] max-w-3xl mx-auto leading-relaxed">
          "समदोषः समाग्निश्च समधातुमलक्रियः । <br className="hidden sm:inline" />
          प्रसन्नात्मेन्द्रियमनाः स्वस्थ इत्यभिधीयते ॥"
        </blockquote>
        <p className="text-xs text-stone-300 max-w-2xl mx-auto">
          One whose bodily energies are in harmony, whose digestive fire (Agni) is balanced, whose tissues and excretions function properly, and whose soul, senses, and mind are serene — is truly called healthy (Swastha).
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 6. SIGN UP INCENTIVE BANNER                                               */}
      {/* ========================================================================= */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#FAF2E6] via-white to-[#FAF2E6] border-2 border-[#E5DAC6] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant Direct Access</span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1C1917]">
            Ready to experience your personalized Health Dashboard?
          </h3>
          <p className="text-xs text-[#78716C] max-w-xl">
            Create your patient profile in seconds. Instantly unlock all 11 patient services, personalized health wellness charts, EHR history, and your 24/7 AI Ayurvedic Doctor.
          </p>
        </div>

        <button
          onClick={onOpenAuth}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer shrink-0 border border-emerald-300"
        >
          <span>Create Free Account Now</span>
          <ArrowRight className="w-4 h-4 text-emerald-200" />
        </button>
      </div>

      {/* Developer Attribution & Contact Helpdesk Links */}
      <div className="pt-4 pb-2 flex flex-wrap items-center justify-center gap-4 text-center text-xs text-stone-500 font-medium">
        <button 
          onClick={onOpenTeam}
          className="hover:text-[#5B3E8C] transition-colors cursor-pointer inline-flex items-center gap-1.5 group"
        >
          <span>Developed by <strong className="text-stone-700 group-hover:text-[#5B3E8C] font-semibold">Zeniva Group</strong></span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200/80 group-hover:bg-purple-100 group-hover:text-purple-800 transition-colors font-bold">Meet the Team →</span>
        </button>

        <span className="text-stone-300">|</span>

        <button
          onClick={onOpenContact}
          className="hover:text-emerald-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 group text-emerald-800 font-semibold"
        >
          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
          <span>24/7 Support & Contact Helpdesk →</span>
        </button>
      </div>

    </div>
  );
};
