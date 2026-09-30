import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Building, Plus, Search, Filter, RefreshCw, 
  CheckCircle2, AlertTriangle, AlertCircle, Calendar, Clock, 
  User, DollarSign, FileText, Printer, Download, Eye, 
  Trash2, Edit, Save, X, Bed, Sparkles, Stethoscope, 
  Layers, ChevronRight, Activity, ArrowUpRight, TrendingUp,
  Package, ShieldCheck, Check, Phone, MapPin, Receipt,
  BadgePercent, FileSpreadsheet, Send, ArrowRight, ArrowLeft, Lock,
  Flame, Droplet, Wind, HeartPulse, UserCheck, Pill
} from 'lucide-react';
import { ZenivaLogo, MortarPestleGraphic } from '../components/ZenivaIcons';
import { getApiUrl } from '../lib/api';

// Fallback initial dataset (guarantees instantaneous render & offline persistence)
const DEFAULT_ERP_DATA = {
  inventory: [
    { id: "med_1", name: "Ashwagandha Churna", sanskrit_name: "अश्वगंधा चूर्ण", form: "Churna", category: "Rasayana & Strength", batch_no: "ASH-2026-B1", mfg_date: "2026-01-10", expiry_date: "2028-01-10", stock_quantity: 65, min_threshold: 15, unit: "100g Pack", cost_price: 140, selling_price: 220, rack_location: "Rack R-1", manufacturer: "Zeniva Ayurvedic Herbals", status: "available" },
    { id: "med_2", name: "Triphala Guggulu", sanskrit_name: "त्रिफळा गुग्गुळ", form: "Vati", category: "Digestive & Detox", batch_no: "TRI-2026-B4", mfg_date: "2026-02-15", expiry_date: "2029-02-15", stock_quantity: 90, min_threshold: 20, unit: "60 Tablets", cost_price: 120, selling_price: 195, rack_location: "Rack D-2", manufacturer: "Baidyanath Ayurveda", status: "available" },
    { id: "med_3", name: "Mahanarayana Taila", sanskrit_name: "महानारायण तैल", form: "Taila", category: "Joints & Pain Relief", batch_no: "MNT-2026-B2", mfg_date: "2026-01-20", expiry_date: "2029-01-20", stock_quantity: 42, min_threshold: 10, unit: "200ml Bottle", cost_price: 210, selling_price: 340, rack_location: "Rack P-4", manufacturer: "Kottakkal Arya Vaidya Sala", status: "available" },
    { id: "med_4", name: "Khadirarishta", sanskrit_name: "खदिरारिष्ट", form: "Asava/Arishta", category: "Skin & Blood Purifier", batch_no: "KHD-2026-B1", mfg_date: "2026-03-01", expiry_date: "2031-03-01", stock_quantity: 38, min_threshold: 12, unit: "450ml Bottle", cost_price: 160, selling_price: 260, rack_location: "Rack S-3", manufacturer: "Dhootapapeshwar", status: "available" },
    { id: "med_5", name: "Brahmi Vati Gold", sanskrit_name: "ब्राह्मी वटी सुवर्णयुक्त", form: "Vati", category: "Mental Peace & Sleep", batch_no: "BRH-2026-B9", mfg_date: "2026-02-10", expiry_date: "2029-02-10", stock_quantity: 8, min_threshold: 10, unit: "30 Tablets", cost_price: 380, selling_price: 580, rack_location: "Rack M-1", manufacturer: "Zeniva Authentic Pharmacy", status: "low_stock" },
    { id: "med_6", name: "Dashamularishta", sanskrit_name: "दशमूलारिष्ट", form: "Asava/Arishta", category: "Vitality & Vata Balance", batch_no: "DSM-2026-B3", mfg_date: "2026-01-05", expiry_date: "2031-01-05", stock_quantity: 55, min_threshold: 15, unit: "450ml Bottle", cost_price: 175, selling_price: 280, rack_location: "Rack V-2", manufacturer: "Baidyanath Ayurveda", status: "available" },
    { id: "med_7", name: "Chandraprabha Vati", sanskrit_name: "चंद्रप्रभा वटी", form: "Vati", category: "Urinary & Metabolic", batch_no: "CPV-2026-B7", mfg_date: "2026-02-22", expiry_date: "2029-02-22", stock_quantity: 72, min_threshold: 15, unit: "80 Tablets", cost_price: 130, selling_price: 210, rack_location: "Rack U-1", manufacturer: "Dhootapapeshwar", status: "available" },
    { id: "med_8", name: "Sitopaladi Churna", sanskrit_name: "सितोपलादि चूर्ण", form: "Churna", category: "Respiratory & Cough", batch_no: "STP-2026-B2", mfg_date: "2026-03-05", expiry_date: "2028-03-05", stock_quantity: 50, min_threshold: 15, unit: "100g Pack", cost_price: 110, selling_price: 175, rack_location: "Rack R-3", manufacturer: "Zeniva Ayurvedic Herbals", status: "available" },
    { id: "med_9", name: "Kumkumadi Tailam", sanskrit_name: "कुंकुमादि तैलम्", form: "Taila", category: "Skin Radiance & Ojas", batch_no: "KKM-2026-B5", mfg_date: "2026-02-18", expiry_date: "2028-02-18", stock_quantity: 24, min_threshold: 8, unit: "25ml Bottle", cost_price: 450, selling_price: 750, rack_location: "Rack S-1", manufacturer: "Zeniva Luxury Herbals", status: "available" },
    { id: "med_10", name: "Gokshuradi Guggulu", sanskrit_name: "गोक्षुरादि गुग्गुळ", form: "Vati", category: "Renal & Joint Health", batch_no: "GKG-2026-B8", mfg_date: "2026-01-12", expiry_date: "2029-01-12", stock_quantity: 48, min_threshold: 12, unit: "60 Tablets", cost_price: 125, selling_price: 205, rack_location: "Rack U-2", manufacturer: "Kottakkal Arya Vaidya Sala", status: "available" }
  ],
  invoices: [
    {
      id: "inv_1",
      invoice_no: "ZEN-INV-2026-001",
      patient_name: "Kamlesh Indurkar",
      patient_phone: "+91 9011942126",
      patient_id: "PAT-901194",
      doctor_name: "Dr. Sohil Indurkar",
      consultation_fee: 500.0,
      medicine_charges: 480.0,
      panchakarma_charges: 2200.0,
      discount: 180.0,
      gst_amount: 150.0,
      net_total: 3150.0,
      payment_mode: "UPI",
      payment_status: "Paid",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      items: [
        { name: "Consultation Fee (Dr. Sohil Indurkar)", type: "consultation", qty: 1, rate: 500, total: 500 },
        { name: "Sarvanga Abhyanga & Bashpa Swedana", type: "panchakarma", qty: 1, rate: 2200, total: 2200 },
        { name: "Ashwagandha Churna (100g)", type: "medicine", qty: 1, rate: 220, total: 220 },
        { name: "Khadirarishta (450ml)", type: "medicine", qty: 1, rate: 260, total: 260 }
      ]
    },
    {
      id: "inv_2",
      invoice_no: "ZEN-INV-2026-002",
      patient_name: "Sunita Deshmukh",
      patient_phone: "+91 9423112233",
      patient_id: "PAT-942311",
      doctor_name: "Dr. Sohil Indurkar",
      consultation_fee: 500.0,
      medicine_charges: 340.0,
      panchakarma_charges: 1400.0,
      discount: 100.0,
      gst_amount: 107.0,
      net_total: 2247.0,
      payment_mode: "Cash",
      payment_status: "Paid",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      items: [
        { name: "Consultation Fee (Dr. Sohil Indurkar)", type: "consultation", qty: 1, rate: 500, total: 500 },
        { name: "Janu Basti Therapy Session", type: "panchakarma", qty: 1, rate: 1400, total: 1400 },
        { name: "Mahanarayana Taila (200ml)", type: "medicine", qty: 1, rate: 340, total: 340 }
      ]
    }
  ],
  panchakarma: [
    { id: "pk_1", patient_name: "Aarav Patil", patient_phone: "+91 9822314567", therapy_name: "Shirodhara (Medicated Oil Flow)", therapist_name: "Vaidya Rajesh Sharma", room_name: "Suite 1 - Shirodhara Hall", start_date: "2026-09-28", time_slot: "08:30 AM - 09:30 AM", days_total: 7, days_completed: 3, status: "In-Progress", notes: "Continuous Brahmi-Taila flow for chronic migraine & sleep", charge_per_session: 1800 },
    { id: "pk_2", patient_name: "Sunita Deshmukh", patient_phone: "+91 9423112233", therapy_name: "Janu Basti (Knee Joint Care)", therapist_name: "Ananya Joshi (Therapist)", room_name: "Suite 2 - Basti Unit", start_date: "2026-09-29", time_slot: "10:00 AM - 11:00 AM", days_total: 14, days_completed: 5, status: "In-Progress", notes: "Warm Mahanarayana taila pool for osteoarthritis", charge_per_session: 1400 },
    { id: "pk_3", patient_name: "Kamlesh Indurkar", patient_phone: "+91 9011942126", therapy_name: "Sarvanga Abhyanga & Bashpa Swedana", therapist_name: "Dr. Sohil Indurkar", room_name: "Suite 3 - Droni Royal Suite", start_date: "2026-09-30", time_slot: "07:00 AM - 08:30 AM", days_total: 5, days_completed: 1, status: "Scheduled", notes: "Full body detox herbal steam bath & vitalizing massage", charge_per_session: 2200 },
    { id: "pk_4", patient_name: "Meera Kulkarni", patient_phone: "+91 9890123456", therapy_name: "Nasya Karma & Mukha Abhyanga", therapist_name: "Kavita Rao (Therapist)", room_name: "Suite 4 - Shalakya Cabin", start_date: "2026-09-29", time_slot: "04:30 PM - 05:30 PM", days_total: 7, days_completed: 6, status: "In-Progress", notes: "Anu Taila instillation for sinusitis and cervical relief", charge_per_session: 1100 }
  ],
  ipd_beds: [
    { id: "bed_1", bed_number: "Bed 101", ward_type: "Deluxe Ayurvedic Cottage", patient_name: "Sunita Deshmukh", patient_phone: "+91 9423112233", admission_date: "2026-09-25", discharge_date: "2026-10-02", prakriti: "Vata-Kapha", assigned_doctor: "Dr. Sohil Indurkar", diet_instructions: "Mudga Yusha (Mung soup) with Dashamula decoction", is_occupied: 1, daily_rate: 2800 },
    { id: "bed_2", bed_number: "Bed 102", ward_type: "Deluxe Ayurvedic Cottage", patient_name: null, patient_phone: null, admission_date: null, discharge_date: null, prakriti: null, assigned_doctor: "Dr. Sohil Indurkar", diet_instructions: "Standard Sattvic Agni diet", is_occupied: 0, daily_rate: 2800 },
    { id: "bed_3", bed_number: "Bed 201", ward_type: "Panchakarma Care Suite", patient_name: "Aarav Patil", patient_phone: "+91 9822314567", admission_date: "2026-09-27", discharge_date: "2026-10-04", prakriti: "Pitta-Vata", assigned_doctor: "Dr. Sohil Indurkar", diet_instructions: "Strict Ghritapana protocol, warm cow milk at bedtime", is_occupied: 1, daily_rate: 2200 },
    { id: "bed_4", bed_number: "Bed 202", ward_type: "Panchakarma Care Suite", patient_name: null, patient_phone: null, admission_date: null, discharge_date: null, prakriti: null, assigned_doctor: "Dr. Sohil Indurkar", diet_instructions: "Standard Sattvic Agni diet", is_occupied: 0, daily_rate: 2200 },
    { id: "bed_5", bed_number: "Bed 301", ward_type: "General Care Ward", patient_name: null, patient_phone: null, admission_date: null, discharge_date: null, prakriti: null, assigned_doctor: "Dr. Sohil Indurkar", diet_instructions: "Warm Kitchari & cumin water", is_occupied: 0, daily_rate: 1200 },
    { id: "bed_6", bed_number: "Bed 302", ward_type: "General Care Ward", patient_name: null, patient_phone: null, admission_date: null, discharge_date: null, prakriti: null, assigned_doctor: "Dr. Sohil Indurkar", diet_instructions: "Warm Kitchari & cumin water", is_occupied: 0, daily_rate: 1200 }
  ],
  daily_body_issues: [
    {
      id: "dbi_1",
      patient_name: "Kamlesh Indurkar",
      patient_phone: "+91 9011942126",
      patient_age: 52,
      gender: "Male",
      body_system: "Spine & Joint Health (अस्थि-संधि)",
      chief_complaint: "Morning stiffness, lumbar backache & knee crunching during walking (संधिशूल व कटिशूल)",
      dosha_imbalance: "Vata-Kapha",
      agni_status: "Vishamagni (Irregular)",
      severity: "Moderate",
      symptoms_duration: "12 Days",
      nadi_pulse: "76 bpm · Mandagati (Sluggish Vata)",
      jihva_tongue: "Slight white coating at root (Samata)",
      sleep_hours: "6 hrs (Interrupted)",
      bowel_habit: "Hard stools every 2nd day",
      daily_care_given: "Sthanika Janu Basti with warm Mahanarayana Taila (45 min) + Yogaraj Guggulu (2 tabs BD)",
      diet_instructions: "Warm freshly cooked mung dal with cow ghee, warm ginger water; avoid raw salads, dry chana, cold drinks",
      lifestyle_advice: "Light Sukshma Vyayama, avoid cold wind draft, 15 min hot water fomentation at bedtime",
      followup_date: "2026-10-05",
      status: "In-Progress",
      logged_by: "Dr. Sohil Indurkar",
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "dbi_2",
      patient_name: "Sunita Deshmukh",
      patient_phone: "+91 9423112233",
      patient_age: 46,
      gender: "Female",
      body_system: "Digestive & Gut Health (अग्नि-कोष्ठ)",
      chief_complaint: "Burning chest sensation, post-lunch sour water reflux & epigastric bloating (अम्लपित्त व आध्मान)",
      dosha_imbalance: "Pitta-Vata",
      agni_status: "Tikshnagni (Hyperactive)",
      severity: "Moderate",
      symptoms_duration: "3 Weeks",
      nadi_pulse: "82 bpm · Chapalagati (High Pitta)",
      jihva_tongue: "Red tip with mild yellowish center",
      sleep_hours: "5 hrs (Heartburn wakes at night)",
      bowel_habit: "Burning loose stools twice daily",
      daily_care_given: "Avipattikar Churna (3g before meals with cold milk) + Kamadudha Ras (Moti Yukta 1 tab BD)",
      diet_instructions: "Cold milk with pinch of cardamom, barley soup, soaked black raisins; strictly avoid green chilies, fried poha, tea on empty stomach",
      lifestyle_advice: "Early dinner before 7:30 PM, 10 min Sheetali Pranayama, walking after dinner",
      followup_date: "2026-10-03",
      status: "Under Treatment",
      logged_by: "Dr. Sohil Indurkar",
      created_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: "dbi_3",
      patient_name: "Aarav Patil",
      patient_phone: "+91 9822314567",
      patient_age: 34,
      gender: "Male",
      body_system: "Mind, Stress & Sleep (मनोवह स्रोतस)",
      chief_complaint: "Chronic sleep onset insomnia, high work cortisol, forehead tension headache & irritability (अनिद्रा व शिरःशूल)",
      dosha_imbalance: "Prana Vata & Sadhaka Pitta",
      agni_status: "Samagni (Normal)",
      severity: "Moderate",
      symptoms_duration: "1 Month",
      nadi_pulse: "78 bpm · Druta gati",
      jihva_tongue: "Clean, pink, mild tremor on extension",
      sleep_hours: "4.5 hrs (Late sleep latency)",
      bowel_habit: "Regular",
      daily_care_given: "Shirodhara with Brahmi Taila (7-day course) + Ashwagandha Arishta (20ml after dinner)",
      diet_instructions: "Warm cow milk with a pinch of nutmeg and saffron at 9:30 PM; avoid nighttime caffeine and spicy curries",
      lifestyle_advice: "Strict digital disconnect 1 hr before bed, Pada Abhyanga (foot massage) with warm Ksheerabala taila",
      followup_date: "2026-10-04",
      status: "In-Progress",
      logged_by: "Dr. Sohil Indurkar",
      created_at: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: "dbi_4",
      patient_name: "Meera Kulkarni",
      patient_phone: "+91 9890123456",
      patient_age: 28,
      gender: "Female",
      body_system: "Respiratory & Immunity (प्राणवह स्रोतस)",
      chief_complaint: "Morning sneezing bouts, clear nasal dripping, post-nasal drip & throat scratchiness (प्रतिश्याय व कास)",
      dosha_imbalance: "Vata-Kapha",
      agni_status: "Mandagni (Sluggish)",
      severity: "Mild",
      symptoms_duration: "5 Days",
      nadi_pulse: "72 bpm · Snigdha",
      jihva_tongue: "Thick white slimy coat (Ama)",
      sleep_hours: "7 hrs",
      bowel_habit: "Sluggish, sticky stools",
      daily_care_given: "Nasya with Anu Taila (2 drops each nostril) + Sitopaladi Churna (3g with raw honey & ginger juice)",
      diet_instructions: "Warm water sipping throughout day, boiled mung soup with black pepper, avoid curd, banana, ice water",
      lifestyle_advice: "Eucalyptus steam inhalation twice daily, keep neck and chest covered in AC environments",
      followup_date: "2026-10-02",
      status: "Relieved",
      logged_by: "Dr. Sohil Indurkar",
      created_at: new Date(Date.now() - 345600000).toISOString()
    }
  ]
};

export const HospitalErpView = ({ currentUser = {}, currentRole = 'public', onSelectTab = () => {} }) => {
  // Strict Role-Based Access Control (RBAC):
  // 1. Public / Home / Guest: 100% Read-Only Showcase Mode (No editing, no adding medicines, no billing creation).
  // 2. Doctor: Clinical Operations (Patient Invoicing, Panchakarma booking, IPD Bed admissions).
  // 3. Super Admin: Master Access (Inventory additions, stock adjustments, full hospital operations).
  const isAdmin = currentRole === 'admin';
  const isDoctor = currentRole === 'doctor';
  const canManageInventory = isAdmin;
  const canEditClinical = isAdmin || isDoctor;
  const canEdit = isAdmin || isDoctor;

  // Navigation sub-tabs inside ERP
  const [activeErpTab, setActiveErpTab] = useState('inventory'); // 'inventory' | 'body_issues' | 'billing' | 'panchakarma' | 'ipd' | 'analytics'
  const [erpData, setErpData] = useState(() => {
    try {
      const saved = localStorage.getItem('zeniva_hospital_erp_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.daily_body_issues || !Array.isArray(parsed.daily_body_issues) || parsed.daily_body_issues.length === 0) {
          parsed.daily_body_issues = DEFAULT_ERP_DATA.daily_body_issues;
        }
        return parsed;
      }
      return DEFAULT_ERP_DATA;
    } catch {
      return DEFAULT_ERP_DATA;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toastMsg, setToastMsg] = useState('');

  // Modals state
  const [isAddMedModalOpen, setIsAddMedModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBookPkModalOpen, setIsBookPkModalOpen] = useState(false);
  const [isAdmitIpdModalOpen, setIsAdmitIpdModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Synchronize to backend & local storage
  const syncToLocalStorage = (newData) => {
    setErpData(newData);
    try {
      localStorage.setItem('zeniva_hospital_erp_data', JSON.stringify(newData));
    } catch (e) {
      console.warn('Local storage save notice:', e);
    }
  };

  // Fetch live from FastAPI backend on load
  const loadBackendData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/erp/overview'));
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          syncToLocalStorage(json.data);
        }
      }
    } catch (err) {
      console.log('Using local ERP database store');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const inv = erpData.inventory || [];
    const invs = erpData.invoices || [];
    const pks = erpData.panchakarma || [];
    const beds = erpData.ipd_beds || [];
    const dailyIssues = erpData.daily_body_issues || [];

    const totalStockVal = inv.reduce((acc, curr) => acc + ((curr.stock_quantity || 0) * (curr.selling_price || 0)), 0);
    const lowStockCount = inv.filter(i => (i.stock_quantity || 0) <= (i.min_threshold || 10)).length;
    const totalRev = invs.filter(i => i.payment_status === 'Paid').reduce((acc, curr) => acc + (curr.net_total || 0), 0);
    const activePks = pks.filter(p => p.status === 'In-Progress' || p.status === 'Scheduled').length;
    const occupiedBeds = beds.filter(b => b.is_occupied === 1).length;
    const activeDailyIssues = dailyIssues.filter(d => d.status !== 'Relieved' && d.status !== 'Resolved').length;
    const relievedDailyIssues = dailyIssues.filter(d => d.status === 'Relieved' || d.status === 'Resolved').length;

    return {
      totalMedicines: inv.length,
      lowStockCount,
      totalStockVal,
      totalRevenue: totalRev,
      activePks,
      occupiedBeds,
      totalBeds: beds.length,
      occupancyRate: beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0,
      totalDailyIssues: dailyIssues.length,
      activeDailyIssues,
      relievedDailyIssues
    };
  }, [erpData]);

  // --- FORM STATES ---
  // Add Medicine Form
  const [medForm, setMedForm] = useState({
    name: '',
    sanskrit_name: '',
    form: 'Churna',
    category: 'Digestive & Agni',
    batch_no: '',
    stock_quantity: 25,
    min_threshold: 10,
    unit: 'Bottles',
    cost_price: 100,
    selling_price: 180,
    rack_location: 'Rack A-1',
    manufacturer: 'Zeniva Authentic Pharmacy'
  });

  // Invoice Form
  const [invForm, setInvForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_id: '',
    doctor_name: 'Dr. Sohil Indurkar',
    consultation_fee: 500,
    discount: 0,
    gst_percent: 5,
    payment_mode: 'UPI',
    payment_status: 'Paid',
    selectedItems: [] // { id, name, type, qty, rate, total }
  });

  // Panchakarma Form
  const [pkForm, setPkForm] = useState({
    patient_name: '',
    patient_phone: '',
    therapy_name: 'Shirodhara (Medicated Oil Flow)',
    therapist_name: 'Vaidya Rajesh Sharma',
    room_name: 'Suite 1 - Shirodhara Hall',
    start_date: new Date().toISOString().split('T')[0],
    time_slot: '09:00 AM - 10:00 AM',
    days_total: 7,
    charge_per_session: 1800,
    notes: ''
  });

  // IPD Admit Form
  const [ipdForm, setIpdForm] = useState({
    bed_number: 'Bed 102',
    patient_name: '',
    patient_phone: '',
    admission_date: new Date().toISOString().split('T')[0],
    discharge_date: '',
    prakriti: 'Vata-Pitta',
    assigned_doctor: 'Dr. Sohil Indurkar',
    diet_instructions: 'Mudga Yusha (Mung soup) with ghee',
    daily_rate: 2200
  });

  // Daily Body Issues Form State
  const [isAddBodyIssueModalOpen, setIsAddBodyIssueModalOpen] = useState(false);
  const [viewingBodyIssue, setViewingBodyIssue] = useState(null);
  const [bodyIssueFilterSystem, setBodyIssueFilterSystem] = useState('all');
  const [bodyIssueFilterSeverity, setBodyIssueFilterSeverity] = useState('all');
  const [bodyIssueFilterStatus, setBodyIssueFilterStatus] = useState('all');
  const [bodyIssueSearch, setBodyIssueSearch] = useState('');
  const [bodyIssueForm, setBodyIssueForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_age: '35',
    gender: 'Male',
    body_system: 'Digestive & Gut Health (अग्नि-कोष्ठ)',
    chief_complaint: '',
    dosha_imbalance: 'Vata-Pitta',
    agni_status: 'Samagni (Balanced)',
    severity: 'Moderate',
    symptoms_duration: '3 Days',
    nadi_pulse: '74 bpm (Samagati)',
    jihva_tongue: 'Clean & Pink (Niraam)',
    sleep_hours: '7 hrs',
    bowel_habit: 'Regular once daily',
    daily_care_given: '',
    diet_instructions: '',
    lifestyle_advice: '',
    followup_date: '',
    status: 'In-Progress'
  });

  // --- ACTIONS ---
  // 1. Add Medicine (Admin Only)
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!canManageInventory || !medForm.name.trim()) return;

    const newMed = {
      ...medForm,
      id: `med_${Date.now()}`,
      batch_no: medForm.batch_no || `BAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      stock_quantity: Number(medForm.stock_quantity),
      min_threshold: Number(medForm.min_threshold),
      cost_price: Number(medForm.cost_price),
      selling_price: Number(medForm.selling_price),
      status: Number(medForm.stock_quantity) <= Number(medForm.min_threshold) ? 'low_stock' : 'available'
    };

    const updatedInv = [newMed, ...(erpData.inventory || [])];
    const newErp = { ...erpData, inventory: updatedInv };
    syncToLocalStorage(newErp);

    try {
      await fetch(getApiUrl('/api/erp/inventory/add'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMed)
      });
    } catch {}

    setIsAddMedModalOpen(false);
    showToast(`✓ ${newMed.name} added to Pharmacy Inventory!`);
  };

  // 2. Adjust Stock Quantity (Admin Only)
  const handleUpdateStock = async (medId, delta) => {
    if (!canManageInventory) return;
    const updatedInv = (erpData.inventory || []).map(item => {
      if (item.id === medId) {
        const newQty = Math.max(0, (item.stock_quantity || 0) + delta);
        return {
          ...item,
          stock_quantity: newQty,
          status: newQty <= (item.min_threshold || 10) ? 'low_stock' : 'available'
        };
      }
      return item;
    });

    const newErp = { ...erpData, inventory: updatedInv };
    syncToLocalStorage(newErp);

    try {
      await fetch(getApiUrl('/api/erp/inventory/update-stock'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: medId, change_quantity: delta })
      });
    } catch {}
    showToast(`✓ Stock quantity updated!`);
  };

  // 3. Create Invoice (Doctor / Admin Only)
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!canEditClinical || !invForm.patient_name.trim()) return;

    const medCharges = invForm.selectedItems.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const subtotal = Number(invForm.consultation_fee) + medCharges - Number(invForm.discount);
    const gstAmt = Math.round(subtotal * (Number(invForm.gst_percent) / 100));
    const netTotal = Math.round(subtotal + gstAmt);

    const count = (erpData.invoices || []).length + 1;
    const invNo = `ZEN-INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count).padStart(3, '0')}`;

    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoice_no: invNo,
      patient_name: invForm.patient_name,
      patient_phone: invForm.patient_phone || '+91 9011942126',
      patient_id: invForm.patient_id || `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
      doctor_name: invForm.doctor_name,
      consultation_fee: Number(invForm.consultation_fee),
      medicine_charges: medCharges,
      panchakarma_charges: 0,
      discount: Number(invForm.discount),
      gst_amount: gstAmt,
      net_total: netTotal,
      payment_mode: invForm.payment_mode,
      payment_status: invForm.payment_status,
      created_at: new Date().toISOString(),
      items: [
        { name: `Consultation Fee (${invForm.doctor_name})`, type: 'consultation', qty: 1, rate: Number(invForm.consultation_fee), total: Number(invForm.consultation_fee) },
        ...invForm.selectedItems
      ]
    };

    // Auto deduct medicines from inventory
    const updatedInventory = (erpData.inventory || []).map(med => {
      const match = invForm.selectedItems.find(item => item.id === med.id);
      if (match) {
        const newStock = Math.max(0, (med.stock_quantity || 0) - match.qty);
        return {
          ...med,
          stock_quantity: newStock,
          status: newStock <= (med.min_threshold || 10) ? 'low_stock' : 'available'
        };
      }
      return med;
    });

    const newErp = {
      ...erpData,
      inventory: updatedInventory,
      invoices: [newInvoice, ...(erpData.invoices || [])]
    };

    syncToLocalStorage(newErp);

    try {
      await fetch(getApiUrl('/api/erp/billing/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInvoice,
          gst_percent: invForm.gst_percent,
          items: newInvoice.items
        })
      });
    } catch {}

    setIsInvoiceModalOpen(false);
    setViewingInvoice(newInvoice);
    showToast(`✓ Invoice ${newInvoice.invoice_no} generated successfully!`);
  };

  // 4. Book Panchakarma (Doctor / Admin Only)
  const handleBookPk = async (e) => {
    e.preventDefault();
    if (!canEditClinical || !pkForm.patient_name.trim()) return;

    const newPk = {
      ...pkForm,
      id: `pk_${Date.now()}`,
      days_total: Number(pkForm.days_total),
      days_completed: 1,
      charge_per_session: Number(pkForm.charge_per_session),
      status: 'Scheduled',
      created_at: new Date().toISOString()
    };

    const newErp = {
      ...erpData,
      panchakarma: [newPk, ...(erpData.panchakarma || [])]
    };
    syncToLocalStorage(newErp);

    try {
      await fetch(getApiUrl('/api/erp/panchakarma/book'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPk)
      });
    } catch {}

    setIsBookPkModalOpen(false);
    showToast(`✓ Panchakarma session booked for ${newPk.patient_name}!`);
  };

  // 5. Admit Patient to Bed (Doctor / Admin Only)
  const handleAdmitIpd = async (e) => {
    e.preventDefault();
    if (!canEditClinical || !ipdForm.patient_name.trim() || !ipdForm.bed_number) return;

    const updatedBeds = (erpData.ipd_beds || []).map(b => {
      if (b.bed_number === ipdForm.bed_number) {
        return {
          ...b,
          is_occupied: 1,
          patient_name: ipdForm.patient_name,
          patient_phone: ipdForm.patient_phone || '+91 9011942126',
          admission_date: ipdForm.admission_date,
          discharge_date: ipdForm.discharge_date,
          prakriti: ipdForm.prakriti,
          assigned_doctor: ipdForm.assigned_doctor,
          diet_instructions: ipdForm.diet_instructions,
          daily_rate: Number(ipdForm.daily_rate)
        };
      }
      return b;
    });

    const newErp = { ...erpData, ipd_beds: updatedBeds };
    syncToLocalStorage(newErp);

    try {
      await fetch(getApiUrl('/api/erp/ipd/admit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ipdForm)
      });
    } catch {}

    setIsAdmitIpdModalOpen(false);
    showToast(`✓ ${ipdForm.patient_name} admitted to ${ipdForm.bed_number}!`);
  };

  // 6. Discharge Patient from Bed (Doctor / Admin Only)
  const handleDischargeBed = async (bedNumber) => {
    if (!canEditClinical) return;
    const updatedBeds = (erpData.ipd_beds || []).map(b => {
      if (b.bed_number === bedNumber) {
        return {
          ...b,
          is_occupied: 0,
          patient_name: null,
          patient_phone: null,
          admission_date: null,
          discharge_date: null,
          prakriti: null
        };
      }
      return b;
    });

    const newErp = { ...erpData, ipd_beds: updatedBeds };
    syncToLocalStorage(newErp);

    try {
      await fetch(getApiUrl('/api/erp/ipd/discharge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bed_number: bedNumber })
      });
    } catch {}

    showToast(`✓ ${bedNumber} marked vacant & sanitized!`);
  };

  // 7. Add Daily Body Issue (Clinical Rogi Log)
  const handleCreateBodyIssue = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!canEditClinical && currentRole === 'public') {
      showToast('⚠️ Showcase Mode: Login as Doctor or Admin to record clinical entries.');
      return;
    }
    if (!bodyIssueForm.patient_name.trim() || !bodyIssueForm.chief_complaint.trim()) {
      showToast('⚠️ Please enter Patient Name and Chief Complaint.');
      return;
    }

    const newIssue = {
      ...bodyIssueForm,
      id: `dbi_${Date.now()}`,
      patient_phone: bodyIssueForm.patient_phone || '+91 9011942126',
      logged_by: currentRole === 'doctor' ? (currentUser.name || 'Dr. Sohil Indurkar') : 'Zeniva Ayurvedic Clinical Team',
      created_at: new Date().toISOString()
    };

    const updatedIssues = [newIssue, ...(erpData.daily_body_issues || [])];
    const newErp = { ...erpData, daily_body_issues: updatedIssues };
    syncToLocalStorage(newErp);

    setIsAddBodyIssueModalOpen(false);
    setBodyIssueForm({
      patient_name: '',
      patient_phone: '',
      patient_age: '35',
      gender: 'Male',
      body_system: 'Digestive & Gut Health (अग्नि-कोष्ठ)',
      chief_complaint: '',
      dosha_imbalance: 'Vata-Pitta',
      agni_status: 'Samagni (Balanced)',
      severity: 'Moderate',
      symptoms_duration: '3 Days',
      nadi_pulse: '74 bpm (Samagati)',
      jihva_tongue: 'Clean & Pink (Niraam)',
      sleep_hours: '7 hrs',
      bowel_habit: 'Regular once daily',
      daily_care_given: '',
      diet_instructions: '',
      lifestyle_advice: '',
      followup_date: '',
      status: 'In-Progress'
    });
    showToast(`✓ Clinical record for ${newIssue.patient_name} logged successfully!`);
  };

  // 8. Update Daily Body Issue Status
  const handleUpdateBodyIssueStatus = (id, newStatus) => {
    if (!canEditClinical && currentRole === 'public') return;
    const updated = (erpData.daily_body_issues || []).map(item => {
      if (item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    syncToLocalStorage({ ...erpData, daily_body_issues: updated });
    showToast(`✓ Case status updated to: ${newStatus}`);
  };

  // 9. Delete Daily Body Issue
  const handleDeleteBodyIssue = (id) => {
    if (!canEditClinical && currentRole === 'public') return;
    const updated = (erpData.daily_body_issues || []).filter(item => item.id !== id);
    syncToLocalStorage({ ...erpData, daily_body_issues: updated });
    showToast('✓ Clinical record removed.');
  };

  // 10. Export Daily Body Issues to CSV
  const handleExportBodyIssuesCSV = () => {
    const list = erpData.daily_body_issues || [];
    if (list.length === 0) {
      showToast('No records to export');
      return;
    }
    const headers = ['ID,Patient Name,Phone,Age,Gender,Body System,Chief Complaint,Dosha,Agni,Severity,Pulse,Sleep,Bowel,Care Prescribed,Diet,Status,Logged Date'];
    const rows = list.map(d => [
      `"${d.id}"`,
      `"${d.patient_name}"`,
      `"${d.patient_phone || ''}"`,
      `"${d.patient_age || ''}"`,
      `"${d.gender || ''}"`,
      `"${d.body_system || ''}"`,
      `"${(d.chief_complaint || '').replace(/"/g, '""')}"`,
      `"${d.dosha_imbalance || ''}"`,
      `"${d.agni_status || ''}"`,
      `"${d.severity || ''}"`,
      `"${d.nadi_pulse || ''}"`,
      `"${d.sleep_hours || ''}"`,
      `"${d.bowel_habit || ''}"`,
      `"${(d.daily_care_given || '').replace(/"/g, '""')}"`,
      `"${(d.diet_instructions || '').replace(/"/g, '""')}"`,
      `"${d.status || ''}"`,
      `"${d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN') : ''}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Zeniva_Ayurvedic_Daily_Body_Issues_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Daily Body Issues CSV downloaded!');
  };

  // Filtered Body Issues
  const filteredBodyIssues = useMemo(() => {
    return (erpData.daily_body_issues || []).filter(item => {
      const matchSearch = !bodyIssueSearch || 
        item.patient_name.toLowerCase().includes(bodyIssueSearch.toLowerCase()) ||
        (item.patient_phone && item.patient_phone.includes(bodyIssueSearch)) ||
        (item.chief_complaint && item.chief_complaint.toLowerCase().includes(bodyIssueSearch.toLowerCase())) ||
        (item.body_system && item.body_system.toLowerCase().includes(bodyIssueSearch.toLowerCase())) ||
        (item.daily_care_given && item.daily_care_given.toLowerCase().includes(bodyIssueSearch.toLowerCase()));

      const matchSystem = bodyIssueFilterSystem === 'all' || (item.body_system && item.body_system.toLowerCase().includes(bodyIssueFilterSystem.toLowerCase()));
      const matchSeverity = bodyIssueFilterSeverity === 'all' || (item.severity && item.severity.toLowerCase() === bodyIssueFilterSeverity.toLowerCase());
      const matchStatus = bodyIssueFilterStatus === 'all' || (item.status && item.status.toLowerCase() === bodyIssueFilterStatus.toLowerCase());

      return matchSearch && matchSystem && matchSeverity && matchStatus;
    });
  }, [erpData.daily_body_issues, bodyIssueSearch, bodyIssueFilterSystem, bodyIssueFilterSeverity, bodyIssueFilterStatus]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return (erpData.inventory || []).filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sanskrit_name && item.sanskrit_name.includes(searchQuery)) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batch_no.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = categoryFilter === 'all' || item.form.toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [erpData.inventory, searchQuery, categoryFilter]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1C1030] pb-24">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#1C1030] text-[#F3EED9] border border-emerald-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* TOP ERP HEADER */}
      <div className="bg-gradient-to-r from-[#140824] via-[#1C1030] to-[#2B1245] text-white border-b border-[#3E256C] px-4 sm:px-8 py-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#7c3aed15_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none"></div>

        {/* Navigation Breadcrumb / Back button */}
        <div className="max-w-7xl mx-auto relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4">
          <button
            onClick={() => onSelectTab(currentRole === 'admin' ? 'admin_dashboard' : 'home')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-stone-200 hover:text-white text-xs font-semibold cursor-pointer transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {currentRole === 'admin' ? 'Admin Dashboard' : 'Dashboard'}</span>
          </button>

          <span className="text-[11px] font-mono text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-inner">
            <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-400' : isDoctor ? 'bg-emerald-400' : 'bg-stone-400'}`}></span>
            Role: {isAdmin ? '👑 Super Admin Master (Full Access)' : isDoctor ? '👨‍⚕️ Ayurvedic Doctor (Clinical Billing)' : '🌐 Public Showcase (Read-Only Preview)'}
          </span>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-mono tracking-wider uppercase font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Hospital Operating System · ERP v2.4
              </span>
              <span className="text-[11px] text-stone-300 font-mono">MCIM / AYUSH Standard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight flex items-center gap-3 text-[#F5EEDC]">
              <span>Zeniva Ayurvedic Hospital ERP</span>
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30">Live Cloud</span>
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              Complete Integrated Clinical Operations: Pharmacy Inventory, Computerized GST Billing, Panchakarma Bed Scheduler & IPD Ward Management.
            </p>
          </div>

          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsAddBodyIssueModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
              >
                <HeartPulse className="w-4 h-4" />
                <span>+ Log Body Issue</span>
              </button>

              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
              >
                <Receipt className="w-4 h-4" />
                <span>+ New Invoice</span>
              </button>

              <button
                onClick={() => setIsAddMedModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
              >
                <Package className="w-4 h-4" />
                <span>+ Add Medicine</span>
              </button>

              <button
                onClick={loadBackendData}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : isDoctor ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsAddBodyIssueModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
              >
                <HeartPulse className="w-4 h-4" />
                <span>+ Log Body Issue</span>
              </button>

              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
              >
                <Receipt className="w-4 h-4" />
                <span>+ New Invoice</span>
              </button>

              <button
                onClick={loadBackendData}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-stone-300 flex items-center gap-1.5 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>Read-Only Preview Mode</span>
              </div>

              <button
                onClick={() => {
                  window.location.hash = '#login/doctor';
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 hover:scale-102"
              >
                <Lock className="w-3.5 h-3.5 text-stone-950" />
                <span>Doctor / Admin Login →</span>
              </button>

              <button
                onClick={loadBackendData}
                disabled={isLoading}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-stone-200 hover:text-white transition-colors cursor-pointer"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Live Metrics Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] text-stone-300 font-medium">Aushadhi Inventory</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">{stats.totalMedicines}</span>
              {stats.lowStockCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-400/40 font-bold">
                  {stats.lowStockCount} Low Stock
                </span>
              )}
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">Valued at ₹{stats.totalStockVal.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] text-stone-300 font-medium">Daily Body Issues</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-purple-300">{stats.totalDailyIssues || 0}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/40 font-bold">
                {stats.activeDailyIssues || 0} Active
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">{stats.relievedDailyIssues || 0} relieved / restored</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] text-stone-300 font-medium">Total Billed Revenue</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-300">₹{stats.totalRevenue.toLocaleString('en-IN')}</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> GST Paid
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">{erpData.invoices?.length || 0} computerized receipts</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <p className="text-[11px] text-stone-300 font-medium">Panchakarma Therapies</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">{stats.activePks}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                Active Suites
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">Shirodhara, Janu Basti, Swedana</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 col-span-2 sm:col-span-1">
            <p className="text-[11px] text-stone-300 font-medium">IPD Bed Occupancy</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300">{stats.occupiedBeds} / {stats.totalBeds}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                {stats.occupancyRate}% Full
              </span>
            </div>
            <p className="text-[10px] text-stone-400 mt-0.5">Cottages & Care Wards</p>
          </div>
        </div>
      </div>

      {/* ERP SUB-NAVIGATION TABS (Mobile swipeable & desktop crisp) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-8 -mt-4 relative z-20">
        <div className="bg-white rounded-2xl p-1.5 shadow-md border border-stone-200/80 flex overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap items-center gap-1.5">
          {[
            { id: 'inventory', label: '🌿 Aushadhi Bhandar (Stock)', badge: erpData.inventory?.length },
            { id: 'body_issues', label: '🩺 Daily Body Issues & Rogi Tracker', badge: erpData.daily_body_issues?.length || 0 },
            { id: 'billing', label: '🧾 GST Billing & Invoices', badge: erpData.invoices?.length },
            { id: 'panchakarma', label: '💆‍♂️ Panchakarma Scheduler', badge: stats.activePks },
            { id: 'ipd', label: '🛏️ IPD Wards & Beds', badge: `${stats.occupiedBeds}/${stats.totalBeds}` },
            { id: 'analytics', label: '📊 Clinic Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveErpTab(tab.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                activeErpTab === tab.id
                  ? 'bg-[#1C1030] text-[#F3EED9] shadow-md scale-102'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                  activeErpTab === tab.id ? 'bg-amber-400/20 text-amber-300' : 'bg-stone-200 text-stone-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN ERP TAB CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        
        {/* ============================================================== */}
        {/* TAB 1: AUSHADHI BHANDAR (INVENTORY) */}
        {/* ============================================================== */}
        {activeErpTab === 'inventory' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search medicine by name, Sanskrit, batch, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-stone-500 font-medium">Form:</span>
                {['all', 'Churna', 'Vati', 'Taila', 'Asava/Arishta'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-purple-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Forms' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Card List for Smartphones (Screen < 768px) */}
            <div className="block md:hidden space-y-3">
              {filteredInventory.map(item => {
                const isLow = (item.stock_quantity || 0) <= (item.min_threshold || 10);
                return (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200/80 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-stone-900 text-sm">{item.name}</h4>
                          {isLow && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold border border-rose-200">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-purple-900 font-semibold">{item.sanskrit_name || 'शास्त्रीय योग'}</p>
                        <p className="text-[10px] text-stone-400">{item.manufacturer}</p>
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-[11px] font-bold shrink-0">
                        {item.form}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <div>
                        <span className="text-stone-400 text-[10px] block">Batch & Expiry:</span>
                        <span className="font-mono text-stone-800 font-medium">{item.batch_no}</span>
                        <span className="text-stone-400 text-[10px] block">Exp: {item.expiry_date}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-stone-400 text-[10px] block">Selling Price:</span>
                        <span className="font-mono font-bold text-stone-900 text-sm">₹{item.selling_price}</span>
                        <span className="text-stone-400 text-[10px] block">Cost: ₹{item.cost_price}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                          {item.rack_location || 'Rack Shelf'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                          isLow ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {item.stock_quantity} {item.unit}
                        </span>
                      </div>

                      {canManageInventory ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateStock(item.id, -1)}
                            className="w-8 h-8 rounded-xl bg-stone-100 active:bg-rose-100 active:text-rose-700 text-stone-800 font-bold flex items-center justify-center cursor-pointer text-sm"
                            title="Dispense 1 unit"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleUpdateStock(item.id, 5)}
                            className="px-2.5 h-8 rounded-xl bg-purple-100 active:bg-emerald-100 text-purple-900 font-bold flex items-center justify-center text-xs cursor-pointer"
                            title="Add 5 units from stock room"
                          >
                            +5
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Inventory Table (Screen >= 768px) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-stone-200 text-stone-600 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">Medicine & Sanskrit Name</th>
                      <th className="py-3.5 px-3">Form & Category</th>
                      <th className="py-3.5 px-3">Batch & Expiry</th>
                      <th className="py-3.5 px-3 text-center">In Stock</th>
                      <th className="py-3.5 px-3 text-right">Selling Price</th>
                      <th className="py-3.5 px-3">Location</th>
                      <th className="py-3.5 px-4 text-center">{canEdit ? 'Stock Adjustment' : 'Pharmacy Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredInventory.map(item => {
                      const isLow = (item.stock_quantity || 0) <= (item.min_threshold || 10);
                      return (
                        <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {isLow && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold border border-rose-200">
                                  Low
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-purple-900 font-semibold">{item.sanskrit_name || 'शास्त्रीय योग'}</p>
                            <p className="text-[10px] text-stone-400">{item.manufacturer}</p>
                          </td>

                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono text-xs font-semibold">
                              {item.form}
                            </span>
                            <p className="text-[11px] text-stone-500 mt-1">{item.category}</p>
                          </td>

                          <td className="py-3 px-3 font-mono text-[11px]">
                            <p className="font-semibold text-stone-800">{item.batch_no}</p>
                            <p className="text-stone-400 text-[10px]">Exp: {item.expiry_date}</p>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className={`px-3 py-1 rounded-full font-mono font-bold text-xs ${
                              isLow ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {item.stock_quantity} {item.unit}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-stone-900">
                            ₹{item.selling_price}
                            <p className="text-[10px] text-stone-400 font-normal">Cost: ₹{item.cost_price}</p>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-medium">
                              {item.rack_location || 'Main Shelf'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            {canManageInventory ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleUpdateStock(item.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-rose-100 hover:text-rose-700 text-stone-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                                  title="Dispense 1 unit"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => handleUpdateStock(item.id, 5)}
                                  className="px-2 h-7 rounded-lg bg-stone-100 hover:bg-emerald-100 hover:text-emerald-700 text-stone-700 font-bold flex items-center justify-center text-xs cursor-pointer transition-colors"
                                  title="Add 5 units from stock room"
                                >
                                  +5
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                Verified Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SMART BILLING & GST INVOICES */}
        {/* ============================================================== */}
        {activeErpTab === 'billing' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">Hospital Invoicing & Patient Billing</h3>
                <p className="text-xs text-stone-500">Computerized, GST-compliant receipts with auto inventory stock deduction.</p>
              </div>

              {canEdit ? (
                <button
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1C1030] hover:bg-[#2B1245] text-[#F3EED9] text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Patient Bill</span>
                </button>
              ) : (
                <span className="text-xs font-medium text-stone-500 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Billing Generation Restricted to Staff</span>
                </span>
              )}
            </div>

            {/* Invoices List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(erpData.invoices || []).map(inv => (
                <div key={inv.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 hover:border-purple-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div>
                        <span className="text-xs font-mono font-bold text-purple-900">{inv.invoice_no}</span>
                        <h4 className="text-base font-bold text-stone-900 mt-0.5">{inv.patient_name}</h4>
                        <p className="text-xs text-stone-500">{inv.patient_phone} · {inv.patient_id}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black font-mono text-emerald-800">₹{inv.net_total}</span>
                        <p className="text-[10px] text-stone-400">{new Date(inv.created_at).toLocaleDateString('en-IN')}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {inv.payment_status} via {inv.payment_mode}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="py-3 space-y-1 text-xs text-stone-600">
                      <div className="flex justify-between">
                        <span>Consultation Fee:</span>
                        <span className="font-mono">₹{inv.consultation_fee}</span>
                      </div>
                      {inv.medicine_charges > 0 && (
                        <div className="flex justify-between">
                          <span>Pharmacy Medicines:</span>
                          <span className="font-mono">₹{inv.medicine_charges}</span>
                        </div>
                      )}
                      {inv.panchakarma_charges > 0 && (
                        <div className="flex justify-between">
                          <span>Panchakarma Therapies:</span>
                          <span className="font-mono">₹{inv.panchakarma_charges}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-stone-400 text-[11px]">
                        <span>CGST + SGST (Tax):</span>
                        <span className="font-mono">+₹{inv.gst_amount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">Doctor: {inv.doctor_name}</span>
                    <button
                      onClick={() => setViewingInvoice(inv)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Official Bill</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: PANCHAKARMA SCHEDULER */}
        {/* ============================================================== */}
        {activeErpTab === 'panchakarma' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">Panchakarma Therapy Theaters & Suites</h3>
                <p className="text-xs text-stone-500">Live booking for Shirodhara, Droni massage tables, Swedana steam & Basti packages.</p>
              </div>

              {canEdit ? (
                <button
                  onClick={() => setIsBookPkModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1C1030] hover:bg-[#2B1245] text-[#F3EED9] text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Book Panchakarma Session</span>
                </button>
              ) : (
                <span className="text-xs font-medium text-stone-500 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Therapy Room Booking Restricted to Staff</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(erpData.panchakarma || []).map(pk => (
                <div key={pk.id} className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200/80 hover:border-amber-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                        {pk.room_name}
                      </span>
                      <h4 className="text-base font-bold text-stone-900 mt-2">{pk.therapy_name}</h4>
                      <p className="text-xs text-stone-600 font-medium">Patient: <span className="font-bold text-stone-900">{pk.patient_name}</span> ({pk.patient_phone})</p>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 font-bold">
                      {pk.status}
                    </span>
                  </div>

                  <div className="my-3 p-3 rounded-xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
                    <p className="text-stone-700"><span className="font-semibold">Therapist:</span> {pk.therapist_name}</p>
                    <p className="text-stone-700"><span className="font-semibold">Slot:</span> {pk.time_slot} (Started: {pk.start_date})</p>
                    <p className="text-stone-500 text-[11px] italic">"{pk.notes}"</p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                    <div>
                      <span className="text-stone-400">Package Progress:</span>
                      <p className="font-mono font-bold text-purple-900">Day {pk.days_completed} of {pk.days_total} Days</p>
                    </div>

                    <div className="text-right">
                      <span className="text-stone-400">Session Charge:</span>
                      <p className="font-mono font-bold text-stone-900">₹{pk.charge_per_session}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: IPD WARDS & BEDS */}
        {/* ============================================================== */}
        {activeErpTab === 'ipd' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900">In-Patient Department (IPD) Ward & Bed Roster</h3>
                <p className="text-xs text-stone-500">Live bed allocation for Ayurvedic residential detoxification & panchakarma packages.</p>
              </div>

              {canEdit ? (
                <button
                  onClick={() => setIsAdmitIpdModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1C1030] hover:bg-[#2B1245] text-[#F3EED9] text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Admit Patient to Bed</span>
                </button>
              ) : (
                <span className="text-xs font-medium text-stone-500 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Bed Allocation Restricted to Staff</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {(erpData.ipd_beds || []).map(b => {
                const isOccupied = b.is_occupied === 1;
                return (
                  <div key={b.id} className={`p-5 rounded-2xl border transition-all ${
                    isOccupied 
                      ? 'bg-white border-purple-300 shadow-md' 
                      : 'bg-[#FAF7F2] border-dashed border-stone-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold font-mono text-stone-900">{b.bed_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOccupied ? 'bg-purple-100 text-purple-900 border border-purple-200' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isOccupied ? 'Occupied' : 'Available'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 font-medium mt-1">{b.ward_type}</p>

                    {isOccupied ? (
                      <div className="mt-4 space-y-2 text-xs">
                        <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                          <p className="font-bold text-stone-900">{b.patient_name}</p>
                          <p className="text-stone-500 text-[11px]">{b.patient_phone} · {b.prakriti}</p>
                          <p className="text-stone-600 text-[11px] mt-1"><span className="font-semibold">Admitted:</span> {b.admission_date}</p>
                          <p className="text-stone-600 text-[11px] mt-1"><span className="font-semibold">Diet:</span> {b.diet_instructions}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="font-mono text-stone-700 font-bold">₹{b.daily_rate}/day</span>
                          {canEdit && (
                            <button
                              onClick={() => handleDischargeBed(b.bed_number)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer transition-colors"
                            >
                              Discharge
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-6 text-center py-4">
                        <Bed className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        <p className="text-xs text-stone-400">Bed is sanitized & ready</p>
                        <p className="font-mono text-xs font-bold text-stone-700 mt-1">₹{b.daily_rate}/day</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: CLINIC ANALYTICS */}
        {/* ============================================================== */}
        {activeErpTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-700" />
                  <span>Revenue Channels Breakdown</span>
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Panchakarma Therapies</span>
                      <span className="font-mono font-bold">58%</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[58%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Ayurvedic Pharmacy Sales</span>
                      <span className="font-mono font-bold">28%</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[28%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-medium mb-1">
                      <span>Doctor OPD Consultation</span>
                      <span className="font-mono font-bold">14%</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full w-[14%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Clinical Compliance & Quality</span>
                </h4>
                <div className="space-y-2 text-xs text-stone-600">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>State MCIM & AYUSH Council Guidelines Adherence</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>100% Computerized Batch & Expiry Traceability</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Charaka Classical Formulation Authentic Verification</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>ABDM / Digital Health Record Compatibility</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                <h4 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <MortarPestleGraphic className="w-4 h-4 text-amber-600" />
                  <span>Top Prescribed Formulations</span>
                </h4>
                <div className="space-y-2 text-xs">
                  {['Ashwagandha Churna', 'Triphala Guggulu', 'Mahanarayana Taila', 'Khadirarishta'].map((m, i) => (
                    <div key={m} className="flex items-center justify-between py-1 border-b border-stone-100">
                      <span className="font-medium text-stone-800">{i + 1}. {m}</span>
                      <span className="font-mono text-purple-900 font-bold">High Demand</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: DAILY BODY ISSUES & AYURVEDIC ROGI TRACKER */}
        {/* ============================================================== */}
        {activeErpTab === 'body_issues' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, complaint, body area, herb..."
                  value={bodyIssueSearch}
                  onChange={(e) => setBodyIssueSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-xs sm:text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bodyIssueFilterSystem}
                  onChange={(e) => setBodyIssueFilterSystem(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                >
                  <option value="all">All Body Systems</option>
                  <option value="Spine">Spine & Joint Health (अस्थि-संधि)</option>
                  <option value="Digestive">Digestive & Gut (अग्नि-कोष्ठ)</option>
                  <option value="Mind">Mind, Stress & Sleep (मनोवह)</option>
                  <option value="Respiratory">Respiratory & Cold (प्राणवह)</option>
                  <option value="Skin">Skin & Complexion (त्वचा-रक्त)</option>
                </select>

                <select
                  value={bodyIssueFilterStatus}
                  onChange={(e) => setBodyIssueFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                >
                  <option value="all">All Statuses</option>
                  <option value="In-Progress">In-Progress</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Relieved">Relieved / Resolved</option>
                </select>

                <button
                  onClick={handleExportBodyIssuesCSV}
                  className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                {canEditClinical && (
                  <button
                    onClick={() => setIsAddBodyIssueModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-102"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Daily Issue</span>
                  </button>
                )}
              </div>
            </div>

            {/* Ayurvedic Clinical Guidance Banner */}
            <div className="bg-gradient-to-r from-teal-900/10 via-purple-900/5 to-amber-900/10 border border-teal-600/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <HeartPulse className="w-5 h-5 text-teal-200" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">Charaka Samhita Rogi Pariksha & Daily Health Ledger (रोगनिदान व दैनंदिन नोंदी)</h4>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Records daily somatic complaints, Doshic vitiation, Agni status, Nadi pulse, and prescribed classical herbal interventions with full clinical audit trail.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 font-mono text-[11px] font-bold">
                  {filteredBodyIssues.length} Active Records
                </span>
              </div>
            </div>

            {/* Mobile View: Cards (< 768px) */}
            <div className="md:hidden space-y-3">
              {filteredBodyIssues.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-2xl border border-stone-200">
                  <AlertCircle className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="font-bold text-stone-700 text-sm">No Daily Body Issue records found</p>
                  <p className="text-xs text-stone-400 mt-1">Try changing filters or log a new patient body issue.</p>
                </div>
              ) : (
                filteredBodyIssues.map(issue => (
                  <div key={issue.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1C1030] to-[#4A267A] text-amber-300 font-serif font-black flex items-center justify-center border border-purple-200 shadow-xs shrink-0 text-xs">
                          {(issue.patient_name || 'P').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">{issue.patient_name}</h4>
                          <p className="text-[11px] text-stone-500 font-mono">
                            {issue.patient_phone} · {issue.patient_age} yrs ({issue.gender})
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono shrink-0 ${
                        issue.status === 'Relieved' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : issue.status === 'Under Treatment'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-purple-100 text-purple-800 border border-purple-300'
                      }`}>
                        {issue.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 text-xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-teal-900">
                        <Activity className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span>{issue.body_system}</span>
                        <span className="text-[10px] text-stone-400 font-normal">({issue.symptoms_duration})</span>
                      </div>
                      <p className="text-stone-800 font-medium leading-relaxed">
                        {issue.chief_complaint}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <span className="text-stone-400 block text-[10px]">Dosha & Agni:</span>
                        <span className="font-bold text-purple-900">{issue.dosha_imbalance}</span>
                        <span className="text-stone-500 block text-[10px]">{issue.agni_status}</span>
                      </div>
                      <div className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                        <span className="text-stone-400 block text-[10px]">Vitals / Pulse:</span>
                        <span className="font-mono text-stone-800 font-medium block truncate">{issue.nadi_pulse}</span>
                        <span className="text-stone-500 block text-[10px] truncate">Tongue: {issue.jihva_tongue}</span>
                      </div>
                    </div>

                    {issue.daily_care_given && (
                      <div className="text-xs bg-teal-50/60 p-2.5 rounded-xl border border-teal-200/70 text-teal-950">
                        <span className="font-bold text-[10px] text-teal-800 uppercase tracking-wide block mb-0.5">Ayurvedic Protocol & Herbs:</span>
                        <p className="font-medium">{issue.daily_care_given}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                      <span className="text-[10px] text-stone-400">
                        Follow-up: <strong className="text-stone-700">{issue.followup_date || 'In 7 days'}</strong>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingBodyIssue(issue)}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 hover:bg-purple-100 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                        </button>

                        {canEditClinical && (
                          <>
                            <button
                              onClick={() => handleUpdateBodyIssueStatus(issue.id, issue.status === 'Relieved' ? 'In-Progress' : 'Relieved')}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                issue.status === 'Relieved'
                                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              }`}
                              title={issue.status === 'Relieved' ? 'Mark In-Progress' : 'Mark Relieved'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteBodyIssue(issue.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop View: Full Clinical Table (Screen >= 768px) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#FAF7F2] border-b border-stone-200 text-stone-600 font-bold uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4">Patient Profile</th>
                      <th className="py-3.5 px-3">Body Area & Chief Complaint</th>
                      <th className="py-3.5 px-3">Dosha & Agni</th>
                      <th className="py-3.5 px-3">Clinical Vitals</th>
                      <th className="py-3.5 px-3">Prescribed Ayurvedic Therapy</th>
                      <th className="py-3.5 px-3 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredBodyIssues.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-stone-400">
                          <p className="font-semibold text-xs">No matching Daily Body Issue records found.</p>
                          <p className="text-[10px] text-stone-400 mt-0.5">Use "Log Daily Issue" button above to record patient complaints.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredBodyIssues.map(issue => (
                        <tr key={issue.id} className="hover:bg-teal-50/20 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C1030] to-[#4A267A] text-amber-300 font-serif font-black flex items-center justify-center border border-purple-200 shadow-2xs shrink-0 text-xs">
                                {(issue.patient_name || 'P').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-stone-900 leading-tight">{issue.patient_name}</p>
                                <p className="text-[10px] text-stone-500 font-mono">
                                  {issue.patient_phone ? (issue.patient_phone.startsWith('+91') ? issue.patient_phone : `+91 ${issue.patient_phone}`) : '—'}
                                </p>
                                <p className="text-[10px] text-stone-400 font-medium">
                                  {issue.patient_age} yrs · {issue.gender}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 max-w-xs">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 font-bold text-[10px] mb-1">
                              {issue.body_system}
                            </span>
                            <p className="text-xs font-semibold text-stone-800 line-clamp-2 leading-relaxed">
                              {issue.chief_complaint}
                            </p>
                            <span className="text-[10px] text-stone-400 block mt-0.5">Duration: {issue.symptoms_duration}</span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px] inline-block mb-1">
                              {issue.dosha_imbalance}
                            </span>
                            <p className="text-[11px] text-stone-600 font-medium">{issue.agni_status}</p>
                            <span className={`text-[10px] font-bold ${
                              issue.severity === 'Severe' ? 'text-rose-600' : issue.severity === 'Moderate' ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              Severity: {issue.severity}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-xs">
                            <p className="font-mono text-stone-700 font-semibold">{issue.nadi_pulse}</p>
                            <p className="text-[10px] text-stone-500">Jihva: {issue.jihva_tongue}</p>
                            <p className="text-[10px] text-stone-400">Sleep: {issue.sleep_hours}</p>
                          </td>

                          <td className="py-3.5 px-3 max-w-xs text-xs">
                            <p className="font-medium text-teal-950 line-clamp-2 leading-relaxed bg-teal-50/70 p-2 rounded-lg border border-teal-200/50">
                              {issue.daily_care_given}
                            </p>
                            {issue.diet_instructions && (
                              <p className="text-[10px] text-stone-500 mt-1 line-clamp-1">Pathya: {issue.diet_instructions}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono inline-block ${
                              issue.status === 'Relieved' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                : issue.status === 'Under Treatment'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-purple-100 text-purple-800 border border-purple-300'
                            }`}>
                              {issue.status}
                            </span>
                            <p className="text-[10px] text-stone-400 mt-1 font-mono">Next: {issue.followup_date || '7 days'}</p>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingBodyIssue(issue)}
                                className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-100 transition-colors cursor-pointer"
                                title="View Rogi Pariksha Slip"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {canEditClinical && (
                                <>
                                  <button
                                    onClick={() => handleUpdateBodyIssueStatus(issue.id, issue.status === 'Relieved' ? 'In-Progress' : 'Relieved')}
                                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                      issue.status === 'Relieved'
                                        ? 'text-amber-700 hover:bg-amber-100'
                                        : 'text-emerald-700 hover:bg-emerald-100'
                                    }`}
                                    title={issue.status === 'Relieved' ? 'Mark In-Progress' : 'Mark Relieved'}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteBodyIssue(issue.id)}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ADD MEDICINE TO INVENTORY */}
      {/* ============================================================== */}
      {isAddMedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-900" />
                <span>Add Classical Medicine to Stock</span>
              </h3>
              <button onClick={() => setIsAddMedModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-3.5 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={medForm.name}
                    onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                    placeholder="e.g. Ashwagandha Churna"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Sanskrit Name</label>
                  <input
                    type="text"
                    value={medForm.sanskrit_name}
                    onChange={(e) => setMedForm({ ...medForm, sanskrit_name: e.target.value })}
                    placeholder="उदा. अश्वगंधा चूर्ण"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Ayurvedic Form</label>
                  <select
                    value={medForm.form}
                    onChange={(e) => setMedForm({ ...medForm, form: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <option value="Churna">Churna (Powder)</option>
                    <option value="Vati">Vati (Tablet/Gutika)</option>
                    <option value="Taila">Taila (Medicated Oil)</option>
                    <option value="Asava/Arishta">Asava / Arishta (Fermented Decoction)</option>
                    <option value="Ghruta">Ghruta (Medicated Ghee)</option>
                    <option value="Kwath">Kwath (Decoction)</option>
                    <option value="Bhasma">Bhasma (Purified Calx)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Therapeutic Category</label>
                  <input
                    type="text"
                    value={medForm.category}
                    onChange={(e) => setMedForm({ ...medForm, category: e.target.value })}
                    placeholder="e.g. Digestive & Agni"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Initial Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={medForm.stock_quantity}
                    onChange={(e) => setMedForm({ ...medForm, stock_quantity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    value={medForm.cost_price}
                    onChange={(e) => setMedForm({ ...medForm, cost_price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={medForm.selling_price}
                    onChange={(e) => setMedForm({ ...medForm, selling_price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Rack / Storage Location</label>
                  <input
                    type="text"
                    value={medForm.rack_location}
                    onChange={(e) => setMedForm({ ...medForm, rack_location: e.target.value })}
                    placeholder="e.g. Shelf B-2"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Pharmacy / Brand</label>
                  <input
                    type="text"
                    value={medForm.manufacturer}
                    onChange={(e) => setMedForm({ ...medForm, manufacturer: e.target.value })}
                    placeholder="Zeniva / Baidyanath / Kottakkal"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMedModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold cursor-pointer"
                >
                  Add Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CREATE PATIENT INVOICE */}
      {/* ============================================================== */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                <span>Generate Computerized Patient Bill</span>
              </h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={invForm.patient_name}
                    onChange={(e) => setInvForm({ ...invForm, patient_name: e.target.value })}
                    placeholder="e.g. Kamlesh Indurkar"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Patient Mobile Phone</label>
                  <input
                    type="text"
                    value={invForm.patient_phone}
                    onChange={(e) => setInvForm({ ...invForm, patient_phone: e.target.value })}
                    placeholder="+91 9011942126"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={invForm.consultation_fee}
                    onChange={(e) => setInvForm({ ...invForm, consultation_fee: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={invForm.discount}
                    onChange={(e) => setInvForm({ ...invForm, discount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">GST Tax Rate</label>
                  <select
                    value={invForm.gst_percent}
                    onChange={(e) => setInvForm({ ...invForm, gst_percent: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                  >
                    <option value="0">0% (Nil)</option>
                    <option value="5">5% (Ayurvedic Standard)</option>
                    <option value="12">12%</option>
                  </select>
                </div>
              </div>

              {/* Add Medicines from Stock */}
              <div className="border border-stone-200 rounded-2xl p-3 bg-stone-50">
                <label className="font-bold text-stone-800 block mb-2">Select Medicines From Pharmacy Stock:</label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {(erpData.inventory || []).slice(0, 8).map(med => {
                    const isSelected = invForm.selectedItems.some(i => i.id === med.id);
                    return (
                      <div key={med.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200 text-xs">
                        <div>
                          <p className="font-bold text-stone-900">{med.name} (Stock: {med.stock_quantity})</p>
                          <p className="text-[10px] text-stone-500">₹{med.selling_price} per {med.unit}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setInvForm({
                                ...invForm,
                                selectedItems: invForm.selectedItems.filter(i => i.id !== med.id)
                              });
                            } else {
                              setInvForm({
                                ...invForm,
                                selectedItems: [
                                  ...invForm.selectedItems,
                                  { id: med.id, name: med.name, type: 'medicine', qty: 1, rate: med.selling_price, total: med.selling_price }
                                ]
                              });
                            }
                          }}
                          className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                            isSelected ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-900'
                          }`}
                        >
                          {isSelected ? 'Remove' : '+ Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Payment Method</label>
                  <select
                    value={invForm.payment_mode}
                    onChange={(e) => setInvForm({ ...invForm, payment_mode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Payment Status</label>
                  <select
                    value={invForm.payment_status}
                    onChange={(e) => setInvForm({ ...invForm, payment_status: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
                  >
                    <option value="Paid">Paid (Full Receipt)</option>
                    <option value="Pending">Payment Pending</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer shadow-md"
                >
                  Generate & View Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: BOOK PANCHAKARMA SESSION */}
      {/* ============================================================== */}
      {isBookPkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>Schedule Panchakarma Therapy</span>
              </h3>
              <button onClick={() => setIsBookPkModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookPk} className="space-y-3.5 mt-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={pkForm.patient_name}
                  onChange={(e) => setPkForm({ ...pkForm, patient_name: e.target.value })}
                  placeholder="e.g. Aarav Patil"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Ayurvedic Therapy</label>
                <select
                  value={pkForm.therapy_name}
                  onChange={(e) => setPkForm({ ...pkForm, therapy_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
                >
                  <option value="Shirodhara (Medicated Oil Flow)">Shirodhara (Brahmi/Taila Continuous Stream)</option>
                  <option value="Janu Basti (Knee Joint Care)">Janu Basti (Warm Oil Retention for Joints)</option>
                  <option value="Kati Basti (Lumbar Spine Therapy)">Kati Basti (Lower Back Warm Pool)</option>
                  <option value="Sarvanga Abhyanga & Bashpa Swedana">Sarvanga Abhyanga & Herbal Steam Swedana</option>
                  <option value="Nasya Karma & Mukha Abhyanga">Nasya Karma (Nasal Detoxification)</option>
                  <option value="Virechana Karma Package">Virechana Karma (Metabolic Liver Cleansing)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Therapy Room / Suite</label>
                  <select
                    value={pkForm.room_name}
                    onChange={(e) => setPkForm({ ...pkForm, room_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <option value="Suite 1 - Shirodhara Hall">Suite 1 - Shirodhara Hall</option>
                    <option value="Suite 2 - Basti Unit">Suite 2 - Basti Unit</option>
                    <option value="Suite 3 - Droni Royal Suite">Suite 3 - Droni Royal Suite</option>
                    <option value="Suite 4 - Shalakya Cabin">Suite 4 - Shalakya Cabin</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Assigned Therapist</label>
                  <input
                    type="text"
                    value={pkForm.therapist_name}
                    onChange={(e) => setPkForm({ ...pkForm, therapist_name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Package Total Days</label>
                  <input
                    type="number"
                    min="1"
                    value={pkForm.days_total}
                    onChange={(e) => setPkForm({ ...pkForm, days_total: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Fee Per Session (₹)</label>
                  <input
                    type="number"
                    value={pkForm.charge_per_session}
                    onChange={(e) => setPkForm({ ...pkForm, charge_per_session: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookPkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: ADMIT PATIENT TO BED */}
      {/* ============================================================== */}
      {isAdmitIpdModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                <Bed className="w-5 h-5 text-purple-900" />
                <span>Admit Patient to IPD Bed</span>
              </h3>
              <button onClick={() => setIsAdmitIpdModalOpen(false)} className="p-1 rounded-full hover:bg-stone-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdmitIpd} className="space-y-3.5 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Select Available Bed</label>
                  <select
                    value={ipdForm.bed_number}
                    onChange={(e) => setIpdForm({ ...ipdForm, bed_number: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold"
                  >
                    {(erpData.ipd_beds || []).filter(b => b.is_occupied === 0).map(b => (
                      <option key={b.id} value={b.bed_number}>
                        {b.bed_number} ({b.ward_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Patient Constitution</label>
                  <input
                    type="text"
                    value={ipdForm.prakriti}
                    onChange={(e) => setIpdForm({ ...ipdForm, prakriti: e.target.value })}
                    placeholder="Vata-Pitta"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={ipdForm.patient_name}
                  onChange={(e) => setIpdForm({ ...ipdForm, patient_name: e.target.value })}
                  placeholder="e.g. Kamlesh Indurkar"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Ayurvedic Diet & Ahara Instructions</label>
                <input
                  type="text"
                  value={ipdForm.diet_instructions}
                  onChange={(e) => setIpdForm({ ...ipdForm, diet_instructions: e.target.value })}
                  placeholder="e.g. Mudga Yusha (Mung soup) with cow ghee"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdmitIpdModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-bold cursor-pointer"
                >
                  Admit Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: PRINTABLE COMPUTERIZED GST INVOICE */}
      {/* ============================================================== */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-in fade-in max-h-[95vh] overflow-y-auto print:p-0 print:border-0 print:shadow-none">
            {/* Action Bar (hidden in print) */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 print:hidden">
              <span className="text-xs font-mono text-purple-900 font-bold">Official Invoice Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="p-2 rounded-full hover:bg-stone-100 text-stone-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Official Hospital Receipt Container */}
            <div className="mt-4 p-6 rounded-2xl border border-stone-300/80 bg-white">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b-2 border-purple-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#1C1030] text-amber-300 flex items-center justify-center font-serif font-black text-lg">
                      Z
                    </div>
                    <h2 className="text-xl font-serif font-black text-stone-900 tracking-wide">
                      ZENIVA AYURVEDIC CLINICAL CENTER
                    </h2>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 font-medium">Department of Kayachikitsa, Panchakarma & Aushadhi Shala</p>
                  <p className="text-[11px] text-stone-500">Nagpur, Maharashtra · MCIM Reg: AYU-MAH-8921 · GSTIN: 27AABCS1429B1Z2</p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
                    TAX INVOICE
                  </span>
                  <p className="text-sm font-mono font-bold text-purple-900 mt-2">{viewingInvoice.invoice_no}</p>
                  <p className="text-[11px] text-stone-500">Date: {new Date(viewingInvoice.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Patient & Doctor Meta */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-stone-200 text-xs">
                <div>
                  <span className="text-stone-400 font-semibold block uppercase text-[10px]">Billed To Patient:</span>
                  <p className="font-bold text-stone-900 text-sm mt-0.5">{viewingInvoice.patient_name}</p>
                  <p className="text-stone-600">Mobile: {viewingInvoice.patient_phone || '+91 9011942126'}</p>
                  <p className="text-stone-500">Patient ID: {viewingInvoice.patient_id}</p>
                </div>

                <div className="text-right">
                  <span className="text-stone-400 font-semibold block uppercase text-[10px]">Attending Physician:</span>
                  <p className="font-bold text-stone-900 text-sm mt-0.5">{viewingInvoice.doctor_name || 'Dr. Sohil Indurkar'}</p>
                  <p className="text-stone-600">BAMS, MD (Ayurveda)</p>
                  <p className="text-emerald-700 font-semibold">Payment: {viewingInvoice.payment_mode} ({viewingInvoice.payment_status})</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left my-4 text-xs">
                <thead>
                  <tr className="border-b border-stone-300 text-stone-500 font-bold uppercase text-[10px]">
                    <th className="py-2">Item / Clinical Service</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Rate (₹)</th>
                    <th className="py-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {(viewingInvoice.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-sans font-medium text-stone-900">{it.name}</td>
                      <td className="py-2 text-center text-stone-600">{it.qty || 1}</td>
                      <td className="py-2 text-right text-stone-600">₹{it.rate}</td>
                      <td className="py-2 text-right font-bold text-stone-900">₹{it.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="border-t-2 border-stone-200 pt-3 text-xs space-y-1 text-stone-700">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">₹{viewingInvoice.consultation_fee + viewingInvoice.medicine_charges + viewingInvoice.panchakarma_charges}</span>
                </div>
                {viewingInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-mono font-bold">-₹{viewingInvoice.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-500">
                  <span>CGST (2.5%) + SGST (2.5%):</span>
                  <span className="font-mono">+₹{viewingInvoice.gst_amount}</span>
                </div>
                <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-200">
                  <span>Net Total Amount Paid:</span>
                  <span className="font-mono text-emerald-800 text-lg">₹{viewingInvoice.net_total}</span>
                </div>
              </div>

              {/* Signatures & Seal */}
              <div className="mt-8 pt-6 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                <div>
                  <p className="font-bold text-stone-800">Zeniva Pharmacy Seal</p>
                  <p>Certified Authentic Ayurvedic Care</p>
                </div>

                <div className="text-right">
                  <div className="font-serif italic font-bold text-purple-900 text-sm">Dr. Sohil Indurkar</div>
                  <p className="text-[10px] text-stone-500 border-t border-stone-300 pt-0.5 mt-0.5">Authorized Signatory / Medical Superintendent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 6: LOG DAILY BODY ISSUE & ROGI CLINICAL RECORD */}
      {/* ============================================================== */}
      {isAddBodyIssueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 animate-in fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-bold text-stone-900 leading-tight">
                    Log Ayurvedic Daily Body Issue (दैनिक शारीरिक विकार)
                  </h3>
                  <p className="text-[11px] text-stone-500">Charaka Samhita Rogi Pariksha & Clinical Symptoms Entry</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddBodyIssueModalOpen(false)} 
                className="p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Fill Button */}
            <div className="mt-3 flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-200/80 text-xs">
              <span className="text-stone-600 font-medium">Quick Fill Active Registered Patient:</span>
              <button
                type="button"
                onClick={() => {
                  try {
                    const patStr = localStorage.getItem('zeniva_patient_user');
                    if (patStr) {
                      const p = JSON.parse(patStr);
                      if (p && p.name) {
                        setBodyIssueForm(prev => ({
                          ...prev,
                          patient_name: p.name,
                          patient_phone: p.phone || prev.patient_phone,
                          patient_age: p.age || prev.patient_age,
                          gender: p.gender || prev.gender,
                          dosha_imbalance: p.prakriti || p.dosha || prev.dosha_imbalance
                        }));
                        showToast(`✓ Loaded data for ${p.name}`);
                      }
                    } else {
                      showToast('No logged in patient found in session');
                    }
                  } catch (e) {}
                }}
                className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Auto-fill Active Patient</span>
              </button>
            </div>

            <form onSubmit={handleCreateBodyIssue} className="space-y-3.5 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    value={bodyIssueForm.patient_name}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, patient_name: e.target.value })}
                    placeholder="e.g. Kamlesh Indurkar"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Mobile Number (+91)</label>
                  <input
                    type="tel"
                    value={bodyIssueForm.patient_phone}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, patient_phone: e.target.value })}
                    placeholder="e.g. +91 9011942126"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Age (Yrs)</label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    value={bodyIssueForm.patient_age}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, patient_age: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Gender</label>
                  <select
                    value={bodyIssueForm.gender}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, gender: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <option value="Male">Male (पुरुष)</option>
                    <option value="Female">Female (स्त्री)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Duration</label>
                  <input
                    type="text"
                    value={bodyIssueForm.symptoms_duration}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, symptoms_duration: e.target.value })}
                    placeholder="e.g. 4 Days / 2 Wks"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Body Area / Srotas System *</label>
                  <select
                    value={bodyIssueForm.body_system}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, body_system: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium"
                  >
                    <option value="Digestive & Gut Health (अग्नि-कोष्ठ)">Digestive & Gut Health (अग्नि-कोष्ठ)</option>
                    <option value="Spine & Joint Health (अस्थि-संधि)">Spine & Joint Health (अस्थि-संधि)</option>
                    <option value="Mind, Stress & Sleep (मनोवह स्रोतस)">Mind, Stress & Sleep (मनोवह स्रोतस)</option>
                    <option value="Respiratory & Immunity (प्राणवह स्रोतस)">Respiratory & Immunity (प्राणवह स्रोतस)</option>
                    <option value="Skin & Complexion (त्वचा-रक्त)">Skin & Complexion (त्वचा-रक्त)</option>
                    <option value="Metabolic & Vitality (ओज व धातु)">Metabolic & Vitality (ओज व धातु)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Severity Level</label>
                  <select
                    value={bodyIssueForm.severity}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, severity: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  >
                    <option value="Mild">Mild (सौम्य)</option>
                    <option value="Moderate">Moderate (मध्यम)</option>
                    <option value="Severe">Severe (तीव्र)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Daily Chief Complaint / Somatic Symptoms *</label>
                <textarea
                  rows={2}
                  required
                  value={bodyIssueForm.chief_complaint}
                  onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, chief_complaint: e.target.value })}
                  placeholder="e.g. Sharp pain in lower back on waking up, knee crepitus when bending, heaviness in stomach after lunch..."
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                ></textarea>
              </div>

              {/* Ayurvedic Examination Findings */}
              <div className="bg-stone-50/80 p-3 rounded-2xl border border-stone-200 space-y-3">
                <span className="font-bold text-stone-900 text-xs uppercase tracking-wide flex items-center gap-1.5 text-purple-900">
                  <MortarPestleGraphic className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ayurvedic Rogi Pariksha Parameters</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-stone-600 block mb-0.5 text-[11px] font-medium">Dosha Imbalance</label>
                    <select
                      value={bodyIssueForm.dosha_imbalance}
                      onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, dosha_imbalance: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 bg-white"
                    >
                      <option value="Vata (वात)">Vata (वात)</option>
                      <option value="Pitta (पित्त)">Pitta (पित्त)</option>
                      <option value="Kapha (कफ)">Kapha (कफ)</option>
                      <option value="Vata-Pitta">Vata-Pitta</option>
                      <option value="Pitta-Kapha">Pitta-Kapha</option>
                      <option value="Vata-Kapha">Vata-Kapha</option>
                      <option value="Tridoshaja">Tridoshaja (त्रिदोषज)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-600 block mb-0.5 text-[11px] font-medium">Agni (Digestion)</label>
                    <select
                      value={bodyIssueForm.agni_status}
                      onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, agni_status: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 bg-white"
                    >
                      <option value="Samagni (Balanced)">Samagni (Balanced)</option>
                      <option value="Mandagni (Sluggish)">Mandagni (Sluggish)</option>
                      <option value="Tikshnagni (Acidic)">Tikshnagni (Acidic)</option>
                      <option value="Vishamagni (Irregular)">Vishamagni (Irregular)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-600 block mb-0.5 text-[11px] font-medium">Nadi (Pulse)</label>
                    <input
                      type="text"
                      value={bodyIssueForm.nadi_pulse}
                      onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, nadi_pulse: e.target.value })}
                      placeholder="e.g. 74 bpm"
                      className="w-full p-2 rounded-lg border border-stone-200 bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-stone-600 block mb-0.5 text-[11px] font-medium">Tongue (Jihva)</label>
                    <select
                      value={bodyIssueForm.jihva_tongue}
                      onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, jihva_tongue: e.target.value })}
                      className="w-full p-2 rounded-lg border border-stone-200 bg-white"
                    >
                      <option value="Clean & Pink (Niraam)">Clean & Pink (Niraam)</option>
                      <option value="White Coated (Saam/Ama)">White Coated (Saam/Ama)</option>
                      <option value="Yellow/Red Coated (Pitta)">Yellow/Red Coated (Pitta)</option>
                      <option value="Dry & Fissured (Vata)">Dry & Fissured (Vata)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Prescribed Ayurvedic Formulation & Therapy</label>
                <input
                  type="text"
                  value={bodyIssueForm.daily_care_given}
                  onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, daily_care_given: e.target.value })}
                  placeholder="e.g. Avipattikar Churna (3g) before meals + Sthanika Abhyanga with warm oil"
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Pathya (Dietary Guidance)</label>
                  <input
                    type="text"
                    value={bodyIssueForm.diet_instructions}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, diet_instructions: e.target.value })}
                    placeholder="e.g. Warm mung dal, avoid spicy & fermented food"
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Next Follow-up Date</label>
                  <input
                    type="date"
                    value={bodyIssueForm.followup_date}
                    onChange={(e) => setBodyIssueForm({ ...bodyIssueForm, followup_date: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddBodyIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-bold shadow-md cursor-pointer transition-all"
                >
                  Save Daily Issue Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 7: VIEW / PRINT DAILY BODY ISSUE ROGI SLIP */}
      {/* ============================================================== */}
      {viewingBodyIssue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-in fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-mono font-bold text-purple-900 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Ayurvedic Clinical Case Sheet</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button onClick={() => setViewingBodyIssue(null)} className="p-1 rounded-full hover:bg-stone-100 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Slip Content */}
            <div className="mt-4 p-5 rounded-2xl bg-[#FCFAF6] border border-amber-200/80 font-sans space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#1C1030] flex items-center justify-center text-amber-300">
                    <ZenivaLogo className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-stone-900 text-base">Zeniva Ayurvedic Hospital & Research</h3>
                    <p className="text-[10px] text-stone-500">Statutory MCIM / AYUSH Certified Clinical Facility</p>
                  </div>
                </div>
                <div className="text-right text-[10px] font-mono text-stone-500">
                  <p>Case ID: <strong className="text-stone-900">{viewingBodyIssue.id}</strong></p>
                  <p>Date: {viewingBodyIssue.created_at ? new Date(viewingBodyIssue.created_at).toLocaleDateString('en-IN') : 'Today'}</p>
                </div>
              </div>

              {/* Patient Profile */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-white p-3 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px]">Patient:</span>
                  <span className="font-bold text-stone-900">{viewingBodyIssue.patient_name}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Phone:</span>
                  <span className="font-mono text-stone-800">{viewingBodyIssue.patient_phone || '—'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Age / Gender:</span>
                  <span className="text-stone-800">{viewingBodyIssue.patient_age} yrs ({viewingBodyIssue.gender})</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Status:</span>
                  <span className="font-bold text-emerald-800">{viewingBodyIssue.status}</span>
                </div>
              </div>

              {/* Chief Complaint */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block mb-1">
                  Body Area: {viewingBodyIssue.body_system}
                </span>
                <p className="font-medium text-stone-900 leading-relaxed">
                  {viewingBodyIssue.chief_complaint}
                </p>
              </div>

              {/* Rogi Pariksha Findings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-3 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-400 block text-[10px]">Dosha Imbalance:</span>
                  <span className="font-bold text-purple-900">{viewingBodyIssue.dosha_imbalance}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Agni Status:</span>
                  <span className="font-semibold text-stone-800">{viewingBodyIssue.agni_status}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Nadi Pulse:</span>
                  <span className="font-mono font-medium text-stone-800">{viewingBodyIssue.nadi_pulse}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">Tongue / Jihva:</span>
                  <span className="text-stone-800">{viewingBodyIssue.jihva_tongue}</span>
                </div>
              </div>

              {/* Prescribed Formulation */}
              {viewingBodyIssue.daily_care_given && (
                <div className="bg-teal-50 p-3 rounded-xl border border-teal-200 text-xs text-teal-950">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-900 block mb-1">
                    Prescribed Classical Ayurvedic Treatment & Formulation:
                  </span>
                  <p className="font-medium">{viewingBodyIssue.daily_care_given}</p>
                </div>
              )}

              {/* Diet & Lifestyle Guidance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {viewingBodyIssue.diet_instructions && (
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-400 block mb-0.5">Pathya (Diet Guidance):</span>
                    <p className="text-stone-800">{viewingBodyIssue.diet_instructions}</p>
                  </div>
                )}
                {viewingBodyIssue.lifestyle_advice && (
                  <div className="bg-white p-2.5 rounded-xl border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-400 block mb-0.5">Lifestyle Guidance:</span>
                    <p className="text-stone-800">{viewingBodyIssue.lifestyle_advice}</p>
                  </div>
                )}
              </div>

              {/* Footer & Signature */}
              <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-stone-500">
                <div>
                  <p>Next Follow-up: <strong className="text-stone-900">{viewingBodyIssue.followup_date || '7 Days'}</strong></p>
                  <p className="text-[10px] text-stone-400">Logged by: {viewingBodyIssue.logged_by || 'Dr. Sohil Indurkar'}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif italic font-bold text-purple-900 text-sm">Dr. Sohil Indurkar</p>
                  <p className="text-[10px] text-stone-400">Chief Ayurvedic Consultant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
