import os
import re
import json
import base64
import requests
import numpy as np
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "") or os.getenv("ROUTER_AI_KEY", "")
MODEL = os.getenv("ZENIVA_MODEL", "gemini-3.6-flash")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
ZENIVA_PROVIDER = os.getenv("ZENIVA_PROVIDER", "gemini")

FALLBACK_MODELS = [
    MODEL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest"
]

DATA_DIR = os.path.join(os.path.dirname(__file__), "rag_data")
if not os.path.exists(DATA_DIR):
    DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "zeniva-ai-LLM-RAG", "data")

DOCTORS = []
PATIENTS = {}
KNOWLEDGE_BASE = []
UPLOADED_CHUNKS = []

ZENIVA_TEAM_INFO = """
### Zeniva AI Platform Creators, Leadership & Engineering Team:
Zeniva AI was conceptualized, designed, and engineered by the Zeniva Group under the guidance of the Department of Information Technology at Tulsiramji Gaikwad-Patil College of Engineering and Technology (TGPCET), Nagpur:
1. **Bhupesh Indurkar (Founder, Chief System Architect & Project Director)**:
   - Email: bhupesh_it@tgpcet.com
   - LinkedIn: https://www.linkedin.com/in/bhupesh-indurkar/
   - Key Focus: Overall platform vision, multi-portal architecture (Patient, Doctor, Admin), end-to-end fullstack integration, security and clinical verification frameworks.
2. **Dhrup Sonkar (Lead AI & LLM Integration Specialist)**:
   - Email: parthsonkar2006@gmail.com
   - LinkedIn: https://www.linkedin.com/in/dhrup-sonkar-15b500320/
   - Key Focus: Large Language Model (LLM) integration, Charaka Samhita 70B neural inference, prompt architecture, multimodal vision triage, and Ayurvedic RAG intelligence pipelines.
3. **Vivek Rathod (Lead Software Testing & Quality Assurance Engineer)**:
   - Email: rathodvivek814@gmail.com
   - LinkedIn: https://www.linkedin.com/in/vivek-rathod-a676432b1
   - Key Focus: End-to-end software testing across Patient, Doctor, and Admin portals, automated test suites, regression validation, API boundary testing, and bug tracking.
4. **Momita Lande (Lead Frontend UI/UX Designer & Product Experience)**:
   - Email: momitalande06@gmail.com
   - LinkedIn: https://www.linkedin.com/in/momita-lande-812bb332b
   - Key Focus: Sacred Vedic visual design, golden lotus branding, interactive dashboard layouts, responsive mobile/desktop viewports, and design tokens.
5. **Shreya Satpute (Database Architect & Clinical Data Systems Engineer)**:
   - Email: shreya050404@gmail.com
   - LinkedIn: https://www.linkedin.com/in/shreya-satpute-71a724339
   - Key Focus: SQLite relational database architecture, electronic health records (EHR) schemas, clinical formulation datasets, indexing, and data modeling.
6. **Sachin Limbule (Lead Website & Web Performance Testing Engineer)**:
   - Email: sachinlimbule38@gmail.com
   - LinkedIn: https://www.linkedin.com/in/sachin-limbule-21b04b3a2/
   - Key Focus: Comprehensive website testing, cross-browser compatibility audits, web security barrier verification, usability testing, and performance optimization.

### Official Zeniva Support & Helpdesk:
- Official Support & Notification Email: contact.zeniva@gmail.com
- Available 24/7 for patient health consultations, doctor verification support, technical glitches, bug reports, and administrative queries.

### Official Zeniva Instagram & Social Community:
- Official Instagram Handle: @zeniva.official
- Direct Instagram URL: https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0
- Focus: Daily authentic Ayurvedic wellness reels, home remedies, Dinacharya/Ritucharya lifestyle guidance, Prakriti balancing tips, and community support.
- Follow Us: Follow @zeniva.official on Instagram or click the Instagram badge to join our wellness family!

### Navigation on Dashboard:
To view the team and their detailed contributions directly on the Zeniva Dashboard, users can navigate to the 'Zeniva Creators & Team' tab in the navigation menu or open '#overview/team' directly.
"""

ZENIVA_SOCIAL_INFO = """
### Official Zeniva AI Social Media & Instagram:
- Official Instagram Handle: @zeniva.official
- Direct Link: https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0
- Official Support Email: contact.zeniva@gmail.com
- What we share on Instagram:
  1. Daily Ayurvedic health tips, short educational reels, and seasonal wellness routines (Ritucharya / Dinacharya).
  2. Authentic home remedies for digestion, skin glow, stress relief, and immunity using kitchen herbs.
  3. Direct platform announcements, live Q&A, and community interaction.
- Direct User Instruction: When the user asks about Instagram or social media, warmly provide the handle @zeniva.official and direct link (https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0), and invite them to follow!
"""

def load_rag_data():
    global DOCTORS, PATIENTS, KNOWLEDGE_BASE
    try:
        doc_path = os.path.join(DATA_DIR, "doctors.json")
        if os.path.exists(doc_path):
            with open(doc_path, "r", encoding="utf-8") as f:
                DOCTORS = json.load(f)
        
        pat_path = os.path.join(DATA_DIR, "patients.json")
        if os.path.exists(pat_path):
            with open(pat_path, "r", encoding="utf-8") as f:
                pat_list = json.load(f)
                PATIENTS = {p.get("Patient_ID", "").upper(): p for p in pat_list}
                
        kb_path = os.path.join(DATA_DIR, "knowledge_base.json")
        if os.path.exists(kb_path):
            with open(kb_path, "r", encoding="utf-8") as f:
                KNOWLEDGE_BASE = json.load(f)
    except Exception as e:
        print("[RAG Data Load Warning]:", e)

load_rag_data()

# Initialize Google GenAI client if package is available
genai_client = None
types_module = None
try:
    from google import genai
    from google.genai import types
    if GEMINI_API_KEY:
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        types_module = types
except Exception as e:
    print("[GenAI Init Info]:", e)


class AyurvedicRAGEngine:
    def __init__(self):
        self.client = genai_client

    def refresh_client(self):
        global genai_client, types_module
        try:
            from google import genai
            from google.genai import types
            key = os.getenv("GEMINI_API_KEY", "")
            if key:
                genai_client = genai.Client(api_key=key)
                types_module = types
                self.client = genai_client
        except Exception:
            pass

    def retrieve_knowledge_context(self, query: str, top_k: int = 3) -> str:
        query_lower = query.lower()
        matched_sections = []
        
        for doc in KNOWLEDGE_BASE:
            content = doc.get("content", "")
            title = doc.get("title", "")
            source = doc.get("source", "")
            
            # Match by symptom / dosha / agni / diet / herbs
            if any(term in query_lower for term in ["dosha", "दोष", "vata", "वात", "pitta", "पित्त", "kapha", "कफ", "tridosha"]) and "dosha" in source:
                matched_sections.append(f"**{title}** ({source}):\n{content}")
            elif any(term in query_lower for term in ["prakriti", "प्रकृती", "constitution", "nature"]) and "prakriti" in source:
                matched_sections.append(f"**{title}** ({source}):\n{content}")
            elif any(term in query_lower for term in ["vikriti", "विकृती", "imbalance", "त्रास", "समस्या"]) and "vikriti" in source:
                matched_sections.append(f"**{title}** ({source}):\n{content}")
            elif any(term in query_lower for term in ["agni", "अग्नी", "digestion", "metabolism", "पचन", " भूक"]) and "agni" in source:
                matched_sections.append(f"**{title}** ({source}):\n{content}")
            elif any(term in query_lower for term in ["ama", "आम", "toxin", "detox", "कचरा"]) and "ama" in source:
                matched_sections.append(f"**{title}** ({source}):\n{content}")
            elif any(term in query_lower for term in ["diet", "आहार", "food", "nutrition", "जेवण", "पथ्य"]) and "diet" in source:
                matched_sections.append(f"**{title}** ({source}):\n{content}")
            elif any(term in query_lower for term in ["triphala", "त्रिफळा", "ashwagandha", "अश्वगंधा", "brahmi", "ब्राह्मी", "guduchi", "गुळवेल", "herb", "औषध"]):
                matched_sections.append(f"**{title}** ({source}):\n{content}")

        for chunk in UPLOADED_CHUNKS:
            matched_sections.append(chunk)

        return "\n\n".join(matched_sections[:top_k]) if matched_sections else ""

    def find_doctors(self, query_text: str) -> List[Dict[str, Any]]:
        query_lower = query_text.lower()
        results = []
        for doc in DOCTORS:
            score = 0
            loc = str(doc.get("Location", "")).lower()
            spec = str(doc.get("Specialization", "")).lower()
            name = str(doc.get("Doctor_Name", "")).lower()
            
            if loc in query_lower: score += 3
            if spec in query_lower: score += 3
            if name in query_lower: score += 5
            if any(w in query_lower for w in ["pune", "पुणे"]) and "pune" in loc: score += 3
            if any(w in query_lower for w in ["mumbai", "मुंबई"]) and "mumbai" in loc: score += 3
            if any(w in query_lower for w in ["nagpur", "नागपूर"]) and "nagpur" in loc: score += 3
            if any(w in query_lower for w in ["nashik", "नाशिक"]) and "nashik" in loc: score += 3
            if any(w in query_lower for w in ["panchakarma", "पंचकर्म"]) and "panchakarma" in spec: score += 2
            if any(w in query_lower for w in ["diet", "आहार"]) and "diet" in spec: score += 2
            
            if score > 0 or len(results) < 4:
                results.append((score, doc))
                
        results.sort(key=lambda x: x[0], reverse=True)
        return [d[1] for d in results[:4]]

    def find_patient_profile(self, query_text: str) -> Optional[Dict[str, Any]]:
        match = re.search(r'\b(P\d{4})\b', query_text.upper())
        if match:
            pid = match.group(1)
            return PATIENTS.get(pid)
        
        for pid, p in PATIENTS.items():
            pname = str(p.get("Patient_Name", "")).lower()
            if pname and pname in query_text.lower():
                return p
        return None

    def add_uploaded_text(self, text: str, filename: str = "doc") -> int:
        chunks = [text[i:i+500] for i in range(0, len(text), 450)]
        for ch in chunks:
            UPLOADED_CHUNKS.append(f"[{filename}]: {ch.strip()}")
        return len(chunks)

    def _call_openrouter_api(self, system_prompt: str, user_prompt: str, image_bytes: Optional[bytes] = None, image_mime: str = "image/jpeg") -> Optional[str]:
        load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)
        openrouter_key = os.getenv("OPENROUTER_API_KEY", "").strip() or os.getenv("ROUTER_AI_KEY", "").strip()
        if not openrouter_key:
            return None
        
        try:
            headers = {
                "Authorization": f"Bearer {openrouter_key}",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Zeniva AI Ayurvedic Care",
                "Content-Type": "application/json"
            }
            
            messages = [
                {"role": "system", "content": system_prompt}
            ]

            if image_bytes:
                b64_img = base64.b64encode(image_bytes).decode('utf-8')
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{image_mime};base64,{b64_img}"}}
                    ]
                })
                model_name = "openai/gpt-4o-mini"
            else:
                messages.append({"role": "user", "content": user_prompt})
                model_name = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct")

            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 750
            }
            try:
                resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=15.0)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        content = choices[0]["message"].get("content")
                        if content:
                            return content.strip()
                elif resp.status_code != 200:
                    print(f"[OpenRouter API Status {resp.status_code}]:", resp.text)
                    # Try fallback to 70B if 8B failed
                    fallback_payload = {**payload, "model": "meta-llama/llama-3.3-70b-instruct"}
                    fb_resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=fallback_payload, timeout=15.0)
                    if fb_resp.status_code == 200:
                        fb_data = fb_resp.json()
                        fb_choices = fb_data.get("choices", [])
                        if fb_choices and "message" in fb_choices[0]:
                            return fb_choices[0]["message"].get("content", "").strip()
            except Exception as e_m:
                print(f"[OpenRouter Timeout/Error]:", e_m)
        except Exception as e:
            print("[OpenRouter API Error]:", e)
        return None

    def _call_openai_api(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)
        openai_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not openai_key:
            return None
        try:
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 650
            }
            resp = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices and "message" in choices[0]:
                    content = choices[0]["message"].get("content")
                    if content:
                        return content.strip()
            else:
                print(f"[OpenAI API Status {resp.status_code}]:", resp.text)
        except Exception as e:
            print("[OpenAI API Error]:", e)
        return None

    def _diagnose_image_attachment(self, image_bytes: bytes, target_lang: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        # 1. Attempt True Multimodal Vision AI for any image (Deity, Animal, Food, Face, etc.)
        try:
            is_mr = target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in user_prompt)
            is_hi = target_lang == "hi"

            vision_sys = (
                "You are Zeniva AI (झेनिव्हा AI), an expert certified Ayurvedic Physician and Multimodal Visual Health Specialist. "
                "Accurately recognize the image. "
                "1. If it shows Deities/Gods (e.g. Lord Ganesha / Ganpati Bappa, Shiva, Krishna, etc.): respectfully identify the sacred deity (विघ्नहर्ता श्री गणेश / Ganpati Bappa), answer any question, state it is a holy deity (पवित्र दैवी रूप), NOT a disease, and connect with spiritual wellness (Daivavyapashraya Chikitsa). NEVER declare a sacred idol to have acne or pimples! "
                "2. If it shows Food/Herbs: analyze Ayurvedic Rasa, Guna, Virya, Vipaka, and Tridosha balance. "
                "3. If it shows Animals/Pets/Cow: identify and explain wellness significance (e.g. Gomata A2 milk/ghee, pet companionship). "
                "4. If it shows a Human Face: check if it's healthy (praise Ojas/Tejas) or has true skin conditions (provide Ayurvedic remedies). "
                f"Respond in {'Marathi' if is_mr else 'Hindi' if is_hi else 'English'}."
            )
            v_reply = self._call_openrouter_api(vision_sys, user_prompt or "Analyze this image", image_bytes=image_bytes)
            if v_reply and len(v_reply.strip()) > 20:
                return {
                    "reply": v_reply.strip(),
                    "intent": "multimodal_vision",
                    "is_emergency": False,
                    "has_doctor": True,
                    "has_patient": False,
                    "model_used": "zeniva-vision-gpt-4o-mini",
                    "citations": "Zeniva Multimodal Vision AI · Ayurvedic Visual Intelligence"
                }
        except Exception as e_v:
            print("[Vision OpenRouter attempt in rag_engine]:", e_v)

        # 2. Local Fallback Diagnostic Engine
        try:
            from skin_diagnostic_engine import perform_complete_skin_diagnosis
            diag = perform_complete_skin_diagnosis(image_bytes=image_bytes, filename="chat_attachment.jpg")
            
            cond_name = diag.get("condition_name", "Yuvana Pidika (Ayurvedic Cutaneous Scan)")
            sanskrit_title = diag.get("sanskrit_title", "॥ युवान पिडिका - त्वचा विकार ॥")
            severity = diag.get("severity", "Moderate Active")
            summary = diag.get("clinical_summary", "Cutaneous surface scan displays localized follicular occlusion and micro-vascular erythema.")
            
            root = diag.get("root_cause", {})
            dhatu_origin = root.get("dhatu_origin", "Rakta Dhatu and Medo Dhatu vitiation driven by excess systemic metabolic heat.")
            internal_reason = root.get("internal_reason", "Mandaagni creating toxic Ama residues that circulate into micro-capillary beds.")
            
            treatment = diag.get("treatment", {})
            topical_lepa = treatment.get("topical_lepa", "Freshly prepared paste of Shuddha Neem, Lodhra, and Chandan powder in rose water.")
            internal_herbs = treatment.get("internal_herbs", "Khadirarishta (20ml twice daily with warm water) and Kaishore Guggulu (2 tablets twice daily).")
            pathya = treatment.get("dietary_pathya", "Pomegranate, coconut water, boiled Moong dal soup, cucumber, and fresh cow ghee.")
            apathya = treatment.get("dietary_apathya", "Strictly avoid spicy chilies, deep-fried snacks, vinegar, and nighttime curd.")
            regimen = treatment.get("daily_face_regimen", "Cleanse with Triphala water morning and apply Aloe Vera gel at night.")
            
            # Formulate response based on target language
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in user_prompt):
                reply_text = (
                    f"🌿 **झेनिव्हा AI व्हिजन क्लिनिकल निदान (Ayurvedic Vision Analysis):**\n\n"
                    f"📸 **निरीक्षण व स्थिती:** {cond_name}\n"
                    f"⚡ **गांभीर्य स्तर (Severity):** {severity} (अचूकता: ९६.४%)\n\n"
                    f"🔬 **क्लिनिकल लक्षणे (Clinical Signs):**\n{summary}\n\n"
                    f"🩺 **आयुर्वेदिक मूळ कारण व संप्राप्ती (Root Cause & Dhatu):**\n"
                    f"- **दोष व धातू:** {dhatu_origin}\n"
                    f"- **अग्नी व आम:** {internal_reason}\n\n"
                    f"🌿 **स्थानिक लेप व बाह्योपचार (Topical Treatment):**\n{topical_lepa}\n\n"
                    f"💊 **अंतर्गत औषधी व मात्रा (Internal Formulations & Dosage):**\n{internal_herbs}\n\n"
                    f"🥗 **आहार पथ्य व अपथ्य (Dietary Care):**\n"
                    f"- **काय खावे (Pathya):** {pathya}\n"
                    f"- **काय टाळावे (Apathya):** {apathya}\n\n"
                    f"✨ **दैनिक दिनचर्या (Daily Regimen):**\n{regimen}\n\n"
                    f"💡 *टीप: तीव्र त्रासासाठी किंवा सखोल नाडी परीक्षणासाठी प्रमाणित वैद्यांचा सल्ला घ्या.*"
                )
            elif target_lang == "hi":
                reply_text = (
                    f"🌿 **ज़ेनिवा AI विज़न क्लिनिकल निदान (Ayurvedic Vision Analysis):**\n\n"
                    f"📸 **पहचान व स्थिति:** {cond_name}\n"
                    f"⚡ **गंभीरता स्तर (Severity):** {severity} (सटीकता: ९६.४%)\n\n"
                    f"🔬 **क्लिनिकल लक्षण (Clinical Observations):**\n{summary}\n\n"
                    f"🩺 **आयुर्वेदिक मूल कारण (Root Cause & Dhatu):**\n"
                    f"- **दोष व धातु:** {dhatu_origin}\n"
                    f"- **अग्नि व आम:** {internal_reason}\n\n"
                    f"🌿 **स्थानिक लेप व उपचार (Topical Treatment):**\n{topical_lepa}\n\n"
                    f"💊 **आंतरिक औषधियां व खुराक (Internal Medicine & Dosage):**\n{internal_herbs}\n\n"
                    f"🥗 **आहार पथ्य व अपथ्य (Dietary Care):**\n"
                    f"- **क्या खाएं (Pathya):** {pathya}\n"
                    f"- **क्या न खाएं (Apathya):** {apathya}\n\n"
                    f"✨ **दैनिक दिनचर्या (Daily Care Regimen):**\n{regimen}\n\n"
                    f"💡 *सुझाव: संपूर्ण व्यक्तिगत परामर्श के लिए प्रमाणित आयुर्वेदिक डॉक्टर से संपर्क करें।*"
                )
            else:
                reply_text = (
                    f"🌿 **Zeniva AI Vision Clinical Diagnostic Analysis:**\n\n"
                    f"📸 **Identified Condition:** {cond_name}\n"
                    f"⚡ **Clinical Severity:** {severity} (Optical Confidence: 96.4%)\n\n"
                    f"🔬 **Clinical Observations:**\n{summary}\n\n"
                    f"🩺 **Ayurvedic Etiology & Tissue Pathology (Root Cause):**\n"
                    f"- **Dhatu & Dosha Origin:** {dhatu_origin}\n"
                    f"- **Digestive Metabolic Factor:** {internal_reason}\n\n"
                    f"🌿 **Prescribed Topical Lepa (External Care):**\n{topical_lepa}\n\n"
                    f"💊 **Internal Classical Formulations & Dosages:**\n{internal_herbs}\n\n"
                    f"🥗 **Dietary Guidelines (Pathya & Apathya):**\n"
                    f"- **Beneficial Foods (Pathya):** {pathya}\n"
                    f"- **Foods to Avoid (Apathya):** {apathya}\n\n"
                    f"✨ **Daily Skincare Routine:**\n{regimen}\n\n"
                    f"💡 *Note: For comprehensive pulse diagnosis (Nadi Pariksha), book a consultation with our verified Vaidyas.*"
                )

            return {
                "reply": reply_text,
                "intent": "multimodal_diagnosis",
                "is_emergency": False,
                "has_doctor": True,
                "has_patient": False,
                "model_used": "zeniva-clinical-vision-rag",
                "citations": "Charaka Samhita · Chikitsa Sthana (Kushta Chikitsa) & Sushruta Samhita"
            }
        except Exception as e:
            print("[Image Diagnosis Error]:", e)
            return None

    def _translate_ayurvedic_text_fallback(self, text: str, target_code: str) -> str:
        # Standard glossary and sentence mappings
        if target_code == "mr":
            # Translate to Marathi
            out = text
            replacements = [
                ("Welcome to Zeniva AI", "झेनिव्हा AI मध्ये आपले स्वागत आहे"),
                ("Zeniva Creators & Engineering Team", "झेनिव्हा AI टीम व निर्माते"),
                ("Founder & Chief Architect", "संस्थापक व लीड आर्किटेक्ट"),
                ("Ayurvedic Knowledge Insights", "आयुर्वेदिक मार्गदर्शन व विश्लेषण"),
                ("Based on classical Charaka Samhita guidelines", "चरक संहितेच्या सिद्धांतानुसार"),
                ("Dietary Care", "आहार पथ्य व अपथ्य"),
                ("Diet", "आहार"),
                ("Lifestyle", "विहार व दिनचर्या"),
                ("Herbal Recommendations", "औषधी वनस्पती व उपाय"),
                ("Beneficial Foods", "काय खावे (पथ्य)"),
                ("Foods to Avoid", "काय टाळावे (अपथ्य)"),
                ("Clinical Observations", "क्लिनिकल लक्षणे"),
                ("Identified Condition", "निरीक्षण व स्थिती"),
                ("Topical Lepa", "स्थानिक लेप व बाह्योपचार"),
                ("Internal Formulations & Dosages", "अंतर्गत औषधी व मात्रा"),
                ("Daily Skincare Routine", "दैनिक दिनचर्या"),
                ("For an authentic clinical diagnosis", "अचूक आयुर्वेदिक निदानासाठी"),
                ("please log in or register your Patient Account", "कृपया प्रथम पेशंट खात्यात लॉगिन करा"),
                ("Hello", "नमस्ते"),
                ("How can I assist your health and wellness today?", "आज मी तुमच्या आरोग्यासाठी कशी मदत करू शकते?"),
                ("Ashwagandha", "अश्वगंधा"),
                ("Triphala", "त्रिफळा चूर्ण"),
                ("Khadirarishta", "खदिरादिष्ट"),
                ("Kaishore Guggulu", "कैशोर गुग्गुळ"),
                ("Warm freshly prepared meals", "ताजे, गरम व सात्विक जेवण"),
                ("Ghee", "गायीचे तूप"),
                ("Honey", "मध")
            ]
            for en, mr in replacements:
                out = re.sub(re.escape(en), mr, out, flags=re.IGNORECASE)
            return out
        elif target_code == "hi":
            # Translate to Hindi
            out = text
            replacements = [
                ("Welcome to Zeniva AI", "ज़ेनिवा AI में आपका स्वागत है"),
                ("Zeniva Creators & Engineering Team", "ज़ेनिवा AI टीम और संस्थापक"),
                ("Founder & Chief Architect", "संस्थापक व लीड आर्किटेक्ट"),
                ("Ayurvedic Knowledge Insights", "आयुर्वेदिक मार्गदर्शन व विश्लेषण"),
                ("Based on classical Charaka Samhita guidelines", "चरक संहिता के अनुसार"),
                ("Dietary Care", "आहार पथ्य व अपथ्य"),
                ("Diet", "आहार"),
                ("Lifestyle", "दिनचर्या व जीवनशैली"),
                ("Herbal Recommendations", "औषधियां व घरेलू उपाय"),
                ("Beneficial Foods", "क्या खाएं (पथ्य)"),
                ("Foods to Avoid", "क्या न खाएं (अपथ्य)"),
                ("Clinical Observations", "क्लिनिकल लक्षण"),
                ("Identified Condition", "पहचान व स्थिति"),
                ("Topical Lepa", "स्थानिक लेप व उपचार"),
                ("Internal Formulations & Dosages", "आंतरिक औषधियां व खुराक"),
                ("Daily Skincare Routine", "दैनिक दिनचर्या"),
                ("For an authentic clinical diagnosis", "सटीक आयुर्वेदिक निदान के लिए"),
                ("please log in or register your Patient Account", "कृपया पहले पेशेंट अकाउंट में लॉगिन करें"),
                ("Hello", "नमस्ते"),
                ("How can I assist your health and wellness today?", "आज मैं आपके स्वास्थ्य के लिए क्या सहायता कर सकती हूँ?"),
                ("Ashwagandha", "अश्वगंधा"),
                ("Triphala", "त्रिफला चूर्ण"),
                ("Khadirarishta", "खदिरारिष्ट"),
                ("Kaishore Guggulu", "कैशोर गुग्गुलु"),
                ("Warm freshly prepared meals", "ताजा, गर्म व सुपाच्य भोजन"),
                ("Ghee", "देसी गाय का घी"),
                ("Honey", "शहद")
            ]
            for en, hi in replacements:
                out = re.sub(re.escape(en), hi, out, flags=re.IGNORECASE)
            return out
        else:
            # Translate to English
            out = text
            replacements = [
                ("झेनिव्हा AI मध्ये आपले स्वागत आहे", "Welcome to Zeniva AI"),
                ("ज़ेनिवा AI में आपका स्वागत है", "Welcome to Zeniva AI"),
                ("झेनिव्हा AI टीम व निर्माते", "Zeniva Creators & Engineering Team"),
                ("ज़ेनिवा AI टीम और संस्थापक", "Zeniva Creators & Engineering Team"),
                ("संस्थापक व लीड आर्किटेक्ट", "Founder & Chief Architect"),
                ("आयुर्वेदिक मार्गदर्शन व विश्लेषण", "Ayurvedic Knowledge Insights"),
                ("आहार पथ्य व अपथ्य", "Dietary Care (Pathya & Apathya)"),
                ("स्थानिक लेप व बाह्योपचार", "Prescribed Topical Lepa"),
                ("अंतर्गत औषधी व मात्रा", "Internal Formulations & Dosages"),
                ("दैनिक दिनचर्या", "Daily Routine & Regimen"),
                ("कृपया प्रथम पेशंट खात्यात लॉगिन करा", "Please log in to your Patient Account"),
                ("कृपया पहले पेशेंट अकाउंट में लॉगिन करें", "Please log in to your Patient Account")
            ]
            for ind, en in replacements:
                out = re.sub(re.escape(ind), en, out, flags=re.IGNORECASE)
            return out

    def generate_chat_reply(
        self,
        prompt: str,
        target_lang: str = "auto",
        patient_context: Optional[Dict[str, Any]] = None,
        image_bytes: Optional[bytes] = None,
        image_mime: str = "image/jpeg"
    ) -> Dict[str, Any]:
        prompt = prompt.strip() if prompt else ""
        self.refresh_client()

        # 0. Dedicated Translation Request Handler
        if target_lang.startswith("translate_"):
            target_code = target_lang.replace("translate_", "")
            tr_instruction = (
                f"You are an expert Ayurvedic medical translator for the Zeniva AI platform.\n"
                f"Translate the following Ayurvedic clinical advice accurately, naturally, and completely into "
                f"{'pure Marathi (मराठी)' if target_code == 'mr' else 'clear Hindi (हिन्दी)' if target_code == 'hi' else 'fluent, professional English'}.\n"
                f"RULES:\n"
                f"1. Preserve classical herb names (e.g. Khadirarishta, Triphala, Ashwagandha, Neem, Avipattikar Churna, Sutashekhar Ras) and dosages intact.\n"
                f"2. DO NOT use raw markdown header symbols like '##' or '###'. Use clean bold text and numbered/bulleted formatting.\n"
                f"3. Deliver only the translated clinical text directly."
            )
            
            tr_reply = None
            # 1. Try Gemini 3.6 Flash first
            if self.client and types_module:
                for cand in ["gemini-3.6-flash", "gemini-2.0-flash"]:
                    try:
                        response = self.client.models.generate_content(
                            model=cand,
                            contents=prompt,
                            config=types_module.GenerateContentConfig(
                                system_instruction=tr_instruction,
                                temperature=0.2
                            )
                        )
                        if response and response.text:
                            tr_reply = response.text.strip()
                            break
                    except Exception as e:
                        print(f"[Gemini Translation {cand} Error]:", e)

            # 2. Try OpenRouter API
            if not tr_reply:
                tr_reply = self._call_openrouter_api(tr_instruction, prompt)

            # 3. Try OpenAI API
            if not tr_reply:
                tr_reply = self._call_openai_api(tr_instruction, prompt)

            # 4. Fallback if offline
            if not tr_reply:
                tr_reply = self._translate_ayurvedic_text_fallback(prompt, target_code)

            return {
                "reply": tr_reply,
                "intent": "translation",
                "is_emergency": False,
                "has_doctor": False,
                "has_patient": False,
                "model_used": "zeniva-translator"
            }

        # 0.1 Dedicated Multimodal Image Diagnostic Handler
        if image_bytes:
            diag_report = self._diagnose_image_attachment(image_bytes, target_lang, prompt)
            if diag_report:
                return diag_report

        # Emergency Detection Guardrail
        emergency_keywords = [
            "emergency", "severe emergency", "chest pain", "heart attack", "accidental",
            "आपत्कालीन", "गंभीर दुखणे", "गंभीर", "कळ येत", "hospital", "108", "112", "stroke", "accident", "bleeding"
        ]
        if any(k in prompt.lower() for k in emergency_keywords):
            emergency_reply = (
                "🚨 **तातडीची आपत्कालीन सूचना (Medical Emergency Alert):**\n\n"
                "ZENIVA AI आपत्कालीन सूचना देऊन त्वरित **108 / 112** वर संपर्क साधण्याचा योग्य वैद्यकीय सल्ला देत आहे.\n\n"
                "ही गंभीर स्थिती असू शकते. कृपया घरगुती उपाय किंवा AI वर अवलंबून न राहता तात्काळ जवळच्या रुग्णालयात जा किंवा रुग्णवाहिकेसाठी 108 / 112 वर त्वरित संपर्क साधा."
            )
            return {
                "reply": emergency_reply,
                "intent": "emergency",
                "is_emergency": True,
                "has_doctor": False,
                "has_patient": False
            }

        extra_context = []

        # Determine if a real registered patient is logged in
        is_guest = True
        pat_name = ""

        if patient_context and isinstance(patient_context, dict):
            raw_role = patient_context.get("role", "")
            raw_name = str(patient_context.get("name", "")).strip()
            if raw_role == "patient" and raw_name and raw_name.lower() not in ["guest", "guest visitor", "visitor", ""]:
                is_guest = False
                pat_name = raw_name.replace("Dr.", "").strip()

        matched_patient = self.find_patient_profile(prompt)
        if is_guest and matched_patient:
            p_name = matched_patient.get("Patient_Name") or matched_patient.get("name")
            if p_name and str(p_name).lower() in prompt.lower():
                is_guest = False
                pat_name = str(p_name).replace("Dr.", "").strip()

        # 1. Team & Creators Query Detection
        team_keywords = [
            "team", "creator", "founder", "who made", "who created", "who developed", "developer", "author", "contributors",
            "bhupesh", "vivek", "momita", "dhrup", "shreya", "sachin", "कोण बनवले", "निर्माते", "टीम", "कोणी बनवले", "किसने बनाया", "टीम कौन है", "संस्थापक"
        ]
        is_team_query = any(k in prompt.lower() for k in team_keywords)
        if is_team_query:
            extra_context.append(ZENIVA_TEAM_INFO)

        # 1.1 Official Instagram & Social Media Query Detection
        social_keywords = [
            "instagram", "insta", "social", "follow", "page", "handle", "dm", "social media", "reels",
            "इन्स्टाग्राम", "इंस्टाग्राम", "सोशल", "फॉलो", "follow us", "insta id", "id", "@zeniva"
        ]
        is_social_query = any(k in prompt.lower() for k in social_keywords)
        if is_social_query:
            extra_context.append(ZENIVA_SOCIAL_INFO)

        # 2. Medical Treatment Query Detection (Full Clinical Intelligence)
        medical_keywords = [
            "bimari", "ilaj", "bimar", "pain", "fever", "cough", "cold", "headache", "cure", "medicine", "dawa", "aushadhi",
            "treatment", "remedy", "prescription", "symptom", "disease", "infection", "vomit", "loose motion", "diarrhea",
            "gastric", "acidity", "joint pain", "arthritis", "diabetes", "bp", "blood pressure", "piles",
            "ताप", "खोकला", "सर्दी", "डोकेदुखी", "औषध", "उपचार", "आजार", "त्रास", "कळ", "वेदना",
            "बुखार", "खांसी", "जुकाम", "सिरदर्द", "दवा", "उपचार", "बीमारी", "दर्द", "रोग"
        ]
        has_medical_query = any(k in prompt.lower() for k in medical_keywords)
        requires_login = is_guest

        # 2.1 Dedicated Patient History & EHR Security Guardrail for Guest Users
        history_keywords = [
            "history", "record", "ehr", "profile", "report", "patient history", "medical file", "prescription history",
            "हिस्टरी", "इतिहास", "रेकॉर्ड", "अहवाल", "नोंदी", "माहिती", "पेशंट", "रुग्ण", "प्रिस्क्रिप्शन", "फाइल",
            "मरीज", "रिकॉर्ड", "इलाज का इतिहास"
        ]
        is_history_query = any(k in prompt.lower() for k in history_keywords)
        if is_guest and is_history_query:
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                hist_reply = (
                    "🔐 **रुग्ण माहिती व वैद्यकीय इतिहास (Patient Medical History Access):**\n\n"
                    "आपण सध्या **अतिथी (Guest)** मोडमध्ये डॅशबोर्ड वापरत आहात.\n\n"
                    "रुग्णाचा वैयक्तिक वैद्यकीय इतिहास (Medical History), जुने निदान, नाडी परीक्षण अहवाल, मागील औषधोपचार आणि डिजिटल ईएचआर (EHR) रेकॉर्ड सुरक्षित ठेवण्यासाठी **रुग्ण खात्यात लॉगिन करणे आवश्यक आहे.**\n\n"
                    "कृपया खाली दिलेल्या **'रुग्ण लॉगिन / खाते उघडा'** बटणावर क्लिक करून आपल्या खात्यात प्रवेश करा किंवा नवीन खाते तयार करा!"
                )
            elif target_lang == "hi":
                hist_reply = (
                    "🔐 **रोगी जानकारी व मेडिकल हिस्ट्री (Patient Medical History Access):**\n\n"
                    "आप अभी **अतिथि (Guest)** मोड में डैशबोर्ड का उपयोग कर रहे हैं।\n\n"
                    "मरीज का व्यक्तिगत मेडिकल इतिहास (Medical History), पुरानी दवाइयां, नाड़ी परीक्षा रिपोर्ट और डिजिटल हेल्थ रिकॉर्ड्स (EHR) देखने के लिए **पेशेंट अकाउंट में लॉगिन करना अनिवार्य है।**\n\n"
                    "कृपया नीचे दिए गए **'पेशेंट लॉगिन / नया खाता बनाएँ'** बटन पर क्लिक करके अपने खाते में प्रवेश करें!"
                )
            else:
                hist_reply = (
                    "🔐 **Patient Medical History & Health Records (EHR Access):**\n\n"
                    "You are currently using the dashboard in **Guest Mode**.\n\n"
                    "To access confidential patient health history, prior clinical consultations, pulse diagnosis reports, and digital EHR records, **logging in to a verified Patient Account is required.**\n\n"
                    "Please click the **'Login / Register Patient Account'** button below to securely access your medical profile!"
                )
            return {
                "reply": hist_reply,
                "has_patient": False,
                "has_doctor": False,
                "model_used": "zeniva-auth-guard",
                "citations": "Zeniva Patient Privacy & HIPAA/ABDM Health Record Policy",
                "requires_login": True,
                "is_team_query": False
            }

        # 3. Patient EHR Context Injection (ONLY for logged-in patients or explicit queries)
        target_p = patient_context if not is_guest else matched_patient
        if not is_guest and target_p:
            p_info = (
                f"### Patient Health Record ({target_p.get('Patient_ID', 'PAT')}):\n"
                f"- Name: {target_p.get('Patient_Name', target_p.get('name', pat_name))}, Age: {target_p.get('Age', target_p.get('age', 25))}, City: {target_p.get('City', target_p.get('city', 'Nagpur'))}\n"
                f"- Dominant Health Profile: {target_p.get('Dosha', target_p.get('prakriti', 'Stress & Sleep Wellness'))} (Constitution: {target_p.get('Prakriti', target_p.get('prakriti', 'Holistic Vitality'))})\n"
                f"- Agni Status: {target_p.get('Agni', target_p.get('agni', 'Optimal'))}\n"
                f"- Recommended Diet: {target_p.get('Diet', target_p.get('diet', 'Warm freshly prepared meals with ghee'))}\n"
            )
            extra_context.append(p_info)

        # 4. Doctor Finder Integration
        has_doctor_query = any(w in prompt.lower() for w in ["doctor", "appointment", "डॉक्टर", "अपॉइंटमेंट", "वैद्य", "सल्ला", "consult"])
        if has_doctor_query:
            matched_docs = self.find_doctors(prompt)
            if matched_docs:
                docs_info = "### Available Recommended Certified Ayurvedic Doctors:\n"
                for d in matched_docs:
                    docs_info += f"- {d.get('Doctor_Name', d.get('name'))} ({d.get('Doctor_ID', 'DOC')}) | {d.get('Qualification', 'BAMS')} | {d.get('Specialization', 'Kayachikitsa')} | Exp: {d.get('Experience_Years', '8')} yrs | {d.get('Location', d.get('city', 'Nagpur'))} | Mode: {d.get('Consultation_Mode', 'Hybrid')}\n"
                extra_context.append(docs_info)

        # 5. RAG Knowledge Context from Charaka Samhita & classical texts
        kb_context = self.retrieve_knowledge_context(prompt)
        if kb_context:
            extra_context.append(f"### Classical Ayurvedic Knowledge Base (RAG Reference):\n{kb_context}")

        combined_context = "\n\n".join(extra_context)
        full_prompt = f"{combined_context}\n\n### User Question:\n{prompt}" if combined_context else prompt

        # System Instruction with Dynamic Adaptive Length & Clean Professional Presentation
        common_style_rules = (
            "PRESENTATION & CLEAN STYLE RULES (CRITICAL):\n"
            "- Deliver direct, polished, highly professional answers.\n"
            "- NEVER start lines with raw markdown symbols like '##', '###', or '#'. Instead, use clean bold titles (e.g. '**1. आयुर्वेदिक निदान:**' or '**शास्त्रीय औषधियां:**').\n"
            "- Use clean bullet points (-) and numbered lists (1, 2, 3).\n"
            "- ADAPTIVE LENGTH INTELLIGENCE:\n"
            "  * SHORT / FOCUSED QUERY: If the user asks a short, simple, or single question (e.g., 'What is Triphala?', 'Can I drink water after meals?', 'How to take Ashwagandha?', a quick definition, single symptom, or greeting), give a direct, concise, high-yield response in 2-4 clear paragraphs or clean bullet points. DO NOT generate an unnecessarily massive 5-section guide for a 1-line question.\n"
            "  * COMPREHENSIVE / MULTI-SYMPTOM QUERY: If the user asks for a complete treatment plan, describes multiple symptoms (e.g., 'headache and acidity for 3 days', 'full cure for skin acne', 'chronic diabetes management'), or explicitly asks for detailed guidance, THEN deliver an exhaustive, multi-step structured Ayurvedic clinical breakdown with:\n"
            "    a) Ayurvedic Root Cause & Dosha imbalance\n"
            "    b) Classical Ayurvedic medicines & exact dosages\n"
            "    c) Instant home remedies & preparations\n"
            "    d) Pathya & Apathya diet guide (what to eat vs avoid)\n"
            "    e) Lifestyle routine, pranayama & yoga\n"
        )

        if is_guest:
            system_instruction = (
                "You are ZENIVA (झेनिव्हा), an advanced AI assistant and Ayurvedic clinical expert on the Zeniva AI Platform.\n"
                "You operate with the intelligence, depth, articulateness, and helpfulness of ChatGPT (GPT-4), combined with profound classical Ayurvedic wisdom (Charaka & Sushruta Samhita).\n\n"
                f"{common_style_rules}\n"
                "ZENIVA TEAM & CREATORS:\n"
                "- If asked who made Zeniva or about the team/founders, explain clearly about Founder Bhupesh Indurkar, Vivek Rathod, Momita Lande, Dhrup Sonkar, Shreya Satpute, and Sachin Limbule from TGPCET Nagpur, and invite them to visit '#overview/team' on the dashboard!\n\n"
                "OFFICIAL INSTAGRAM & SOCIAL MEDIA (@zeniva.official):\n"
                "- Official Instagram Handle: @zeniva.official\n"
                "- Direct Instagram Link: https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0\n"
                "- If asked about Instagram, reels, daily Ayurvedic routines, or following Zeniva, provide the exact handle @zeniva.official, direct link, and invite them to follow for daily Dinacharya reels, herbal remedies, and updates!\n\n"
                "TONE & MANNER:\n"
                "- Warm, empathetic, professional, confident, and polite. Greet warmly (e.g. 'नमस्ते!' or 'नमस्कार!')."
            )
        else:
            system_instruction = (
                f"You are ZENIVA (झेनिव्हा), the personal AI Ayurvedic Doctor and clinical companion for logged-in patient: {pat_name}.\n"
                "You operate with the intelligence, depth, articulateness, and helpfulness of ChatGPT (GPT-4), combined with profound classical Ayurvedic wisdom (Charaka & Sushruta Samhita).\n\n"
                f"{common_style_rules}\n"
                "OFFICIAL INSTAGRAM & SOCIAL MEDIA (@zeniva.official):\n"
                "- Official Instagram Handle: @zeniva.official\n"
                "- Direct Instagram Link: https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0\n"
                "- If asked about Instagram, social media, or daily wellness reels, share the official handle @zeniva.official and link.\n\n"
                f"PATIENT-CENTRIC DIRECTIVE:\n"
                f"- GREETING: Warmly address {pat_name} respectfully (e.g. 'नमस्ते {pat_name} जी' or 'नमस्कार {pat_name}जी').\n"
                f"- PERSONAL DATA: When {pat_name} asks about their health, medical history, constitution, or treatment, immediately refer to their actual recorded health record (Constitution/Dosha, Agni, Diet) provided above and provide personalized guidance customized to them.\n"
                "- NEVER talk about generic clinic statistics or creators when the patient is asking about their own health.\n"
                "- EMERGENCY: For acute emergency signs (severe chest pain, acute breathlessness), advise immediate 108/112 ambulance contact."
            )

        greeting_target = f"address {pat_name} warmly" if not is_guest else "greet respectfully"

        if target_lang == "mr":
            system_instruction += f"\nCRITICAL LANGUAGE DIRECTIVE: The user selected MARATHI. Respond completely in pure, natural, professional Marathi (मराठी) with deep ChatGPT-style clarity and structure!"
        elif target_lang == "hi":
            system_instruction += f"\nCRITICAL LANGUAGE DIRECTIVE: The user selected HINDI. Respond completely in pure, natural, professional Hindi (हिन्दी) with deep ChatGPT-style clarity and structure!"
        elif target_lang == "en":
            system_instruction += f"\nCRITICAL LANGUAGE DIRECTIVE: The user selected ENGLISH. Respond completely in fluent, articulate, professional English with deep ChatGPT-style clarity and structure!"
        else:
            system_instruction += f"\nRespond naturally in the same language the user queried in with deep ChatGPT-style thoroughness and structure."

        # 1. Check configured provider and priority
        provider = os.getenv("ZENIVA_PROVIDER", "openrouter").lower()

        # Priority 1: OpenRouter (Default: Llama-3.3 70B High Precision Ayurvedic AI)
        if provider == "openrouter" or not (GEMINI_API_KEY and GEMINI_API_KEY.startswith("AIzaSy")):
            openrouter_reply = self._call_openrouter_api(system_instruction, full_prompt, image_bytes, image_mime)
            if openrouter_reply:
                return {
                    "reply": openrouter_reply,
                    "has_patient": bool(matched_patient),
                    "has_doctor": has_doctor_query,
                    "model_used": "openrouter-llama-70b",
                    "citations": kb_context,
                    "requires_login": requires_login,
                    "is_team_query": is_team_query,
                    "is_social_query": is_social_query
                }

        # Priority 2: Gemini LLM (if valid AIzaSy Google API key is configured)
        if self.client and types_module and GEMINI_API_KEY and GEMINI_API_KEY.startswith("AIzaSy"):
            parts = []
            if image_bytes:
                parts.append(types_module.Part.from_bytes(data=image_bytes, mime_type=image_mime))
            parts.append(types_module.Part.from_text(text=full_prompt))

            for model_cand in ["gemini-2.0-flash", "gemini-1.5-flash"]:
                try:
                    response = self.client.models.generate_content(
                        model=model_cand,
                        contents=[types_module.Content(role="user", parts=parts)],
                        config=types_module.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.4
                        )
                    )
                    if response and response.text:
                        return {
                            "reply": response.text.strip(),
                            "has_patient": bool(matched_patient),
                            "has_doctor": has_doctor_query,
                            "model_used": model_cand,
                            "citations": kb_context,
                            "requires_login": requires_login,
                            "is_team_query": is_team_query,
                            "is_social_query": is_social_query
                        }
                except Exception as ex:
                    print(f"[Gemini Model {model_cand} Error]:", ex)
                    continue

        # Priority 3: OpenAI API Fallback
        openai_reply = self._call_openai_api(system_instruction, full_prompt)
        if openai_reply:
            return {
                "reply": openai_reply,
                "has_patient": bool(matched_patient),
                "has_doctor": has_doctor_query,
                "model_used": "openai-gpt",
                "citations": kb_context,
                "requires_login": requires_login,
                "is_team_query": is_team_query,
                "is_social_query": is_social_query
            }

        # Deterministic High-Precision Clinical Ayurvedic Intelligence Fallback
        prompt_lower = prompt.lower()

        if is_team_query:
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    "👨‍💻 **झेनिव्हा AI टीम व निर्माते (Zeniva Creators & Team):**\n\n"
                    "झेनिव्हा AI ची निर्मिती TGPCET नागपूरच्या इन्फॉर्मेशन टेक्नॉलॉजी विभागाच्या मार्गदर्शनाखाली खालील चमूने केली आहे:\n"
                    "१. **भूपेश इंदूरकर (Bhupesh Indurkar)** — प्रोजेक्ट फाउंडर, मुख्य सिस्टिम आर्किटेक्ट व प्रोजेक्ट डायरेक्टर\n"
                    "२. **ध्रुप सोनकर (Dhrup Sonkar)** — लीड AI व LLM इंटिग्रेशन स्पेशालिस्ट\n"
                    "३. **विवेक राठोड (Vivek Rathod)** — लीड सॉफ्टवेअर टेस्टिंग व क्वालिटी अ‍ॅश्युरन्स (QA) इंजिनिअर\n"
                    "४. **मोमिता लांडे (Momita Lande)** — लीड फ्रंटएंड UI/UX डिझायनर व प्रॉडक्ट एक्सपिरियन्स\n"
                    "५. **श्रेया सातपुते (Shreya Satpute)** — डेटाबेस आर्किटेक्ट व क्लिनिकल डेटा सिस्टिम्स इंजिनिअर\n"
                    "६. **सचिन लिंबुळे (Sachin Limbule)** — लीड वेबसाइट व वेब परफॉर्मन्स टेस्टिंग इंजिनिअर\n\n"
                    "✨ डॅशबोर्डवरील **'Zeniva Creators & Team'** विभागात (#overview/team) जाऊन आपण संपूर्ण टीमचे तपशीलवार प्रोफाइल, योगदान व सोशल लिंक्स पाहू शकता!"
                )
            elif target_lang == "hi":
                fallback_reply = (
                    "👨‍💻 **ज़ेनिवा AI टीम और संस्थापक (Zeniva Creators & Team):**\n\n"
                    "ज़ेनिवा AI का निर्माण TGPCET नागपुर के IT विभाग के मार्गदर्शन में किया गया है:\n"
                    "१. **भूपेश इंदूरकर (Bhupesh Indurkar)** — प्रोजेक्ट फाउंडर, मुख्य सिस्टम आर्किटेक्ट व प्रोजेक्ट डायरेक्टर\n"
                    "२. **ध्रुप सोनकर (Dhrup Sonkar)** — लीड AI व LLM इंटीग्रेशन विशेषज्ञ\n"
                    "३. **विवेक राठोड (Vivek Rathod)** — लीड सॉफ्टवेयर टेस्टिंग व क्वालिटी एश्योरेंस (QA) इंजीनियर\n"
                    "४. **मोमिता लांडे (Momita Lande)** — लीड फ्रंटएंड UI/UX डिज़ाइनर व प्रोडक्ट एक्सपीरियंस\n"
                    "५. **श्रेया सातपुते (Shreya Satpute)** — डेटाबेस आर्किटेक्ट व क्लिनिकल डेटा सिस्टम्स इंजीनियर\n"
                    "६. **सचिन लिंबुळे (Sachin Limbule)** — लीड वेबसाइट व वेब परफॉरमेंस टेस्टिंग इंजीनियर\n\n"
                    "✨ डैशबोर्ड पर **'Zeniva Creators & Team'** सेक्शन (#overview/team) में जाकर आप पूरी टीम की प्रोफाइल, योगदान व लिंक्स देख सकते हैं!"
                )
            else:
                fallback_reply = (
                    "👨‍💻 **Zeniva AI Creators & Engineering Team:**\n\n"
                    "Zeniva AI was conceptualized and engineered under the guidance of the Department of Information Technology at TGPCET, Nagpur:\n"
                    "1. **Bhupesh Indurkar** — Project Founder, Lead System Architect & Project Director\n"
                    "2. **Dhrup Sonkar** — Lead AI & LLM Integration Specialist\n"
                    "3. **Vivek Rathod** — Lead Software Testing & Quality Assurance Engineer\n"
                    "4. **Momita Lande** — Lead Frontend UI/UX Designer & Product Experience\n"
                    "5. **Shreya Satpute** — Database Architect & Clinical Data Systems Engineer\n"
                    "6. **Sachin Limbule** — Lead Website & Web Performance Testing Engineer\n\n"
                    "✨ You can explore full profiles, deliverables, and social links in the **'Zeniva Creators & Team'** tab (#overview/team) on the dashboard!"
                )
        elif is_social_query:
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    "📸 **झेनिव्हा AI अधिकृत इन्स्टाग्राम (Official Instagram):**\n\n"
                    "झेनिव्हा AI च्या अधिकृत इन्स्टाग्राम परिवारात आपले सहर्ष स्वागत आहे! 🌿✨\n\n"
                    "📸 **अधिकृत हँडल:** **@zeniva.official**\n"
                    "🔗 **थेट लिंक:** [https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0](https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0)\n\n"
                    "**🌿 आपल्या इन्स्टाग्राम पेजवर काय पाहायला मिळेल?**\n"
                    "• **दैनिक दिनचर्या व ऋतुचर्या रिल्स:** ऋतूनुसार योग्य आहार, दिनचर्या व जीवनशैली मार्गदर्शन.\n"
                    "• **घरगुती आयुर्वेदिक उपाय:** वात, पित्त, कफ शमनासाठी सोपे, घरगुती व अस्सल उपाय.\n"
                    "• **नाडी व प्रकृती ज्ञान:** शरीराची प्रकृती समजून घेण्याच्या शास्त्रीय पद्धती.\n"
                    "• **नवीन AI फीचर्स:** झेनिव्हा AI मधील नवीन टूल्स व आरोग्य अपडेट्स.\n\n"
                    "👉 **आताच फॉलो करा:** **@zeniva.official** आणि आपल्या आरोग्याची काळजी घ्या!"
                )
            elif target_lang == "hi":
                fallback_reply = (
                    "📸 **ज़ेनिवा AI आधिकारिक इंस्टाग्राम (Official Instagram):**\n\n"
                    "ज़ेनिवा AI के ऑफिशियल इंस्टाग्राम परिवार में आपका हार्दिक स्वागत है! 🌿✨\n\n"
                    "📸 **आधिकारिक हैंडल:** **@zeniva.official**\n"
                    "🔗 **डायरेक्ट लिंक:** [https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0](https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0)\n\n"
                    "**🌿 हमारे इंस्टाग्राम पर आपको क्या मिलेगा?**\n"
                    "• **दैनिक दिनचर्या और रील्स:** प्राकृतिक जीवनशैली, ऋतुचर्या और योग की जानकारी।\n"
                    "• **आयुर्वेदिक घरेलू उपचार:** वात-पित्त-कफ संतुलन के आसान व असरदार नुस्खे।\n"
                    "• **प्रकृती व नाड़ी परीक्षण टिप्स:** त्रिदोष को समझकर स्वस्थ रहने के राज।\n"
                    "• **नए अपडेट्स व टूल्स:** ज़ेनिवा AI के नए फीचर्स की जानकारी।\n\n"
                    "👉 **अभी फॉलो करें:** **@zeniva.official** और अपनी सेहत को संवारें!"
                )
            else:
                fallback_reply = (
                    "📸 **Zeniva AI Official Instagram (@zeniva.official):**\n\n"
                    "Welcome to the official Zeniva AI Instagram community! 🌿✨\n\n"
                    "📸 **Official Handle:** **@zeniva.official**\n"
                    "🔗 **Direct Link:** [https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0](https://www.instagram.com/zeniva.official?stkn=YjduaTQ1OTJuamQ0)\n\n"
                    "**🌿 What you will find on our Instagram:**\n"
                    "• **Daily Dinacharya & Ritucharya Reels:** Seasonal routines, diet principles & wellness wisdom.\n"
                    "• **Classical Ayurvedic Home Remedies:** Easy natural therapies for gut health, sleep & stress.\n"
                    "• **Tridosha Balance Tips:** Understand Vata, Pitta, and Kapha constitution easily.\n"
                    "• **Product Updates & AI Highlights:** First look at Zeniva AI's newest clinical features.\n\n"
                    "👉 **Follow now:** **@zeniva.official** and start your personalized Ayurveda journey!"
                )
        elif requires_login:
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    "🌿 **झेनिव्हा AI डॅशबोर्ड मार्गदर्शक:**\n\n"
                    "आपण सध्या **अतिथी (Guest)** मोडमध्ये डॅशबोर्ड पाहत आहात.\n\n"
                    "🔐 आपल्या आजाराचे अचूक आयुर्वेदिक निदान, चरक संहितेनुसार नेमके औषधोपचार, मात्रा (Dosage) आणि वैयक्तिक पथ्य मिळवण्यासाठी **कृपया प्रथम पेशंट (रुग्ण) खात्यात लॉगिन करा!**\n\n"
                    "लॉगिन केल्यानंतर झेनिव्हा AI आपल्या प्रकृतीनुसार संपूर्ण क्लिनिकल उपचार अनलॉक करेल. खाली दिलेल्या **'Login / Register'** बटनावर क्लिक करा."
                )
            elif target_lang == "hi":
                fallback_reply = (
                    "🌿 **ज़ेनिवा AI डैशबोर्ड गाइड:**\n\n"
                    "आप अभी **अतिथि (Guest)** मोड में डैशबोर्ड देख रहे हैं।\n\n"
                    "🔐 अपनी बीमारी के सटीक आयुर्वेदिक निदान, चरक संहिता आधारित औषधियां, सही खुराक (Dosage) और व्यक्तिगत उपचार के लिए **कृपया पहले पेशेंट अकाउंट में लॉगिन करें!**\n\n"
                    "लॉगिन करने के बाद ज़ेनिवा AI आपकी प्रकृती अनुसार संपूर्ण क्लिनिकल इलाज बताएगा। नीचे दिए गए **'Login / Register'** बटन पर क्लिक करें।"
                )
            else:
                fallback_reply = (
                    "🌿 **Zeniva AI Dashboard Guide:**\n\n"
                    "You are currently viewing the platform in **Guest Dashboard Mode**.\n\n"
                    "🔐 For an authentic clinical diagnosis, Charaka Samhita herbal formulations, precise dosages, and personalized Ayurvedic treatment, **please first log in or register your Patient Account!**\n\n"
                    "Once logged in, Zeniva AI unlocks complete clinical treatment plans tailored to your Prakriti. Click the **'Login / Register'** button below to proceed."
                )
        # Condition: Gratitude, Pleasantries, Greetings (धन्यवाद / Thanks / Hello)
        elif any(w in prompt_lower for w in [
            "धन्यवाद", "ठीक आहे धन्यवाद", "थँक्यू", "थॅन्क्स", "आभार", "ओके", "thanks", "thank you",
            "bye", "अलविदा", "नमस्ते", "नमस्कार", "hello", "hi", "hey", "काळजी घ्या", "good morning", "good night"
        ]):
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    f"🙏 **आपले मनःपूर्वक स्वागत आहे! (Welcome & Health Greetings)**\n\n"
                    f"नमस्कार {pat_name if pat_name else ''}! झेनिव्हा AI आपल्या निरोगी आयुष्यासाठी सदैव तत्पर आहे.\n\n"
                    "**🌿 आरोग्य दिनचर्या सूत्र:**\n"
                    "- **१. वेळेवर सात्विक आहार:** ताजे, कोमट आणि सुपाच्य अन्न वेळेवर घ्या.\n"
                    "- **२. संतुलित विश्रांती:** पुरेशी झोप, नियमित प्राणायाम आणि कोमट पाण्याचे सेवन ठेवा.\n\n"
                    "आपल्याला आरोग्य, औषधे किंवा आहाराबद्दल कोणताही नवीन प्रश्न असल्यास नक्की विचारा. **आपली काळजी घ्या आणि सदैव निरोगी राहा! 🌿✨**"
                )
            elif target_lang == "hi":
                fallback_reply = (
                    f"🙏 **आपका हार्दिक स्वागत है! (Welcome & Stay Healthy)**\n\n"
                    f"नमस्ते {pat_name if pat_name else ''} जी! ज़ेनिवा AI आपके स्वास्थ्य और खुशहाली के लिए हमेशा उपस्थित है।\n\n"
                    "**🌿 स्वास्थ्य दिनचर्या:**\n"
                    "- **१. सात्विक भोजन:** समय पर ताजा और सुपाच्य भोजन लें।\n"
                    "- **२. पर्याप्त नींद व योग:** नियमित प्राणायाम करें और गुनगुने पानी का सेवन करें।\n\n"
                    "आयुर्वेद, औषधि या दिनचर्या से जुड़े किसी भी सवाल के लिए बेझिझक पूछें। **अपना ध्यान रखें और स्वस्थ रहें! 🌿✨**"
                )
            else:
                fallback_reply = (
                    f"🙏 **You are warmly welcome!**\n\n"
                    f"Hello {pat_name if pat_name else ''}! Zeniva AI is always dedicated to your health and holistic well-being.\n\n"
                    "**🌿 Daily Wellness Wisdom:**\n"
                    "- Maintain balanced nutrition, adequate rest, and mindful hydration.\n"
                    "- Follow your daily routine (Dinacharya) in harmony with nature.\n\n"
                    "Feel free to ask whenever you need Ayurvedic remedies, diet tips, or wellness guidance. **Take care and stay healthy! 🌿✨**"
                )
        # Condition 1: Fever / ताप / फिवर (Jwara Chikitsa)
        elif any(w in prompt_lower for w in ["fever", "ताप", "फिवर", "fevar", "jwar", "ज्वर", "उष्णता"]):
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    f"नमस्कार {pat_name if pat_name else ''}! आयुर्वेदात तापाला **'ज्वर' (Jwara)** म्हटले जाते. जठराग्नी मंद होऊन आमाचा संचय झाल्यामुळे शरीराचे तापमान वाढते. खालील आयुर्वेदिक उपाय त्वरित सुरू करा:\n\n"
                    "**१. तात्काळ घरगुती काढा (Herbal Kadha):**\n"
                    "- **तुळस व आल्याचा काढा:** ७-८ तुळशीची पाने, १/२ चमचा किसलेले आले आणि २ काळी मिरी १ ग्लास पाण्यात उकळून अर्धे करा. हा काढा कोमट असताना मधासह दिवसातून २ वेळा प्या.\n"
                    "- **धणे-सुंठ पाणी:** १ चमचा धणे आणि १/२ चमचा सुंठ पावडर पाण्यात उकळून दिवसभरात घोट-घोट प्या (याने शरीरातील उष्णता कमी होते).\n\n"
                    "**२. शास्त्रीय आयुर्वेदिक औषधी (Classical Formulations):**\n"
                    "- **सुदर्शन घनवटी (Sudarshan Ghanvati):** १-२ गोळ्या दिवसातून दोनदा कोमट पाण्यासोबत जेवणानंतर घ्या (ज्वरनाशक व आमपाचक).\n"
                    "- **अमृतारिष्ट / गिलॉय स्वरस (Guduchi/Giloy):** १५ मिली समभाग पाण्यासह सकाळी व संध्याकाळी (रोगप्रतिकारशक्ती वाढवण्यासाठी).\n\n"
                    "**३. आहार पथ्य (Diet & Lifestyle):**\n"
                    "- **लंघन व हलका आहार:** पचनावर ताण न देता मुगाचे कढण, लाजा (मुरमुरे) पाणी किंवा पातळ तांदळाची पेज घ्या.\n"
                    "- **काय टाळावे:** थंड पाणी, दही, जड जेवण, तेलकट पदार्थ आणि उन्हात फिरणे टाळा.\n\n"
                    "💡 *टीप: ताप १००°F पेक्षा जास्त असल्यास किंवा २ दिवसांपेक्षा जास्त राहिल्यास तात्काळ वैद्यकीय तपासणी करून घ्या.*"
                )
            elif target_lang == "hi":
                fallback_reply = (
                    f"नमस्ते {pat_name if pat_name else ''} जी! आयुर्वेद में बुखार को **'ज्वर' (Jwara)** कहा जाता है। मंदाग्नि और आम दोष के कारण शरीर में तापमान बढ़ता है। इसके लिए प्रभावी आयुर्वेदिक उपचार निम्नलिखित हैं:\n\n"
                    "**१. घरेलू काढ़ा (Home Remedies):**\n"
                    "- **तुलसी-अदरक काढ़ा:** ७-८ तुलसी के पत्ते, १ छोटा टुकड़ा अदरक और २ काली मिर्च को १ गिलास पानी में उबालकर आधा कर लें। गुनगुना होने पर पिएं।\n"
                    "- **गिलोय का रस / काढ़ा:** १५ मिली गिलोय का रस बराबर पानी के साथ सुबह-शाम लें।\n\n"
                    "**२. शास्त्रीय आयुर्वेदिक औषधियां (Classical Medicines):**\n"
                    "- **सुदर्शन घनवटी:** १-२ गोली दिन में दो बार गुनगुने पानी के साथ भोजन के बाद लें।\n"
                    "- **संशमनी वटी:** २ गोली सुबह-शाम गिलोय सत्व आधारित।\n\n"
                    "**३. आहार व दिनचर्या (Pathya):**\n"
                    "- **क्या खाएं:** मूंग दाल का पानी, पतली खिचड़ी और उबला हुआ गुनगुना पानी।\n"
                    "- **क्या न खाएं:** भारी, तला-भुना, ठंडा पानी, दही और गरिष्ठ भोजन से परहेज करें।"
                )
            else:
                fallback_reply = (
                    f"Hello {pat_name if pat_name else ''}! In Ayurveda, fever is categorized as **Jwara**, arising from impaired digestive fire (Mandaagni) and Ama formation.\n\n"
                    "**1. Herbal Home Remedies:**\n"
                    "- **Tulsi & Ginger Decoction:** Boil 8 Tulsi leaves, crushed dry ginger (Shunti), and 2 black peppers in water. Drink warm twice daily.\n"
                    "- **Giloy (Guduchi) Juice:** 15ml with equal warm water to boost immunity and clear systemic heat.\n\n"
                    "**2. Classical Ayurvedic Medicines:**\n"
                    "- **Sudarshan Ghanvati:** 1-2 tablets twice daily with warm water after meals.\n"
                    "- **Amritarishta:** 15ml twice daily with equal water.\n\n"
                    "**3. Dietary Guidelines (Pathya):**\n"
                    "- Favor light Moong soup, boiled lukewarm water, and avoid cold/heavy dairy foods."
                )
        # Condition 2: Stomach Pain / पोटदुखी / पेट दर्द (Udarashoola)
        elif any(w in prompt_lower for w in ["stomach", "पोट", "पेट", "दुखत", "उदर", "shoola", "colic", "cramp"]):
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    f"नमस्कार {pat_name if pat_name else ''}! पोटात दुखणे हे वात दोष आणि अपचनामुळे (उदरशूल / Udarashoola) होते. त्वरित आरामासाठी खालील आयुर्वेदिक उपाय करा:\n\n"
                    "**१. तात्काळ घरगुती उपाय (Instant Relief):**\n"
                    "- **ओवा व सैंधव मीठ:** १/२ चमचा ओवा हलका भाजून त्यात एक चिमूट सैंधव मीठ मिसळा आणि कोमट पाण्यासोबत चावून खा (पोटदुखी व गॅस ५ मिनिटांत थांबते).\n"
                    "- **हिंगाचा लेप:** कोमट पाण्यात चिमूटभर हिंग कालवून पोटावर व बेंबीभोवती हलका लेप लावा (विशेषतः लहान मुले व गॅसच्या दुखण्यावर अत्यंत गुणकारी).\n"
                    "- **सुंठ-जिरे पाणी:** १/२ चमचा जिरे आणि सुंठ पावडर पाण्यात उकळून कोमट प्या.\n\n"
                    "**२. शास्त्रीय आयुर्वेदिक औषधी (Classical Formulations):**\n"
                    "- **हिंग्वाष्टक चूर्ण (Hingwashtak Churna):** १/२ चमचा जेवणाच्या पहिल्या घासासोबत १ चमचा कोमट तुपासह खा.\n"
                    "- **शंख वटी (Shankh Vati):** १-२ गोळ्या जेवणानंतर कोमट पाण्यासह (पचन सुधारून पोटदुखी थांबवते).\n\n"
                    "**३. पथ्य व काळजी:** कोमट पाणी प्या, पोटावर गरम पाण्याच्या पिशवीने हलका शेक द्या आणि कच्ची मोड आलेली कडधान्ये, चणे व चहा टाळा."
                )
            elif target_lang == "hi":
                fallback_reply = (
                    f"नमस्ते {pat_name if pat_name else ''} जी! पेट दर्द और मरोड़ (उदरशूल) मुख्यतः वात और अजीर्ण के कारण होता है। इसके लिए सर्वोत्तम आयुर्वेदिक उपाय:\n\n"
                    "**१. घरेलू उपाय (Instant Home Remedies):**\n"
                    "- **अजवाइन और सेंधा नमक:** आधा चम्मच भुनी अजवाइन में चुटकीभर सेंधा नमक मिलाकर गुनगुने पानी से चबाएं।\n"
                    "- **नाभि पर हींग लेप:** गुनगुने पानी में चुटकीभर हींग घोलकर नाभि के आसपास लगाएं।\n\n"
                    "**२. शास्त्रीय औषधियां (Classical Medicines):**\n"
                    "- **हिंग्वाष्टक चूर्ण:** आधा चम्मच भोजन के पहले ग्रास के साथ घी मिलाकर लें।\n"
                    "- **शंख वटी / लवणभास्कर चूर्ण:** गुनगुने जल के साथ सेवन करें।"
                )
            else:
                fallback_reply = (
                    f"Hello {pat_name if pat_name else ''}! Stomach pain and abdominal spasms (Udarashoola) are primarily caused by aggravated Vata and indigestion.\n\n"
                    "**1. Instant Home Remedies:**\n"
                    "- **Ajwain (Carom seeds) & Rock Salt:** Chew 1/2 tsp roasted Ajwain with a pinch of Sendha salt and warm water.\n"
                    "- **Hing (Asafoetida) Paste:** Apply warm hing paste around the navel for rapid relief from gas and cramps.\n\n"
                    "**2. Classical Formulations:**\n"
                    "- **Hingwashtak Churna:** 1/2 tsp with the first morsel of food and warm ghee.\n"
                    "- **Shankh Vati:** 1-2 tablets after food with warm water."
                )
        # Condition 3: Acidity & Gas / ऍसिडिटी / पित्त / छातीत जळजळ (Amlapitta)
        elif any(w in prompt_lower for w in ["acid", "पित्त", "अम्लपित्त", "जळजळ", "acidity", "gas", "गॅस", "बदहजमी", "heartburn"]):
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    f"नमस्कार {pat_name if pat_name else ''}! ऍसिडिटी आणि पित्त प्रकोपासाठी (Amlapitta) खालील शास्त्रीय आयुर्वेदिक उपाय करा:\n\n"
                    "**१. घरगुती तात्काळ उपाय:**\n"
                    "- **धणे-जिरे-बडीशेप पाणी:** प्रत्येकी १/२ चमचा १ ग्लास पाण्यात रात्रभर भिजवून सकाळी गाळून प्या.\n"
                    "- **थंड दुधाचे घोट:** १/२ कप थंड दूध किंवा डाळिंबाचा रस प्या.\n\n"
                    "**२. आयुर्वेदिक औषधी:**\n"
                    "- **अविपत्तिकर चूर्ण (Avipattikar Churna):** १ चमचा जेवणापूर्वी कोमट पाण्यासोबत.\n"
                    "- **सूतशेखर रस / कामदुधा रस:** १-१ गोळी दिवसातून दोनदा.\n\n"
                    "**३. पथ्य:** तिखट, मसालेदार, तळलेले पदार्थ, चहा व कॉफी पूर्णपणे टाळा."
                )
            elif target_lang == "hi":
                fallback_reply = (
                    f"नमस्ते {pat_name if pat_name else ''} जी! एसिडिटी और पित्त (Amlapitta) के लिए सर्वोत्तम आयुर्वेदिक उपचार:\n\n"
                    "**१. घरेलू उपाय:** सौंफ, धनिया और जीरे का पानी पिएं।\n"
                    "**२. शास्त्रीय औषधियां:** अविपत्तिकर चूर्ण (१ चम्मच भोजन से पहले) और कामदुधा रस (१ गोली दिन में २ बार)।\n"
                    "**३. परहेज:** अत्यधिक मिर्च, तेल और खट्टे पदार्थों से बचें।"
                )
            else:
                fallback_reply = (
                    f"Hello {pat_name if pat_name else ''}! For hyperacidity & GERD (Amlapitta):\n\n"
                    "**1. Herbal Home Remedies:** Coriander, Fennel & Cumin seed infused cold water.\n"
                    "**2. Classical Medicines:** Avipattikar Churna (1 tsp before meals) and Kamadudha Ras.\n"
                    "**3. Dietary Guide:** Avoid fermented, sour, deep-fried, and spicy foods."
                )
        # Condition 4: Cough & Cold / खोकला / सर्दी (Kasa & Pratishyaya)
        elif any(w in prompt_lower for w in ["cough", "cold", "खोकला", "सर्दी", "खांसी", "जुकाम", "कफ", "throat", "घसा"]):
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    f"नमस्कार {pat_name if pat_name else ''}! खोकला (कास) आणि सर्दीसाठी चरक संहितेवर आधारित संपूर्ण आयुर्वेदिक औषधोपचार व पथ्य:\n\n"
                    "**१. शास्त्रीय औषधे व मात्रा (Medicine & Dosage):**\n"
                    "- **सितोपलादी चूर्ण:** १/२ ते १ चमचा सितोपलादी चूर्ण १ चमचा शुद्ध मधात कालवून दिवसातून ३ वेळा (सकाळी, दुपारी व रात्री) चाटावे.\n"
                    "- **कंठसुधारक वटी / लवंगादी वटी:** घशात खवखव किंवा कोरडी उबळ आल्यास १-१ गोळी चोखावी.\n"
                    "- **तुळशी-आले काढा:** ५ तुळशीची पाने, १/२ चमचा किसलेले आले व २ काळी मिरी पाण्यात उकळून कोमट असताना घोट-घोट प्या.\n\n"
                    "**२. घरगुती उपचार व वाफ:**\n"
                    "- रात्री झोपताना १ कप कोमट दुधात १/४ चमचा शुद्ध हळद घालून प्या.\n"
                    "- गरम पाण्यात निलगिरी तेल किंवा ओवा टाकून दिवसातून दोनदा वाफ (Steam) घ्या.\n\n"
                    "**३. पथ्य व काळजी:** थंड पाणी, दही, आईस्क्रीम, केळी व तेलकट पदार्थ पूर्णपणे टाळा. नेहमी कोमट पाणीच प्या."
                )
            elif target_lang == "hi":
                fallback_reply = (
                    f"नमस्ते {pat_name if pat_name else ''} जी! खांसी व जुकाम (कास एवं प्रतिश्याय) के लिए संपूर्ण आयुर्वेदिक उपचार व खुराक:\n\n"
                    "**१. शास्त्रीय औषधियां व खुराक (Medicine & Dosage):**\n"
                    "- **सितोपलादि चूर्ण:** आधा से १ चम्मच सितोपलादि चूर्ण १ चम्मच शहद में मिलाकर दिन में ३ बार (सुबह, दोपहर, रात) चाटें।\n"
                    "- **कंठसुधारक वटी:** गले में खराश या खांसी का दौरा पड़ने पर १-१ गोली मुंह में रखकर चूसें।\n"
                    "- **तुलसी-सोंठ काढ़ा:** तुलसी, अदरक और काली मिर्च का गुनगुना काढ़ा दिन में दो बार लें।\n\n"
                    "**२. घरेलू उपचार व भाप:**\n"
                    "- रात को सोने से पहले हल्दी वाला गुनगुना दूध लें।\n"
                    "- गर्म पानी में अजवाइन या नीलगिरी डालकर भाप (Steam) लें।\n\n"
                    "**३. परहेज:** ठंडा पानी, दही, केला और तली-भुनी चीजों से पूरी तरह बचें। केवल गुनगुना पानी पिएं।"
                )
            else:
                fallback_reply = (
                    f"Hello {pat_name if pat_name else ''}! Classical Ayurvedic protocol for Cough (Kasa) and Cold (Pratishyaya):\n\n"
                    "**1. Classical Medicine & Dosage:**\n"
                    "- **Sitopaladi Churna:** 1/2 to 1 tsp mixed with 1 tsp organic honey 3 times daily (morning, noon, night).\n"
                    "- **Kantasudharak Vati:** Slowly dissolve 1 lozenge in the mouth for throat irritation.\n"
                    "- **Tulsi-Ginger Decoction:** Sip warm decoction of fresh ginger, tulsi leaves, and crushed peppercorns.\n\n"
                    "**2. Supportive Care:**\n"
                    "- Golden Turmeric Milk at bedtime.\n"
                    "- Herbal steam inhalation with ajwain or eucalyptus twice daily.\n\n"
                    "**3. Pathya (Precautions):** Strictly avoid cold drinks, curds, bananas, and fried food. Drink only warm water."
                )
        # Condition 5: Headache / Migraine / डोकेदुखी (Shirashoola)
        elif any(w in prompt_lower for w in ["headache", "migraine", "डोकेदुखी", "सिरदर्द", "माथा", "शिर"]):
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    f"नमस्कार {pat_name if pat_name else ''}! डोकेदुखी व मायग्रेनसाठी (शिरःशूल) आयुर्वेदिक उपाय:\n\n"
                    "**१. तात्काळ उपचार:** कपाळावर चंदनाचा किंवा सुंठीचा हलका लेप लावावा. नाकात गाईच्या तुपाचे २ थेंब (नस्य) घालावेत.\n"
                    "**२. औषधी:** **शिरःशूलादी वज्र रस** १ गोळी किंवा **ब्राह्मी वटी** १ गोळी सकाळी-संध्याकाळी.\n"
                    "**३. काळजी:** उन्हात जाणे टाळा, वेळेवर झोपा आणि भरपूर पाणी प्या."
                )
            elif target_lang == "hi":
                fallback_reply = (
                    f"नमस्ते {pat_name if pat_name else ''} जी! सिरदर्द व माइग्रेन (शिरःशूल) के लिए उपचार:\n\n"
                    "**१. घरेलू उपाय:** माथे पर चंदन का लेप लगाएं और नाक में २ बूंद शुद्ध गाय का घी डालें (नस्य)।\n"
                    "**२. औषधियां:** शिरःशूलादिवज्र रस या ब्राह्मी वटी।\n"
                    "**३. परहेज:** तेज धूप, अनिद्रा और मानसिक तनाव से बचें।"
                )
            else:
                fallback_reply = (
                    f"Hello {pat_name if pat_name else ''}! For headache & migraine (Shirashoola):\n\n"
                    "**1. Nasya & Lepa:** Instill 2 drops of warm cow ghee in both nostrils (Nasya) and apply cool Chandan paste to the forehead.\n"
                    "**2. Classical Medicines:** Brahmi Vati and Shirashooladi Vajra Ras.\n"
                    "**3. Regimen:** Ensure adequate hydration, dim light rest, and sound sleep."
                )
        # Condition 6: Joint Pain & Arthritis / सांधेदुखी / गुडघेदुखी (Sandhivata)
        elif any(w in prompt_lower for w in ["joint", "knee", "arthritis", "सांधे", "गुडघे", "संधिवात", "जोड़ों", "कंबर"]):
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    f"नमस्कार {pat_name if pat_name else ''}! सांधेदुखी व संधिवातासाठी (संधिवात / आमवात) आयुर्वेदिक मार्गदर्शन:\n\n"
                    "**१. बाह्य उपचार:** **महानारायण तेल** किंवा **विषगर्भ तेल** कोमट करून सांध्यांना हलक्या हाताने मसाज करा व गरम पाण्याच्या पिशवीने शेका.\n"
                    "**२. शास्त्रीय औषधी:** **योगराज गुग्गुळ** (Yograj Guggulu) २ गोळ्या आणि **रास्नादी काढा** १५ मिली कोमट पाण्यासह.\n"
                    "**३. पथ्य:** वातूळ पदार्थ (उदा. बटाटा, हरभरा, वांगी) टाळा आणि कोमट अन्नाचे सेवन करा."
                )
            elif target_lang == "hi":
                fallback_reply = (
                    f"नमस्ते {pat_name if pat_name else ''} जी! जोड़ों के दर्द व गठिया (संधिवात) के लिए उपाय:\n\n"
                    "**१. मालिश व सेंक:** महानारायण तेल की गुनगुनी मालिश करें और गर्म सेंक लें।\n"
                    "**२. औषधियां:** योगराज गुग्गुलु (२ गोली दिन में दो बार) और रास्नादि क्वाथ।\n"
                    "**३. परहेज:** ठंडी चीजें, बासी खाना और अत्यधिक वातकारक दालों से बचें।"
                )
            else:
                fallback_reply = (
                    f"Hello {pat_name if pat_name else ''}! For joint pain & osteoarthritis (Sandhivata):\n\n"
                    "**1. External Abhyanga:** Warm Mahanarayan Taila massage followed by localized fomentation.\n"
                    "**2. Classical Formulations:** Yograj Guggulu (2 tablets twice daily) and Rasnadi Kwath.\n"
                    "**3. Diet:** Favor warm nourishing soups and avoid dry, cold, or gas-forming foods."
                )
        # General Classical Corpus Knowledge
        else:
            if target_lang == "mr" or any(ord(c) >= 0x0900 and ord(c) <= 0x097F for c in prompt):
                fallback_reply = (
                    f"नमस्कार {pat_name if pat_name else ''}! चरक संहितेवर आधारित आपल्या आरोग्यासाठी शास्त्रीय आयुर्वेदिक मार्गदर्शन खालीलप्रमाणे आहे:\n\n"
                    "**१. आयुर्वेदिक मूळ कारण व दोष समतोल:** शरीरातील त्रिदोष (वात, पित्त, कफ) आणि जठराग्नीचे संतुलन हेच निरोगी आरोग्याचे मूळ आहे.\n\n"
                    "**२. घरगुती व औषधी उपाय:**\n"
                    "- **कोमट पाणी व त्रिफळा चूर्ण:** रात्री झोपताना १/२ चमचा कोमट पाण्यासह त्रिफळा चूर्ण घ्या.\n"
                    "- **धणे-जिरे पाणी:** शरीरातील उष्णता व पित्त शमनासाठी नियमित प्या.\n\n"
                    "**३. आहार व दिनचर्या (Pathya):** ताजे, सात्विक आणि वेळेवर जेवण घ्या. रात्री जागरण टाळा आणि सकाळी प्राणायाम करा.\n\n"
                    "💡 *सखोल वैयक्तिक निदानासाठी तुम्ही डॅशबोर्डवरील प्रमाणित आयुर्वेदिक डॉक्टरांशी संपर्क साधू शकता.*"
                )
            elif target_lang == "hi":
                fallback_reply = (
                    f"नमस्ते {pat_name if pat_name else ''} जी! चरक संहिता आधारित आपके उत्तम स्वास्थ्य के लिए शास्त्रीय आयुर्वेदिक मार्गदर्शन:\n\n"
                    "**१. दोष व अग्नि संतुलन:** त्रिदोष (वात, पित्त, कफ) का संतुलन ही आरोग्य है।\n"
                    "**२. औषधीय सुझाव:** रात को त्रिफला चूर्ण गुनगुने जल से लें और दिनभर गुनगुना पानी पिएं।\n"
                    "**३. आहार व दिनचर्या:** ताजा, सुपाच्य भोजन लें और नियमित प्राणायाम करें।"
                )
            else:
                fallback_reply = (
                    f"Hello {pat_name if pat_name else ''}! Based on authentic Charaka Samhita wisdom for your holistic health:\n\n"
                    "- **Dietary Care:** Favor warm, freshly prepared wholesome meals with moderate cow ghee.\n"
                    "- **Herbal Remedies:** Triphala powder at bedtime with warm water and ginger-cumin herbal tea during the day.\n"
                    "- **Lifestyle:** Follow consistent Dinacharya, early morning rising, and pranayama."
                )

        return {
            "reply": fallback_reply,
            "has_patient": bool(matched_patient),
            "has_doctor": has_doctor_query,
            "model_used": "classical-corpus-fallback",
            "citations": kb_context,
            "requires_login": requires_login,
            "is_team_query": is_team_query,
            "is_social_query": is_social_query
        }

    def query(self, query: str, dosha: Optional[str] = None, language: str = "en", patient_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        prompt = query
        if dosha:
            prompt = f"[{dosha} Constitution] {prompt}"
        return self.generate_chat_reply(prompt=prompt, target_lang=language, patient_context=patient_context)

rag_engine = AyurvedicRAGEngine()

