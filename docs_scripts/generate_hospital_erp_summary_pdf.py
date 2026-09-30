import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Canvas that computes total pages dynamically for footer page numbering."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Skip header/footer on cover page
            return

        self.saveState()
        
        # Header line
        self.setStrokeColor(colors.HexColor("#3B1D6B")) # Deep Royal Purple
        self.setLineWidth(0.75)
        self.line(40, letter[1] - 40, letter[0] - 40, letter[1] - 40)
        
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#3B1D6B"))
        self.drawString(40, letter[1] - 34, "ZENIVA AYURVEDIC HOSPITAL ERP (HOS v2.4)")
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6B7280"))
        self.drawRightString(letter[0] - 40, letter[1] - 34, "Comprehensive Clinical & Operations Summary")
        
        # Footer line
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.75)
        self.line(40, 42, letter[0] - 40, 42)
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6B7280"))
        self.drawString(40, 28, "Zeniva AI Healthcare Platform • AYUSH & MCIM Statutory Standards")
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 40, 28, page_text)
        
        self.restoreState()


def build_pdf(output_filename):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Brand Color Palette
    PRIMARY = colors.HexColor("#1C1030")     # Deep Regal Plum / Ink
    PURPLE_CORE = colors.HexColor("#4A267A") # Royal Violet
    TEAL_CLINICAL = colors.HexColor("#0D5C4D") # Ayurvedic Emerald / Teal
    AMBER_GOLD = colors.HexColor("#B45309")   # Warm Saffron Gold
    DARK_TEXT = colors.HexColor("#1F2937")   # Deep Gray Text
    MUTED_TEXT = colors.HexColor("#4B5563")  # Secondary Gray
    BG_LIGHT = colors.HexColor("#FDFBF7")    # Ivory Cream
    BG_CALLOUT = colors.HexColor("#F5F3ED")  # Soft Parchment
    BORDER_COLOR = colors.HexColor("#E5E0D5")# Border Line
    SUCCESS = colors.HexColor("#065F46")     # Relieved Green
    CARD_BG = colors.HexColor("#FFFFFF")

    # Typography Styles
    styles.add(ParagraphStyle(
        'CoverBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=AMBER_GOLD,
        alignment=1, # Center
        spaceAfter=14
    ))

    styles.add(ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=25,
        leading=30,
        textColor=PRIMARY,
        alignment=1, # Center
        spaceAfter=10
    ))

    styles.add(ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=16,
        textColor=MUTED_TEXT,
        alignment=1, # Center
        spaceAfter=25
    ))

    styles.add(ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'SubHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=PURPLE_CORE,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=DARK_TEXT,
        spaceAfter=5
    ))

    styles.add(ParagraphStyle(
        'BulletItem',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=DARK_TEXT,
        leftIndent=12,
        spaceAfter=3
    ))

    styles.add(ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=PRIMARY
    ))

    styles.add(ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0
    ))

    styles.add(ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=DARK_TEXT
    ))

    styles.add(ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=DARK_TEXT
    ))

    story = []

    # =========================================================================
    # COVER / TITLE BLOCK
    # =========================================================================
    story.append(Spacer(1, 10))
    story.append(Paragraph("★ ZENIVA AI CLINICAL HEALTHCARE PLATFORM ★", styles['CoverBadge']))
    story.append(Paragraph("ZENIVA AYURVEDIC HOSPITAL ERP", styles['CoverTitle']))
    story.append(Paragraph("Comprehensive Clinical Architecture, Daily Body Issue Tracking, Pharmacy Stock, Computerized GST Invoicing, Panchakarma Scheduling & IPD Bed Operations (HOS v2.4)", styles['CoverSubtitle']))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PURPLE_CORE, spaceAfter=18))

    # Meta Summary Box
    meta_data = [
        [
            Paragraph("<b>Software Edition:</b> Zeniva Hospital OS v2.4", styles['TableCell']),
            Paragraph("<b>Statutory Framework:</b> AYUSH & MCIM Standards", styles['TableCell'])
        ],
        [
            Paragraph("<b>Clinical Scope:</b> OPD, IPD, Pharmacy & Rogi Pariksha", styles['TableCell']),
            Paragraph("<b>Architecture:</b> React 19, FastAPI, SQLite / Supabase Cloud", styles['TableCell'])
        ],
        [
            Paragraph("<b>Lead Engineer:</b> Bhupesh Indurkar", styles['TableCell']),
            Paragraph("<b>Chief Medical Advisor:</b> Dr. Sohil Indurkar (BAMS, MD)", styles['TableCell'])
        ],
        [
            Paragraph("<b>Deployment Status:</b> Live Production Cloud (Vercel)", styles['TableCell']),
            Paragraph("<b>Live URL:</b> zeniva-aryuvedic-ai.vercel.app/#overview/hospital_erp", styles['TableCell'])
        ]
    ]
    meta_table = Table(meta_data, colWidths=[266, 266])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CALLOUT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 1: EXECUTIVE VISION & ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("1. Executive Vision & System Architecture", styles['SectionHeading']))
    story.append(Paragraph(
        "<b>Zeniva Ayurvedic Hospital ERP</b> is an enterprise-grade hospital management system engineered specifically for classical Ayurvedic clinics, hospitals, and Panchakarma sanatoriums. Unlike generic allopathic hospital software that reduces healthcare to ICD-10 codes, Zeniva combines ancient Vedic diagnostic science (Charaka Samhita Nidana & Chikitsa Sthana, Ashtavidha Pariksha) with modern hospital workflows, including real-time computerized GST billing, automated inventory deduction, Panchakarma suite allocation, and IPD bed admission control.",
        styles['BodyDark']
    ))
    story.append(Paragraph(
        "<b>Role-Based Access Control (RBAC):</b>",
        styles['SubHeading']
    ))
    story.append(Paragraph("• <b>Super Admin:</b> Master operational control. Can add/modify pharmacy catalog, adjust real-time stock levels, inspect system audit logs, configure clinic-wide tax parameters, and manage doctors.", styles['BulletItem']))
    story.append(Paragraph("• <b>Ayurvedic Doctor:</b> Clinical practice authority. Issues computerized GST invoices, logs daily body complaints and Rogi Pariksha findings, schedules Panchakarma therapy courses, and admits/discharges in-patients.", styles['BulletItem']))
    story.append(Paragraph("• <b>Public / Patient Showcase:</b> 100% Read-Only preview. Allows prospective patients and visitors to browse authentic classical formulations, check transparent pricing, review Panchakarma therapies, and verify clinic credentials safely.", styles['BulletItem']))
    story.append(Spacer(1, 10))

    # Callout Box: Core Capabilities
    callout_data = [[
        Paragraph(
            "<b>Key Operational Benchmark:</b> Zeniva ERP guarantees zero latency through a hybrid offline-first persistence engine. Clinical records, inventory tallies, and invoices are cached in browser localStorage and asynchronously synchronized to Supabase Cloud and FastAPI endpoints.",
            styles['CalloutText']
        )
    ]]
    callout_table = Table(callout_data, colWidths=[532])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EDE9FE")), # Soft lavender
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#C4B5FD")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 2: MODULE 1 — AUSHADHI BHANDAR (PHARMACY INVENTORY)
    # =========================================================================
    story.append(Paragraph("2. Module 1: Aushadhi Bhandar (Ayurvedic Pharmacy Stock)", styles['SectionHeading']))
    story.append(Paragraph(
        "The Aushadhi Bhandar module manages the hospital's authentic classical botanical and mineral inventory. It enforces statutory batch control, shelf-life monitoring, and automatic threshold alerts.",
        styles['BodyDark']
    ))

    inv_table_data = [
        [
            Paragraph("Formulation & Sanskrit Name", styles['TableHeader']),
            Paragraph("Ayurvedic Form", styles['TableHeader']),
            Paragraph("Category", styles['TableHeader']),
            Paragraph("Stock Qty", styles['TableHeader']),
            Paragraph("MRP (₹)", styles['TableHeader']),
            Paragraph("Status", styles['TableHeader'])
        ],
        [
            Paragraph("Ashwagandha Churna (अश्वगंधा)", styles['TableCellBold']),
            Paragraph("Churna (Powder)", styles['TableCell']),
            Paragraph("Rasayana & Strength", styles['TableCell']),
            Paragraph("65 Packs", styles['TableCell']),
            Paragraph("₹220", styles['TableCell']),
            Paragraph("Available", styles['TableCell'])
        ],
        [
            Paragraph("Triphala Guggulu (त्रिफळा गुग्गुळ)", styles['TableCellBold']),
            Paragraph("Vati (Tablet)", styles['TableCell']),
            Paragraph("Digestive & Detox", styles['TableCell']),
            Paragraph("90 Tabs", styles['TableCell']),
            Paragraph("₹195", styles['TableCell']),
            Paragraph("Available", styles['TableCell'])
        ],
        [
            Paragraph("Mahanarayana Taila (महानारायण)", styles['TableCellBold']),
            Paragraph("Taila (Oil)", styles['TableCell']),
            Paragraph("Joints & Pain Relief", styles['TableCell']),
            Paragraph("42 Bottles", styles['TableCell']),
            Paragraph("₹340", styles['TableCell']),
            Paragraph("Available", styles['TableCell'])
        ],
        [
            Paragraph("Khadirarishta (खदिरारिष्ट)", styles['TableCellBold']),
            Paragraph("Asava/Arishta", styles['TableCell']),
            Paragraph("Skin & Blood Purifier", styles['TableCell']),
            Paragraph("38 Bottles", styles['TableCell']),
            Paragraph("₹260", styles['TableCell']),
            Paragraph("Available", styles['TableCell'])
        ],
        [
            Paragraph("Brahmi Vati Gold (सुवर्णयुक्त)", styles['TableCellBold']),
            Paragraph("Vati (Tablet)", styles['TableCell']),
            Paragraph("Mind & Sleep Care", styles['TableCell']),
            Paragraph("8 Tabs", styles['TableCell']),
            Paragraph("₹580", styles['TableCell']),
            Paragraph("Low Stock Alert", styles['TableCell'])
        ]
    ]
    inv_table = Table(inv_table_data, colWidths=[140, 75, 115, 62, 55, 85])
    inv_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PURPLE_CORE),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_CALLOUT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(inv_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 3: MODULE 2 — DAILY BODY ISSUES & AYURVEDIC ROGI TRACKER
    # =========================================================================
    story.append(Paragraph("3. Module 2: Daily Body Issues & Ayurvedic Rogi Tracker", styles['SectionHeading']))
    story.append(Paragraph(
        "Newly introduced to address daily clinical body complaints, the <b>Daily Body Issues & Rogi Tracker (दैनिक शारीरिक विकार व रुग्ण नोंदी)</b> records patient health events across organ systems (Srotamsi) and pairs them with classical Nidana assessments.",
        styles['BodyDark']
    ))
    story.append(Paragraph("• <b>Organ Systems (स्रोतांसि):</b> Categorizes complaints into Spine & Joints (अस्थि-संधि), Digestive & Gut (अग्नि-कोष्ठ), Mind, Stress & Sleep (मनोवह), Respiratory (प्राणवह), Skin & Complexion (त्वचा), and Metabolic Vitality (ओज व धातु).", styles['BulletItem']))
    story.append(Paragraph("• <b>Ashtavidha Pariksha Markers:</b> Tracks Doshic vitiation (Vata, Pitta, Kapha), Agni status (Samagni, Mandagni, Tikshnagni, Vishamagni), Nadi pulse rate/gati, Jihva coating (Saam/Niraam), and sleep/bowel regularity.", styles['BulletItem']))
    story.append(Paragraph("• <b>Integrative Prescriptions:</b> Records administered formulations, Panchakarma therapies (Janu Basti, Shirodhara), Pathya (wholesome diet) and Apathya (contraindicated food).", styles['BulletItem']))
    story.append(Paragraph("• <b>Clinical Case Slip & CSV Export:</b> Generates professional printable medical case sheets with doctor credentials and enables bulk export for hospital analytics.", styles['BulletItem']))
    story.append(Spacer(1, 8))

    # Sample Daily Issues Table
    body_table_data = [
        [
            Paragraph("Patient & Phone", styles['TableHeader']),
            Paragraph("Body System", styles['TableHeader']),
            Paragraph("Chief Complaint & Symptoms", styles['TableHeader']),
            Paragraph("Dosha / Agni", styles['TableHeader']),
            Paragraph("Care Prescribed", styles['TableHeader']),
            Paragraph("Status", styles['TableHeader'])
        ],
        [
            Paragraph("Kamlesh Indurkar<br/>+91 9011942126", styles['TableCellBold']),
            Paragraph("Spine & Joints<br/>(अस्थि-संधि)", styles['TableCell']),
            Paragraph("Morning knee stiffness & lumbar back pain during walking", styles['TableCell']),
            Paragraph("Vata-Kapha<br/>Vishamagni", styles['TableCell']),
            Paragraph("Janu Basti + Yogaraj Guggulu (2 BD)", styles['TableCell']),
            Paragraph("In-Progress", styles['TableCell'])
        ],
        [
            Paragraph("Sunita Deshmukh<br/>+91 9423112233", styles['TableCellBold']),
            Paragraph("Digestive & Gut<br/>(अग्नि-कोष्ठ)", styles['TableCell']),
            Paragraph("Post-meal sour water reflux, burning chest & bloating", styles['TableCell']),
            Paragraph("Pitta-Vata<br/>Tikshnagni", styles['TableCell']),
            Paragraph("Avipattikar Churna + Kamadudha Ras", styles['TableCell']),
            Paragraph("Under Treatment", styles['TableCell'])
        ],
        [
            Paragraph("Aarav Patil<br/>+91 9822314567", styles['TableCellBold']),
            Paragraph("Mind & Sleep<br/>(मनोवह)", styles['TableCell']),
            Paragraph("High work cortisol, chronic insomnia & forehead headaches", styles['TableCell']),
            Paragraph("Prana Vata<br/>Samagni", styles['TableCell']),
            Paragraph("Shirodhara with Brahmi Taila + Ashwagandharishta", styles['TableCell']),
            Paragraph("In-Progress", styles['TableCell'])
        ],
        [
            Paragraph("Meera Kulkarni<br/>+91 9890123456", styles['TableCellBold']),
            Paragraph("Respiratory<br/>(प्राणवह)", styles['TableCell']),
            Paragraph("Morning sneezing bouts, post-nasal drip & throat scratchiness", styles['TableCell']),
            Paragraph("Vata-Kapha<br/>Mandagni", styles['TableCell']),
            Paragraph("Nasya with Anu Taila + Sitopaladi Churna", styles['TableCell']),
            Paragraph("Relieved", styles['TableCell'])
        ]
    ]
    body_table = Table(body_table_data, colWidths=[90, 80, 142, 75, 95, 50])
    body_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TEAL_CLINICAL),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_CALLOUT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(body_table)
    story.append(Spacer(1, 14))

    # =========================================================================
    # SECTION 4: MODULE 3 — GST INVOICING & FINANCIAL CONTROLS
    # =========================================================================
    story.append(Paragraph("4. Module 3: Computerized GST Invoicing & Billing", styles['SectionHeading']))
    story.append(Paragraph(
        "Zeniva ERP produces computerized, tax-compliant GST receipts for both Outpatient (OPD) consultations and Inpatient (IPD) admissions. Line items dynamically calculate consultation fees, Panchakarma therapeutic procedures, and dispensed herbal medications with statutory CGST (2.5%) and SGST (2.5%) breakdown.",
        styles['BodyDark']
    ))
    story.append(Paragraph("• <b>Instant Inventory Sync:</b> When an invoice is finalized, prescribed medicines (e.g., Ashwagandha Churna, Khadirarishta) are automatically decremented from pharmacy inventory.", styles['BulletItem']))
    story.append(Paragraph("• <b>Printable Computerized Invoices:</b> Every invoice features patient metadata, statutory GSTIN credentials, payment mode (UPI, Cash, Card), clinic seal, and authorized medical superintendent signature.", styles['BulletItem']))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 5: MODULE 4 & 5 — PANCHAKARMA & IPD WARDS
    # =========================================================================
    story.append(Paragraph("5. Module 4 & 5: Panchakarma Scheduler & IPD Wards", styles['SectionHeading']))
    story.append(Paragraph(
        "<b>Panchakarma Care Management:</b> Schedules specialized bio-cleansing therapies including <i>Shirodhara (Medicated Oil Flow)</i>, <i>Sarvanga Abhyanga & Bashpa Swedana (Herbal Steam Bath)</i>, <i>Janu Basti (Knee Joint Therapy)</i>, and <i>Nasya Karma</i>. Tracks session progression (e.g., Day 3 of 7), assigned therapist, and patient clinical feedback.",
        styles['BodyDark']
    ))
    story.append(Paragraph(
        "<b>IPD Cottages & Wards:</b> Manages bed allocations across three tiers:",
        styles['BodyDark']
    ))
    story.append(Paragraph("• <b>Deluxe Ayurvedic Cottages:</b> Individual cottages with private Shirodhara suites, personalized Sattvic Agni diet, and dedicated caregiver (₹2,800/day).", styles['BulletItem']))
    story.append(Paragraph("• <b>Panchakarma Care Suites:</b> Equipped with traditional wooden Droni tables and steam cabinets for intensive detox programs (₹2,200/day).", styles['BulletItem']))
    story.append(Paragraph("• <b>General Care Wards:</b> Sanitized communal convalescence wards for recovery and post-therapy observation (₹1,200/day).", styles['BulletItem']))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 6: MODULE 6 — CLINIC ANALYTICS & REVENUE INTELLIGENCE
    # =========================================================================
    story.append(Paragraph("6. Module 6: Clinic Analytics & Revenue Intelligence", styles['SectionHeading']))
    story.append(Paragraph(
        "Provides real-time clinical business intelligence. Automatically computes <b>Total Pharmacy Stock Valuation</b>, <b>Gross Billed Revenue</b>, <b>Active Panchakarma Therapy Utilization</b>, and <b>Bed Occupancy Percentage</b>. Alerts administrative staff to fast-depleting medicines and seasonal surges in Vata/Pitta/Kapha disorders.",
        styles['BodyDark']
    ))
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 7: MOBILE RESPONSIVENESS & TECHNICAL SPECS
    # =========================================================================
    story.append(Paragraph("7. Mobile View Responsiveness & Engineering Standards", styles['SectionHeading']))
    story.append(Paragraph(
        "A primary design priority of Zeniva ERP is flawless execution on smartphones, tablets, and desktop workstations without compromise:",
        styles['BodyDark']
    ))
    story.append(Paragraph("• <b>Responsive Duality:</b> On mobile displays (width < 768px), wide clinical tables automatically transform into touch-friendly stacked cards (<code>md:hidden</code>), preventing horizontal clipping and illegible micro-text.", styles['BulletItem']))
    story.append(Paragraph("• <b>Swipeable Navigation:</b> The sub-navigation tab bar supports frictionless horizontal touch-swipe with hidden scrollbars for native app-like fluid interaction.", styles['BulletItem']))
    story.append(Paragraph("• <b>Statutory Compliance:</b> Designed in strict alignment with Ministry of AYUSH guidelines, Maharashtra Council of Indian Medicine (MCIM) standards, and ABDM digital health records.", styles['BulletItem']))
    story.append(Spacer(1, 14))

    # Footer Signoff Box
    signoff_data = [
        [
            Paragraph("<b>Document Certified By:</b><br/>Zeniva AI Governance & Clinical Core Team", styles['TableCell']),
            Paragraph("<b>Lead Architect & Systems Engineer:</b><br/>Bhupesh Indurkar (Nagpur, Maharashtra)", styles['TableCell'])
        ]
    ]
    signoff_table = Table(signoff_data, colWidths=[266, 266])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CALLOUT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(signoff_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {output_filename}")


if __name__ == '__main__':
    workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_pdf = os.path.join(workspace_root, "Zeniva_Ayurvedic_Hospital_ERP_Summary.pdf")
    build_pdf(target_pdf)
    
    # Also copy to frontend public directory for in-app download
    public_dir = os.path.join(workspace_root, "frontend", "public")
    if os.path.exists(public_dir):
        public_pdf = os.path.join(public_dir, "Zeniva_Ayurvedic_Hospital_ERP_Summary.pdf")
        import shutil
        shutil.copyfile(target_pdf, public_pdf)
        print(f"Copied to public web directory: {public_pdf}")
