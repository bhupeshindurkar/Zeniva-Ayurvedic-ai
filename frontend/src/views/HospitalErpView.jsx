import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Building, Plus, Search, Filter, RefreshCw, 
  CheckCircle2, AlertTriangle, AlertCircle, Calendar, Clock, 
  User, DollarSign, FileText, Printer, Download, Eye, 
  Trash2, Edit, Save, X, Bed, Sparkles, Stethoscope, 
  Layers, ChevronRight, Activity, ArrowUpRight, TrendingUp,
  Package, ShieldCheck, Check, Phone, MapPin, Receipt,
  BadgePercent, FileSpreadsheet, Send, ArrowRight
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
  ]
};

export const HospitalErpView = ({ currentUser = {}, currentRole = 'doctor', onSelectTab = () => {} }) => {
  // Navigation sub-tabs inside ERP
  const [activeErpTab, setActiveErpTab] = useState('inventory'); // 'inventory' | 'billing' | 'panchakarma' | 'ipd' | 'analytics'
  const [erpData, setErpData] = useState(() => {
    try {
      const saved = localStorage.getItem('zeniva_hospital_erp_data');
      return saved ? JSON.parse(saved) : DEFAULT_ERP_DATA;
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

    const totalStockVal = inv.reduce((acc, curr) => acc + ((curr.stock_quantity || 0) * (curr.selling_price || 0)), 0);
    const lowStockCount = inv.filter(i => (i.stock_quantity || 0) <= (i.min_threshold || 10)).length;
    const totalRev = invs.filter(i => i.payment_status === 'Paid').reduce((acc, curr) => acc + (curr.net_total || 0), 0);
    const activePks = pks.filter(p => p.status === 'In-Progress' || p.status === 'Scheduled').length;
    const occupiedBeds = beds.filter(b => b.is_occupied === 1).length;

    return {
      totalMedicines: inv.length,
      lowStockCount,
      totalStockVal,
      totalRevenue: totalRev,
      activePks,
      occupiedBeds,
      totalBeds: beds.length,
      occupancyRate: beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0
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

  // --- ACTIONS ---
  // 1. Add Medicine
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!medForm.name.trim()) return;

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

  // 2. Adjust Stock Quantity
  const handleUpdateStock = async (medId, delta) => {
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

  // 3. Create Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invForm.patient_name.trim()) return;

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

  // 4. Book Panchakarma
  const handleBookPk = async (e) => {
    e.preventDefault();
    if (!pkForm.patient_name.trim()) return;

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

  // 5. Admit Patient to Bed
  const handleAdmitIpd = async (e) => {
    e.preventDefault();
    if (!ipdForm.patient_name.trim() || !ipdForm.bed_number) return;

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

  // 6. Discharge Patient from Bed
  const handleDischargeBed = async (bedNumber) => {
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

          <div className="flex flex-wrap items-center gap-2.5">
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
        </div>

        {/* Live Metrics Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
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

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
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

      {/* ERP SUB-NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 -mt-4 relative z-20">
        <div className="bg-white rounded-2xl p-1.5 shadow-md border border-stone-200/80 flex flex-wrap items-center gap-1">
          {[
            { id: 'inventory', label: '🌿 Aushadhi Bhandar (Pharmacy Stock)', badge: erpData.inventory?.length },
            { id: 'billing', label: '🧾 GST Billing & Invoices', badge: erpData.invoices?.length },
            { id: 'panchakarma', label: '💆‍♂️ Panchakarma Scheduler', badge: stats.activePks },
            { id: 'ipd', label: '🛏️ IPD Wards & Beds', badge: `${stats.occupiedBeds}/${stats.totalBeds}` },
            { id: 'analytics', label: '📊 Clinic Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveErpTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
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

            {/* Inventory Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200/80 overflow-hidden">
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
                      <th className="py-3.5 px-4 text-center">Stock Adjustment</th>
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">Hospital Invoicing & Patient Billing</h3>
                <p className="text-xs text-stone-500">Computerized, GST-compliant receipts with auto inventory stock deduction.</p>
              </div>

              <button
                onClick={() => setIsInvoiceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#1C1030] hover:bg-[#2B1245] text-[#F3EED9] text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Patient Bill</span>
              </button>
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">Panchakarma Therapy Theaters & Suites</h3>
                <p className="text-xs text-stone-500">Live booking for Shirodhara, Droni massage tables, Swedana steam & Basti packages.</p>
              </div>

              <button
                onClick={() => setIsBookPkModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#1C1030] hover:bg-[#2B1245] text-[#F3EED9] text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Book Panchakarma Session</span>
              </button>
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900">In-Patient Department (IPD) Ward & Bed Roster</h3>
                <p className="text-xs text-stone-500">Live bed allocation for Ayurvedic residential detoxification & panchakarma packages.</p>
              </div>

              <button
                onClick={() => setIsAdmitIpdModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#1C1030] hover:bg-[#2B1245] text-[#F3EED9] text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Admit Patient to Bed</span>
              </button>
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
                          <button
                            onClick={() => handleDischargeBed(b.bed_number)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer transition-colors"
                          >
                            Discharge
                          </button>
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
    </div>
  );
};
