# SyncSafe (PS-13) — Multi-Device File Synchronization & Security System

> **Problem Statement (PS-13)**: Google Drive — Same File, Multiple Devices.  
> **Core Principle**: Never silently discard a user’s change. Persist offline work, validate base versions, merge only when change rules make it safe, preserve conflicting edits, and require explicit resolution when the system cannot safely decide.

---

## 🌟 Key Features

1. **Server-Authoritative State & Transactional Concurrency (`SEC03`)**
   - SQLite WAL mode with ACID transactions guaranteeing that concurrent writes against the same base version either serialize or trigger conflict handling without lost updates.
   - Version history is strictly append-only and immutable with parent pointers.

2. **Durable Client Offline Storage (`TC03`, `TC10`)**
   - IndexedDB-backed local cache and persistent pending-change queue per device.
   - Pending changes survive browser tab closures, page reloads, and app restarts.
   - Every queued change carries a stable, unique `changeId`, `documentId`, `deviceId`, `baseVersion`, structured payload, and timestamp.

3. **Truth-in-UI Sync States**
   - **Synced**: Server confirms durable acceptance and client holds authoritative state.
   - **Saved locally — pending sync**: Offline edit saved to IndexedDB; waiting for network/acknowledgement.
   - **Syncing...**: Submission in-flight.
   - **Conflict detected**: Overlapping changes detected; preserved for explicit user review.
   - **Offline**: Network simulation or browser offline indicator.

4. **Field-Level 3-Way Auto-Merge (`TC06`)**
   - Supported structured fields: `title`, `status`, `description`, `content`.
   - When an offline device reconnects with a stale base version, the server compares the incoming change and intervening server changes against the base snapshot.
   - **Non-overlapping fields** (e.g. Laptop updated `description` while Phone updated `status`) merge automatically without data loss, advancing to a new version marked `auto_merged`.

5. **Conflict Preservation & 3-Way Visual Resolver (`TC07`, `TC12`)**
   - When the same field is modified concurrently (e.g. differing `content`), the server refuses to overwrite.
   - Creates a conflict record retaining base state, server state, and incoming device state.
   - Interactive 3-way visual resolver allows users to choose:
     - *Keep Server Version*
     - *Keep Device Version*
     - *Custom Field-by-Field Merge*
   - Explicit resolution creates a new version (`manual_resolution`) and converges all devices.

6. **Idempotency & Safe Retries (`TC08`, `TC09`)**
   - Submitting the same `changeId` multiple times (e.g. after network timeouts) returns the prior outcome without creating duplicate versions or corrupted states.

7. **Authentication & Per-Document Authorization (`SEC01`, `SEC02`)**
   - JWT session authentication.
   - User identity derived strictly from server-verified tokens (request body `userId` spoofing is rejected).
   - Unauthorized cross-user document access returns 404 with zero metadata leakage.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **Backend API** | Node.js + Express (TypeScript) | Transactional sync engine, base-version validation, 3-way merge, conflict management, JWT auth |
| **Database** | SQLite (`better-sqlite3`) + WAL mode | ACID transactions, users, devices, documents, immutable versions, change log, conflicts |
| **Frontend Client** | Vite + React + TypeScript | Dual-device persona simulator (Laptop vs Mobile), dark-mode glassmorphic UI, responsive editor |
| **Client Storage** | Browser IndexedDB (`idb`) | Persistent local cache and pending change queue per device |
| **Test Suite** | Vitest + Supertest | Automated test coverage for TC01–TC12 and SEC01–SEC04 |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js `v18+` (Tested on `v24.11.0`)
- npm `v9+`

### 2. Install Dependencies
```bash
# In server/
cd server
npm install

# In client/
cd ../client
npm install
```

### 3. Run Backend & Frontend
In separate terminals from the root directory:
```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 5173)
npm run dev:client
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Test Suite Verification (TC01–TC12 & SEC01–SEC04)

Run the automated test suite:
```bash
npm test
```

### Test Results Matrix:
| Test ID | Scenario | Result |
| :--- | :--- | :--- |
| **TC01** | One device edits online -> Change accepted, new version created | ✅ Passed |
| **TC02** | Second device fetches latest authoritative version from server | ✅ Passed |
| **TC04** | Offline device reconnects when server unchanged -> Change accepted cleanly | ✅ Passed |
| **TC05 & TC06** | Non-overlapping field edits merge automatically (Phone status + Laptop desc) | ✅ Passed |
| **TC07** | Overlapping field edits preserve both branches and trigger conflict | ✅ Passed |
| **TC08 & TC09** | Idempotent retries return prior outcome without duplicate versions | ✅ Passed |
| **TC11** | Very old base version considers intervening versions; no blind overwrite | ✅ Passed |
| **TC12** | Explicit conflict resolution creates new version and converges all devices | ✅ Passed |
| **SEC01** | Cross-user document access blocked with 404; zero metadata leakage | ✅ Passed |
| **SEC02** | Authenticated token identity enforced; request body userId spoofing rejected | ✅ Passed |
| **SEC03** | Concurrent writes race against same base version; transactional serialization | ✅ Passed |
| **SEC04** | Malformed/oversized payloads rejected safely; client data recoverable | ✅ Passed |

---

## 📋 Required Judging Demo Script (Section 12)

Click the **"Guided Demo Script"** button in the header at `http://localhost:5173` to walk through or execute the 8-step demo automatically:

1. **Step 1 (Initial State)**: Confirm Server, Laptop, and Phone begin at Version 1.
2. **Step 2 (Online Edit)**: Edit Title on Laptop online -> Syncs -> Version 2 created.
3. **Step 3 (Phone Offline Edit)**: Toggle Phone Offline -> Edit Status to `in_review` -> Shows *"Saved locally — pending sync"*.
4. **Step 4 (Concurrent Server Edit)**: Edit Description on Laptop -> Server creates Version 3.
5. **Step 5 (Reconnect & Auto-Merge)**: Toggle Phone Online -> Submits V1-based change -> Server detects stale base -> Auto-merges non-overlapping fields -> Version 4 created (`auto_merged`)!
6. **Step 6 (Conflicting Edits)**: Edit Content differently on Laptop and Phone -> Phone reconnects -> Overlapping conflict detected & preserved safely without overwriting.
7. **Step 7 (Resolve & Converge)**: Open 3-Way Conflict Resolver -> Select or custom merge -> Server creates Version 5/6 -> Both devices converge.
8. **Step 8 (Security Verification)**: Attacker attempts unauthorized access -> Request rejected with 404.
