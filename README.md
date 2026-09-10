# JanMitra – Secure Case & Document Management for Law Enforcement

> A role-based, audit-driven digital platform for managing law-enforcement cases, judicial documents, and investigative records — built for Smart India Hackathon 2026.

---

## 1. Project Information

| Field             | Details                                              |
|-------------------|------------------------------------------------------|
| **Project Title** | JanMitra – Secure Case & Document Management         |
| **PS ID**         | 26190                                     |
| **PS Title**      | Secure Digital Document Management                                  |
| **Category**      | Software                                             |
| **Theme**         | Miscellaneous                                       |

---

## 2. Problem Statement

Law enforcement agencies and judicial bodies handle a large volume of sensitive documents — FIRs, charge sheets, witness statements, court orders, and investigation reports. Fragmented service channels create bureaucratic friction and backlogs:

- **No single window** for identity verification, case filing, and multi-sector grievances
- Scanned and digital records can be **modified without verifiable audit trails**
- Manual document retrieval is slow and error-prone across isolated government portals/silos

---

## 3. Proposed Solution

**JanMitra** is a full-stack, secure web application that provides:

- A **centralised case and document registry** for law enforcement officers — one ecosystem instead of isolated portals
- Strict **Role-Based Access Control (RBAC)** across six permission levels
- **Immutable audit trails** — every document view, upload, case update, and login event is logged with user identity, IP address, device, severity, and timestamp
- **OCR-assisted document workflows** via a dual pipeline (Tesseract.js and pdf-parse) — scanned documents and PDFs become searchable text automatically
- **Two-Factor Authentication (2FA)** password and email OTP (Nodemailer)
- **SHA-256 document fingerprinting** for tamper-evident chain-of-custody records
- **Real-time security monitoring** — dashboard polls for suspicious logins and unusual activity every 5 seconds


---

## 4. Key Features

| Feature | Details |
|---|---|
|  **Secure Authentication** | JWT login, 2FA ,session management (device/browser/OS/IP tracked per session) |
|  **Guided Case Management** | Multi-step case creation (5-step wizard), track cases as Active / Pending / Closed, attach Victims, Witnesses, Suspects |
|  **Document Vault** | Upload FIRs, investigation reports, witness statements, court orders, evidence — with SHA-256 integrity fingerprinting |
|  **Automated OCR** | Tesseract.js & pdf-parse extract searchable text automatically; OCR quality graded High / Medium / Low with confidence metrics |
|  **Live Security Monitoring** | Dashboard Security Alerts card polls every 5 seconds — flags failed logins, unusual access patterns, and critical severity events in real time |
|  **Immutable Audit Trail** | Logs document, review, login, approval, registration, and security events — filterable by type, case, severity, and status |
|  **Role-Based Access Control** | 6 roles (Admin → Senior Officer → Investigator → Officer → Clerk → Viewer) with per-role data visibility rules |
|  **Accessibility** | High-contrast UI, adjustable text size (Small / Medium / Large), language preferences |
|  **Dashboard & Analytics** | Case counts, recent documents, live security alerts, and activity overview |

---

## 5. Technology Stack

| Layer          | Technology                                                                       |
|----------------|----------------------------------------------------------------------------------|
| **Frontend**   | Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Backend**    | Next.js API Routes (Node.js runtime)                                             |
| **Database**   | MongoDB Atlas (Mongoose ODM)                                                     |
| **OCR**        | Tesseract.js (image OCR with Sharp preprocessing) & pdf-parse (PDF extraction)   |
| **Auth**       | JWT (`jsonwebtoken`), bcryptjs, Nodemailer / Resend (email OTP), Twilio (SMS OTP)|
| **Hashing**    | Node.js built-in `crypto` — SHA-256 for document integrity and token security   |
| **Deployment** | Vercel                                                                           |

---

## 6. Architecture

```
User (Browser — Law Enforcement Personnel)
      │
      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Next.js 16 Full-Stack Application                      │
│                                                                             │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │   React 19 Pages (App Router)   │   │   API Route Handlers (Node.js)  │  │
│  ├─────────────────────────────────┤   ├─────────────────────────────────┤  │
│  │ • Officer Portal / Login (/)    │   │ • /api/auth (JWT, 2FA, session) │  │
│  │ • 3-Step Officer Registration   │◄─►│ • /api/cases (CRUD & docs)      │  │
│  │ • 2FA Verification & Password   │   │ • /api/documents (vault & OCR)  │  │
│  │ • Interactive Dashboard         │   │ • /api/audit (security logs)    │  │
│  │ • Guided Case Creation (Steps)  │   │ • /api/users (RBAC management)  │  │
│  │ • Digital Evidence Vault        │   │ • /api/draft (real-time autosav)│  │
│  │ • Immutable Audit Trail         │   │ • /api/otp & /api/phone-otp     │  │
│  │ • Accessibility & Settings      │   │ • /api/health (system monitor)  │  │
│  └─────────────────────────────────┘   └────────────────┬────────────────┘  │
└─────────────────────────────────────────────────────────┼───────────────────┘
                                                          │
         ┌──────────────────────────────┬─────────────────┴─────────────┐
         ▼                              ▼                               ▼
  ┌──────────────┐          ┌───────────────────────┐       ┌───────────────────────┐
  │ MongoDB Atlas│          │ Dual OCR Engine       │       │ Multi-Channel 2FA     │
  │ (Mongoose)   │          ├───────────────────────┤       ├───────────────────────┤
  ├──────────────┤          │ • pdf-parse (PDF docs)│       │ • Twilio (SMS OTP)    │
  │ • Users      │          │ • Tesseract.js        │       │ • Nodemailer / Resend │
  │ • Cases      │          │ • Sharp image prep    │       │   (Email OTP & link)  │
  │ • Documents  │          │ • Confidence scoring  │       └───────────────────────┘
  │ • Audit Logs │          │ • Quality grading     │
  │ • Drafts     │          └───────────┬───────────┘
  │ • Sessions   │                      │
  └──────────────┘                      ▼
         │                  ┌───────────────────────┐
         ▼                  │ Storage & Cryptography│
  ┌──────────────┐          ├───────────────────────┤
  │ Node.js      │◄─────────┤ • uploads/documents/  │
  │ crypto       │          │ • SHA-256 integrity   │
  │ SHA-256      │          │   fingerprint on load │
  └──────────────┘          └───────────────────────┘
```

---

## 7. User Roles & Access Hierarchy

JanMitra implements strict Role-Based Access Control (RBAC) across six hierarchical ranks. Permissions are enforced both in API route handlers via token verification and dynamically in the UI:

```
┌──────────────────────────────────────────────────────────────┐
│                            ADMIN                             │
│  Full system control · User RBAC & role elevation · Audits   │
└──────────────────────────────┬───────────────────────────────┘
                               │
               ┌───────────────▼───────────────┐
               │         SENIOR OFFICER        │
               │  Supervisory oversight · Full │
               │  case dossier deletion & logs │
               └───────────────┬───────────────┘
                               │
               ┌───────────────▼───────────────┐
               │          INVESTIGATOR         │
               │  Assigned cases · OCR triggers│
               │  Case management & deletion   │
               └───────────────┬───────────────┘
                               │
               ┌───────────────▼───────────────┐
               │            OFFICER            │
               │  Active case updates · Evidence│
               │  attachment · Dossier reviews │
               └───────────────┬───────────────┘
                               │
               ┌───────────────▼───────────────┐
               │             CLERK             │
               │  FIR intake · 5-step wizard   │
               │  Document upload · Draft save │
               └───────────────┬───────────────┘
                               │
               ┌───────────────▼───────────────┐
               │            VIEWER             │
               │  Read-only case observation   │
               │  Redacted PII / Admin controls│
               └───────────────────────────────┘
```

### Permission Matrix

| Capability | Admin | Senior Officer | Investigator | Officer | Clerk | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **View Published Cases & Records** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create New FIR Cases (Wizard / Draft)** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Edit & Update Case Details** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Delete Cases** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Upload Evidence & Case Documents** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Trigger OCR & Extract Text** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Delete Uploaded Evidence** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Audit Trail & Security Alerts** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Users & Role Assignment** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Delete Accounts & Session Revocation** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 8. Repository Structure

```
janmitra/
├── README.md                             # Project documentation & SIH specifications
├── package.json                          # Dependencies, Next.js scripts, and test runner
├── package-lock.json                     # Deterministic dependency lockfile
├── next.config.mjs                       # Next.js 16 configuration & external server packages
├── tailwind.config.js                    # Tailwind CSS v4 styling & color themes
├── tsconfig.json                         # TypeScript configuration with path aliases (@/*)
├── vercel.json                           # Vercel deployment configuration
├── .oxlintrc.json                        # Oxlint code quality configuration
├── .gitignore                            # Excluded files (build cache, uploads, environment)
├── .env.example                          # Template for environment configuration
├── AGENTS.md                             
├── CLAUDE.md                    
├── test-backend-e2e.mjs                  # Automated 51-point E2E backend test suite
│
├── public/                               # Static UI assets & government insignia
│   ├── bgimg.png                         # Background portal imagery
│   ├── face-scan.png                     # Biometric / face scan graphic
│   ├── logo.jpg                          # JanMitra emblem
│   ├── national-emblem.png               # National emblem of India
│   └── sidebar-tricolor.png              # Tiranga brand accent
│
├── uploads/                              # Local storage vault (excluded from git)
│   └── documents/                        # Stored case evidence & uploaded PDF/image files
│
└── src/
    ├── index.css                         # Global CSS & Tailwind directives
    ├── app/                              # Next.js 16 App Router
    │   ├── layout.tsx                    # Root layout with theme & font providers
    │   ├── page.tsx                      # Officer landing & login portal
    │   │
    │   ├── register/                     # 3-step officer onboarding wizard
    │   │   ├── step1/page.tsx            # Personal details & biometric profile
    │   │   ├── step2/page.tsx            # Official ID & government verification
    │   │   └── step3/page.tsx            # Role selection, designation & credentials
    │   │
    │   ├── 2fa-login/page.tsx            # Two-factor authentication challenge
    │   ├── 2fa-result/page.tsx           # 2FA verification confirmation
    │   ├── forgot-password/page.tsx      # Password recovery initiation
    │   ├── reset-password/page.tsx       # Secure token-based password reset
    │   │
    │   ├── (dashboard)/                  # Authenticated portal layout (Sidebar & TopNav)
    │   │   ├── layout.tsx                # Dashboard shell with role-aware navigation
    │   │   ├── dashboard/page.tsx        # Overview analytics, case stats & live security alerts
    │   │   ├── cases/
    │   │   │   ├── page.tsx              # FIR Case registry with status filters & search
    │   │   │   ├── [id]/page.tsx         # Comprehensive case dossier & attached documents
    │   │   │   └── new/
    │   │   │       ├── page.tsx          # Wizard entry router
    │   │   │       ├── step1/page.tsx    # Step 1: Incident & reporting officer info
    │   │   │       ├── step2/page.tsx    # Step 2: Victims, witnesses & suspect details
    │   │   │       ├── step4/page.tsx    # Step 4: Evidence files & initial document uploads
    │   │   │       └── step5/page.tsx    # Step 5: Final review & formal submission
    │   │   ├── documents/page.tsx        # Centralized digital evidence vault & OCR viewer
    │   │   ├── audit-trail/page.tsx      # Immutable audit trail with severity & type filtering
    │   │   ├── settings/page.tsx         # Account profile, 2FA setup, active sessions & a11y
    │   │   ├── help/page.tsx             # System guidelines, FAQ & standard procedures
    │   │   └── help-guidelines/
    │   │       ├── filing-new-case/      # Standard Operating Procedure for FIR filing
    │   │       └── tracking-evidence/    # Chain-of-custody tracking protocol
    │   │
    │   └── api/                          # Next.js Server-Side API Handlers
    │       ├── health/route.ts           # System status & DB health probe
    │       ├── auth/
    │       │   ├── login/route.ts        # Credential authentication & session creation
    │       │   ├── register/route.ts     # Officer account registration with validation
    │       │   ├── me/route.ts           # Authenticated user session verification
    │       │   ├── 2fa/route.ts          # Two-factor verification & status updates
    │       │   ├── change-password/      # In-portal password update
    │       │   ├── forgot-password/      # Recovery token dispatcher
    │       │   ├── reset-password/       # Password reset fulfillment
    │       │   ├── preferences/route.ts  # Accessibility & language settings
    │       │   ├── sessions/route.ts     # Active device session tracking
    │       │   ├── sessions/[id]/        # Remote session termination
    │       │   └── export-data/          # Officer data portability export
    │       ├── cases/
    │       │   ├── route.ts              # Case collection CRUD & status query
    │       │   ├── [id]/route.ts         # Single case retrieval, PATCH update & DELETE
    │       │   └── [id]/documents/[docId]/ocr/route.ts # Trigger case-level document OCR
    │       ├── documents/
    │       │   ├── route.ts              # File upload, storage & document listing
    │       │   ├── [id]/route.ts         # Document metadata & delete
    │       │   ├── [id]/download/        # Secure file stream download
    │       │   └── [id]/ocr/route.ts     # Standalone document OCR extraction
    │       ├── audit/route.ts            # Audit trail log query & filtering
    │       ├── users/
    │       │   ├── route.ts              # User list query
    │       │   └── [id]/route.ts         # User role updates (Admin only) & account deletion
    │       ├── draft/route.ts            # Case draft saving, retrieval & clearing
    │       ├── otp/                      
    │       └── phone-otp/              
    │
    ├── components/
    │   ├── dashboard/SecurityAlertsCard.tsx # Real-time security alert monitor (5s polling)
    │   ├── documents/OcrTextModal.tsx       # Extracted OCR text viewer & SHA-256 display
    │   ├── layout/Sidebar.tsx               # Role-aware navigation sidebar
    │   ├── layout/TopNav.tsx                # Header bar with user profile & quick controls
    │   └── ui/                              # Shared UI components (Badge, Card, Stepper)
    │
    ├── lib/
    │   ├── api.ts                        # Unified client fetch client with auth headers
    │   ├── db.ts                         # Mongoose MongoDB cached connection singleton
    │   ├── preferences.ts                # Accessibility settings state
    │   ├── useDraft.ts                   # Autosaving draft React hook
    │   └── server/                       # Server-only services (Node.js runtime)
    │       ├── auth.ts                   # JWT signing, verification & cookie extraction
    │       ├── caseId.ts                 # Sequential FIR Case ID generator (FIR-YYYY-XXX)
    │       ├── mailer.ts                 # Nodemailer & Resend OTP dispatcher
    │       ├── ocr.ts                    # Tesseract.js & pdf-parse dual-engine pipeline
    │       ├── security.ts               # IP extraction, User-Agent parser & unusual login heuristics
    │       └── storage.ts                # Disk persistence & SHA-256 hash calculator
    │
    └── models/                           # Mongoose Data Schemas
        ├── User.ts                       # 6 user roles, credentials, sessions, preferences
        ├── Case.ts                       # FIR case schema, victims, witnesses, suspects, docs
        ├── Document.ts                   # Document metadata, SHA-256 hash, OCR results & quality
        ├── Audit.ts                      # Non-repudiation log, severity, IP, device, isUnusual
        ├── Draft.ts                      # Temporary in-progress FIR case drafts
        ├── EmailOTP.ts                   
        ├── TwoFactorToken.ts             # 2FA verification tokens
        └── PasswordResetToken.ts         # Secure password recovery tokens
```

---

## 9. Final Presentation

Keep your final SIH presentation in the repository whenever the file size allows it.

See [`submission/PRESENTATION.md`](./submission/PRESENTATION.md) for the required format.  
If the file is too large for GitHub, upload to Google Drive / OneDrive and paste the shareable link in `submission/PRESENTATION.md`.

---

## 10. Demo Video

A demo video is optional but recommended.  
Add the YouTube / Google Drive link in [`submission/DEMO.md`](./submission/DEMO.md).

---

## 11. Screenshots / Prototype Photos

Add important screenshots to `assets/screenshots/`.

Recommended screenshots to include:
- Login page with 2FA flow
- Dashboard with Security Alerts card (live ping indicator)
- Case creation wizard (multi-step)
- Document vault with SHA-256 fingerprints
- OCR text extraction modal
- Audit Trail page with severity filters

---

## 12. Installation

```bash
# Clone the repository
git clone <YOUR_REPOSITORY_URL>
cd janmitra

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file at the project root with the following keys:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email>
SMTP_PASS=<your_app_password>
APP_URL=http://localhost:5000
```

> **Warning:** Never commit your `.env` file or credentials to the repository. It is already included in `.gitignore`.

---

## 13. Run

```bash
# Development server (runs on port 5000)
npm run dev

# Run automated backend test suite (51 passing tests)
npm test

# Run code linter
npm run lint

# Production build and start
npm run build
npm run start
```

The application will be available at `http://localhost:5000`.

---

## 14. Future Scope

- **AI-powered document classification** — Integrate an ML model to automatically tag and categorise FIRs, charge sheets, and evidence files
- **Natural Language Search** — Allow officers to search case documents using plain-language queries via an LLM
- **End-to-end encryption** — Client-side encryption for the most sensitive document payloads before storage
- **Offline-first PWA** — Allow field officers to record case notes offline with sync-on-connect
- **Blockchain-anchored audit trail** — Periodically anchor audit log Merkle roots to a permissioned blockchain for external tamper-evidence
- **Mobile application** — Native Android/iOS companion app for on-site evidence capture and OCR
- **Inter-agency data sharing** — Secure, consent-based API for sharing case data across jurisdictions and departments

---

## Important

> Before submission, ensure the repository is accessible to reviewers.  
> **Do NOT upload** passwords, API keys, JWT secrets, `.env` files, or any other sensitive credentials to the repository.

---

*Built for Smart India Hackathon 2026 — `Astrophage` | `Netaji Subhas University of Technology(NSUT)`*


