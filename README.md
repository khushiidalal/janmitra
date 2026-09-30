# JanMitra – Secure Case & Document Management for Law Enforcement

> A role-based, audit-driven digital platform for managing law-enforcement cases, judicial documents, and investigative records — built for Smart India Hackathon 2026.

---

## 1. Project Information

| Field             | Details                                                                           |
|-------------------|-----------------------------------------------------------------------------------|
| **Project Title** | JanMitra – Secure Case & Document Management                                      |
| **PS ID**         | 26190                                                                             |
| **PS Title**      | Secure Digital Document Management System for Legal and Investigation Documents   |
| **Category**      | Software                                                                          |
| **Theme**         | Blockchain & Cybersecurity                                                        |

---

## 2. Problem Statement

Law enforcement agencies and judicial bodies handle a large volume of sensitive documents — FIRs, charge sheets, witness statements, court orders, and investigation reports. Fragmented service channels create bureaucratic friction and backlogs.

India is becoming more digital, but many important processes in police and law enforcement still involve a large amount of paperwork and scattered records. When these records are stored in different files, folders, or systems, finding the right information takes a lot of time.

For example, an officer working on a case may need to find an old document, check evidence, see who updated a record, or find the latest report. If the information is not properly organized, the officer has to search through multiple records.

Key Challenges:
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
| **Secure Authentication** | JWT login, 2FA, session management (device/browser/OS/IP tracked per session) |
| **Guided Case Management** | Multi-step case creation (5-step wizard), track cases as Active / Pending / Closed, attach Victims, Witnesses, Suspects |
| **Document Vault** | Upload FIRs, investigation reports, witness statements, court orders, evidence — with SHA-256 integrity fingerprinting |
| **Automated OCR** | Tesseract.js & pdf-parse extract searchable text automatically; OCR quality graded High / Medium / Low with confidence metrics |
| **Live Security Monitoring** | Dashboard Security Alerts card polls every 5 seconds — flags failed logins, unusual access patterns, and critical severity events in real time |
| **Immutable Audit Trail** | Logs document, review, login, approval, registration, and security events — filterable by type, case, severity, and status |
| **Role-Based Access Control** | 6 roles (Admin → Senior Officer → Investigator → Officer → Clerk → Viewer) with per-role data visibility rules |
| **Accessibility** | High-contrast UI, adjustable text size (Small / Medium / Large), language preferences |
| **Dashboard & Analytics** | Case counts, recent documents, live security alerts, and activity overview |

---

## 5. Technology Stack

| Layer          | Technology                                                                                |
|----------------|-------------------------------------------------------------------------------------------|
| **Frontend**   | Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide Icons|
| **Backend**    | Next.js API Routes (Node.js runtime)                                                      |
| **Database**   | MongoDB Atlas (Mongoose ODM)                                                              |
| **OCR**        | Tesseract.js (image OCR with Sharp preprocessing) & pdf-parse (PDF extraction)            |
| **Auth**       | JWT (`jsonwebtoken`), bcryptjs, Nodemailer / Resend (email OTP)                           |
| **Hashing**    | Node.js built-in `crypto` — SHA-256 for document integrity and token security            |
| **Deployment** | Vercel                                                                                    |

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

JanMitra implements strict Role-Based Access Control (RBAC) across six hierarchical ranks:

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

---

## 8. Repository Structure

```text
janmitra/
├── .env.example
├── .gitignore
├── .oxlintrc.json
├── README.md
├── next-env.d.ts
├── next.config.mjs
├── ocr-data/
│   ├── eng.traineddata
│   └── hin.traineddata
├── package-lock.json
├── package.json
├── postcss.config.js
├── public/
│   ├── bgimg.png
│   ├── face-scan.png
│   ├── logo.jpg
│   ├── national-emblem.png
│   └── sidebar-tricolor.png
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── audit-trail/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── cases/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   ├── step1/page.tsx
│   │   │   │   │   ├── step2/page.tsx
│   │   │   │   │   ├── step4/page.tsx
│   │   │   │   │   ├── step5/page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── documents/page.tsx
│   │   │   ├── help/page.tsx
│   │   │   ├── help-guidelines/
│   │   │   │   ├── filing-new-case/page.tsx
│   │   │   │   └── tracking-evidence/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── layout.tsx
│   │   ├── 2fa-login/page.tsx
│   │   ├── 2fa-result/page.tsx
│   │   ├── api/
│   │   │   ├── audit/route.ts
│   │   │   ├── auth/
│   │   │   │   ├── 2fa/
│   │   │   │   │   ├── send-link/route.ts
│   │   │   │   │   ├── verify-link/route.ts
│   │   │   │   │   ├── verify-login/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   ├── change-password/route.ts
│   │   │   │   ├── export-data/route.ts
│   │   │   │   ├── forgot-password/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── me/route.ts
│   │   │   │   ├── preferences/route.ts
│   │   │   │   ├── register/route.ts
│   │   │   │   ├── reset-password/route.ts
│   │   │   │   └── sessions/
│   │   │   │       ├── [id]/route.ts
│   │   │   │       └── route.ts
│   │   │   ├── cases/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── documents/[docId]/ocr/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── documents/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── download/route.ts
│   │   │   │   │   ├── ocr/route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   ├── draft/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── otp/
│   │   │   │   ├── send/route.ts
│   │   │   │   └── verify/route.ts
│   │   │   ├── phone-otp/
│   │   │   │   ├── send/route.ts
│   │   │   │   └── verify/route.ts
│   │   │   └── users/
│   │   │       ├── [id]/route.ts
│   │   │       └── route.ts
│   │   ├── forgot-password/page.tsx
│   │   ├── register/
│   │   │   ├── step1/page.tsx
│   │   │   ├── step2/page.tsx
│   │   │   └── step3/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard/SecurityAlertsCard.tsx
│   │   ├── documents/OcrTextModal.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopNav.tsx
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       └── Stepper.tsx
│   ├── lib/
│   │   ├── server/
│   │   │   ├── auth.ts
│   │   │   ├── caseId.ts
│   │   │   ├── mailer.ts
│   │   │   ├── ocr.ts
│   │   │   ├── security.ts
│   │   │   └── storage.ts
│   │   ├── api.ts
│   │   ├── db.ts
│   │   ├── preferences.ts
│   │   └── useDraft.ts
│   ├── models/
│   │   ├── Audit.ts
│   │   ├── AuthorizedAdmin.ts
│   │   ├── Case.ts
│   │   ├── Document.ts
│   │   ├── Draft.ts
│   │   ├── EmailOTP.ts
│   │   ├── PasswordResetToken.ts
│   │   ├── TwoFactorToken.ts
│   │   └── User.ts
│   ├── index.css
│   └── proxy.ts
├── tailwind.config.js
├── test-backend-e2e.mjs
├── test_ocr.mjs
├── tsconfig.json
├── uploads/
│   └── documents/
└── vercel.json
```

---

## 9. Final Presentation

📁 **[View Final Presentation on Google Drive](https://drive.google.com/drive/folders/1x9BPGXj2eayRisD599VGGVREHyaWW0iI?usp=sharing)**

---

## 10. Demo Video

🎥 The Demo video is live at **[YouTube Demo](https://youtu.be/X5MXSVi4sWM)**

---

## 11. Screenshots & Prototypes

📁 **[View All Prototype Screenshots](uploads/documents/)**

---

## 12. Installation

```bash
# Clone the repository
git clone https://github.com/khushiidalal/janmitra.git

# Navigate into project directory
cd janmitra

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following keys:

```env
PORT=5000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:5000

# Database
MONGODB_URI=<your_mongodb_connection_string>

# JWT Secret
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=7d

# Email Services (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email>
SMTP_PASS=<your_app_password>
```

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

The application is deployed live at **[JanMitra Production Site](https://janmitra-pbbl.vercel.app)**.

---

## 14. Future Scope

JANMITRA can be expanded in the future with features such as:
- AI-based document summarization
- Smart document search using natural language
- Automatic document classification
- Digital signatures
- Multilingual support
- Mobile application
- Real-time notifications
- Advanced case analytics
- Integration with other authorized government systems

*AI features can help users find and understand information faster, but important legal and investigative decisions will remain under human control.*

---

*Built for Smart India Hackathon 2026 — `Astrophage` | `Netaji Subhas University of Technology (NSUT)`*
