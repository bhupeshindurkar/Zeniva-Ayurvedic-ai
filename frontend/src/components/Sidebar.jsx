import React, { useState, useEffect } from 'react';
import { 
  Home, User, Activity, HeartPulse, Stethoscope, Sparkles, 
  Calendar, BookOpen, FileText, Settings, Shield, Clock, 
  Users, BarChart3, ChevronDown, ChevronRight, CheckCircle2,
  FileCheck, ShieldCheck, Database, Layers, MessageSquare, Bell,
  FileBarChart, ShieldAlert, Award, Trophy, MapPin, ClipboardList,
  Mail, HelpCircle, Headphones, Briefcase, Phone, X
} from 'lucide-react';
import { ZenivaLogo, MeditatingYogi, InstagramIcon } from './ZenivaIcons';

export const Sidebar = ({ 
  currentRole = 'patient', // 'patient' | 'doctor' | 'admin' | 'public'
  activeTab = 'home', 
  onSelectTab,
  onOpenQuickScan,
  onOpenProfile,
  onOpenSettings,
  onOpenConsultation,
  onOpenAuth = () => {},
  isOpenMobile = false,
  onCloseMobile = () => {}
}) => {
  const [breathPhase, setBreathPhase] = useState('Inhale (स्वास 4s)');

  useEffect(() => {
    const phases = [
      'Inhale (स्वास 4s)',
      'Hold (कुम्भक 4s)',
      'Exhale (रेचक 4s)'
    ];
    let currentIdx = 0;
    const timer = setInterval(() => {
      currentIdx = (currentIdx + 1) % phases.length;
      setBreathPhase(phases[currentIdx]);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const [expandedSections, setExpandedSections] = useState({
    patients: true,
    doctors: true,
    recommendations: true,
    appointments: true,
    consultations: true
  });

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTabClick = (tabId, customAction) => {
    if (customAction) {
      customAction();
    } else if (onSelectTab) {
      onSelectTab(tabId);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  // Public Nav items (Shown on Zeniva overview dashboard before patient login)
  const publicNav = [
    { id: 'home', label: 'Zeniva Overview', icon: Home },
    { id: 'hospital_erp', label: 'Hospital ERP & Pharmacy', icon: Database },
    { id: 'opportunities', label: 'Clinical Opportunities', icon: Briefcase },
    { id: 'insights', label: 'Ayurvedic AI Features', icon: Award },
    { id: 'consultation', label: 'Find Vaidyas & Clinics', icon: Stethoscope },
    { id: 'library', label: 'Vedic Knowledge Library', icon: BookOpen },
    { id: 'team', label: 'Zeniva Creators & Team', icon: Users },
    { id: 'contact', label: 'Contact & Helpdesk', icon: Phone },
  ];

  // Patient Nav items (Shown only when patient is logged in)
  const patientNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'profile', label: 'My Profile', icon: User, action: onOpenProfile },
    { id: 'dosha', label: 'Health Assessment', icon: Activity },
    { id: 'symptoms', label: 'Symptom Checker', icon: HeartPulse },
    { id: 'hospital_erp', label: 'Hospital ERP & Pharmacy', icon: Database },
    { id: 'opportunities', label: 'Clinical & Research Opps', icon: Briefcase },
    { id: 'consultation', label: 'Consultation', icon: Stethoscope },
    { id: 'herbs', label: 'Herbal Recommendations', icon: Sparkles },
    { id: 'planner', label: 'Lifestyle Planner', icon: Calendar },
    { id: 'library', label: 'Knowledge Library', icon: BookOpen },
    { id: 'reports', label: 'Reports & History', icon: Clock },
    { id: 'insights', label: 'System Insights & Poster', icon: Award },
    { id: 'contact', label: 'Contact & Helpdesk', icon: Phone },
    { id: 'settings', label: 'Settings', icon: Settings, action: onOpenSettings },
  ];

  // Super Admin Navigation
  const adminNav = [
    { id: 'admin_dashboard', label: 'Dashboard', icon: Home, type: 'single' },
    
    // Patients Group
    { 
      id: 'patients_group',
      label: 'Patients', 
      icon: Users, 
      type: 'group',
      groupKey: 'patients',
      children: [
        { id: 'admin_patient_details', label: 'Patient Details' },
        { id: 'admin_assessment_history', label: 'Assessment History' },
        { id: 'admin_recommendation_history', label: 'Recommendation History' },
      ]
    },

    // Doctors Group
    { 
      id: 'doctors_group',
      label: 'Doctors', 
      icon: Stethoscope, 
      type: 'group',
      groupKey: 'doctors',
      children: [
        { id: 'admin_doctor_details', label: 'Doctor Details' },
        { id: 'admin_doctor_verification', label: 'Doctor Verification' },
        { id: 'admin_doctor_availability', label: 'Doctor Availability' },
      ]
    },

    // AI Recommendations Group
    { 
      id: 'ai_recommendations_group',
      label: 'AI Recommendations', 
      icon: Sparkles, 
      type: 'group',
      groupKey: 'recommendations',
      children: [
        { id: 'admin_symptom_assessments', label: 'Symptom Assessments' },
        { id: 'admin_ayurvedic_remedies', label: 'Ayurvedic Remedies' },
        { id: 'admin_doctor_review', label: 'Doctor Review' },
      ]
    },

    // Appointments Group
    { 
      id: 'appointments_group',
      label: 'Appointments', 
      icon: Calendar, 
      type: 'group',
      groupKey: 'appointments',
      children: [
        { id: 'admin_appointments_upcoming', label: 'Upcoming' },
        { id: 'admin_appointments_completed', label: 'Completed' },
        { id: 'admin_appointments_canceled', label: 'Cancelled' },
      ]
    },

    // Consultations Group
    { 
      id: 'consultations_group',
      label: 'Consultations', 
      icon: MessageSquare, 
      type: 'group',
      groupKey: 'consultations',
      children: [
        { id: 'admin_consultations_active', label: 'Active' },
        { id: 'admin_consultations_upcoming', label: 'Upcoming' },
        { id: 'admin_consultations_completed', label: 'Completed' },
      ]
    },

    { id: 'admin_notifications', label: 'Notifications', icon: Bell, type: 'single' },
    { id: 'admin_analytics', label: 'Reports', icon: FileBarChart, type: 'single' },
    { id: 'hospital_erp', label: 'Hospital ERP & Pharmacy', icon: Database, type: 'single' },
    { id: 'admin_security', label: 'Security & Audit', icon: ShieldAlert, type: 'single' },
    { id: 'insights', label: 'System Insights & Poster', icon: Award, type: 'single' },
    { id: 'admin_settings', label: 'Settings', icon: Settings, type: 'single' },
  ];

  // Doctor Navigation
  const doctorNav = [
    {
      type: 'single',
      id: 'home',
      altIds: ['doc_dashboard', 'dashboard'],
      label: 'Dashboard',
      icon: Home
    },
    {
      type: 'section',
      title: 'PROFILE',
      items: [
        { id: 'doc_personal_details', label: 'Personal Details', icon: User },
        { id: 'doc_qualification', label: 'Doctor Qualification', icon: Award },
        { id: 'doc_experience', label: 'Experience', icon: Calendar },
        { id: 'doc_specialization', label: 'Specialization', icon: Trophy },
        { id: 'doc_treatments', label: 'Successful Treatments', icon: ShieldCheck },
      ]
    },
    {
      type: 'section',
      title: 'PRACTICE',
      items: [
        { id: 'doc_location', label: 'Location', icon: MapPin },
        { id: 'doc_availability', label: 'Availability', icon: Clock },
      ]
    },
    {
      type: 'section',
      title: 'MANAGE',
      items: [
        { id: 'hospital_erp', label: 'Hospital ERP & Pharmacy', icon: Database },
        { id: 'doc_appointments', label: 'Appointments', icon: Calendar },
        { id: 'doc_patients', label: 'Patients', icon: Users },
        { id: 'doc_consultations', label: 'Consultations', icon: Stethoscope },
        { id: 'opportunities', label: 'Clinical Opportunities', icon: Briefcase },
        { id: 'doc_treatment_plans', label: 'Treatment Plans', icon: ClipboardList },
        { id: 'doc_herbal_recommendations', label: 'Herbal Recommendations', icon: Sparkles },
        { id: 'doc_reports_analytics', label: 'Reports & Analytics', icon: BarChart3 },
      ]
    },
    {
      type: 'section',
      title: 'OTHERS',
      items: [
        { id: 'doc_reminders', label: 'Reminders', icon: Bell },
        { id: 'doc_messages', label: 'Messages', icon: Mail },
        { id: 'doc_settings', label: 'Settings', icon: Settings },
        { id: 'doc_help_support', label: 'Help & Support', icon: HelpCircle },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 lg:hidden transition-opacity animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#1C1030] text-[#F3EED9] flex flex-col shrink-0 border-r border-[#311E54] select-none h-screen z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:w-64 lg:z-20 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#311E54] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8C65C9] to-[#5B3E8C] flex items-center justify-center p-1.5 shadow-md">
              <ZenivaLogo className="w-full h-full text-[#F5DEB3]" />
            </div>
            <div>
              <h1 className="text-base font-serif font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>Zeniva</span>
                <span className="text-[10px] bg-[#E5C07B] text-[#1C1030] px-1.5 py-0.2 rounded font-sans font-bold">AI</span>
              </h1>
              <p className="text-[9px] text-[#A69BBE] tracking-widest uppercase font-semibold">
                {currentRole === 'admin' ? 'Zeniva AI Governance' : currentRole === 'doctor' ? 'Zeniva AI Clinical Desk' : currentRole === 'public' ? 'Zeniva AI Public Overview' : 'Zeniva AI Ayurvedic Care'}
              </p>
            </div>
          </div>

          {/* Close button on Mobile Drawer */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-xl text-[#D3C7E8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links Area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          
          {/* 0. PUBLIC VISITOR NAVIGATION (Before Login) */}
          {currentRole === 'public' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="px-3 pt-2 text-[10px] font-bold tracking-wider text-[#A69BBE] uppercase">
                  Zeniva Overview
                </div>
                {publicNav.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#5B3E8C] text-white shadow-sm font-semibold'
                          : 'text-[#D3C7E8] hover:bg-[#2A1848] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#E5C07B]' : 'text-[#A69BBE]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1. PATIENT NAVIGATION (Unlocked after login) */}
          {currentRole === 'patient' && (
            <div className="space-y-1">
              {patientNav.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id, item.action)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#5B3E8C] text-white shadow-sm font-semibold'
                        : 'text-[#D3C7E8] hover:bg-[#2A1848] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#E5C07B]' : 'text-[#A69BBE]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. SUPER ADMIN NAVIGATION */}
          {currentRole === 'admin' && (
            <div className="space-y-1">
              {adminNav.map((item) => {
                if (item.type === 'single') {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#5B3E8C] text-white shadow-sm font-semibold'
                          : 'text-[#D3C7E8] hover:bg-[#2A1848] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#E5C07B]' : 'text-[#A69BBE]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                }

                // Group Items
                const isExpanded = expandedSections[item.groupKey];
                const Icon = item.icon;
                const hasActiveChild = item.children.some(c => c.id === activeTab);

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleSection(item.groupKey)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                        hasActiveChild ? 'text-[#E5C07B] bg-[#2A1848]/60' : 'text-[#D3C7E8] hover:bg-[#2A1848]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#A69BBE]" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180 text-white' : 'text-[#A69BBE]'}`} />
                    </button>

                    {isExpanded && (
                      <div className="pl-6 space-y-0.5 border-l border-[#311E54] ml-4 my-1">
                        {item.children.map(child => {
                          const isChildActive = activeTab === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => handleTabClick(child.id)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors cursor-pointer block ${
                                isChildActive
                                  ? 'bg-[#5B3E8C] text-white font-bold'
                                  : 'text-[#A69BBE] hover:text-white hover:bg-[#2A1848]'
                              }`}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. DOCTOR NAVIGATION */}
          {currentRole === 'doctor' && (
            <div className="space-y-3">
              {doctorNav.map((section, idx) => {
                if (section.type === 'single') {
                  const Icon = section.icon;
                  const isItemActive = activeTab === section.id || (section.altIds && section.altIds.includes(activeTab));
                  return (
                    <button
                      key={section.id || idx}
                      onClick={() => handleTabClick(section.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                        isItemActive
                          ? 'bg-[#5B3E8C] text-white shadow-sm font-semibold'
                          : 'text-[#D3C7E8] hover:bg-[#2A1848] hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isItemActive ? 'text-[#E5C07B]' : 'text-[#A69BBE]'}`} />
                      <span>{section.label}</span>
                    </button>
                  );
                }

                // Section Items
                return (
                  <div key={idx} className="space-y-1">
                    <div className="px-3 pt-2 text-[10px] font-bold tracking-wider text-[#A69BBE] uppercase">
                      {section.title}
                    </div>
                    {section.items.map(item => {
                      const Icon = item.icon;
                      const isItemActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                            isItemActive
                              ? 'bg-[#5B3E8C] text-white font-bold'
                              : 'text-[#D3C7E8] hover:bg-[#2A1848] hover:text-white'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isItemActive ? 'text-[#E5C07B]' : 'text-[#A69BBE]'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Meditating Yogi / Vedic Chaitanya Bio-Harmony Card (Compact Size) */}
        {(currentRole === 'patient' || currentRole === 'public') && (
          <div className="p-2 border-t border-[#311E54] bg-[#160B28]/95">
            <div className="bg-gradient-to-b from-[#251342] via-[#1B0C32] to-[#120722] rounded-xl p-2 border border-[#4E2E7D] shadow-md relative overflow-hidden flex flex-col items-center text-center space-y-1.5 group">
              
              {/* Subtle Ambient Radial Glow */}
              <div className="absolute top-1/3 inset-x-0 mx-auto w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>

              {/* Card Header: Title & Ojas Vitality */}
              <div className="w-full flex items-center justify-between border-b border-[#351D59] pb-1 px-0.5">
                <span className="text-[10px] font-serif font-bold text-[#F5DEB3] flex items-center gap-1 tracking-wide">
                  <span>॥ दैनिक प्रेरणा ॥</span>
                </span>
                <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-emerald-300 bg-emerald-950/70 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Ojas 96%</span>
                </span>
              </div>

              {/* Compact Meditating Yogi with Breathing Halo */}
              <div className="relative py-0.5 flex items-center justify-center">
                <div className={`absolute w-16 h-16 rounded-full border border-amber-400/30 transition-all duration-1000 pointer-events-none ${
                  breathPhase.includes('Inhale') ? 'scale-110 opacity-80 border-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.25)]' : breathPhase.includes('Hold') ? 'scale-105 opacity-90 ring-1 ring-purple-400/30' : 'scale-90 opacity-40'
                }`}></div>

                <div className="w-13 h-13 rounded-xl overflow-hidden border border-amber-300/40 shadow-sm flex items-center justify-center bg-[#140A24] transition-transform duration-500 hover:scale-105">
                  <img
                    src="/assets/vedic_meditating_yogi.png"
                    alt="Vedic Meditating Yogi"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Compact Prāna Breath Strip */}
              <div className="w-full bg-[#180A2D] rounded-lg py-0.5 px-1.5 border border-[#3A1E61] space-y-0.5">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[#C4B5FD] font-medium flex items-center gap-1">
                    <span>🌬️</span> {breathPhase}
                  </span>
                  <span className="text-amber-300/90 font-mono text-[8px]">4s Cycle</span>
                </div>
                <div className="w-full h-0.5 bg-[#11051F] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 via-purple-400 to-emerald-400 animate-pulse"></div>
                </div>
              </div>

              {/* Compact Button */}
              <button
                type="button"
                onClick={() => {
                  if (currentRole === 'public') {
                    handleTabClick('insights');
                  } else {
                    handleTabClick('dosha');
                  }
                }}
                className="w-full py-1 px-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-purple-600/25 hover:from-amber-500/25 hover:to-purple-600/35 text-amber-200 border border-amber-400/25 text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all hover:scale-[1.01]"
              >
                <span>🌿 Holistic Health Profile</span>
                <ChevronRight className="w-2.5 h-2.5 text-amber-300" />
              </button>
            </div>
          </div>
        )}

        {/* Official Instagram Follow Strip */}
        <div className="px-3 py-1.5 border-t border-[#311E54] bg-[#160B2C]/70 flex items-center justify-between">
          <a
            href="https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-pink-300 hover:text-pink-100 transition-colors group"
          >
            <InstagramIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span className="font-semibold tracking-wide">@zeniva.official</span>
          </a>
          <span className="text-[9px] text-[#A697C3] uppercase tracking-wider font-semibold">Instagram</span>
        </div>

        {/* Bottom Footer Attribution: Subtle Developed by Zeniva Group */}
        <div className="px-3 py-2 border-t border-[#311E54] text-[9px] text-[#8E82A8] flex items-center justify-between">
          <span>Developed by <strong className="font-semibold text-[#B3A6CE]">Zeniva Group</strong></span>
          <span className="text-emerald-400 font-mono flex items-center gap-1 text-[8px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>v2.4</span>
          </span>
        </div>

      </aside>
    </>
  );
};
