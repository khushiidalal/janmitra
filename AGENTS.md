# Janmitra Developer & Agent Guide

Welcome to **Janmitra**! This repository powers a full-stack digital evidence vault and case investigation management platform designed for cyber crime units, legal investigators, and law enforcement officers.

Whether you are an engineer contributing new features or an AI pair programmer assisting with code refactoring, this guide provides the context, principles, and workflows you need to build and maintain Janmitra effectively.

---

## 1. Project Overview & Architecture

Janmitra is structured as a modern full-stack application built with the **Next.js 16 App Router**, **React 19**, **TypeScript**, and **Tailwind CSS v4**, backed by **MongoDB** through **Mongoose**.

### Key System Capabilities

- **FIR & Case Management**: Step-by-step case registration (`/cases/new/step1` through `step5`), status lifecycles, investigator assignments, and real-time draft autosave (`/api/draft`).
- **Evidence Vault & Dual OCR**: Upload and preview of legal case documents, automated text extraction from PDFs and images using `pdf-parse` and `tesseract.js`, with OCR confidence metrics and quality scoring.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions across six hierarchical ranks:
  - `Admin`: Full access to user management, case deletion, system configurations, and security audits.
  - `Senior Officer`: Comprehensive supervisory oversight across cases, documents, and audit trails.
  - `Investigator`: Full access to case investigation, OCR text extraction, and document uploads.
  - `Officer`: Active field case handling, evidence attachment, and dossier reviews.
  - `Clerk`: FIR registration wizard, draft management, and initial document intake.
  - `Viewer`: Read-only access to assigned records with redacted administrative controls.
- **Multi-Factor Authentication (2FA)**: Two-factor verification using Email OTP (via Nodemailer/Resend) and SMS OTP (simulated / Twilio).
- **Audit Trails**: Non-repudiation logging for every authentication event, case change, document upload, and user role modification.

---

## 2. Directory Layout

```
janmitra/
├── README.md               # Hackathon & project documentation
├── public/                 # Static branding, emblems, and visual assets
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (dashboard)/    # Authenticated dashboard views (cases, documents, audit, settings)
│   │   ├── api/            # Backend API routes (/api/auth, /api/cases, /api/documents, etc.)
│   │   ├── register/       # 3-step officer registration flow
│   │   ├── layout.tsx      # Root application layout
│   │   └── page.tsx        # Officer login & landing portal
│   ├── components/
│   │   ├── dashboard/      # Analytics, security alerts (5s live polling), and metric cards
│   │   ├── documents/      # Evidence viewer and OCR text inspection modals
│   │   ├── layout/         # Sidebar navigation and top bar components
│   │   └── ui/             # Reusable UI primitives (Badge, Card, Stepper)
│   ├── lib/
│   │   ├── api.ts          # Client-side API fetch client and token handlers
│   │   ├── db.ts           # Mongoose MongoDB connection singleton
│   │   ├── preferences.ts  # Local user preferences management
│   │   └── server/         # Server-only utilities (auth, caseId generation, mailer, ocr, storage)
│   └── models/             # Mongoose schemas (User, Case, Document, Draft, Audit, Tokens)
├── uploads/                # Local evidence storage (git-ignored)
└── test-backend-e2e.mjs    # Comprehensive end-to-end API test suite (51 test cases)
```

---

## 3. Developer Workflows & Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the local development server at `http://localhost:5000` |
| `npm run build` | Compiles the production build, prerenders static pages, and validates TypeScript |
| `npm run start` | Runs the production server on port 5000 |
| `npm run lint` | Runs Oxlint to catch JavaScript/TypeScript and React errors quickly |
| `npm test` | Runs the automated 51-point backend test suite (auto-spawns test server if needed) |

---

## 4. Engineering Principles & Conventions

1. **Server vs. Client Boundary**:
   - Keep business logic, file storage, database queries, and encryption in `src/lib/server/` or `src/app/api/`.
   - Never import server-only modules (`mongoose`, `nodemailer`, `sharp`, `tesseract.js`) into client components.
2. **Security & Data Integrity**:
   - Validate input payloads explicitly before passing data to database models.
   - Guard administrative routes with `requireAuth` and verify role permissions before allowing deletions or elevations.
   - Always log significant actions using the `Audit` model (`src/models/Audit.ts`).
3. **Clean Git Hygiene**:
   - Do not commit compiler artifacts (e.g., `tsconfig.tsbuildinfo`), build output (`.next`), or user-uploaded evidence (`uploads/`). These are safely ignored in `.gitignore`.
4. **Resilient Error Handling**:
   - Return structured JSON responses with appropriate HTTP status codes (`400` for validation, `401` for unauthorized, `403` for forbidden, `404` for missing records, `500` for server exceptions).

---

## 5. Next.js Framework Rules

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
