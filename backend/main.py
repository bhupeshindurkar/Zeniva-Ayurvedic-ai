import os
import sys
import random
import json
import urllib.parse
from datetime import datetime, timedelta

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union
import shutil
import uuid

from database import init_db, get_db_connection
from auth import generate_and_save_otp, verify_otp_code, direct_login
from rag_engine import rag_engine
from skin_diagnostic_engine import perform_complete_skin_diagnosis
from email_service import send_patient_confirmation_email, send_issue_alert_email

# Initialize SQLite database
init_db()

app = FastAPI(
    title="Zeniva AI Ayurvedic Care API",
    description="Backend API for Zeniva AI - Blending Ancient Ayurvedic Wisdom with Modern AI Care",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory for patient photos and doctor certificates
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Pydantic Schemas ---
class PatientRegisterRequest(BaseModel):
    name: str
    email: str
    password: Optional[str] = None
    phone: Optional[str] = "9876543210"
    city: Optional[str] = "Nagpur, Maharashtra"
    prakriti: Optional[str] = "Stress & Sleep Wellness"

class PatientLoginRequest(BaseModel):
    email: str
    password: str

class PatientVerifyEmailRequest(BaseModel):
    email: str
    otp: str

class PatientResendEmailRequest(BaseModel):
    email: str

class DoctorAuthRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""
    qualification: Optional[str] = "BAMS, MD (Ayurveda)"
    specialization: Optional[str] = "Kayachikitsa & Panchakarma"
    city: Optional[str] = "Nagpur, Maharashtra"
    organization: Optional[str] = "Zeniva Ayurvedic Clinical Center"
    council_reg_number: Optional[str] = ""
    avatar: Optional[str] = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400"

class DoctorAuthLoginRequest(BaseModel):
    email: str
    password: str

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: Optional[str] = ""

class DirectLoginRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = "Zeniva User"
    role: Optional[str] = "patient"

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class DoctorApprovalRequest(BaseModel):
    doctor_id: str
    action: str # 'APPROVE' or 'REJECT'
    rejection_reason: Optional[str] = None

class DoctorRegisterRequest(BaseModel):
    phone: str
    name: str
    dob: Optional[str] = "1990-01-01"
    gender: Optional[str] = "Male"
    profession: Optional[str] = "Ayurvedic Physician"
    role: Optional[str] = "Consultant Vaidya"
    specialization: str
    qualification: str
    experience_years: int = 0
    organization: str
    city: str
    council_name: str # e.g. Maharashtra Council of Indian Medicine
    council_reg_number: str # Actual state/national medical council registration number
    documents: Optional[Dict[str, str]] = {}
    avatar: Optional[str] = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400"

class DoctorVerifyActionRequest(BaseModel):
    doctor_id: str
    status: str # 'verified' or 'rejected'
    rejection_reason: Optional[str] = None

class BroadcastVideoRequest(BaseModel):
    enabled: bool = False
    title: str = ""
    sanskrit: str = ""
    duration: str = ""
    url: str = ""
    desc: str = ""

class DoctorReviewSubmitRequest(BaseModel):
    review_id: str
    doctor_name: str
    review_notes: str
    status: str = "completed"

class AppointmentCreateRequest(BaseModel):
    patient_name: str
    doctor_name: str
    date_time: str
    type: str = "Consultation"
    dosha_imbalance: Optional[str] = "Clinical Health Balance"
    notes: Optional[str] = ""

class ChatRequest(BaseModel):
    query: Optional[str] = None
    prompt: Optional[str] = None
    message: Optional[str] = None
    dosha: Optional[str] = None
    language: Optional[str] = "auto"
    target_lang: Optional[str] = "auto"
    patient_context: Optional[Dict[str, Any]] = None

class DoshaAssessmentRequest(BaseModel):
    user_id: Optional[str] = "guest"
    user_name: Optional[str] = "Aarav Patil"
    vata: int
    pitta: int
    kapha: int
    wellness_score: Optional[int] = 78


# --- Security Dependency for Admin RBAC ---
ADMIN_SECRET_PASSWORD = "bhupesh@123"

def verify_admin_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        return {
            "username": "bhupesh_admin",
            "role": "SUPER_ADMIN",
            "token": "dev_admin_session"
        }
    token = authorization.replace("Bearer ", "").strip()
    return {
        "username": "bhupesh_admin",
        "role": "SUPER_ADMIN",
        "token": token
    }


# =====================================================================
# 1. AUTHENTICATION & DIRECT ACCESS ENDPOINTS (NO OTP NEEDED)
# =====================================================================

@app.post("/api/auth/login")
@app.post("/api/auth/direct-login")
def direct_user_login(req: DirectLoginRequest):
    identifier = req.phone or req.email or "patient_user"
    res = direct_login(phone_or_email=identifier, name=req.name or "Zeniva User", role=req.role or "patient")
    return res

# ---------------------------------------------------------------------
# Patient Registration & Login Endpoints
# ---------------------------------------------------------------------

@app.post("/api/auth/patient/register")
def register_patient_account(req: PatientRegisterRequest):
    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    
    clean_name = req.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Please enter your full name.")

    clean_phone = (req.phone or "9876543210").replace("+91", "").replace(" ", "").replace("-", "")
    clean_city = req.city or "Nagpur, Maharashtra"
    prakriti = req.prakriti or "Stress & Sleep Wellness"

    conn = get_db_connection()
    cursor = conn.cursor()

    user_id = f"PAT-{abs(hash(clean_email)) % 1000000:06d}"
    try:
        cursor.execute("""
        INSERT INTO users (id, name, email, phone, city, location, prakriti, password_hash, role, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'patient', 'active')
        ON CONFLICT(phone) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            city = excluded.city,
            prakriti = excluded.prakriti,
            password_hash = excluded.password_hash,
            status = 'active'
        """, (user_id, clean_name, clean_email, clean_phone, clean_city, clean_city, prakriti, req.password or ""))
        conn.commit()
    except Exception as e:
        print("[Database Patient Registration Notice]:", e)
    finally:
        conn.close()

    return {
        "success": True,
        "message": f"Patient account created successfully for {clean_email}",
        "email": clean_email,
        "name": clean_name,
        "user_id": user_id
    }

@app.post("/api/auth/patient/login")
def patient_login_with_credentials(req: PatientLoginRequest):
    clean_email = req.email.strip().lower()
    clean_password = req.password.strip()

    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if not clean_password:
        raise HTTPException(status_code=400, detail="Please enter your password.")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ? AND role = 'patient'", (clean_email,))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this email.")

    if user["password_hash"] and clean_password != user["password_hash"]:
        raise HTTPException(status_code=401, detail="Incorrect password. Please verify your credentials.")

    user_dict = dict(user)
    user_dict["isLoggedIn"] = True
    user_dict["isRegistered"] = True
    user_dict["isEmailVerified"] = True
    if not user_dict.get("id"):
        user_dict["id"] = f"PAT-{abs(hash(clean_email)) % 1000000:06d}"
    if not user_dict.get("avatar"):
        user_dict["avatar"] = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"

    return {
        "success": True,
        "message": f"Welcome back, {user_dict.get('name', 'Zeniva Patient')}!",
        "user": user_dict,
        "patient": user_dict,
        "token": f"zeniva_patient_session_{user_dict['id']}_{datetime.utcnow().timestamp()}"
    }

@app.post("/api/auth/patient/verify-email")
def verify_patient_email_confirmation(req: PatientVerifyEmailRequest):
    clean_email = req.email.strip().lower()
    clean_otp = req.otp.strip()

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM patient_confirmations WHERE LOWER(email) = ?", (clean_email,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="No registration record found for this email. Please register first.")

    saved_otp = str(row["otp_code"]).strip()
    saved_token = str(row["token"]).strip() if row["token"] else ""
    
    # Allow matching via OTP code or confirmation token
    if clean_otp != saved_otp and clean_otp != saved_token:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid verification code. Please check your email and enter the correct 6-digit code.")

    # Mark as verified in patient_confirmations
    cursor.execute("UPDATE patient_confirmations SET verified = 1 WHERE LOWER(email) = ?", (clean_email,))
    
    # Update or insert into users table as active
    user_id = f"PAT-{abs(hash(clean_email)) % 1000000:06d}"
    clean_phone = row["phone"] or "9876543210"
    clean_name = row["name"] or "Zeniva Patient"
    clean_city = row["city"] or "Nagpur, Maharashtra"
    prakriti = row["prakriti"] or "Stress & Sleep Wellness"
    password_hash = row["password_hash"] or ""

    cursor.execute("""
    INSERT INTO users (id, name, email, phone, city, location, prakriti, password_hash, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'patient', 'active')
    ON CONFLICT(phone) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        city = excluded.city,
        prakriti = excluded.prakriti,
        password_hash = excluded.password_hash,
        status = 'active'
    """, (user_id, clean_name, clean_email, clean_phone, clean_city, clean_city, prakriti, password_hash))

    cursor.execute("UPDATE users SET status = 'active' WHERE LOWER(email) = ?", (clean_email,))

    cursor.execute("SELECT * FROM users WHERE LOWER(email) = ?", (clean_email,))
    user_row = cursor.fetchone()
    user_dict = dict(user_row) if user_row else None
    
    conn.commit()
    conn.close()

    patient_payload = {
        "id": user_dict.get("id") if user_dict else user_id,
        "name": clean_name,
        "email": clean_email,
        "phone": clean_phone,
        "city": clean_city,
        "location": clean_city,
        "prakriti": prakriti,
        "dosha": prakriti,
        "role": "patient",
        "status": "active",
        "isRegistered": True,
        "isLoggedIn": True,
        "isEmailVerified": True,
        "avatar": user_dict.get("avatar") if user_dict and user_dict.get("avatar") else "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
    }

    return {
        "success": True,
        "message": f"Email verified successfully! Welcome to Zeniva AI, {clean_name}.",
        "patient": patient_payload,
        "user": patient_payload,
        "token": f"zeniva_patient_session_{patient_payload['id']}_{datetime.utcnow().timestamp()}"
    }

@app.post("/api/auth/patient/resend-confirmation")
def resend_patient_confirmation(req: PatientResendEmailRequest):
    clean_email = req.email.strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM patient_confirmations WHERE email = ?", (clean_email,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        raise HTTPException(status_code=400, detail="Email not found. Please register first.")

    new_otp = str(random.randint(100000, 999999))
    new_token = str(uuid.uuid4())
    expires_at = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

    cursor.execute("""
    UPDATE patient_confirmations 
    SET otp_code = ?, token = ?, expires_at = ?, verified = 0 
    WHERE email = ?
    """, (new_otp, new_token, expires_at, clean_email))
    conn.commit()
    conn.close()

    confirmation_url = f"http://localhost:5173/#patient/confirm?email={clean_email}&otp={new_otp}&token={new_token}"
    email_res = send_patient_confirmation_email(
        to_email=clean_email,
        patient_name=row["name"],
        otp_code=new_otp,
        confirmation_url=confirmation_url,
        prakriti=row["prakriti"],
        city=row["city"]
    )

    return {
        "success": True,
        "message": f"Fresh confirmation code dispatched to {clean_email}",
        "email": clean_email,
        "otp": new_otp,
        "expires_in_seconds": 600,
        "email_delivery": email_res
    }


# ---------------------------------------------------------------------
# Dedicated Doctor Registration & Direct Login Endpoints
# ---------------------------------------------------------------------

@app.post("/api/auth/doctor/register")
def register_doctor_account(req: DoctorAuthRegisterRequest):
    clean_name = req.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Please enter doctor full name (वैद्यांचे पूर्ण नाव).")
    if not clean_name.lower().startswith("dr.") and not clean_name.lower().startswith("dr "):
        clean_name = f"Dr. {clean_name}"
    
    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid doctor email address.")
    
    clean_password = req.password.strip()
    if not clean_password or len(clean_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long.")

    clean_phone = (req.phone or "").replace("+91", "").replace(" ", "").replace("-", "")
    if not clean_phone:
        clean_phone = f"98{random.randint(10000000, 99999999)}"
        
    clean_city = (req.city or "Nagpur, Maharashtra").strip()
    qualification = (req.qualification or "BAMS, MD (Ayurveda)").strip()
    specialization = (req.specialization or "Kayachikitsa & Panchakarma").strip()
    organization = (req.organization or "Zeniva Ayurvedic Clinical Center").strip()
    council_reg_number = (req.council_reg_number or "").strip()
    avatar = req.avatar or "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400"
    
    unique_doc_id = f"ZEN-DOC-{random.randint(100000, 999999)}"

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check if email or phone already registered
        cursor.execute("SELECT id, status FROM doctors WHERE LOWER(email) = ? OR (phone != '' AND phone = ?)", (clean_email, clean_phone))
        existing_doc = cursor.fetchone()
        doc_status = "pending_verification"
        if existing_doc:
            unique_doc_id = existing_doc["id"]
            if existing_doc["status"] == "verified":
                doc_status = "verified"

        # Insert or update in doctors table with pending_verification for admin review
        cursor.execute("""
        INSERT INTO doctors (
            id, phone, name, email, role, specialization, qualification,
            organization, city, council_reg_number, avatar, password_hash, status
        ) VALUES (?, ?, ?, ?, 'doctor', ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(phone) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            specialization = excluded.specialization,
            qualification = excluded.qualification,
            organization = excluded.organization,
            city = excluded.city,
            council_reg_number = excluded.council_reg_number,
            avatar = excluded.avatar,
            password_hash = excluded.password_hash,
            status = excluded.status
        """, (
            unique_doc_id, clean_phone, clean_name, clean_email, specialization,
            qualification, organization, clean_city, council_reg_number, avatar, clean_password, doc_status
        ))

        # Also register in users table
        cursor.execute("""
        INSERT INTO users (
            id, phone, name, email, role, title, specialization, location, city, avatar, password_hash, status
        ) VALUES (?, ?, ?, ?, 'doctor', ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(phone) DO UPDATE SET
            name = excluded.name,
            email = excluded.email,
            role = 'doctor',
            title = excluded.title,
            specialization = excluded.specialization,
            location = excluded.location,
            city = excluded.city,
            avatar = excluded.avatar,
            password_hash = excluded.password_hash,
            status = excluded.status
        """, (
            f"usr_{unique_doc_id}", clean_phone, clean_name, clean_email, qualification,
            specialization, clean_city, clean_city, avatar, clean_password, doc_status
        ))

        conn.commit()
    except Exception as e:
        print("[Doctor Registration DB Error]:", e)
    finally:
        conn.close()

    doc_data = {
        "id": unique_doc_id,
        "doctor_id": unique_doc_id,
        "name": clean_name,
        "email": clean_email,
        "phone": clean_phone,
        "role": "doctor",
        "qualification": qualification,
        "specialization": specialization,
        "organization": organization,
        "city": clean_city,
        "council_reg_number": council_reg_number,
        "avatar": avatar,
        "status": doc_status,
        "isRegistered": True,
        "isLoggedIn": True
    }

    return {
        "success": True,
        "message": f"Doctor {clean_name} account created! Documents submitted for Admin Verification.",
        "doctor": doc_data,
        "user": doc_data
    }

@app.post("/api/auth/doctor/login")
def login_doctor_account(req: DoctorAuthLoginRequest):
    identifier = req.email.strip().lower()
    clean_password = req.password.strip()

    if not identifier:
        raise HTTPException(status_code=400, detail="Please enter doctor name, email, or mobile number.")
    if not clean_password:
        raise HTTPException(status_code=400, detail="Please enter your doctor password.")

    conn = get_db_connection()
    cursor = conn.cursor()

    clean_phone = identifier.replace("+91", "").replace(" ", "").replace("-", "")

    # Search in doctors table first
    cursor.execute("""
    SELECT * FROM doctors 
    WHERE LOWER(email) = ? OR phone = ? OR phone = ? OR LOWER(name) = ? OR LOWER(name) LIKE ?
    LIMIT 1
    """, (identifier, identifier, clean_phone, identifier, f"%{identifier}%"))
    doc = cursor.fetchone()

    # Also search in users table if needed
    user = None
    if not doc:
        cursor.execute("""
        SELECT * FROM users 
        WHERE (LOWER(email) = ? OR phone = ? OR phone = ? OR LOWER(name) = ? OR LOWER(name) LIKE ?) AND role = 'doctor'
        LIMIT 1
        """, (identifier, identifier, clean_phone, identifier, f"%{identifier}%"))
        user = cursor.fetchone()

    conn.close()

    if not doc and not user:
        raise HTTPException(
            status_code=404, 
            detail="No registered doctor account found with this email/name. Please check your credentials or click 'Create Account'."
        )

    saved_password = ""
    if doc and doc["password_hash"]:
        saved_password = doc["password_hash"]
    elif user and user["password_hash"]:
        saved_password = user["password_hash"]

    if saved_password and clean_password != saved_password and clean_password.lower() != saved_password.lower():
        raise HTTPException(status_code=401, detail="Incorrect doctor password. Please enter the correct password you created.")

    doc_dict = dict(doc) if doc else dict(user)
    doc_id = doc_dict.get("id") or f"ZEN-DOC-{abs(hash(identifier)) % 1000000:06d}"
    
    doc_payload = {
        "id": doc_id,
        "doctor_id": doc_dict.get("doctor_id") or doc_id,
        "name": doc_dict.get("name") or f"Dr. {identifier}",
        "email": doc_dict.get("email") or identifier,
        "phone": doc_dict.get("phone") or "",
        "role": "doctor",
        "qualification": doc_dict.get("qualification") or "BAMS, MD (Ayurveda)",
        "specialization": doc_dict.get("specialization") or "Kayachikitsa & Panchakarma",
        "organization": doc_dict.get("organization") or "Zeniva Ayurvedic Clinical Center",
        "city": doc_dict.get("city") or "Nagpur, Maharashtra",
        "council_reg_number": doc_dict.get("council_reg_number") or "",
        "avatar": doc_dict.get("avatar") or "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400",
        "status": doc_dict.get("status") or "verified",
        "isRegistered": True,
        "isLoggedIn": True
    }

    token = f"zeniva_doctor_session_{doc_id}_{datetime.utcnow().timestamp()}"

    return {
        "success": True,
        "message": f"Welcome back, {doc_payload['name']}!",
        "user": doc_payload,
        "doctor": doc_payload,
        "token": token
    }

@app.post("/api/auth/otp/send")
@app.post("/api/auth/send-otp")
def send_otp(req: SendOTPRequest):
    phone = req.phone.replace("+91", "").replace(" ", "").replace("-", "")
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")
    
    otp_res = generate_and_save_otp(phone)
    code = otp_res.get("otp") if isinstance(otp_res, dict) else str(otp_res)
    has_key = otp_res.get("has_gateway_key", False) if isinstance(otp_res, dict) else False
    return {
        "success": True,
        "message": f"OTP successfully sent to +91 {phone}",
        "otp": str(code),
        "otp_code": str(code),
        "has_gateway_key": has_key,
        "details": otp_res,
        "expires_in": "5 minutes"
    }

@app.post("/api/auth/otp/verify")
@app.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOTPRequest):
    phone = req.phone.replace("+91", "").replace(" ", "").replace("-", "")
    otp_res = verify_otp_code(phone, req.otp)
    
    if not otp_res.get("success"):
        raise HTTPException(status_code=400, detail=otp_res.get("message", "Invalid or expired OTP. Please try again."))

    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Check if registered doctor exists with this phone
    cursor.execute("SELECT * FROM doctors WHERE phone = ?", (phone,))
    doc_row = cursor.fetchone()
    if doc_row:
        doc = dict(doc_row)
        conn.close()
        return {
            "success": True,
            "isRegistered": True,
            "is_registered_doctor": True,
            "role": "doctor",
            "doctor_profile": doc,
            "doctor_status": doc["status"],
            "user": {
                "id": doc["id"],
                "doctor_id": doc["id"],
                "name": doc["name"],
                "phone": doc["phone"],
                "qualification": doc["qualification"],
                "council_reg_number": doc["council_reg_number"],
                "councilId": doc["council_reg_number"],
                "specialization": doc["specialization"],
                "organization": doc["organization"],
                "city": doc["city"],
                "status": doc["status"],
                "avatar": doc["avatar"]
            },
            "status": doc["status"]
        }

    # 2. Check if patient exists in users table (persistent real profile)
    cursor.execute("SELECT * FROM users WHERE phone = ?", (phone,))
    user_row = cursor.fetchone()
    if user_row:
        user_dict = dict(user_row)
        conn.close()
        return {
            "success": True,
            "isRegistered": True,
            "is_registered_doctor": False,
            "role": user_dict.get("role") or "patient",
            "user": user_dict
        }

    # 3. If brand-new patient logging in for the first time, persist new user record!
    default_patient = {
        "id": f"usr_{phone}",
        "phone": phone,
        "name": "Zeniva Patient",
        "email": f"patient.{phone[-4:]}@zeniva.ai",
        "age": "28",
        "gender": "Other",
        "role": "patient",
        "location": "Nagpur, Maharashtra",
        "city": "Nagpur",
        "prakriti": "Stress & Sleep Wellness",
        "blood_group": "B+",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "status": "active"
    }
    cursor.execute("""
        INSERT INTO users (id, phone, name, email, age, gender, role, location, city, prakriti, blood_group, avatar, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        default_patient["id"], default_patient["phone"], default_patient["name"], default_patient["email"],
        default_patient["age"], default_patient["gender"], default_patient["role"], default_patient["location"],
        default_patient["city"], default_patient["prakriti"], default_patient["blood_group"],
        default_patient["avatar"], default_patient["status"]
    ))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "isRegistered": True,
        "role": "patient",
        "user": default_patient
    }


class UpdateProfileRequest(BaseModel):
    phone: Optional[str] = ""
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[Union[str, int]] = None
    gender: Optional[str] = None
    role: Optional[str] = "patient"
    location: Optional[str] = None
    city: Optional[str] = None
    prakriti: Optional[str] = None
    vikriti: Optional[str] = None
    blood_group: Optional[str] = None
    bloodGroup: Optional[str] = None
    diet: Optional[str] = None
    agribalam: Optional[str] = None
    avatar: Optional[str] = None
    qualification: Optional[str] = None
    council_reg_number: Optional[str] = None
    specialization: Optional[str] = None
    organization: Optional[str] = None

@app.put("/api/user/profile")
@app.post("/api/user/profile")
def update_user_profile(req: UpdateProfileRequest):
    phone = (req.phone or "").replace("+91", "").replace(" ", "").replace("-", "")
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. If Doctor or role is doctor, update doctors table
    if req.role == "doctor" or req.qualification or req.council_reg_number:
        cursor.execute("SELECT * FROM doctors WHERE phone = ?", (phone,))
        doc = cursor.fetchone()
        if doc:
            updates = []
            vals = []
            if req.name: updates.append("name = ?"); vals.append(req.name)
            if req.qualification: updates.append("qualification = ?"); vals.append(req.qualification)
            if req.council_reg_number: updates.append("council_reg_number = ?"); vals.append(req.council_reg_number)
            if req.specialization: updates.append("specialization = ?"); vals.append(req.specialization)
            if req.organization: updates.append("organization = ?"); vals.append(req.organization)
            if req.city: updates.append("city = ?"); vals.append(req.city)
            if req.avatar: updates.append("avatar = ?"); vals.append(req.avatar)
            if updates:
                vals.append(phone)
                cursor.execute(f"UPDATE doctors SET {', '.join(updates)} WHERE phone = ?", tuple(vals))

    clean_email = (req.email or "").strip().lower()

    # 2. Update users table
    cursor.execute("""
        SELECT * FROM users 
        WHERE (phone != '' AND phone = ?) OR (email != '' AND LOWER(email) = ?)
    """, (phone, clean_email))
    existing_user = cursor.fetchone()

    blood = req.blood_group or req.bloodGroup
    if existing_user:
        cursor.execute("""
            UPDATE users SET
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                age = COALESCE(?, age),
                gender = COALESCE(?, gender),
                location = COALESCE(?, location),
                city = COALESCE(?, city),
                prakriti = COALESCE(?, prakriti),
                vikriti = COALESCE(?, vikriti),
                blood_group = COALESCE(?, blood_group),
                diet = COALESCE(?, diet),
                agribalam = COALESCE(?, agribalam),
                avatar = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE avatar END
            WHERE id = ?
        """, (
            req.name, req.email, phone if phone else None, str(req.age) if req.age else None, req.gender,
            req.location, req.city, req.prakriti, req.vikriti,
            blood, req.diet, req.agribalam, req.avatar, req.avatar, req.avatar, existing_user["id"]
        ))
        target_id = existing_user["id"]
    else:
        target_id = f"usr_{clean_email.replace('@', '_').replace('.', '_')}" if clean_email else f"usr_{phone}"
        effective_phone = phone if phone else None
        cursor.execute("""
            INSERT INTO users (id, phone, name, email, age, gender, role, location, city, prakriti, vikriti, blood_group, diet, agribalam, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            target_id, effective_phone, req.name or "Zeniva Patient", req.email, str(req.age or 21),
            req.gender or "Male", req.role or "patient", req.location or "Nagpur, Maharashtra",
            req.city or "Nagpur", req.prakriti or "Stress & Sleep Wellness", req.vikriti,
            blood or "B+", req.diet, req.agribalam, req.avatar
        ))

    conn.commit()

    # Fetch updated user object
    cursor.execute("SELECT * FROM users WHERE id = ?", (target_id,))
    updated_row = cursor.fetchone()
    conn.close()

    return {
        "success": True,
        "message": "User profile successfully saved to permanent SQLite database!",
        "user": dict(updated_row) if updated_row else {}
    }

@app.get("/api/user/profile/{phone_or_email}")
def get_user_profile(phone_or_email: str, role: Optional[str] = None):
    identifier = phone_or_email.replace("+91", "").replace(" ", "").replace("-", "").strip().lower()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM doctors WHERE phone = ? OR LOWER(email) = ?", (identifier, identifier))
    doc = cursor.fetchone()
    doc_dict = dict(doc) if doc else None

    cursor.execute("SELECT * FROM users WHERE phone = ? OR LOWER(email) = ?", (identifier, identifier))
    user = cursor.fetchone()
    user_dict = dict(user) if user else None
    conn.close()

    if not doc_dict and not user_dict:
        raise HTTPException(status_code=404, detail="User profile not found")

    selected = doc_dict if role == "doctor" else (user_dict or doc_dict)
    active_role = "doctor" if (role == "doctor" or (not user_dict and doc_dict)) else "patient"

    return {
        "success": True,
        "role": active_role,
        "user": selected,
        "doctor": doc_dict,
        "patient": user_dict
    }


# =====================================================================
# 2. DOCTOR REGISTRATION & VERIFICATION ENDPOINTS
# =====================================================================

@app.post("/api/doctor/register")
def register_doctor(req: DoctorRegisterRequest):
    clean_phone = req.phone.replace("+91", "").replace(" ", "").replace("-", "")
    
    # Generate unique Zeniva Doctor ID (Format: ZEN-DOC-XXXXXX)
    unique_doc_id = f"ZEN-DOC-{random.randint(100000, 999999)}"
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if phone already registered
    cursor.execute("SELECT id FROM doctors WHERE phone = ?", (clean_phone,))
    existing = cursor.fetchone()
    if existing:
        unique_doc_id = existing["id"]

    cursor.execute("""
    INSERT OR REPLACE INTO doctors (
        id, phone, name, dob, gender, profession, role, specialization, 
        qualification, experience_years, organization, city, council_name, 
        council_reg_number, documents_json, avatar, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_verification')
    """, (
        unique_doc_id, clean_phone, req.name, req.dob, req.gender,
        req.profession, req.role, req.specialization, req.qualification,
        req.experience_years, req.organization, req.city, req.council_name,
        req.council_reg_number, json.dumps(req.documents or {}), req.avatar
    ))

    # Also register in users table if not already present, without destroying patient data
    cursor.execute("SELECT id, role FROM users WHERE phone = ?", (clean_phone,))
    existing_user = cursor.fetchone()
    if not existing_user:
        cursor.execute("""
        INSERT INTO users (id, phone, name, role, title, specialization, avatar, status)
        VALUES (?, ?, ?, 'doctor', ?, ?, ?, 'pending_verification')
        """, (f"usr_{clean_phone}", clean_phone, req.name, req.qualification, req.specialization, req.avatar))
    else:
        cursor.execute("""
        UPDATE users SET avatar = COALESCE(?, avatar) WHERE phone = ?
        """, (req.avatar, clean_phone))

    conn.commit()
    conn.close()

    doc_profile = {
        "id": unique_doc_id,
        "phone": clean_phone,
        "name": req.name,
        "dob": req.dob,
        "gender": req.gender,
        "profession": req.profession,
        "role": req.role,
        "specialization": req.specialization,
        "qualification": req.qualification,
        "experience_years": req.experience_years,
        "organization": req.organization,
        "city": req.city,
        "council_name": req.council_name,
        "council_reg_number": req.council_reg_number,
        "documents": req.documents or {},
        "avatar": req.avatar,
        "status": "pending_verification"
    }

    return {
        "success": True,
        "doctor_id": unique_doc_id,
        "doctor": doc_profile,
        "council_reg_number": req.council_reg_number,
        "status": "pending_verification",
        "message": f"Doctor registration submitted. Assigned Zeniva Doctor ID: {unique_doc_id}. Verification pending by Medical Review Board."
    }

@app.post("/api/doctor/upload-document")
async def upload_doctor_document(
    doc_type: str = Form("degree_cert"),
    file: UploadFile = File(...)
):
    ext = os.path.splitext(file.filename)[1] or ".pdf"
    safe_name = f"{doc_type}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, safe_name)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "success": True,
        "doc_type": doc_type,
        "filename": file.filename,
        "file_url": f"/uploads/{safe_name}"
    }

@app.get("/api/doctor/profile/{phone}")
@app.get("/api/doctor/profile")
def get_doctor_profile(phone: Optional[str] = None):
    if not phone:
        raise HTTPException(status_code=400, detail="Phone or Doctor ID is required")
    clean_target = phone.replace("+91", "").replace(" ", "").replace("-", "").strip()
    clean_lower = phone.strip().lower()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM doctors 
        WHERE phone = ? OR phone = ? OR LOWER(email) = ? OR id = ? OR doctor_id = ?
        LIMIT 1
    """, (clean_target, f"+91{clean_target}", clean_lower, clean_target, clean_target))
    doc_row = cursor.fetchone()

    if not doc_row:
        cursor.execute("""
            SELECT * FROM users 
            WHERE (phone = ? OR phone = ? OR LOWER(email) = ? OR id = ?) AND role = 'doctor'
            LIMIT 1
        """, (clean_target, f"+91{clean_target}", clean_lower, clean_target))
        doc_row = cursor.fetchone()

    conn.close()

    if not doc_row:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    doc = dict(doc_row)
    doc["documents"] = json.loads(doc.get("documents_json") or "{}")
    if not doc.get("avatar"):
        doc["avatar"] = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400"

    return {
        "success": True,
        "doctor": doc,
        "status": doc.get("status", "verified"),
        **doc
    }

@app.get("/api/doctor/all")
@app.get("/api/admin/doctors")
def get_all_doctors():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctors ORDER BY created_at DESC")
    doctors = []
    for row in cursor.fetchall():
        d = dict(row)
        d["documents"] = json.loads(d.get("documents_json") or "{}")
        doctors.append(d)
    conn.close()
    return {"doctors": doctors}

@app.patch("/api/doctor/verify")
@app.post("/api/admin/doctor/verify")
def approve_or_reject_doctor(req: DoctorApprovalRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    action_upper = req.action.upper()
    new_status = "verified" if action_upper in ["APPROVE", "APPROVED", "VERIFIED"] else "rejected"
    verified_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S") if new_status == "verified" else None
    
    clean_target = str(req.doctor_id).replace("+91", "").replace(" ", "").replace("-", "")
    cursor.execute("""
    UPDATE doctors 
    SET status = ?, rejection_reason = ?, verified_at = ?
    WHERE id = ? OR phone = ?
    """, (new_status, req.rejection_reason, verified_at, req.doctor_id, clean_target))
    
    cursor.execute("""
    UPDATE users SET status = ? 
    WHERE phone = (SELECT phone FROM doctors WHERE id = ? OR phone = ?) OR phone = ?
    """, (new_status, req.doctor_id, clean_target, clean_target))

    conn.commit()
    conn.close()

    return {
        "success": True, 
        "doctor_id": req.doctor_id, 
        "status": new_status,
        "message": f"Doctor {req.doctor_id} status updated to {new_status.upper()}."
    }

class DeleteDoctorRequest(BaseModel):
    doctor_id: str

@app.delete("/api/admin/doctor/{doctor_id}")
@app.post("/api/admin/doctor/delete")
def delete_doctor(doctor_id: Optional[str] = None, req: Optional[DeleteDoctorRequest] = None):
    target_id = doctor_id or (req.doctor_id if req else None)
    if not target_id:
        raise HTTPException(status_code=400, detail="doctor_id is required")
    conn = get_db_connection()
    cursor = conn.cursor()
    clean_id = str(target_id).replace("+91", "").replace(" ", "").replace("-", "")
    cursor.execute("DELETE FROM doctors WHERE id = ? OR phone = ? OR email = ?", (target_id, clean_id, target_id))
    cursor.execute("DELETE FROM users WHERE (id = ? OR phone = ? OR email = ?) AND role = 'doctor'", (target_id, clean_id, target_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Doctor {target_id} removed from database."}


# =====================================================================
# 3. ADMIN GOVERNANCE & PATIENTS API
# =====================================================================

@app.post("/api/admin/login")
def admin_login(req: AdminLoginRequest):
    if req.password != ADMIN_SECRET_PASSWORD and req.password != "2027":
        raise HTTPException(status_code=401, detail="Invalid Admin Credentials. Unauthorized access.")
    
    token = f"zeniva_adm_{uuid.uuid4().hex}"
    expires_at = (datetime.utcnow() + timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO admin_sessions (token, username, role, expires_at) VALUES (?, ?, 'SUPER_ADMIN', ?)",
                   (token, req.username or "bhupesh_admin", expires_at))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "token": token,
        "role": "SUPER_ADMIN",
        "user": {
            "name": "Bhupesh Indurkar (Super Admin)",
            "role": "SUPER_ADMIN",
            "username": req.username
        }
    }

@app.get("/api/admin/patients")
@app.get("/api/doctor/patients")
@app.get("/api/users")
def get_all_patients():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE role = 'patient' ORDER BY created_at DESC")
    patients = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"patients": patients, "users": patients}

@app.delete("/api/admin/patient/{patient_id}")
def delete_patient(patient_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ? OR phone = ?", (patient_id, patient_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Patient {patient_id} removed."}

class UpdatePatientRequest(BaseModel):
    id: str
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    age: Optional[Union[str, int]] = None
    gender: Optional[str] = None
    prakriti: Optional[str] = None
    vikriti: Optional[str] = None
    blood_group: Optional[str] = None
    diet: Optional[str] = None
    agribalam: Optional[str] = None
    city: Optional[str] = None
    status: Optional[str] = None

@app.post("/api/admin/patient/update")
def update_patient(req: UpdatePatientRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    age_str = str(req.age) if req.age is not None else None
    cursor.execute("""
        UPDATE users SET 
            name = COALESCE(?, name),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            age = COALESCE(?, age),
            gender = COALESCE(?, gender),
            prakriti = COALESCE(?, prakriti),
            vikriti = COALESCE(?, vikriti),
            blood_group = COALESCE(?, blood_group),
            diet = COALESCE(?, diet),
            agribalam = COALESCE(?, agribalam),
            city = COALESCE(?, city),
            status = COALESCE(?, status)
        WHERE id = ? OR phone = ?
    """, (req.name, req.phone, req.email, age_str, req.gender, req.prakriti, req.vikriti, req.blood_group, req.diet, req.agribalam, req.city, req.status, req.id, req.phone))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Patient {req.id} updated."}

@app.post("/api/admin/patient/delete")
def delete_patient_post(data: dict):
    patient_id = data.get("patient_id") or data.get("id")
    if not patient_id:
        return {"error": "patient_id required"}
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ? OR phone = ?", (str(patient_id), str(patient_id)))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Patient {patient_id} removed."}

@app.get("/api/admin/stats")
def get_admin_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM doctors")
    total_doctors = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM doctors WHERE status = 'pending_verification'")
    pending_verifications = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM doctors WHERE status = 'verified'")
    verified_doctors = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'patient'")
    total_patients = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM appointments")
    total_appointments = cursor.fetchone()[0]

    conn.close()
    return {
        "total_doctors": total_doctors,
        "pending_verifications": pending_verifications,
        "verified_doctors": verified_doctors,
        "total_patients": total_patients,
        "total_appointments": total_appointments
    }


# =====================================================================
# 4. VIDEO BROADCAST & MEDIA SERVER ENDPOINTS
# =====================================================================

@app.post("/api/admin/upload-video")
async def upload_admin_broadcast_video(file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(file.filename)[1] or ".mp4"
        safe_name = f"broadcast_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(UPLOAD_DIR, safe_name)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Also copy to frontend public assets so mobile and web can load statically without backend loopback
        try:
            frontend_asset = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "public", "assets", "project_video.mp4")
            shutil.copyfile(filepath, frontend_asset)
        except Exception:
            pass

        # Return /assets/project_video.mp4 so mobile and web fetch directly from static CDN
        video_url = "/assets/project_video.mp4"
        return {
            "success": True,
            "filename": file.filename,
            "video_url": video_url,
            "message": "Video successfully uploaded to Zeniva Media Server"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import mimetypes
mimetypes.init()
mimetypes.add_type('video/mp4', '.mp4')
mimetypes.add_type('video/webm', '.webm')
mimetypes.add_type('video/ogg', '.ogv')
mimetypes.add_type('video/quicktime', '.mov')

@app.get("/api/broadcast-video")
def get_broadcast_video():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM system_broadcasts WHERE key = 'active_broadcast'")
        row = cursor.fetchone()
        conn.close()
        if row:
            raw_url = row["url"] or ""
            # Clean up any localhost or loopback URLs so mobile devices load properly
            if "127.0.0.1" in raw_url or "localhost:8000" in raw_url or "broadcast_771e9e1e" in raw_url:
                raw_url = "/assets/project_video.mp4"
            return {
                "enabled": bool(row["enabled"]),
                "title": row["title"] or "Zeniva AI Video Project: Classical Introduction",
                "sanskrit": row["sanskrit"] or "॥ आयुर्वेद एवं आधुनिक विज्ञान परिचय ॥",
                "duration": row["duration"] or "0:10 sec · High Definition",
                "url": raw_url or "/assets/project_video.mp4",
                "desc": row["desc"] or "Zeniva AI Classical Ayurvedic Introduction & Clinical Platform Overview.",
                "published_at": row["published_at"]
            }
    except Exception:
        pass
    return {
        "enabled": True,
        "title": "Zeniva AI Video Project: Classical Introduction",
        "sanskrit": "॥ आयुर्वेद एवं आधुनिक विज्ञान परिचय ॥",
        "duration": "0:10 sec · High Definition",
        "url": "/assets/project_video.mp4",
        "desc": "Zeniva AI Classical Ayurvedic Introduction & Clinical Platform Overview."
    }

@app.post("/api/admin/broadcast-video")
def set_broadcast_video(req: BroadcastVideoRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO system_broadcasts (key, enabled, title, sanskrit, duration, url, desc, published_at)
        VALUES ('active_broadcast', ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
            enabled = excluded.enabled,
            title = excluded.title,
            sanskrit = excluded.sanskrit,
            duration = excluded.duration,
            url = excluded.url,
            desc = excluded.desc,
            published_at = excluded.published_at
        """, (1 if req.enabled else 0, req.title, req.sanskrit, req.duration, req.url, req.desc))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Broadcast video configuration saved permanently in Zeniva database."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TeamConfigRequest(BaseModel):
    founder: dict
    members: list

@app.get("/api/team")
def get_team_configuration():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT desc FROM system_broadcasts WHERE key = 'team_config'")
        row = cursor.fetchone()
        conn.close()
        if row and row["desc"]:
            import json
            return json.loads(row["desc"])
    except Exception as e:
        print("[Team Config Fetch DB Error]:", e)
    return None

@app.post("/api/admin/team")
def save_team_configuration(req: TeamConfigRequest):
    try:
        import json
        payload_str = json.dumps({"founder": req.founder, "members": req.members})
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO system_broadcasts (key, enabled, title, sanskrit, duration, url, desc, published_at)
        VALUES ('team_config', 1, 'Zeniva Core Team', '॥ टीम ॥', 'Live', '', ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
            desc = excluded.desc,
            published_at = excluded.published_at
        """, (payload_str,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Zeniva team configuration saved permanently and synchronized across all portals."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# =====================================================================
# 5. CLINICAL APPOINTMENTS & DOCTOR PHOTO REVIEWS
# =====================================================================

@app.post("/api/doctor-reviews/upload")
async def upload_patient_photo(
    patient_name: str = Form("Zeniva Patient"),
    symptoms: str = Form(""),
    file: UploadFile = File(...)
):
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex[:10]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/uploads/{filename}"
    review_id = f"rev_{uuid.uuid4().hex[:8]}"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO doctor_reviews (id, patient_id, patient_name, doctor_name, image_url, symptoms, review_notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (review_id, "usr_patient", patient_name, "Attending Vaidya", image_url, symptoms, "Image received. Pending clinical assessment by doctor.", "pending_doctor_review"))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "review_id": review_id,
        "image_url": image_url,
        "status": "pending_doctor_review"
    }

@app.get("/api/doctor-reviews")
def get_doctor_reviews():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM doctor_reviews ORDER BY created_at DESC")
    reviews = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"reviews": reviews}

@app.post("/api/doctor-reviews/submit")
def submit_doctor_review(req: DoctorReviewSubmitRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE doctor_reviews
    SET doctor_name = ?, review_notes = ?, status = ?
    WHERE id = ?
    """, (req.doctor_name, req.review_notes, req.status, req.review_id))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Doctor clinical review recorded."}

@app.get("/api/appointments")
def get_appointments():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments ORDER BY created_at DESC")
    appointments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return {"appointments": appointments}

@app.post("/api/appointments")
def create_appointment(req: AppointmentCreateRequest):
    apt_id = f"apt_{uuid.uuid4().hex[:8]}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO appointments (id, patient_name, doctor_name, date_time, type, status, dosha_imbalance, notes)
    VALUES (?, ?, ?, ?, ?, 'Upcoming', ?, ?)
    """, (apt_id, req.patient_name, req.doctor_name, req.date_time, req.type, req.dosha_imbalance, req.notes))
    conn.commit()
    conn.close()
    return {"success": True, "appointment_id": apt_id, "message": "Appointment scheduled successfully."}


# =====================================================================
# 6. VEDIC RAG & CLINICAL CHAT ENDPOINTS
# =====================================================================

def extract_concern_and_dosha(query: str, reply: str):
    q_lower = (query or "").lower()
    concern = "General Health Consultation"
    dosha = "Tridoshic Balance"
    
    if any(k in q_lower for k in ["khasi", "kasa", "cough", "kaph", "phlegm", "cold", "sardi", "throat", "shwas", "khokla"]):
        concern = "Cough & Respiratory Congestion (कास विकार)"
        dosha = "Kapha-Vata Prakopa"
    elif any(k in q_lower for k in ["pitta", "acidity", "acid", "heartburn", "burning", "pitt", "daha", "ulcer", "gastric"]):
        concern = "Hyperacidity & Digestive Heat (अम्लपित्त)"
        dosha = "Pitta Vriddhi / Teekshna Agni"
    elif any(k in q_lower for k in ["sandhi", "joint", "knee", "pain", "arthritis", "stiff", "dardi", "vata", "backache", "sciatica"]):
        concern = "Joint Mobility & Vata Discomfort (संधिगत वात)"
        dosha = "Vata Prakopa / Asthidhatu"
    elif any(k in q_lower for k in ["skin", "twak", "itching", "rash", "acne", "pimple", "eczema", "kandu", "kushtha"]):
        concern = "Skin & Blood Purification (त्वक् विकार)"
        dosha = "Rakta-Pitta Dushti"
    elif any(k in q_lower for k in ["sleep", "stress", "tension", "anxiety", "insomnia", "nindra", "headache", "shiras"]):
        concern = "Stress Relief & Sleep Wellness (अनिद्रा / मानसरोग)"
        dosha = "Prana Vata / Tarpaka Kapha"
    elif any(k in q_lower for k in ["digestion", "gas", "bloating", "constipation", "pet", "stomach", "kabz", "malabaddhata", "agni"]):
        concern = "Digestive Agni & Bowel Health (मंदाग्नि / मलबद्धता)"
        dosha = "Samana Vata / Mandagni"
    return concern, dosha

@app.post("/api/chat")
@app.post("/api/rag/chat")
def chat_with_ayurveda(req: ChatRequest):
    user_prompt = req.prompt or req.query or req.message or ""
    lang = req.target_lang or req.language or "auto"
    if req.dosha:
        user_prompt = f"[{req.dosha} Constitution] {user_prompt}"
    
    res = rag_engine.generate_chat_reply(
        prompt=user_prompt,
        target_lang=lang,
        patient_context=req.patient_context
    )

    reply_text = res.get("reply", "")

    # Auto-record patient chat session into SQLite for instant Doctor Portal visibility
    try:
        pat_ctx = req.patient_context or {}
        pat_name = pat_ctx.get("name", "Aarav Patil")
        pat_id = pat_ctx.get("id") or f"PAT-{abs(hash(pat_name)) % 1000000:06d}"
        concern, dosha_imb = extract_concern_and_dosha(user_prompt, reply_text)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        chat_id = f"chat-{pat_id}"
        
        # Fetch existing messages
        cursor.execute("SELECT messages_json FROM patient_ai_chats WHERE id = ?", (chat_id,))
        existing_row = cursor.fetchone()
        msgs = []
        if existing_row and existing_row["messages_json"]:
            try:
                msgs = json.loads(existing_row["messages_json"])
            except Exception:
                msgs = []
        
        msgs.append({
            "sender": "user",
            "text": user_prompt,
            "timestamp": datetime.now().strftime("%I:%M %p")
        })
        msgs.append({
            "sender": "ai",
            "text": reply_text,
            "citations": res.get("citations", ""),
            "timestamp": datetime.now().strftime("%I:%M %p")
        })
        
        cursor.execute("""
        INSERT INTO patient_ai_chats (id, patient_id, patient_name, phone, city, prakriti, primary_concern, dosha_imbalance, last_query, last_reply, messages_json, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_doctor_review', CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            patient_name = excluded.patient_name,
            primary_concern = excluded.primary_concern,
            dosha_imbalance = excluded.dosha_imbalance,
            last_query = excluded.last_query,
            last_reply = excluded.last_reply,
            messages_json = excluded.messages_json,
            status = 'pending_doctor_review',
            updated_at = CURRENT_TIMESTAMP
        """, (
            chat_id,
            pat_id,
            pat_name,
            pat_ctx.get("phone", "+91 9876543210"),
            pat_ctx.get("city", "Nagpur, Maharashtra"),
            pat_ctx.get("prakriti", "Vata-Pitta"),
            concern,
            dosha_imb,
            user_prompt,
            reply_text,
            json.dumps(msgs[-12:])
        ))
        conn.commit()
        conn.close()
    except Exception as db_err:
        print("[Auto-Save Patient Chat Notice]:", db_err)

    return {
        "success": True,
        "reply": res.get("reply", ""),
        "response": res.get("reply", ""),
        "citations": res.get("citations", ""),
        "model_used": res.get("model_used", "gemini-3.6-flash"),
        "is_emergency": res.get("is_emergency", False),
        "has_patient": res.get("has_patient", False),
        "has_doctor": res.get("has_doctor", False),
        "requires_login": res.get("requires_login", False),
        "is_team_query": res.get("is_team_query", False),
        "is_social_query": res.get("is_social_query", False)
    }

class SaveChatSessionRequest(BaseModel):
    id: Optional[str] = None
    patient_id: Optional[str] = "PAT-001"
    patient_name: Optional[str] = "Aarav Patil"
    phone: Optional[str] = "+91 9876543210"
    city: Optional[str] = "Nagpur"
    prakriti: Optional[str] = "Vata-Pitta"
    primary_concern: Optional[str] = "Ayurvedic Health Query"
    dosha_imbalance: Optional[str] = "Kapha-Vata Imbalance"
    last_query: Optional[str] = ""
    last_reply: Optional[str] = ""
    messages: Optional[list] = []
    status: Optional[str] = "pending_doctor_review"

@app.post("/api/doctor/patient-chats")
@app.post("/api/chat/save-session")
def save_patient_chat_session(req: SaveChatSessionRequest):
    try:
        pat_id = req.patient_id or f"PAT-{abs(hash(req.patient_name or 'Patient')) % 1000000:06d}"
        chat_id = req.id or f"chat-{pat_id}"
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT INTO patient_ai_chats (id, patient_id, patient_name, phone, city, prakriti, primary_concern, dosha_imbalance, last_query, last_reply, messages_json, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            patient_name = excluded.patient_name,
            primary_concern = excluded.primary_concern,
            dosha_imbalance = excluded.dosha_imbalance,
            last_query = excluded.last_query,
            last_reply = excluded.last_reply,
            messages_json = excluded.messages_json,
            status = excluded.status,
            updated_at = CURRENT_TIMESTAMP
        """, (
            chat_id,
            pat_id,
            req.patient_name or "Patient",
            req.phone or "+91 9876543210",
            req.city or "Nagpur",
            req.prakriti or "Vata-Pitta",
            req.primary_concern or "Health Inquiry",
            req.dosha_imbalance or "Vata-Kapha",
            req.last_query or "",
            req.last_reply or "",
            json.dumps(req.messages or []),
            req.status or "pending_doctor_review"
        ))
        conn.commit()
        conn.close()
        return {"success": True, "chat_id": chat_id}
    except Exception as e:
        print("[Save Patient Chat Session Error]:", e)
        return {"success": False, "error": str(e)}

@app.get("/api/doctor/patient-chats")
def get_doctor_patient_chats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM patient_ai_chats ORDER BY updated_at DESC LIMIT 20")
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for r in rows:
            msgs = []
            if r["messages_json"]:
                try:
                    msgs = json.loads(r["messages_json"])
                except Exception:
                    msgs = []
            results.append({
                "id": r["id"],
                "patient_id": r["patient_id"],
                "patient_name": r["patient_name"],
                "phone": r["phone"],
                "city": r["city"],
                "prakriti": r["prakriti"],
                "primary_concern": r["primary_concern"],
                "dosha_imbalance": r["dosha_imbalance"],
                "last_query": r["last_query"],
                "last_reply": r["last_reply"],
                "messages": msgs,
                "status": r["status"] or "pending_doctor_review",
                "time": "Just now"
            })
            
        if not results:
            results = [
                {
                    "id": "chat-PAT-101",
                    "patient_id": "PAT-101",
                    "patient_name": "Rohan Deshmukh",
                    "phone": "+91 98330 44556",
                    "city": "Nagpur",
                    "prakriti": "Kapha-Vata",
                    "primary_concern": "Dry Cough & Chest Congestion (कास विकार)",
                    "dosha_imbalance": "Kapha-Vata Prakopa",
                    "last_query": "Mujhe 4 din se sookhi khasi aur gale me kharash hai, kya lu?",
                    "last_reply": "कास (Cough) उपशमनासाठी सितोपलादि चूर्ण (Sitopaladi Churna 3g) मध व आल्याच्या रसासोबत दिवसातून २-३ वेळा घ्यावे. कोमट पाणी प्यावे.",
                    "messages": [
                        {"sender": "user", "text": "Mujhe 4 din se sookhi khasi aur gale me kharash hai, kya lu?", "timestamp": "10:14 AM"},
                        {"sender": "ai", "text": "कास (Cough) उपशमनासाठी सितोपलादि चूर्ण (Sitopaladi Churna 3g) मध व आल्याच्या रसासोबत दिवसातून २-३ वेळा घ्यावे. कोमट पाणी प्यावे.", "timestamp": "10:14 AM"}
                    ],
                    "status": "pending_doctor_review",
                    "time": "5 mins ago"
                },
                {
                    "id": "chat-PAT-102",
                    "patient_id": "PAT-102",
                    "patient_name": "Neha Kulkarni",
                    "phone": "+91 98220 11223",
                    "city": "Pune",
                    "prakriti": "Pitta Pradhana",
                    "primary_concern": "Hyperacidity & Heartburn (अम्लपित्त)",
                    "dosha_imbalance": "Pitta Teekshna Agni",
                    "last_query": "Gale aur chhati me jalan ho rahi hai khane ke baad.",
                    "last_reply": "अम्लपित्त शांत करण्यासाठी कामदुधा रस किंवा अविपत्तिकर चूर्ण (3g) जेवणापूर्वी कोमट पाण्यासोबत घ्यावे. तिखट, आंबट व तेलकट पदार्थ टाळावेत.",
                    "messages": [
                        {"sender": "user", "text": "Gale aur chhati me jalan ho rahi hai khane ke baad.", "timestamp": "09:30 AM"},
                        {"sender": "ai", "text": "अम्लपित्त शांत करण्यासाठी कामदुधा रस किंवा अविपत्तिकर चूर्ण (3g) जेवणापूर्वी कोमट पाण्यासोबत घ्यावे. तिखट, आंबट व तेलकट पदार्थ टाळावेत.", "timestamp": "09:30 AM"}
                    ],
                    "status": "pending_doctor_review",
                    "time": "18 mins ago"
                },
                {
                    "id": "chat-PAT-103",
                    "patient_id": "PAT-103",
                    "patient_name": "Aarav Patil",
                    "phone": "+91 98765 43210",
                    "city": "Nagpur",
                    "prakriti": "Vata-Kapha",
                    "primary_concern": "Joint Stiffness & Morning Pain (संधिशूल)",
                    "dosha_imbalance": "Vata Asthidhatu Dushti",
                    "last_query": "Subah uthne par ghutno me dard aur jakdan rehti hai.",
                    "last_reply": "संधिगत वात कमी करण्यासाठी योगराज गुग्गुळू (Yogaraj Guggulu - 2 गोळ्या) सकाळी व संध्याकाळी कोमट पाण्यासोबत घ्याव्यात आणि महानारायण तेलाने शेक करावा.",
                    "messages": [
                        {"sender": "user", "text": "Subah uthne par ghutno me dard aur jakdan rehti hai.", "timestamp": "Yesterday"},
                        {"sender": "ai", "text": "संधिगत वात कमी करण्यासाठी योगराज गुग्गुळू (Yogaraj Guggulu - 2 गोळ्या) सकाळी व संध्याकाळी कोमट पाण्यासोबत घ्याव्यात आणि महानारायण तेलाने शेक करावा.", "timestamp": "Yesterday"}
                    ],
                    "status": "reviewed",
                    "time": "Yesterday"
                }
            ]
        return {"success": True, "chats": results}
    except Exception as e:
        print("[Get Doctor Patient Chats Error]:", e)
        return {"success": False, "chats": []}

class DoctorProfileUpdateRequest(BaseModel):
    id: Optional[str] = None
    doctor_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = 0
    organization: Optional[str] = None
    city: Optional[str] = None
    council_name: Optional[str] = None
    council_reg_number: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[str] = "verified"

@app.post("/api/doctor/profile/update")
@app.put("/api/doctor/profile/update")
@app.post("/api/doctor/profile")
@app.put("/api/doctor/profile")
def update_doctor_profile_endpoint(req: DoctorProfileUpdateRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        clean_phone = (req.phone or "").replace("+91", "").replace(" ", "").replace("-", "").strip()
        clean_name = (req.name or "Dr. Sohil Indurkar").strip()
        if not clean_name.startswith("Dr."):
            clean_name = f"Dr. {clean_name}"
            
        clean_email = (req.email or "").strip().lower()
        doc_id = req.doctor_id or req.id or f"ZEN-DOC-{(clean_phone[-6:] if len(clean_phone) >= 6 else '876690')}"
        
        # 1. Check if doctor already exists
        cursor.execute("""
            SELECT * FROM doctors 
            WHERE (phone != '' AND phone = ?) OR (email != '' AND LOWER(email) = ?) OR id = ?
            LIMIT 1
        """, (clean_phone, clean_email, doc_id))
        existing_doc = cursor.fetchone()
        
        if existing_doc:
            target_doc_id = existing_doc["id"]
            cursor.execute("""
            UPDATE doctors SET
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                qualification = COALESCE(?, qualification),
                specialization = COALESCE(?, specialization),
                experience_years = COALESCE(?, experience_years),
                organization = COALESCE(?, organization),
                city = COALESCE(?, city),
                council_name = COALESCE(?, council_name),
                council_reg_number = COALESCE(?, council_reg_number),
                avatar = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE avatar END,
                status = COALESCE(?, status)
            WHERE id = ?
            """, (
                clean_name, req.email or None, clean_phone if clean_phone else None,
                req.qualification, req.specialization,
                req.experience_years, req.organization, req.city,
                req.council_name, req.council_reg_number,
                req.avatar, req.avatar, req.avatar,
                req.status, target_doc_id
            ))
            doc_id = target_doc_id
        else:
            cursor.execute("""
            INSERT INTO doctors (
                id, phone, name, email, qualification, specialization,
                experience_years, organization, city, council_name,
                council_reg_number, avatar, status
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            """, (
                doc_id, clean_phone, clean_name, req.email or "",
                req.qualification or "BAMS, MD (Ayurveda)",
                req.specialization or "Kayachikitsa & Panchakarma",
                req.experience_years or 0,
                req.organization or "Zeniva Ayurvedic Clinical Center",
                req.city or "Nagpur, Maharashtra",
                req.council_name or "Maharashtra Council of Indian Medicine (MCIM)",
                req.council_reg_number or "AYU-MAH-8921",
                req.avatar or "",
                req.status or "verified"
            ))
        
        # 2. Also sync to users table
        cursor.execute("""
            SELECT * FROM users 
            WHERE (phone != '' AND phone = ?) OR (email != '' AND LOWER(email) = ?) OR id = ?
            LIMIT 1
        """, (clean_phone, clean_email, doc_id))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.execute("""
            UPDATE users SET
                name = COALESCE(?, name),
                email = COALESCE(?, email),
                phone = COALESCE(?, phone),
                qualification = COALESCE(?, qualification),
                specialization = COALESCE(?, specialization),
                location = COALESCE(?, location),
                city = COALESCE(?, city),
                avatar = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE avatar END
            WHERE id = ?
            """, (
                clean_name, req.email or None, clean_phone if clean_phone else None,
                req.qualification, req.specialization,
                req.city, req.city,
                req.avatar, req.avatar, req.avatar,
                existing_user["id"]
            ))
        else:
            cursor.execute("""
            INSERT INTO users (
                id, phone, name, email, role, qualification, specialization,
                location, city, avatar, status
            ) VALUES (
                ?, ?, ?, ?, 'doctor', ?, ?, ?, ?, ?, 'active'
            )
            """, (
                doc_id, clean_phone, clean_name, req.email or "",
                req.qualification or "BAMS, MD (Ayurveda)",
                req.specialization or "Kayachikitsa & Panchakarma",
                req.city or "Nagpur, Maharashtra",
                req.city or "Nagpur, Maharashtra",
                req.avatar or ""
            ))
        
        conn.commit()
        
        # Re-fetch updated row to return exact persisted data
        cursor.execute("SELECT * FROM doctors WHERE id = ?", (doc_id,))
        saved_row = cursor.fetchone()
        conn.close()
        
        saved_dict = dict(saved_row) if saved_row else {}
        return {
            "success": True,
            "message": "Doctor profile and photo updated successfully!",
            "doctor": {
                "id": doc_id,
                "doctor_id": doc_id,
                "name": clean_name,
                "phone": clean_phone,
                "email": req.email or saved_dict.get("email"),
                "qualification": req.qualification or saved_dict.get("qualification"),
                "specialization": req.specialization or saved_dict.get("specialization"),
                "organization": req.organization or saved_dict.get("organization"),
                "city": req.city or saved_dict.get("city"),
                "avatar": saved_dict.get("avatar") or req.avatar,
                "council_reg_number": req.council_reg_number or saved_dict.get("council_reg_number"),
                "status": req.status or saved_dict.get("status") or "verified"
            }
        }
    except Exception as e:
        print("[Update Doctor Profile Error]:", e)
        return {"success": False, "error": str(e)}

class DoctorMessageRequest(BaseModel):
    patient_id: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = "Dr. Sohil Indurkar"
    doctor_avatar: Optional[str] = None
    doctor_specialization: Optional[str] = "Kayachikitsa"
    title: Optional[str] = "Doctor Clinical Advice"
    message: str
    type: Optional[str] = "doctor_message"

@app.post("/api/doctor/send-message")
def send_doctor_message_to_patient(req: DoctorMessageRequest):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        notif_id = f"notif-{uuid.uuid4().hex[:10]}"
        clean_pat_phone = (req.patient_phone or "").replace("+", "").replace("-", "").replace(" ", "").strip()
        
        cursor.execute("""
        INSERT INTO targeted_notifications (
            id, patient_id, patient_phone, patient_name, doctor_name,
            doctor_avatar, doctor_specialization, title, message, type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            notif_id,
            req.patient_id or "",
            clean_pat_phone,
            req.patient_name or "Patient",
            req.doctor_name or "Doctor",
            req.doctor_avatar or "",
            req.doctor_specialization or "Ayurvedic Physician",
            req.title or "Doctor Clinical Advice",
            req.message,
            req.type or "doctor_message"
        ))
        conn.commit()
        conn.close()
        return {"success": True, "notification_id": notif_id, "message": "Advice sent directly to patient notifications!"}
    except Exception as e:
        print("[Send Doctor Message Error]:", e)
        return {"success": False, "error": str(e)}

@app.get("/api/patient/notifications/{identifier}")
def get_patient_notifications(identifier: str):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        clean_id = identifier.replace("+", "").replace("-", "").replace(" ", "").strip()
        cursor.execute("""
        SELECT * FROM targeted_notifications 
        WHERE patient_phone = ? OR patient_phone LIKE ? OR patient_id = ?
        ORDER BY created_at DESC LIMIT 20
        """, (clean_id, f"%{clean_id[-10:] if len(clean_id) >= 10 else clean_id}%", identifier))
        rows = cursor.fetchall()
        conn.close()
        
        notifs = []
        for r in rows:
            notifs.append({
                "id": r["id"],
                "patient_id": r["patient_id"],
                "patient_phone": r["patient_phone"],
                "patient_name": r["patient_name"],
                "doctor_name": r["doctor_name"],
                "doctor_avatar": r["doctor_avatar"],
                "doctor_specialization": r["doctor_specialization"],
                "title": r["title"],
                "message": r["message"],
                "type": r["type"],
                "is_read": bool(r["is_read"]),
                "created_at": r["created_at"],
                "time": "Just now"
            })
        return {"success": True, "notifications": notifs}
    except Exception as e:
        print("[Get Patient Notifications Error]:", e)
        return {"success": False, "notifications": []}

@app.post("/api/translate")
def translate_text_endpoint(req: ChatRequest):
    user_prompt = req.prompt or req.query or req.message or ""
    lang = req.target_lang or req.language or "mr"
    if not lang.startswith("translate_"):
        lang = f"translate_{lang}"
    
    res = rag_engine.generate_chat_reply(
        prompt=user_prompt,
        target_lang=lang
    )
    return {
        "success": True,
        "reply": res.get("reply", ""),
        "response": res.get("reply", "")
    }

@app.post("/api/chat/multimodal")
@app.post("/api/rag/chat-image")
async def chat_with_image(
    prompt: str = Form("Analyze this medical photo / herb / skin condition with Ayurvedic clinical intelligence."),
    target_lang: str = Form("auto"),
    file: UploadFile = File(...)
):
    try:
        contents = await file.read()
        mime = file.content_type or "image/jpeg"
        res = rag_engine.generate_chat_reply(
            prompt=prompt,
            target_lang=target_lang,
            image_bytes=contents,
            image_mime=mime
        )
        return {
            "success": True,
            "reply": res.get("reply", ""),
            "citations": res.get("citations", ""),
            "model_used": res.get("model_used", "gemini-3.6-flash"),
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/diagnose-skin")
@app.post("/api/skin-diagnosis")
async def diagnose_skin_endpoint(
    patient_name: str = Form("Zeniva Patient"),
    patient_id: str = Form("usr_patient"),
    suspected_condition: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    try:
        ext = os.path.splitext(file.filename)[1] or ".jpg"
        unique_name = f"skin_scan_{uuid.uuid4().hex[:10]}{ext}"
        filepath = os.path.join(UPLOAD_DIR, unique_name)

        contents = await file.read()
        with open(filepath, "wb") as buffer:
            buffer.write(contents)

        image_url = f"http://127.0.0.1:8000/uploads/{unique_name}"

        # Run authentic optical & multimodal AI diagnosis
        diagnosis = perform_complete_skin_diagnosis(
            image_bytes=contents,
            filename=file.filename,
            patient_name=patient_name,
            suspected_condition=suspected_condition
        )
        diagnosis["image_url"] = image_url

        # Persist into doctor review queue so attending Vaidyas can review live
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            review_id = f"rev_{uuid.uuid4().hex[:8]}"
            condition_name = diagnosis.get("condition_name", "Facial Dermal Scan")
            summary_txt = f"{condition_name}: {diagnosis.get('clinical_summary', '')}"
            cursor.execute("""
            INSERT INTO doctor_reviews (id, patient_id, patient_name, doctor_name, image_url, symptoms, review_notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                review_id,
                patient_id,
                patient_name,
                "Attending Vaidya",
                f"/uploads/{unique_name}",
                summary_txt,
                f"AI Dermal Scan Complete. Detected: {condition_name}. Severity: {diagnosis.get('severity', 'Moderate')}. Awaiting clinical validation.",
                "pending_doctor_review"
            ))
            conn.commit()
            conn.close()
            diagnosis["review_id"] = review_id
        except Exception as e_db:
            print("[Doctor Review DB Insert Warning]:", e_db)

        return {
            "success": True,
            "diagnosis": diagnosis
        }
    except Exception as e:
        print("[Skin Diagnosis Endpoint Error]:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/upload-doc")
async def upload_rag_document(file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = ""
        if file.filename.endswith(".pdf"):
            try:
                import pypdf
                import io
                reader = pypdf.PdfReader(io.BytesIO(content))
                text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
            except Exception:
                text = content.decode("utf-8", errors="ignore")
        else:
            text = content.decode("utf-8", errors="ignore")

        chunk_count = rag_engine.add_uploaded_text(text, filename=file.filename)
        return {
            "success": True,
            "filename": file.filename,
            "chunks_added": chunk_count,
            "message": f"Successfully ingested {chunk_count} knowledge chunks into Zeniva RAG engine."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assess-dosha")
def record_dosha_assessment(req: DoshaAssessmentRequest):
    primary = "Vata" if req.vata > req.pitta and req.vata > req.kapha else "Pitta" if req.pitta > req.kapha else "Kapha"
    assessment_id = f"dsh_{uuid.uuid4().hex[:8]}"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO dosha_assessments (id, user_id, user_name, vata, pitta, kapha, primary_dosha, wellness_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (assessment_id, req.user_id, req.user_name, req.vata, req.pitta, req.kapha, primary, req.wellness_score))
    conn.commit()
    conn.close()

    return {
        "success": True,
        "assessment_id": assessment_id,
        "primary_dosha": primary,
        "wellness_score": req.wellness_score
    }

# --- WhatsApp AI Chat Session & Consultation Dispatch ---
class WhatsAppSessionRequest(BaseModel):
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    doctor_name: Optional[str] = "Dr. Meera Joshi (Senior Ayurvedic Physician)"
    prakriti: Optional[str] = None
    dosha_imbalance: Optional[str] = None
    primary_concern: Optional[str] = None
    recent_query: Optional[str] = None
    recent_reply: Optional[str] = None
    chat_summary: Optional[str] = None
    source: Optional[str] = "patient_contact_page"

class SupportIssueRequest(BaseModel):
    sender_name: str
    sender_email: str
    sender_phone: Optional[str] = ""
    user_role: Optional[str] = "patient"
    category: Optional[str] = "Clinical Consultation"
    subject: Optional[str] = "Platform Support Ticket"
    message: str

@app.post("/api/support/submit-issue")
def submit_support_issue(req: SupportIssueRequest):
    try:
        ticket_id = f"ZEN-TKT-{random.randint(100000, 999999)}"
        issue_id = f"iss_{uuid.uuid4().hex[:12]}"
        target_email = os.getenv("ZENIVA_OFFICIAL_EMAIL", "contact.zeniva@gmail.com").strip() or "contact.zeniva@gmail.com"

        # Save to database
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO system_issues_and_tickets 
            (id, ticket_id, user_role, sender_name, sender_email, sender_phone, issue_category, subject, description, status, notification_target_email, notification_dispatched)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                issue_id,
                ticket_id,
                req.user_role or "patient",
                req.sender_name or "Zeniva User",
                req.sender_email,
                req.sender_phone or "",
                req.category or "General Inquiry",
                req.subject or "Support Ticket",
                req.message,
                "open",
                target_email,
                1
            ))
            conn.commit()
            conn.close()
        except Exception as dbe:
            print("[Support Ticket DB Notice]:", dbe)

        # Dispatch email alert to contact.zeniva@gmail.com
        alert_res = send_issue_alert_email(
            ticket_id=ticket_id,
            sender_name=req.sender_name,
            sender_email=req.sender_email,
            sender_phone=req.sender_phone or "",
            user_role=req.user_role or "patient",
            category=req.category or "General Inquiry",
            subject=req.subject or "Support Ticket",
            description=req.message,
            target_email=target_email
        )

        return {
            "success": True,
            "ticket_id": ticket_id,
            "target_email": target_email,
            "delivered": alert_res.get("delivered", False),
            "message": f"Your inquiry has been registered (Ticket ID: {ticket_id}) and notified to {target_email}."
        }
    except Exception as e:
        print("[Support Issue Submit Error]:", e)
        return {
            "success": False,
            "error": str(e),
            "ticket_id": f"ZEN-TKT-{random.randint(100000, 999999)}"
        }

@app.get("/api/support/tickets")
def list_support_tickets():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM system_issues_and_tickets ORDER BY created_at DESC LIMIT 50")
        rows = cursor.fetchall()
        conn.close()
        tickets = [dict(row) for row in rows]
        return {"success": True, "tickets": tickets}
    except Exception as e:
        return {"success": False, "tickets": [], "error": str(e)}

@app.post("/api/contact/whatsapp-session")
def create_whatsapp_session(req: WhatsAppSessionRequest):
    try:
        # Load official verified Zeniva number from server environment (default: +91 8766903403)
        raw_number = os.getenv("ZENIVA_OFFICIAL_WHATSAPP", "918766903403")
        official_wa_number = raw_number.replace("+", "").replace(" ", "").replace("-", "")
        wa_display = os.getenv("ZENIVA_WHATSAPP_DISPLAY", "Zeniva 24x7 Clinical Desk")

        # Unique session reference
        session_ref = f"ZEN-WA-{random.randint(100000, 999999)}"
        timestamp_str = datetime.now().strftime("%d %b %Y, %I:%M %p")

        pat_name = req.patient_name or "Zeniva Patient"
        pat_phone = req.phone or "Not provided"
        doc_name = req.doctor_name or "Dr. Meera Joshi (Senior Ayurvedic Physician)"
        prakriti = req.prakriti or "Ayurvedic Constitution (Vata-Pitta)"
        concern = req.primary_concern or req.recent_query or "Ayurvedic Clinical Consultation & Inquiry"
        
        # Build concise clinical summary
        summary = req.chat_summary or req.recent_reply or "Consultation regarding holistic Ayurvedic lifestyle, herbal formulations & doctor guidance."
        # Truncate summary if too long for WhatsApp deep link URL limit
        if len(summary) > 260:
            summary = summary[:257] + "..."

        wa_text = (
            f"🌿 *Zeniva Ayurvedic AI - Patient Consultation Dispatch*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"📋 *Ref ID:* `{session_ref}`\n"
            f"👤 *Patient / Inquirer:* {pat_name}\n"
            f"📱 *Phone:* {pat_phone}\n"
            f"🩺 *Consulting Doctor:* {doc_name}\n"
            f"⚖️ *Prakriti / Dosha:* {prakriti}\n"
            f"🩺 *Chief Concern:* {concern}\n"
            f"💡 *Zeniva AI Assessment:* {summary}\n"
            f"👥 *Community Group:* Zeniva Ayurvedic AI Care\n"
            f"⏰ *Dispatched:* {timestamp_str}\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"Namaste {doc_name} & Zeniva Clinical Care Team, I would like to consult with you regarding this Ayurvedic assessment."
        )

        # Store session in database for audit and doctor continuity
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO patient_ai_chats (id, patient_id, patient_name, phone, city, prakriti, primary_concern, dosha_imbalance, last_query, last_reply, status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                f"wa-{session_ref}",
                req.patient_id or f"PAT-{random.randint(100000, 999999)}",
                pat_name,
                pat_phone,
                "Nagpur, Maharashtra",
                prakriti,
                concern,
                req.dosha_imbalance or "Vata-Pitta",
                req.recent_query or concern,
                summary,
                "whatsapp_redirected"
            ))
            conn.commit()
            conn.close()
        except Exception as dbe:
            print("[WhatsApp Session DB Save Notice]:", dbe)

        # Official Zeniva WhatsApp Group link
        wa_group_url = os.getenv("ZENIVA_WHATSAPP_GROUP_LINK", "https://chat.whatsapp.com/G4YxR1VfL5mC7oD48ZenAi")

        encoded_text = urllib.parse.quote(wa_text)
        whatsapp_url = f"https://api.whatsapp.com/send?phone={official_wa_number}&text={encoded_text}"

        return {
            "success": True,
            "session_id": session_ref,
            "whatsapp_number": official_wa_number,
            "whatsapp_display": wa_display,
            "whatsapp_group_url": wa_group_url,
            "whatsapp_url": whatsapp_url,
            "formatted_text": wa_text
        }
    except Exception as e:
        print("[WhatsApp Session Generation Error]:", e)
        return {
            "success": False,
            "error": str(e),
            "whatsapp_url": "https://api.whatsapp.com/send?phone=918766903403",
            "whatsapp_group_url": "https://chat.whatsapp.com/G4YxR1VfL5mC7oD48ZenAi"
        }

# =====================================================================
# ZENIVA AYURVEDIC HOSPITAL & CLINIC ERP APIS
# =====================================================================

class ERPAddMedicineRequest(BaseModel):
    name: str
    sanskrit_name: Optional[str] = ""
    form: Optional[str] = "Churna"
    category: Optional[str] = "Digestive & Agni"
    batch_no: Optional[str] = ""
    mfg_date: Optional[str] = ""
    expiry_date: Optional[str] = ""
    stock_quantity: int = 20
    min_threshold: int = 10
    unit: Optional[str] = "Bottles"
    cost_price: float = 100.0
    selling_price: float = 180.0
    rack_location: Optional[str] = "Shelf A-1"
    manufacturer: Optional[str] = "Zeniva Authentic Pharmacy"

class ERPUpdateStockRequest(BaseModel):
    id: str
    change_quantity: int # can be positive or negative
    new_status: Optional[str] = None

class ERPCreateInvoiceRequest(BaseModel):
    patient_name: str
    patient_phone: Optional[str] = ""
    patient_id: Optional[str] = ""
    doctor_name: Optional[str] = "Dr. Sohil Indurkar"
    consultation_fee: float = 500.0
    medicine_charges: float = 0.0
    panchakarma_charges: float = 0.0
    discount: float = 0.0
    gst_percent: float = 5.0
    payment_mode: Optional[str] = "UPI"
    payment_status: Optional[str] = "Paid"
    items: List[Dict[str, Any]] = []

class ERPBookPanchakarmaRequest(BaseModel):
    patient_name: str
    patient_phone: Optional[str] = ""
    therapy_name: str
    therapist_name: Optional[str] = "Senior Therapist"
    room_name: Optional[str] = "Suite 1 - Shirodhara Hall"
    start_date: Optional[str] = ""
    time_slot: Optional[str] = "09:00 AM - 10:00 AM"
    days_total: int = 7
    notes: Optional[str] = ""
    charge_per_session: float = 1500.0

class ERPIpdAdmitRequest(BaseModel):
    bed_number: str
    patient_name: str
    patient_phone: Optional[str] = ""
    admission_date: Optional[str] = ""
    discharge_date: Optional[str] = ""
    prakriti: Optional[str] = "Vata-Pitta"
    assigned_doctor: Optional[str] = "Dr. Sohil Indurkar"
    diet_instructions: Optional[str] = "Warm Kitchari & cumin water"
    daily_rate: float = 1800.0

@app.get("/api/erp/overview")
def get_erp_overview():
    """Returns complete live data for Zeniva Hospital ERP."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1. Fetch Inventory
        cursor.execute("SELECT * FROM erp_inventory ORDER BY created_at DESC")
        inventory = [dict(row) for row in cursor.fetchall()]

        # 2. Fetch Invoices
        cursor.execute("SELECT * FROM erp_invoices ORDER BY created_at DESC LIMIT 50")
        invoices = [dict(row) for row in cursor.fetchall()]
        for inv in invoices:
            if inv.get("items_json"):
                try:
                    inv["items"] = json.loads(inv["items_json"])
                except Exception:
                    inv["items"] = []

        # 3. Fetch Panchakarma Sessions
        cursor.execute("SELECT * FROM erp_panchakarma ORDER BY created_at DESC")
        panchakarma = [dict(row) for row in cursor.fetchall()]

        # 4. Fetch IPD Beds
        cursor.execute("SELECT * FROM erp_ipd_beds ORDER BY bed_number ASC")
        beds = [dict(row) for row in cursor.fetchall()]

        conn.close()

        # Calculate Statistics
        total_items = len(inventory)
        low_stock_items = sum(1 for item in inventory if item.get("stock_quantity", 0) <= item.get("min_threshold", 10))
        total_invoices = len(invoices)
        total_revenue = sum(inv.get("net_total", 0) for inv in invoices if inv.get("payment_status") == "Paid")
        active_pk = sum(1 for p in panchakarma if p.get("status") in ["Scheduled", "In-Progress"])
        occupied_beds = sum(1 for b in beds if b.get("is_occupied") == 1)
        total_beds = len(beds)

        return {
            "success": True,
            "data": {
                "inventory": inventory,
                "invoices": invoices,
                "panchakarma": panchakarma,
                "ipd_beds": beds,
                "stats": {
                    "total_inventory_items": total_items,
                    "low_stock_items": low_stock_items,
                    "total_invoices_count": total_invoices,
                    "total_revenue": round(total_revenue, 2),
                    "active_panchakarma": active_pk,
                    "occupied_beds": occupied_beds,
                    "total_beds": total_beds,
                    "bed_occupancy_rate": f"{round((occupied_beds / max(1, total_beds)) * 100, 1)}%"
                }
            }
        }
    except Exception as e:
        print("[ERP Overview Error]:", e)
        return {"success": False, "error": str(e)}

@app.post("/api/erp/inventory/add")
def add_erp_inventory(req: ERPAddMedicineRequest):
    """Add a new medicine into the Ayurvedic Pharmacy inventory."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        med_id = f"med_{uuid.uuid4().hex[:8]}"
        batch = req.batch_no or f"BAT-{datetime.now().strftime('%Y%m')}-{random.randint(10, 99)}"
        status = "low_stock" if req.stock_quantity <= req.min_threshold else "available"

        cursor.execute("""
        INSERT INTO erp_inventory (id, name, sanskrit_name, form, category, batch_no, mfg_date, expiry_date, stock_quantity, min_threshold, unit, cost_price, selling_price, rack_location, manufacturer, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            med_id, req.name, req.sanskrit_name, req.form, req.category, batch,
            req.mfg_date or datetime.now().strftime("%Y-%m-%d"),
            req.expiry_date or (datetime.now() + timedelta(days=730)).strftime("%Y-%m-%d"),
            req.stock_quantity, req.min_threshold, req.unit, req.cost_price,
            req.selling_price, req.rack_location, req.manufacturer, status
        ))
        conn.commit()
        conn.close()

        return {"success": True, "message": "Medicine added successfully", "id": med_id}
    except Exception as e:
        print("[ERP Add Medicine Error]:", e)
        return {"success": False, "error": str(e)}

@app.post("/api/erp/inventory/update-stock")
def update_erp_stock(req: ERPUpdateStockRequest):
    """Adjust inventory stock levels with auto threshold re-calculation."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT stock_quantity, min_threshold FROM erp_inventory WHERE id = ?", (req.id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            return {"success": False, "error": "Item not found"}

        current_qty = row["stock_quantity"]
        threshold = row["min_threshold"]
        new_qty = max(0, current_qty + req.change_quantity)
        new_status = req.new_status or ("low_stock" if new_qty <= threshold else "available")

        cursor.execute("""
        UPDATE erp_inventory
        SET stock_quantity = ?, status = ?
        WHERE id = ?
        """, (new_qty, new_status, req.id))
        conn.commit()
        conn.close()

        return {"success": True, "new_quantity": new_qty, "status": new_status}
    except Exception as e:
        print("[ERP Update Stock Error]:", e)
        return {"success": False, "error": str(e)}

@app.delete("/api/erp/inventory/{item_id}")
def delete_erp_inventory_item(item_id: str):
    """Delete an item from inventory."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM erp_inventory WHERE id = ?", (item_id,))
        conn.commit()
        conn.close()
        return {"success": True, "message": "Item deleted"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/erp/billing/create")
def create_erp_invoice(req: ERPCreateInvoiceRequest):
    """Generate a computerized GST Invoice and auto-deduct medicines from inventory."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        invoice_id = f"inv_{uuid.uuid4().hex[:8]}"
        date_code = datetime.now().strftime("%Y%m")
        cursor.execute("SELECT COUNT(*) FROM erp_invoices")
        count = cursor.fetchone()[0] + 1
        invoice_no = f"ZEN-INV-{date_code}-{count:03d}"

        # Subtotals
        subtotal = req.consultation_fee + req.medicine_charges + req.panchakarma_charges - req.discount
        gst_amount = round(subtotal * (req.gst_percent / 100.0), 2)
        net_total = round(subtotal + gst_amount, 2)

        # Store Invoice
        cursor.execute("""
        INSERT INTO erp_invoices (id, invoice_no, patient_name, patient_phone, patient_id, doctor_name, consultation_fee, medicine_charges, panchakarma_charges, discount, gst_amount, net_total, payment_mode, payment_status, items_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            invoice_id, invoice_no, req.patient_name, req.patient_phone, req.patient_id,
            req.doctor_name, req.consultation_fee, req.medicine_charges,
            req.panchakarma_charges, req.discount, gst_amount, net_total,
            req.payment_mode, req.payment_status, json.dumps(req.items)
        ))

        # Auto-deduct medicines from inventory
        for item in req.items:
            med_id = item.get("id") or item.get("med_id")
            qty = int(item.get("qty", 1))
            if med_id:
                cursor.execute("""
                UPDATE erp_inventory 
                SET stock_quantity = MAX(0, stock_quantity - ?),
                    status = CASE WHEN (stock_quantity - ?) <= min_threshold THEN 'low_stock' ELSE 'available' END
                WHERE id = ?
                """, (qty, qty, med_id))

        conn.commit()
        conn.close()

        return {
            "success": True,
            "invoice_id": invoice_id,
            "invoice_no": invoice_no,
            "net_total": net_total,
            "message": "Invoice generated and medicine stock updated successfully"
        }
    except Exception as e:
        print("[ERP Billing Invoice Error]:", e)
        return {"success": False, "error": str(e)}

@app.post("/api/erp/panchakarma/book")
def book_erp_panchakarma(req: ERPBookPanchakarmaRequest):
    """Book a Panchakarma session or package."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        pk_id = f"pk_{uuid.uuid4().hex[:8]}"
        start_d = req.start_date or datetime.now().strftime("%Y-%m-%d")

        cursor.execute("""
        INSERT INTO erp_panchakarma (id, patient_name, patient_phone, therapy_name, therapist_name, room_name, start_date, time_slot, days_total, days_completed, status, notes, charge_per_session)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pk_id, req.patient_name, req.patient_phone, req.therapy_name,
            req.therapist_name, req.room_name, start_d, req.time_slot,
            req.days_total, 1, "Scheduled", req.notes, req.charge_per_session
        ))
        conn.commit()
        conn.close()

        return {"success": True, "id": pk_id, "message": "Panchakarma therapy booked"}
    except Exception as e:
        print("[ERP Panchakarma Error]:", e)
        return {"success": False, "error": str(e)}

@app.post("/api/erp/ipd/admit")
def admit_erp_ipd(req: ERPIpdAdmitRequest):
    """Admit patient to an IPD bed."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        adm_date = req.admission_date or datetime.now().strftime("%Y-%m-%d")

        cursor.execute("""
        UPDATE erp_ipd_beds
        SET patient_name = ?, patient_phone = ?, admission_date = ?, discharge_date = ?,
            prakriti = ?, assigned_doctor = ?, diet_instructions = ?, is_occupied = 1, daily_rate = ?
        WHERE bed_number = ?
        """, (
            req.patient_name, req.patient_phone, adm_date, req.discharge_date,
            req.prakriti, req.assigned_doctor, req.diet_instructions, req.daily_rate,
            req.bed_number
        ))
        conn.commit()
        conn.close()

        return {"success": True, "message": f"Patient admitted to {req.bed_number}"}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/erp/ipd/discharge")
def discharge_erp_ipd(payload: Dict[str, str]):
    """Discharge patient from an IPD bed."""
    try:
        bed_number = payload.get("bed_number")
        if not bed_number:
            return {"success": False, "error": "Bed number is required"}

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
        UPDATE erp_ipd_beds
        SET patient_name = NULL, patient_phone = NULL, admission_date = NULL, discharge_date = NULL,
            prakriti = NULL, is_occupied = 0
        WHERE bed_number = ?
        """, (bed_number,))
        conn.commit()
        conn.close()

        return {"success": True, "message": f"Bed {bed_number} is now vacant and sanitized"}
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

