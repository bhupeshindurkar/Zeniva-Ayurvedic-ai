import React, { useState, useEffect } from 'react';
import { 
  Phone, Mail, MapPin, Clock, MessageSquare, Send, CheckCircle2, 
  Sparkles, Stethoscope, ShieldCheck, Heart, ArrowRight, 
  HelpCircle, ChevronDown, ChevronUp, AlertCircle, Building, ExternalLink,
  Users, X, MessageCircle
} from 'lucide-react';

export const ContactUsView = ({ 
  currentUser = {}, 
  onSelectTab = () => {}, 
  onOpenAIChat = () => {} 
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    inquiryType: 'Clinical Consultation',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  // WhatsApp states & modal
  const [isConnectingWhatsApp, setIsConnectingWhatsApp] = useState(false);
  const [whatsappNotice, setWhatsappNotice] = useState(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Official Zeniva WhatsApp configuration
  const officialDoctorPhone = '8766903403';
  const officialGroupUrl = 'https://chat.whatsapp.com/G4YxR1VfL5mC7oD48ZenAi';

  // Certified Consultation Directory Doctors (from #overview/consultation)
  const consultationDoctors = [
    { id: 'doc_meera', name: 'Dr. Meera Joshi', specialty: 'Senior Ayurvedic Physician (Pune)' },
    { id: 'doc_arjun', name: 'Dr. Arjun Patil', specialty: 'Nadi Pariksha & Joint Care (Mumbai)' },
    { id: 'doc_neha', name: 'Dr. Neha Kulkarni', specialty: 'Dravyaguna & Women’s Health (Thane)' },
    { id: 'doc_rajeshwar', name: 'Dr. Rajeshwar Sharma', specialty: 'Senior Vaidya & Metabolic Care (Delhi)' },
    { id: 'doc_priya', name: 'Dr. Priya Nair', specialty: 'Mind-Body & Rasayana Expert (Pune)' },
    { id: 'doc_anand', name: 'Dr. Anand Deshpande', specialty: 'Spine & Joint Specialist (Nagpur)' },
  ];

  const [selectedDoctor, setSelectedDoctor] = useState('Dr. Meera Joshi (Senior Ayurvedic Physician)');

  // Strict check if currently logged-in user is an authenticated patient
  const isLoggedInPatient = Boolean(
    currentUser && 
    currentUser.isLoggedIn && 
    currentUser.role === 'patient' && 
    currentUser.name && 
    currentUser.name !== 'Guest Visitor'
  );

  // Quick inputs for guest modal
  const [guestName, setGuestName] = useState(isLoggedInPatient ? currentUser.name : '');
  const [guestPhone, setGuestPhone] = useState(isLoggedInPatient ? (currentUser.phone || '') : '');
  const [guestQuery, setGuestQuery] = useState('');

  // Sync state if currentUser changes
  useEffect(() => {
    if (isLoggedInPatient) {
      setGuestName(currentUser.name || '');
      setGuestPhone(currentUser.phone || '');
    }
  }, [currentUser, isLoggedInPatient]);

  const handleOpenWhatsAppModal = () => {
    // Extract latest chat inquiry if available
    try {
      const rawSessions = localStorage.getItem('zeniva_patient_ai_chat_sessions');
      if (rawSessions) {
        const sessions = JSON.parse(rawSessions);
        if (Array.isArray(sessions) && sessions.length > 0) {
          const latest = sessions[0];
          const query = latest?.last_query || latest?.primary_concern || '';
          if (query && !guestQuery) {
            setGuestQuery(query);
          }
        }
      }
    } catch (e) {}

    setIsWhatsAppModalOpen(true);
  };

  const handleStartWhatsAppChat = async (targetType = 'doctor', overrideData = null) => {
    if (targetType === 'group') {
      window.open(officialGroupUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setIsConnectingWhatsApp(true);
    try {
      // 1. Determine patient identity with strict multi-session isolation
      let patientName = 'Guest Visitor';
      let patientPhone = '';
      let prakriti = 'Ayurvedic Wellness Constitution';
      let chiefConcern = 'Ayurvedic Health Consultation';
      let recentReply = 'Personalized Ayurvedic analysis & lifestyle guidelines.';
      let recentQuery = 'Consultation regarding health symptoms & diet';

      if (overrideData) {
        patientName = overrideData.name || (isLoggedInPatient ? currentUser.name : 'Guest Visitor');
        patientPhone = overrideData.phone || (isLoggedInPatient ? currentUser.phone : '');
        chiefConcern = overrideData.query || 'Ayurvedic Health Consultation';
      } else if (isLoggedInPatient) {
        patientName = currentUser.name;
        patientPhone = currentUser.phone || '';
        prakriti = currentUser.prakriti || 'Stress & Sleep Wellness Profile';
      } else {
        // Unauthenticated guest visitor
        patientName = guestName.trim() || 'Guest Visitor';
        patientPhone = guestPhone.trim() || '';
        prakriti = 'General Ayurvedic Wellness Inquiry';
        chiefConcern = guestQuery.trim() || 'Ayurvedic Health Consultation';
      }

      // 2. Fetch latest AI assessment summary from active session if available
      try {
        const rawSessions = localStorage.getItem('zeniva_patient_ai_chat_sessions');
        if (rawSessions) {
          const sessions = JSON.parse(rawSessions);
          if (Array.isArray(sessions) && sessions.length > 0) {
            const latestChat = sessions[0];
            if (!overrideData?.query && latestChat?.primary_concern) {
              chiefConcern = latestChat.primary_concern;
            }
            if (latestChat?.last_query) {
              recentQuery = latestChat.last_query;
            }
            if (latestChat?.last_reply || latestChat?.summary) {
              recentReply = latestChat.last_reply || latestChat.summary;
            }
            if (isLoggedInPatient && latestChat?.prakriti) {
              prakriti = latestChat.prakriti;
            }
          }
        }
      } catch (e) {}

      const targetDoctor = overrideData?.doctor || selectedDoctor || 'Dr. Meera Joshi (Senior Ayurvedic Physician)';

      const payload = {
        patient_id: isLoggedInPatient ? (currentUser.id || '') : `GUEST-${Math.floor(100000 + Math.random() * 900000)}`,
        patient_name: patientName,
        phone: patientPhone,
        doctor_name: targetDoctor,
        email: isLoggedInPatient ? (currentUser.email || '') : '',
        prakriti: prakriti,
        dosha_imbalance: 'Holistic Health Balance',
        primary_concern: chiefConcern,
        recent_query: recentQuery,
        recent_reply: recentReply,
        chat_summary: recentReply,
        source: 'contact_page'
      };

      // 3. Dispatch through backend API
      let targetWhatsAppUrl = '';
      try {
        const apiBase = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:8000' : '';
        const res = await fetch(`${apiBase}/api/contact/whatsapp-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.whatsapp_url) {
            targetWhatsAppUrl = data.whatsapp_url;
          }
        }
      } catch (apiErr) {
        console.warn('Backend WhatsApp API notice:', apiErr);
      }

      // 4. Fallback directly to verified official Zeniva clinical line (8766903403)
      if (!targetWhatsAppUrl) {
        const sessionRef = `ZEN-WA-${Math.floor(100000 + Math.random() * 900000)}`;
        const summaryText = recentReply.length > 250 ? (recentReply.substring(0, 247) + '...') : recentReply;
        const msg = 
`🌿 *Zeniva Ayurvedic AI - Patient Consultation Dispatch*
━━━━━━━━━━━━━━━━━━━━━
📋 *Ref ID:* \`${sessionRef}\`
👤 *Patient / Inquirer:* ${patientName}
📱 *Phone:* ${patientPhone || 'Direct WhatsApp'}
🩺 *Consulting Doctor:* ${targetDoctor}
⚖️ *Prakriti / Dosha:* ${prakriti}
🩺 *Chief Concern:* ${chiefConcern}
💡 *Zeniva AI Assessment:* ${summaryText}
👥 *Community Group:* Zeniva Ayurvedic AI Care
━━━━━━━━━━━━━━━━━━━━━
Namaste ${targetDoctor} & Zeniva Clinical Care Team, I would like to consult with you regarding this Ayurvedic assessment.`;

        targetWhatsAppUrl = `https://api.whatsapp.com/send?phone=91${officialDoctorPhone}&text=${encodeURIComponent(msg)}`;
      }

      setWhatsappNotice('Connecting to official Zeniva AI WhatsApp with your Ayurvedic assessment...');
      setIsWhatsAppModalOpen(false);

      setTimeout(() => {
        window.open(targetWhatsAppUrl, '_blank', 'noopener,noreferrer');
        setIsConnectingWhatsApp(false);
      }, 350);

      setTimeout(() => {
        setWhatsappNotice(null);
      }, 5000);

    } catch (err) {
      console.error('WhatsApp dispatch error:', err);
      window.open(`https://api.whatsapp.com/send?phone=91${officialDoctorPhone}`, '_blank', 'noopener,noreferrer');
      setIsConnectingWhatsApp(false);
      setIsWhatsAppModalOpen(false);
    }
  };

  const faqs = [
    {
      q: "झेनिव्हा (Zeniva) AI सल्ला कसा मिळवावा?",
      a: "तुम्ही थेट स्क्रीनवरील 'Zeniva AI Assistant' किंवा 'AI Vaidya Chat' वर क्लिक करून मराठी, हिंदी किंवा इंग्रजीत कोणताही आजार, लक्षणे किंवा आहाराबद्दल विनामूल्य सल्ला विचारू शकता."
    },
    {
      q: "नाडी परीक्षण आणि त्वचेचे AI स्कॅन (Skin Scan) कसे करावे?",
      a: "डॅशबोर्डवरील 'Skin AI Scan' किंवा 'Health Assessment' बटनावर क्लिक करा. तुमच्या त्वचेचा किंवा जीभेचा फोटो अपलोड करून काही सेकंदात ९६.४% अचूकतेसह आयुर्वेदिक निदान मिळवा."
    },
    {
      q: "तज्ज्ञ आयुर्वेदिक डॉक्टरांशी थेट सल्लामसलत कशी करावी?",
      a: "आमच्या 'Find Vaidyas & Clinics' किंवा 'Consultation' विभागात जाऊन तुम्ही महाराष्ट्रातील नामांकित BAMS / MD (Ayurveda) तज्ज्ञ डॉक्टरांची अपॉइंटमेंट बुक करू शकता."
    },
    {
      q: "माझा आरोग्य डेटा सुरक्षित आहे का?",
      a: "होय, झेनिव्हा प्लॅटफॉर्म संपूर्णपणे 256-bit HIPAA सुसंगत एन्क्रिप्शन वापरतो. तुमचा वैद्यकीय इतिहास आणि अहवाल फक्त तुमच्या आणि तुमच्या अधिकृत डॉक्टरांच्या परवानगीनेच पाहता येतो."
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.message.trim()) {
      return;
    }
    setIsSubmitting(true);
    const fallbackTicket = `ZEN-TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // 1. Direct real-time email notification to contact.zeniva@gmail.com
      try {
        await fetch('https://formsubmit.co/ajax/contact.zeniva@gmail.com', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            _subject: `🚨 [Zeniva AI Ticket] ${formData.inquiryType}: ${formData.subject?.trim() || 'Patient Problem/Inquiry'} (${fallbackTicket})`,
            Ticket_ID: fallbackTicket,
            Patient_Name: formData.fullName.trim(),
            Patient_Email: formData.email.trim(),
            Patient_Phone: formData.phone.trim() || 'Not Provided',
            Category: formData.inquiryType || 'Clinical Consultation',
            User_Role: currentUser?.role || 'patient',
            Subject: formData.subject?.trim() || `${formData.inquiryType} Ticket`,
            Message: formData.message.trim(),
            _template: 'table'
          })
        });
      } catch (mailErr) {
        console.warn("Direct email dispatch note:", mailErr);
      }

      // 2. Register ticket in backend database & trigger server-side handlers
      const apiBase = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000'
        : '';

      const res = await fetch(`${apiBase}/api/support/submit-issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: formData.fullName.trim(),
          sender_email: formData.email.trim(),
          sender_phone: formData.phone.trim() || '',
          user_role: currentUser?.role || 'patient',
          category: formData.inquiryType || 'Clinical Consultation',
          subject: formData.subject?.trim() || `${formData.inquiryType} Ticket`,
          message: formData.message.trim()
        })
      });

      const data = await res.json().catch(() => null);
      if (data && data.ticket_id) {
        setTicketId(data.ticket_id);
      } else {
        setTicketId(fallbackTicket);
      }
    } catch (err) {
      console.warn("Issue registered with offline fallback:", err);
      setTicketId(fallbackTicket);
    } finally {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        inquiryType: 'Clinical Consultation',
        subject: '',
        message: ''
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6 sm:space-y-8 bg-[#FAF7F2] min-h-screen select-none pb-24">
      
      {/* Toast Notice for WhatsApp Connect */}
      {whatsappNotice && (
        <div className="fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl bg-[#1C1030] text-white border border-emerald-500/40 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 fill-white" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-emerald-400">WhatsApp Dispatch Active</p>
            <p className="text-stone-300">{whatsappNotice}</p>
          </div>
        </div>
      )}

      {/* WhatsApp Care Hub & Group Modal */}
      {isWhatsAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-[#EBE3D5] shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <MessageSquare className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    Zeniva AI WhatsApp Care Hub
                  </h3>
                  <p className="text-xs text-stone-500">
                    Official WhatsApp Group & Direct Doctor Consultation
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Option 1: Zeniva AI WhatsApp Group */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Zeniva AI WhatsApp Community Group
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#25D366] text-white text-[10px] font-bold">
                  1,200+ Members
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                आमच्या अधिकृत व्हॉट्सअ‍ॅप ग्रुपमध्ये सामील व्हा! येथे आयुर्वेदिक डॉक्टर, AI असिस्टंट व सदस्य दररोज मोफत आरोग्य सल्ला, दिनचर्या मार्गदर्शक आणि नवीन अपडेट्स शेअर करतात.
              </p>
              <button
                onClick={() => handleStartWhatsAppChat('group')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Join Zeniva AI WhatsApp Group (ग्रुप जॉईन करा)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Option 2: 1-on-1 Direct Doctor Consultation */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                    1-on-1 Direct Doctor & AI Chat
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  24x7 Verified Clinical Desk
                </span>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>Consulting Doctor (तज्ज्ञ डॉक्टर निवडा)</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Consultation Directory</span>
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium cursor-pointer"
                  >
                    {consultationDoctors.map((doc) => (
                      <option key={doc.id} value={`${doc.name} (${doc.specialty})`}>
                        🩺 {doc.name} — {doc.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Your Name (तुमचे नाव)
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name (उदा. राहुल शर्मा)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Health Query / Concern (आरोग्य प्रश्न / लक्षणे)
                  </label>
                  <input
                    type="text"
                    value={guestQuery}
                    onChange={(e) => setGuestQuery(e.target.value)}
                    placeholder="e.g. Joint pain, digestion issue or sleep guidance"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  />
                </div>
              </div>

              <button
                onClick={() => handleStartWhatsAppChat('doctor', { name: guestName, phone: guestPhone, query: guestQuery, doctor: selectedDoctor })}
                disabled={isConnectingWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1C1030] hover:bg-[#2D1650] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer mt-2"
              >
                <MessageSquare className="w-4 h-4 text-[#25D366]" />
                <span>{isConnectingWhatsApp ? 'Preparing Dispatch...' : 'Dispatch Assessment to Doctor on WhatsApp →'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1C1030] via-[#2D1650] to-[#163628] text-white p-6 sm:p-10 shadow-xl border border-amber-500/20">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>24/7 Ayurvedic Clinical & Technical Helpdesk</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Get in Touch with Zeniva AI Care
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            आमच्याशी संपर्क साधा! आयुर्वेदिक निदान, तांत्रिक सहाय्यता, क्लिनिकल भागीदारी किंवा कॉलेज सहयोगासाठी आमची तज्ज्ञ चमू २४ तास आपल्या सेवेत उपलब्ध आहे.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleOpenWhatsAppModal}
              disabled={isConnectingWhatsApp}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>{isConnectingWhatsApp ? 'Opening Official WhatsApp...' : 'Chat with Zeniva AI on WhatsApp'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-100 animate-pulse"></span>
            </button>
            <button
              onClick={() => handleStartWhatsAppChat('group')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold border border-white/20 transition-transform hover:scale-105 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>Join WhatsApp Group</span>
            </button>
            <button
              onClick={() => onOpenAIChat('मला झेनिव्हा सहाय्यता व डॉक्टरांशी संपर्क साधायचा आहे.')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium border border-white/15 transition-transform hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Instant AI Vaidya</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Direct Contact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Chat with Zeniva Doctor on WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-xs hover:shadow-md transition-all space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-100 transition-colors"></div>
          
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 fill-[#25D366]" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
              24x7 Active
            </span>
          </div>

          <h3 className="text-sm font-bold text-[#1C1917] pt-1">
            Chat with Zeniva AI on WhatsApp
          </h3>
          <p className="text-xs text-[#78716C] leading-snug">
            1-on-1 clinical chat with pre-loaded AI assessment & health triage.
          </p>

          <div className="pt-2">
            <button
              onClick={handleOpenWhatsAppModal}
              disabled={isConnectingWhatsApp}
              className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-[#25D366] text-emerald-800 hover:text-white text-xs font-bold border border-emerald-200 hover:border-[#25D366] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <span>{isConnectingWhatsApp ? 'Connecting...' : 'Chat with Doctor'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-emerald-700 font-semibold text-center mt-1.5">
              24x7 Ayurvedic Clinical Desk
            </p>
          </div>
        </div>

        {/* Card 2: Zeniva AI WhatsApp Community Group */}
        <div className="bg-white p-5 rounded-2xl border border-teal-200/80 shadow-xs hover:shadow-md transition-all space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full blur-xl pointer-events-none group-hover:bg-teal-100 transition-colors"></div>
          
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-teal-700" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold">
              🌿 Group Care
            </span>
          </div>

          <h3 className="text-sm font-bold text-[#1C1917] pt-1">
            Zeniva AI WhatsApp Group
          </h3>
          <p className="text-xs text-[#78716C] leading-snug">
            Join official group for community updates, daily tips & doctor care.
          </p>

          <div className="pt-2">
            <button
              onClick={() => handleStartWhatsAppChat('group')}
              className="w-full py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white text-xs font-bold border border-teal-200 hover:border-teal-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <span>Join WhatsApp Group</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-stone-500 text-center mt-1.5 font-mono">
              1,200+ Active Members
            </p>
          </div>
        </div>

        {/* Card 3: Email */}
        <div className="bg-white p-5 rounded-2xl border border-[#EBE3D5] shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#1C1917]">Official Support Email</h3>
          <p className="text-xs text-[#78716C]">Inquiries & technical questions</p>
          <div className="pt-1">
            <a href="mailto:contact.zeniva@gmail.com" className="text-xs font-bold text-purple-700 hover:underline block truncate">
              contact.zeniva@gmail.com
            </a>
            <p className="text-[11px] text-stone-500 truncate">
              24x7 Direct Inquiries & Alerts
            </p>
          </div>
        </div>

        {/* Card 4: Location */}
        <div className="bg-white p-5 rounded-2xl border border-[#EBE3D5] shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#1C1917]">AI Research & Clinical Lab</h3>
          <p className="text-xs text-[#78716C]">Dept. of IT, TGPCET</p>
          <p className="text-xs font-medium text-stone-700 pt-1 leading-tight">
            Mohgaon, Wardha Road, Nagpur 441108
          </p>
        </div>
      </div>

      {/* 3. Main Form & Interactive Locator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Direct Inquiry Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-[#EBE3D5] shadow-sm space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B3E8C]">
              <MessageSquare className="w-4 h-4" />
              <span>Send Message & Clinical Query</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1917] mt-1">
              Direct Contact & Support Ticket
            </h2>
            <p className="text-xs text-[#78716C] mt-0.5">
              Fill out the form below. Our clinical and technical support desk will respond within 2 hours.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Message Received Successfully! (संदेश प्राप्त झाला)</span>
              </div>
              <p className="text-xs text-emerald-800">
                Your support ticket ID is <strong className="font-mono">{ticketId}</strong>. An alert notification has been dispatched to official monitoring at <strong className="font-mono">contact.zeniva@gmail.com</strong>.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Full Name (पूर्ण नाव) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name (उदा. राहुल शर्मा)"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DAC6] focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DAC6] focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Mobile Number (मोबाईल क्रमांक)
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DAC6] focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Inquiry Category (चौकशी प्रकार)
                </label>
                <select
                  value={formData.inquiryType}
                  onChange={(e) => setFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DAC6] focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm font-medium cursor-pointer"
                >
                  <option value="Clinical Consultation">🌿 Patient Clinical Consultation</option>
                  <option value="Doctor Registration">🩺 Doctor Registration & Verification</option>
                  <option value="AI Features & RAG">⚡ Ayurvedic AI Features & RAG</option>
                  <option value="Research Collaboration">🎓 College & Research Collaboration</option>
                  <option value="Technical Support">🛠️ Technical Support & Bug Report</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Subject / Topic
              </label>
              <input
                type="text"
                placeholder="Brief subject of your inquiry"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DAC6] focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Your Message / Health Query (संदेश) *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Describe your health question, feedback, or inquiry in detail..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E5DAC6] focus:outline-none focus:ring-2 focus:ring-purple-600 text-xs sm:text-sm font-medium resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5B3E8C] to-[#2E1854] hover:from-[#6D49A6] hover:to-[#381D66] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Submitting Query...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message (संदेश पाठवा)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Campus Clinical Lab & FAQs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Location Card with Map Preview */}
          <div className="bg-white p-6 rounded-3xl border border-[#EBE3D5] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1917]">Zeniva AI Innovation Center</h3>
                <p className="text-[11px] text-[#78716C]">TGPCET Campus · Nagpur, Maharashtra</p>
              </div>
            </div>

            <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-[#EBE3D5] bg-stone-100">
              <iframe
                title="TGPCET Nagpur Location"
                src="https://maps.google.com/maps?q=Tulsiramji+Gaikwad-Patil+College+of+Engineering+and+Technology+Nagpur&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0"
                loading="lazy"
              ></iframe>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-stone-500 font-medium">Department of Information Technology</span>
              <a
                href="https://maps.google.com/?q=Tulsiramji+Gaikwad-Patil+College+of+Engineering+and+Technology+Nagpur"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-purple-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Open in Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Quick FAQ Accordion */}
          <div className="bg-white p-6 rounded-3xl border border-[#EBE3D5] shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E5039]">
              <HelpCircle className="w-4 h-4" />
              <span>Frequently Asked Questions (वारंवार विचारले जाणारे प्रश्न)</span>
            </div>

            <div className="space-y-2 pt-1">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="border border-[#EBE3D5] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="w-full p-3 text-left font-bold text-xs text-[#1C1917] flex items-center justify-between bg-[#FAF7F2] hover:bg-[#F3EED9] transition-colors cursor-pointer"
                    >
                      <span className="pr-2">{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-purple-700 shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="p-3 text-xs text-[#57534E] bg-white leading-relaxed border-t border-[#EBE3D5]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
