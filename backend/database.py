import sqlite3
import json
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "zeniva.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table (Comprehensive Patient & User Profiles)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        phone TEXT UNIQUE,
        name TEXT,
        email TEXT,
        age TEXT,
        gender TEXT,
        role TEXT DEFAULT 'patient', -- 'patient', 'doctor', 'super_admin'
        title TEXT,
        prakriti TEXT,
        vikriti TEXT,
        specialization TEXT,
        location TEXT,
        city TEXT,
        blood_group TEXT,
        diet TEXT,
        agribalam TEXT,
        avatar TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Dynamic Column Migration (Safely adds any missing profile columns without data loss)
    for col, ctype in [
        ("email", "TEXT"),
        ("age", "TEXT"),
        ("gender", "TEXT"),
        ("prakriti", "TEXT"),
        ("vikriti", "TEXT"),
        ("location", "TEXT"),
        ("city", "TEXT"),
        ("blood_group", "TEXT"),
        ("diet", "TEXT"),
        ("agribalam", "TEXT"),
        ("password_hash", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {ctype}")
        except Exception:
            pass

    # Admin Sessions / Tokens Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admin_sessions (
        token TEXT PRIMARY KEY,
        username TEXT,
        role TEXT DEFAULT 'SUPER_ADMIN',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Dedicated Registered Doctors Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY, -- Zeniva Doctor ID format: ZEN-DOC-XXXXXX
        phone TEXT UNIQUE,
        name TEXT,
        email TEXT,
        dob TEXT,
        gender TEXT,
        profession TEXT DEFAULT 'Ayurvedic Physician',
        role TEXT DEFAULT 'Consultant Vaidya',
        specialization TEXT,
        qualification TEXT,
        experience_years INTEGER DEFAULT 0,
        organization TEXT,
        city TEXT,
        council_name TEXT, -- e.g. Maharashtra Council of Indian Medicine
        council_reg_number TEXT, -- Official Government / State Council Reg No.
        documents_json TEXT, -- JSON holding uploaded certificate paths & names
        avatar TEXT,
        password_hash TEXT,
        status TEXT DEFAULT 'pending_verification', -- 'pending_verification', 'verified', 'rejected'
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP
    )
    """)

    # Dynamic Column Migration for Doctors Table
    for col, ctype in [
        ("email", "TEXT"),
        ("password_hash", "TEXT"),
        ("city", "TEXT"),
        ("organization", "TEXT"),
        ("specialization", "TEXT"),
        ("qualification", "TEXT"),
        ("avatar", "TEXT"),
        ("status", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE doctors ADD COLUMN {col} {ctype}")
        except Exception:
            pass

    # OTP Storage Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS otp_codes (
        phone TEXT PRIMARY KEY,
        otp_code TEXT,
        expires_at TIMESTAMP,
        verified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Patient Email Confirmations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_confirmations (
        email TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT,
        city TEXT,
        prakriti TEXT,
        password_hash TEXT,
        otp_code TEXT,
        token TEXT,
        expires_at TIMESTAMP,
        verified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Appointments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patient_name TEXT,
        doctor_name TEXT,
        date_time TEXT,
        type TEXT, -- 'Consultation', 'Follow-up'
        status TEXT, -- 'Upcoming', 'Completed', 'Cancelled'
        dosha_imbalance TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Doctor Review (Manual Photo & Clinical Review Queue)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS doctor_reviews (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        patient_name TEXT,
        doctor_name TEXT,
        image_url TEXT,
        symptoms TEXT,
        review_notes TEXT,
        status TEXT DEFAULT 'pending_doctor_review',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Dosha Assessments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dosha_assessments (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        user_name TEXT,
        vata INTEGER,
        pitta INTEGER,
        kapha INTEGER,
        primary_dosha TEXT,
        wellness_score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Classical Ayurvedic RAG Knowledge Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ayurvedic_corpus (
        id TEXT PRIMARY KEY,
        samhita TEXT,
        chapter TEXT,
        sutra_title TEXT,
        category TEXT,
        sanskrit_sloka TEXT,
        english_translation TEXT,
        indications TEXT,
        herbal_remedies TEXT,
        lifestyle_advice TEXT
    )
    """)

    # Real-Time Patient AI Chat Triage & Doctor Visibility Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_ai_chats (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        patient_name TEXT,
        phone TEXT,
        city TEXT,
        prakriti TEXT,
        primary_concern TEXT,
        dosha_imbalance TEXT,
        last_query TEXT,
        last_reply TEXT,
        messages_json TEXT,
        status TEXT DEFAULT 'pending_doctor_review',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Real-Time Targeted Doctor-to-Patient Notifications
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS targeted_notifications (
        id TEXT PRIMARY KEY,
        patient_id TEXT,
        patient_phone TEXT,
        patient_name TEXT,
        doctor_name TEXT,
        doctor_avatar TEXT,
        doctor_specialization TEXT,
        title TEXT,
        message TEXT,
        type TEXT DEFAULT 'doctor_message',
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # System Broadcast Video Table (Universal Cross-Browser Persistence)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_broadcasts (
        key TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 0,
        title TEXT,
        sanskrit TEXT,
        duration TEXT,
        url TEXT,
        desc TEXT,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # System Issues, Patient Grievances, Doctor Queries & Support Tickets Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_issues_and_tickets (
        id TEXT PRIMARY KEY,
        ticket_id TEXT UNIQUE,
        user_role TEXT DEFAULT 'guest',
        sender_name TEXT,
        sender_email TEXT,
        sender_phone TEXT,
        issue_category TEXT,
        subject TEXT,
        description TEXT,
        status TEXT DEFAULT 'open',
        notification_target_email TEXT DEFAULT 'contact.zeniva@gmail.com',
        notification_dispatched INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ----------------------------------------------------
    # ZENIVA AYURVEDIC HOSPITAL & CLINIC ERP TABLES
    # ----------------------------------------------------
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS erp_inventory (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sanskrit_name TEXT,
        form TEXT, -- Churna, Vati, Asava, Arishta, Taila, Ghruta, Kwath, Bhasma
        category TEXT, -- Digestive, Rasayana, Joints & Pain, Skin, Respiratory
        batch_no TEXT,
        mfg_date TEXT,
        expiry_date TEXT,
        stock_quantity INTEGER DEFAULT 0,
        min_threshold INTEGER DEFAULT 15,
        unit TEXT DEFAULT 'Bottles', -- Bottles, Tablets, Grams, Pack
        cost_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        rack_location TEXT DEFAULT 'Shelf A-1',
        manufacturer TEXT DEFAULT 'Zeniva Authentic Pharmacy',
        status TEXT DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS erp_invoices (
        id TEXT PRIMARY KEY,
        invoice_no TEXT UNIQUE,
        patient_name TEXT NOT NULL,
        patient_phone TEXT,
        patient_id TEXT,
        doctor_name TEXT DEFAULT 'Dr. Sohil Indurkar',
        consultation_fee REAL DEFAULT 500,
        medicine_charges REAL DEFAULT 0,
        panchakarma_charges REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        gst_amount REAL DEFAULT 0,
        net_total REAL NOT NULL,
        payment_mode TEXT DEFAULT 'UPI',
        payment_status TEXT DEFAULT 'Paid',
        items_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS erp_panchakarma (
        id TEXT PRIMARY KEY,
        patient_name TEXT NOT NULL,
        patient_phone TEXT,
        therapy_name TEXT NOT NULL,
        therapist_name TEXT,
        room_name TEXT,
        start_date TEXT,
        time_slot TEXT,
        days_total INTEGER DEFAULT 7,
        days_completed INTEGER DEFAULT 1,
        status TEXT DEFAULT 'Scheduled',
        notes TEXT,
        charge_per_session REAL DEFAULT 1500,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS erp_ipd_beds (
        id TEXT PRIMARY KEY,
        bed_number TEXT UNIQUE,
        ward_type TEXT,
        patient_name TEXT,
        patient_phone TEXT,
        admission_date TEXT,
        discharge_date TEXT,
        prakriti TEXT,
        assigned_doctor TEXT DEFAULT 'Dr. Sohil Indurkar',
        diet_instructions TEXT DEFAULT 'Peya & Mung Dal Yavagu with Cow Ghee',
        is_occupied INTEGER DEFAULT 0,
        daily_rate REAL DEFAULT 1800,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Seed Default Authentic Ayurvedic Medicine Stock if empty
    cursor.execute("SELECT COUNT(*) FROM erp_inventory")
    if cursor.fetchone()[0] == 0:
        sample_medicines = [
            ("med_1", "Ashwagandha Churna", "अश्वगंधा चूर्ण", "Churna", "Rasayana & Strength", "ASH-2026-B1", "2026-01-10", "2028-01-10", 65, 15, "100g Pack", 140, 220, "Rack R-1", "Zeniva Ayurvedic Herbals", "available"),
            ("med_2", "Triphala Guggulu", "त्रिफळा गुग्गुळ", "Vati", "Digestive & Detox", "TRI-2026-B4", "2026-02-15", "2029-02-15", 90, 20, "60 Tablets", 120, 195, "Rack D-2", "Baidyanath Ayurveda", "available"),
            ("med_3", "Mahanarayana Taila", "महानारायण तैल", "Taila", "Joints & Pain Relief", "MNT-2026-B2", "2026-01-20", "2029-01-20", 42, 10, "200ml Bottle", 210, 340, "Rack P-4", "Kottakkal Arya Vaidya Sala", "available"),
            ("med_4", "Khadirarishta", "खदिरारिष्ट", "Asava/Arishta", "Skin & Blood Purifier", "KHD-2026-B1", "2026-03-01", "2031-03-01", 38, 12, "450ml Bottle", 160, 260, "Rack S-3", "Dhootapapeshwar", "available"),
            ("med_5", "Brahmi Vati Gold", "ब्राह्मी वटी सुवर्णयुक्त", "Vati", "Mental Peace & Sleep", "BRH-2026-B9", "2026-02-10", "2029-02-10", 8, 10, "30 Tablets", 380, 580, "Rack M-1", "Zeniva Authentic Pharmacy", "low_stock"),
            ("med_6", "Dashamularishta", "दशमूलारिष्ट", "Asava/Arishta", "Vitality & Vata Balance", "DSM-2026-B3", "2026-01-05", "2031-01-05", 55, 15, "450ml Bottle", 175, 280, "Rack V-2", "Baidyanath Ayurveda", "available"),
            ("med_7", "Chandraprabha Vati", "चंद्रप्रभा वटी", "Vati", "Urinary & Metabolic", "CPV-2026-B7", "2026-02-22", "2029-02-22", 72, 15, "80 Tablets", 130, 210, "Rack U-1", "Dhootapapeshwar", "available"),
            ("med_8", "Sitopaladi Churna", "सितोपलादि चूर्ण", "Churna", "Respiratory & Cough", "STP-2026-B2", "2026-03-05", "2028-03-05", 50, 15, "100g Pack", 110, 175, "Rack R-3", "Zeniva Ayurvedic Herbals", "available"),
            ("med_9", "Kumkumadi Tailam", "कुंकुमादि तैलम्", "Taila", "Skin Radiance & Ojas", "KKM-2026-B5", "2026-02-18", "2028-02-18", 24, 8, "25ml Bottle", 450, 750, "Rack S-1", "Zeniva Luxury Herbals", "available"),
            ("med_10", "Gokshuradi Guggulu", "गोक्षुरादि गुग्गुळ", "Vati", "Renal & Joint Health", "GKG-2026-B8", "2026-01-12", "2029-01-12", 48, 12, "60 Tablets", 125, 205, "Rack U-2", "Kottakkal Arya Vaidya Sala", "available")
        ]
        cursor.executemany("""
        INSERT INTO erp_inventory (id, name, sanskrit_name, form, category, batch_no, mfg_date, expiry_date, stock_quantity, min_threshold, unit, cost_price, selling_price, rack_location, manufacturer, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_medicines)

    # Seed Default Panchakarma Room Scheduler if empty
    cursor.execute("SELECT COUNT(*) FROM erp_panchakarma")
    if cursor.fetchone()[0] == 0:
        sample_pk = [
            ("pk_1", "Aarav Patil", "+91 9822314567", "Shirodhara (Medicated Oil Flow)", "Vaidya Rajesh Sharma", "Suite 1 - Shirodhara Hall", "2026-09-28", "08:30 AM - 09:30 AM", 7, 3, "In-Progress", "Continuous Brahmi-Taila flow for chronic migraine & sleep", 1800),
            ("pk_2", "Sunita Deshmukh", "+91 9423112233", "Janu Basti (Knee Joint Care)", "Ananya Joshi (Therapist)", "Suite 2 - Basti Unit", "2026-09-29", "10:00 AM - 11:00 AM", 14, 5, "In-Progress", "Warm Mahanarayana taila pool for osteoarthritis", 1400),
            ("pk_3", "Kamlesh Indurkar", "+91 9011942126", "Sarvanga Abhyanga & Bashpa Swedana", "Dr. Sohil Indurkar", "Suite 3 - Droni Royal Suite", "2026-09-30", "07:00 AM - 08:30 AM", 5, 1, "Scheduled", "Full body detox herbal steam bath & vitalizing massage", 2200),
            ("pk_4", "Meera Kulkarni", "+91 9890123456", "Nasya Karma & Mukha Abhyanga", "Kavita Rao (Therapist)", "Suite 4 - Shalakya Cabin", "2026-09-29", "04:30 PM - 05:30 PM", 7, 6, "In-Progress", "Anu Taila instillation for sinusitis and cervical relief", 1100)
        ]
        cursor.executemany("""
        INSERT INTO erp_panchakarma (id, patient_name, patient_phone, therapy_name, therapist_name, room_name, start_date, time_slot, days_total, days_completed, status, notes, charge_per_session)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_pk)

    # Seed Hospital IPD Beds if empty
    cursor.execute("SELECT COUNT(*) FROM erp_ipd_beds")
    if cursor.fetchone()[0] == 0:
        sample_beds = [
            ("bed_1", "Bed 101", "Deluxe Ayurvedic Cottage", "Sunita Deshmukh", "+91 9423112233", "2026-09-25", "2026-10-02", "Vata-Kapha", "Dr. Sohil Indurkar", "Mudga Yusha (Mung soup) with Dashamula decoction", 1, 2800),
            ("bed_2", "Bed 102", "Deluxe Ayurvedic Cottage", None, None, None, None, None, "Dr. Sohil Indurkar", "Standard Sattvic Agni diet", 0, 2800),
            ("bed_3", "Bed 201", "Panchakarma Care Suite", "Aarav Patil", "+91 9822314567", "2026-09-27", "2026-10-04", "Pitta-Vata", "Dr. Sohil Indurkar", "Strict Ghritapana protocol, warm cow milk at bedtime", 1, 2200),
            ("bed_4", "Bed 202", "Panchakarma Care Suite", None, None, None, None, None, "Dr. Sohil Indurkar", "Standard Sattvic Agni diet", 0, 2200),
            ("bed_5", "Bed 301", "General Care Ward", None, None, None, None, None, "Dr. Sohil Indurkar", "Warm Kitchari & cumin water", 0, 1200),
            ("bed_6", "Bed 302", "General Care Ward", None, None, None, None, None, "Dr. Sohil Indurkar", "Warm Kitchari & cumin water", 0, 1200)
        ]
        cursor.executemany("""
        INSERT INTO erp_ipd_beds (id, bed_number, ward_type, patient_name, patient_phone, admission_date, discharge_date, prakriti, assigned_doctor, diet_instructions, is_occupied, daily_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_beds)

    # Seed Invoices if empty
    cursor.execute("SELECT COUNT(*) FROM erp_invoices")
    if cursor.fetchone()[0] == 0:
        sample_invs = [
            (
                "inv_1", "ZEN-INV-2026-001", "Kamlesh Indurkar", "+91 9011942126", "PAT-901194",
                "Dr. Sohil Indurkar", 500.0, 480.0, 2200.0, 180.0, 150.0, 3150.0, "UPI", "Paid",
                json.dumps([
                    {"name": "Consultation Fee (Dr. Sohil Indurkar)", "type": "consultation", "qty": 1, "rate": 500, "total": 500},
                    {"name": "Sarvanga Abhyanga & Bashpa Swedana", "type": "panchakarma", "qty": 1, "rate": 2200, "total": 2200},
                    {"name": "Ashwagandha Churna (100g)", "type": "medicine", "qty": 1, "rate": 220, "total": 220},
                    {"name": "Khadirarishta (450ml)", "type": "medicine", "qty": 1, "rate": 260, "total": 260}
                ])
            ),
            (
                "inv_2", "ZEN-INV-2026-002", "Sunita Deshmukh", "+91 9423112233", "PAT-942311",
                "Dr. Sohil Indurkar", 500.0, 340.0, 1400.0, 100.0, 107.0, 2247.0, "Cash", "Paid",
                json.dumps([
                    {"name": "Consultation Fee (Dr. Sohil Indurkar)", "type": "consultation", "qty": 1, "rate": 500, "total": 500},
                    {"name": "Janu Basti Therapy Session", "type": "panchakarma", "qty": 1, "rate": 1400, "total": 1400},
                    {"name": "Mahanarayana Taila (200ml)", "type": "medicine", "qty": 1, "rate": 340, "total": 340}
                ])
            )
        ]
        cursor.executemany("""
        INSERT INTO erp_invoices (id, invoice_no, patient_name, patient_phone, patient_id, doctor_name, consultation_fee, medicine_charges, panchakarma_charges, discount, gst_amount, net_total, payment_mode, payment_status, items_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_invs)

    # Seed permanent default active broadcast if empty or missing
    cursor.execute("SELECT COUNT(*) FROM system_broadcasts WHERE key = 'active_broadcast'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO system_broadcasts (key, enabled, title, sanskrit, duration, url, desc, published_at)
        VALUES (
            'active_broadcast', 
            1, 
            'Zeniva AI: Video Project Showcase', 
            '॥ आयुर्वेद एवं आधुनिक विज्ञान परिचय ॥', 
            '10:00 sec', 
            'http://127.0.0.1:8000/uploads/broadcast_db5be5d0.mp4', 
            'Welcome to Zeniva AI. Discover how authentic Charaka Samhita formulas and AI Clinical Health assessments work together with certified doctors.', 
            CURRENT_TIMESTAMP
        )
        """)

    # Ensure Super Admin exists by default
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'super_admin'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO users (id, phone, name, role, title, specialization, avatar) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ("usr_admin", "9800000000", "Super Admin", "super_admin", "Administrator", "System & Governance", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"))

    conn.commit()
    conn.close()

def reset_db_to_clean_slate():
    """Wipes all mock data so only live registered users exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM doctors")
    cursor.execute("DELETE FROM users WHERE role != 'super_admin'")
    cursor.execute("DELETE FROM appointments")
    cursor.execute("DELETE FROM doctor_reviews")
    cursor.execute("DELETE FROM dosha_assessments")
    conn.commit()
    conn.close()
    print("Database cleaned: All dummy doctors and patients removed.")

# Auto-initialize database tables and column migrations on import
try:
    init_db()
except Exception as e:
    print("[Database Init Warning]:", e)

if __name__ == "__main__":
    init_db()
    reset_db_to_clean_slate()
    print("Database initialized cleanly.")
