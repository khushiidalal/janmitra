# Claude Code Guidelines for Janmitra

Hello Claude! This guide summarizes the architecture, conventions, and essential workflows for working within the **Janmitra** digital evidence and case investigation portal.

For extended architectural details and system capabilities, please also refer to [AGENTS.md](./AGENTS.md).

---

## 1. Project Context & Purpose

Janmitra is a full-stack portal empowering cyber crime investigation units and legal authorities to manage digital evidence and case records:
- **Stack**: Next.js 16 (App Router + Turbopack), React 19, TypeScript, Tailwind CSS v4, Mongoose/MongoDB.
- **Key Modules**: Case FIR tracking, Evidence Vault with OCR parsing (Tesseract.js & pdf-parse), Role-Based Access Control (`Admin`, `Senior Officer`, `Investigator`, `Officer`, `Clerk`, `Viewer`), Two-Factor Authentication, and Immutable Audit Trails.

---

## 2. Essential Commands

Always run these commands from the `janmitra` directory:

```bash
# Start local development server on port 5000
npm run dev

# Run production build and static analysis
npm run build

# Run Oxlint for fast code quality checks
npm run lint

# Run end-to-end backend API test suite (51 passing test cases)
npm test
```

> **Note on Testing**: `npm test` automatically verifies whether a server is active on port 5000. If not, it spawns a background server, runs all endpoint assertions, and tears it down cleanly upon completion.

---

## 3. Project Structure & Organization

- `src/app/(dashboard)/`: Authenticated officer views (`dashboard`, `cases`, `cases/new`, `documents`, `audit-trail`, `settings`, `help`).
- `src/app/api/`: App Router route handlers (`auth`, `cases`, `documents`, `audit`, `users`, `draft`, `otp`, `phone-otp`, `health`).
- `src/components/`: Reusable React components (`dashboard`, `documents`, `layout`, `ui`).
- `src/lib/server/`: Server-only utilities (`auth.ts`, `caseId.ts`, `mailer.ts`, `ocr.ts`, `security.ts`, `storage.ts`).
- `src/models/`: Mongoose schemas (`User`, `Case`, `Document`, `Draft`, `Audit`, `TwoFactorToken`, etc.).
- `uploads/documents/`: Local disk evidence storage (excluded from git tracking).

---

## 4. Coding Standards & Conventions

1. **Keep Secrets & Server Imports Isolated**:
   - Never import `mongoose`, `nodemailer`, `tesseract.js`, or `sharp` into client components.
   - Always access database models through server route handlers or server utilities.
2. **Access Control & RBAC**:
   - Enforce authentication via `requireAuth` from `src/lib/server/auth.ts`.
   - Strictly verify role permissions across the 6 hierarchy levels before executing mutations or deletes.
3. **Audit Trails**:
   - Log all security-sensitive actions (login, registration, case creation/deletion, role update, document upload) using `src/models/Audit.ts`.
4. **Git Hygiene**:
   - Do not commit compiler cache files (`*.tsbuildinfo`), build artifacts (`.next`), or uploaded evidence files (`uploads/`).

