# SyncSafe: Multi-Device File Synchronization & Security System
### Hackathon Project Documentation & Technical Whitepaper
**Problem Statement PS-13: Google Drive – Same File, Multiple Devices**

---

**Project Name:** SyncSafe  
**Problem Statement:** PS-13 (Google Drive – Same File, Multiple Devices)  
**Repository:** [https://github.com/rsaisachidhanandam-stack/GenGD](https://github.com/rsaisachidhanandam-stack/GenGD) (Branch: `main`)  
**Status:** Working, Fully Verified Functional Prototype (Not a UI-only Mockup)  
**Implementation Stack:** Express.js, TypeScript, SQLite (`better-sqlite3` in WAL mode), React, Vite, IndexedDB (`idb`), Vitest, Supertest  
**Verification:** 16 / 16 Automated Test Scenarios Passing (100% Pass Rate)  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [The Problem in Simple Terms](#3-the-problem-in-simple-terms)
4. [Why Naive Synchronization Fails](#4-why-naive-synchronization-fails)
5. [Existing Solution Landscape](#5-existing-solution-landscape)
6. [The SyncSafe Solution](#6-the-syncsafe-solution)
7. [Core Design Principle](#7-core-design-principle)
8. [System Architecture](#8-system-architecture)
9. [End-to-End Workflow](#9-end-to-end-workflow)
10. [Database Architecture](#10-database-architecture)
11. [Immutable Versioning System](#11-immutable-versioning-system)
12. [Base-Version Concurrency Control](#12-base-version-concurrency-control)
13. [Field-Level 3-Way Auto-Merge Engine](#13-field-level-3-way-auto-merge-engine)
14. [Conflict Detection & State Preservation](#14-conflict-detection--state-preservation)
15. [Conflict Resolution Workflow](#15-conflict-resolution-workflow)
16. [Durable Offline Synchronization (IndexedDB)](#16-durable-offline-synchronization-indexeddb)
17. [Retry Handling & Idempotency (`changeId`)](#17-retry-handling--idempotency-changeid)
18. [Concurrent Write Handling & ACID Transactions](#18-concurrent-write-handling--acid-transactions)
19. [Security & Access Control](#19-security--access-control)
20. [Client Synchronization State Machine](#20-client-synchronization-state-machine)
21. [Dual-Device Simulator Interface](#21-dual-device-simulator-interface)
22. [Implementation Milestones](#22-implementation-milestones)
23. [Testing & Verification (16 / 16 Passed)](#23-testing--verification-16--16-passed)
24. [Step-by-Step Hackathon Demonstration Script](#24-step-by-step-hackathon-demonstration-script)
25. [Engineering Differentiators](#25-engineering-differentiators)
26. [Current System Limitations](#26-current-system-limitations)
27. [Future Architectural Roadmap](#27-future-architectural-roadmap)
28. [Comprehensive Judge Questions & Answers (18 Q&As)](#28-comprehensive-judge-questions--answers)
29. [The 60-Second Spoken Pitch](#29-the-60-second-spoken-pitch)
30. [End-to-End Architecture & Sync Flow Diagram](#30-end-to-end-architecture--sync-flow-diagram)
31. [Final Conclusion](#31-final-conclusion)

---

## 1. Executive Summary

SyncSafe is a working, fully verified multi-device document synchronization prototype developed to solve **PS-13: Google Drive – Same File, Multiple Devices**. 

When a user edits the same file across multiple devices—such as a laptop on office Wi-Fi and a smartphone in a subway tunnel without network coverage—standard naive synchronization systems frequently overwrite newer data or silently discard offline work.

SyncSafe solves this challenge through an architectural commitment: **"Never silently discard a user's change."** SyncSafe replaces blind overwrites with server-authoritative base-version validation, field-level 3-way automatic merging, durable client-side IndexedDB persistence, idempotent retry processing, and transparent 3-way visual conflict resolution.

SyncSafe is a functioning full-stack application backed by **Express, TypeScript, SQLite WAL mode, React, Vite, and IndexedDB**, accompanied by a test suite of **16 automated scenarios passing with a 100% success rate**.

---

## 2. Problem Statement

**PS-13: Google Drive – Same File, Multiple Devices**

The prompt requires designing and implementing a multi-device synchronization engine where:
> A user edits a document on a laptop while the same file is also open or being accessed on a phone or another device. The system must keep the file consistent across devices without losing any changes.

The problem requires addressing:
* Multi-device synchronization and eventual consistency.
* Append-only immutable version tracking.
* Concurrency control and base-version validation.
* Field-level automatic merging versus conflict detection.
* Durable offline caching and queue persistence across restarts.
* Safe reconnection and idempotent retry handling.
* Complete prevention of silent data loss.

---

## 3. The Problem in Simple Terms

### Simple Explanation
When you edit a document on your phone while offline, your phone doesn't know that your laptop already made changes online, so saving your phone's file later can accidentally wipe out your laptop's work.

### Technical Explanation
When two devices diverge from a common ancestor version ($V_1$), each creates an independent branch of edits. If the server evaluates incoming writes purely by arrival timestamp or raw payload replacement, the device that syncs second will overwrite the intervening updates applied by the first device, resulting in an unrecoverable "lost update" anomaly.

### Concrete Example
1. **Starting Point**: A document starts at **Version 1** (`status = "draft"`, `description = "Initial scope"`). Both Laptop and Phone hold local copies of Version 1.
2. **Laptop Edit (Online)**: The laptop updates `description` to `"Updated Q4 scope"`. The server validates that the laptop started from Version 1, accepts the change, and increments the document to **Version 2**.
3. **Phone Edit (Offline)**: The phone loses network connectivity and edits `status` to `"in_review"`. The phone is still working from its original base of Version 1.
4. **Reconnection Risk**: When the phone reconnects, a naive server simply replaces the document with the phone's payload. The laptop's new description is erased.

---

## 4. Why Naive Synchronization Fails

### Simple Explanation
Blindly keeping the latest upload means whichever device uploads last destroys whatever was uploaded before it.

### Technical Explanation
Naive file synchronization relies on the **Last-Write-Wins (LWW)** pattern:
```text
Device A (Laptop) ─── Uploads Edit (V2) ──────────► Server (Saves V2)
                                                         │
Device B (Phone)  ─── Reconnects; uploads V1 edit ───────┘
                                │
                                ▼
         Server blindly overwrites V2 with B's V1 edit
                                │
                                ▼
            Device A's changes SILENTLY DISAPPEAR
```

### Why Last-Write-Wins Fails:
1. **Clock Skew**: Device system clocks drift; network transit latency makes physical arrival order arbitrary and disconnected from logical user intent.
2. **The "Silent Eraser" Effect**: A phone user fixing a single punctuation mark offline will overwrite thousands of words written on a laptop if their upload arrives second.
3. **No Audit Trail**: Direct record overwrites destroy the previous state, making data recovery impossible.

**SyncSafe does not use blind Last-Write-Wins for document content.**

---

## 5. Existing Solution Landscape

Commercial cloud platforms address multi-device synchronization through various engineering trade-offs. At a high level:

* **Google Drive (Backup & Sync / Stream)**: Synchronizes files and block updates between local filesystems and cloud storage. When conflicting edits occur on general files, it typically generates duplicate conflicted copy files (e.g., `Document (conflicted copy)`), requiring users to manually compare files.
* **Microsoft OneDrive**: Uses differential synchronization to upload modified blocks. It supports automatic merging on structured Office document formats (OOXML), while falling back to conflicted copies on generic files.
* **Dropbox**: Utilizes block-level streaming with rolling checksums. On collision, it creates an append-only snapshot ledger and produces a `[Filename] (Conflicted Copy)` file.
* **Collaborative Document Editors (Google Docs / Figma)**: Focus on continuous real-time co-authoring using Operational Transformation (OT) or Conflict-Free Replicated Data Types (CRDT), transforming individual keystrokes in active memory.

> **SyncSafe's Scope**: SyncSafe does not claim to duplicate the planetary infrastructure or private internal algorithms of Google Drive or Dropbox. SyncSafe is a focused, working prototype demonstrating synchronization correctness, offline durability, versioning, conflict detection, and transparent resolution for structured documents.

---

## 6. The SyncSafe Solution

### Simple Explanation
SyncSafe checks what version you started with, combines edits automatically if they don't touch the same field, and stops to ask you if edits collide—never throwing away work.

### Technical Explanation
SyncSafe enforces a structured ten-stage synchronization lifecycle:

```text
User Edit
   ↓
Local Cache (Memory)
   ↓
Create Change (Generate UUID v4 changeId + Attach baseVersion)
   ↓
Durable Pending Queue (Persisted in IndexedDB before network call)
   ↓
Send Change to Server (HTTP POST with Bearer JWT)
   ↓
JWT Authentication + Ownership Validation
   ↓
Server Base-Version Verification (Inside SQLite Transaction)
   ↓
Is baseVersion Current?
   ├── YES (baseVersion == currentVersion) ──► Direct Accept & Increment
   │
   └── NO  (baseVersion < currentVersion)  ──► 3-Way Field Analysis
               ├── Non-overlapping fields ──► Auto-Merge (auto_merged V)
               └── Overlapping fields     ──► Conflict Preservation
                                                     ↓
                                              User Resolution Modal
                                                     ↓
                                              manual_resolution V
   ↓
Create Immutable Version Record
   ↓
Server Acknowledgement
   ↓
Remove Queue Item from Client IndexedDB
   ↓
Connected Devices Synchronize & Converge
```

---

## 7. Core Design Principle

The primary principle of SyncSafe is:

> ### **"Never silently discard a user's change."**

Every user edit submitted to or stored within SyncSafe must terminate in exactly one of five deterministic states:

| Outcome State | Description |
| :--- | :--- |
| **1. Accepted Normally** | The base version matched the current server version; committed atomically as the next sequential version. |
| **2. Safely Auto-Merged** | The base version was stale, but the modified fields were disjoint from intervening server edits; combined automatically into an `auto_merged` version. |
| **3. Stored in Offline Queue** | The device is disconnected or the network request timed out; edits remain durably preserved in client IndexedDB. |
| **4. Preserved as a Conflict** | Edits modified the same field differently; both branches are immutably stored in the server's `conflicts` table without overwriting the document. |
| **5. Explicitly Resolved** | The user inspected the 3-way diff (*Base*, *Server*, *Incoming*) and submitted a resolution, creating a `manual_resolution` version. |

---

## 8. System Architecture

The SyncSafe architecture consists of a client layer with isolated device storage, a stateless sync engine, and an ACID-compliant transactional persistence layer:

```text
┌────────────────────────────────────────────────────────┐
│                   Dual-Device Web UI                   │
│                                                        │
│   ┌───────────────────────┐   ┌────────────────────┐   │
│   │  Laptop Simulator     │   │  Phone Simulator   │   │
│   │  - IndexedDB Cache    │   │  - IndexedDB Cache │   │
│   │  - Pending Queue      │   │  - Pending Queue   │   │
│   │  - Offline Toggle     │   │  - Offline Toggle  │   │
│   └───────────┬───────────┘   └─────────┬──────────┘   │
└───────────────┼─────────────────────────┼──────────────┘
                │ HTTP / REST + Bearer JWT│ HTTP / REST + Bearer JWT
                ▼                         ▼
┌────────────────────────────────────────────────────────┐
│          Express + TypeScript Sync Engine              │
│                                                        │
│   - JWT Authentication & Server-Verified Identity      │
│   - Document Ownership Validation                      │
│   - Zod Payload Schema & Size Validation (SEC04)       │
│   - Idempotency & Duplicate Change Filter (TC08, TC09) │
│   - Transactional Concurrency Control (SEC03)          │
│   - Base-Version Verification Engine                   │
│   - Field-Level 3-Way Auto-Merge Engine (TC06)         │
│   - Conflict Preservation & Resolution Engine (TC07)   │
└───────────────────────────┬────────────────────────────┘
                            │ SQLite Transaction (WAL Mode)
                            ▼
┌────────────────────────────────────────────────────────┐
│              SQLite WAL / ACID Storage                 │
│                                                        │
│  users     ──< devices                                 │
│  documents ──< versions (Immutable Append-Only Log)    │
│  changes   ──< conflicts (Preserved 3-Way Snapshots)   │
└────────────────────────────────────────────────────────┘
```

---

## 9. End-to-End Workflow

### Step-by-Step Walkthrough

1. **User Edit**: The user changes a document property (Title, Status, Description, or Content) in the client interface.
2. **Local Cache Update**: The edit is updated in the browser's local memory for instant UI responsiveness.
3. **Change Generation**: A permanent UUID v4 `changeId` is generated, and the document's current known `baseVersion` is recorded.
4. **Durable Queue Enqueue**: Before any network call is attempted, the change object is committed to the device's **IndexedDB** `pending_queue`.
5. **Network Transmission**: The `ClientSyncCoordinator` attempts an HTTP POST request to `/api/documents/:id/changes`.
6. **Authentication & Ownership**: The Express server validates the JWT header, extracts the verified `userId`, and confirms document ownership (`SEC01`, `SEC02`).
7. **Concurrency-Locked Version Check**: Inside a SQLite immediate write transaction, the server reads `documents.current_version`.
8. **Branching Evaluation**:
   - If `baseVersion == current_version`: The change is accepted directly.
   - If `baseVersion < current_version`: The server executes 3-way merge logic against the base snapshot.
9. **Immutable Version Creation**: An immutable row is inserted into `versions`, and `documents.current_version` is incremented.
10. **Server Acknowledgement**: The server returns `{ status: 'accepted', version: newVersion }`.
11. **Queue Removal**: Upon receiving acknowledgement, the client deletes the item from IndexedDB.
12. **Device Convergence**: Connected devices fetch the new authoritative version and converge.

---

## 10. Database Architecture

SyncSafe's relational database runs on **SQLite with Write-Ahead Logging (WAL)**.

```
┌──────────────────┐        ┌──────────────────┐
│      users       │◄───────┤     devices      │
└────────┬─────────┘        └──────────────────┘
         │ 1:N
         ▼
┌──────────────────┐        ┌──────────────────┐
│    documents     │◄───────┤     changes      │
└────────┬─────────┘        └────────┬─────────┘
         │ 1:N                       │ 1:1
         ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│     versions     │        │    conflicts     │
└──────────────────┘        └──────────────────┘
```

### 10.1 Table Specifications

#### `users`
* **Purpose**: Stores authenticated user accounts.
* **Fields**: `id` (UUID PK), `email` (UNIQUE), `password_hash` (Bcrypt), `name`, `created_at`.
* **Why Needed**: Enforces identity and document ownership boundaries.

#### `devices`
* **Purpose**: Tracks registered hardware and client platforms.
* **Fields**: `id` (PK, e.g. `device-laptop-001`), `user_id` (FK), `device_name`, `platform`, `last_seen`, `created_at`.
* **Why Needed**: Distinguishes which physical or simulated device authored specific changes.

#### `documents`
* **Purpose**: Maintains the authoritative current-version pointer and live document fields.
* **Fields**: `id` (UUID PK), `owner_id` (FK), `name`, `current_version` (INT), `title`, `status`, `description`, `content`, `created_at`, `updated_at`.
* **Why Needed**: Serves as the single source of truth for the latest accepted state.

#### `versions`
* **Purpose**: Append-only immutable log of every historical document revision.
* **Fields**: `id` (UUID PK), `document_id` (FK), `version_number` (INT), `parent_version` (INT), `title`, `status`, `description`, `content`, `device_id`, `change_id`, `created_by` (FK), `merge_type` (`'direct' | 'auto_merged' | 'manual_resolution'`), `created_at`.
* **Constraint**: `UNIQUE(document_id, version_number)`.
* **Why Needed**: Provides an immutable audit trail and historical snapshots for 3-way merge comparisons.

#### `changes`
* **Purpose**: Idempotency ledger and deduplication filter.
* **Fields**: `change_id` (UUID PK), `document_id` (FK), `device_id`, `base_version` (INT), `payload_json`, `status` (`'accepted' | 'conflict' | 'rejected'`), `result_version` (INT), `processed_at`.
* **Why Needed**: Detects duplicate retries from dropped networks and prevents duplicate versions.

#### `conflicts`
* **Purpose**: Stores conflicting branches that require human review.
* **Fields**: `id` (UUID PK), `document_id` (FK), `incoming_change_id` (FK), `base_version` (INT), `server_version` (INT), `conflicting_fields_json`, `server_state_json`, `incoming_state_json`, `base_state_json`, `status` (`'open' | 'resolved'`), `resolution_version`, `created_at`.
* **Why Needed**: Preserves both sides of a collision without silent data loss.

---

## 11. Immutable Versioning System

### Simple Explanation
SyncSafe never erases old drafts; every save adds a new numbered page to an unchangeable historical ledger.

### Technical Explanation
Every successful edit, auto-merge, or manual conflict resolution inserts an immutable row into the `versions` table. Version numbers are strictly monotonically increasing integers ($1, 2, 3\dots$). Intermediate versions are never overwritten or deleted.

```text
Version 1 (Initial Document, parent = 0)
   ↓
Version 2 (Laptop Title Edit, parent = 1, merge_type = 'direct')
   ↓
Version 3 (Laptop Description Edit, parent = 2, merge_type = 'direct')
   ↓
Version 4 (Phone Status Auto-Merge, parent = 3, merge_type = 'auto_merged')
   ↓
Version 5 (Laptop Content Edit, parent = 4, merge_type = 'direct')
   ↓
Version 6 (Conflict Resolution, parent = 5, merge_type = 'manual_resolution')
```

### Why Restoring a Version Creates a New Version
If a user chooses to restore Version 1:
- The system **does not** delete Versions 2 through 6.
- The system reads Version 1's fields and creates **Version 7** with `parent_version = 6`.
- **Value**: Guaranteed auditability, non-destructive rollbacks, and complete user trust.

---

## 12. Base-Version Concurrency Control

### Simple Explanation
Before saving your work, the server checks if you started from the latest version; if someone else saved first, the server stops to check what changed instead of overwriting.

### Technical Explanation
Every write request submitted by a client includes its known `baseVersion`:
```typescript
interface SubmitChangeRequest {
  changeId: string;
  deviceId: string;
  baseVersion: number;
  payload: Partial<DocumentStructuredFields>;
}
```

The server compares `req.baseVersion` against `document.current_version`:
1. **Current Base (`baseVersion == current_version`)**: Direct accept. Document increments to `current_version + 1`.
2. **Stale Base (`baseVersion < current_version`)**: The client was editing an outdated revision. The server branches to the 3-Way Merge Engine.
3. **Invalid Future Base (`baseVersion > current_version`)**: Rejected immediately with HTTP 400.

> **Key Rule**: A stale update is never treated as permission to overwrite newer server state.

---

## 13. Field-Level 3-Way Auto-Merge Engine

### Simple Explanation
If two people edit different parts of the same file (like one changing the title and another changing the status), the system automatically combines both edits safely.

### Technical Explanation
When an incoming update has a stale base version, the server retrieves the ancestor snapshot ($V_{\text{base}}$) and evaluates three distinct states:
1. **Base State ($S_{\text{base}}$)**: The document snapshot at `baseVersion`.
2. **Server State ($S_{\text{server}}$)**: The document's current live state at `current_version`.
3. **Incoming State ($S_{\text{incoming}}$)**: The client's proposed state formed by applying `req.payload` onto $S_{\text{base}}$.

The engine analyzes the supported structured fields (`title`, `status`, `description`, `content`):
$$\Delta_{\text{client}} = \{ f \in \text{Fields} \mid S_{\text{incoming}}[f] \neq S_{\text{base}}[f] \}$$
$$\Delta_{\text{server}} = \{ f \in \text{Fields} \mid S_{\text{server}}[f] \neq S_{\text{base}}[f] \}$$
$$\text{Collisions} = \{ f \in (\Delta_{\text{client}} \cap \Delta_{\text{server}}) \mid S_{\text{incoming}}[f] \neq S_{\text{server}}[f] \}$$

### Concrete Example of Auto-Merge (`TC06`)
```text
BASE (V1):
  Status:      "draft"
  Description: "Initial requirements"

SERVER (V2) [Laptop updated Description]:
  Status:      "draft"
  Description: "Updated Q4 scope"         <-- Server Delta: ['description']

INCOMING (V1 Base) [Phone updated Status]:
  Status:      "in_review"                 <-- Client Delta: ['status']
  Description: "Initial requirements"
```
* **Evaluation**: $\Delta_{\text{client}} \cap \Delta_{\text{server}} = \emptyset$.
* **Action**: Safe disjoint union. The server overlays the incoming `status` onto the server's state.
* **Result**: `status = "in_review"`, `description = "Updated Q4 scope"`.
* **Output**: **Version 3** is created with `merge_type = 'auto_merged'`.

---

## 14. Conflict Detection & State Preservation

### Simple Explanation
When two devices change the exact same sentence or field in different ways, the system refuses to guess which one is right and saves both versions for the user to review.

### Technical Explanation
When $\text{Collisions} \neq \emptyset$, an unresolvable semantic conflict exists.

### Concrete Example of Collision (`TC07`)
```text
BASE (V1):
  Content: "Launch on Monday"

SERVER (V2) [Laptop online edit]:
  Content: "Launch postponed to Friday"

INCOMING (V1 Base) [Phone offline edit]:
  Content: "Emergency launch on Wednesday"
```
* **Collision**: Both devices modified `content` differently.
* **Server Action**:
  1. The server **refuses** to overwrite the document.
  2. The incoming change is recorded in `changes` with `status = 'conflict'`.
  3. A new row is inserted into `conflicts` preserving full JSON snapshots of `base_state`, `server_state`, and `incoming_state`.
  4. Returns HTTP 200 `{ status: 'conflict', conflictId, conflictingFields: ['content'] }`.

---

## 15. Conflict Resolution Workflow

### Simple Explanation
The user is shown a clear 3-way comparison screen and chooses whether to keep the server's version, keep their device's version, or combine both in a text box.

### Technical Explanation
When a conflict is detected, the UI displays the **Conflict Resolver Modal**:

```text
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     BASE VERSION 1      │    SERVER VERSION 2     │    MY OFFLINE CHANGE    │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Title: Project Roadmap  │ Title: Project Roadmap  │ Title: Project Roadmap  │
│ Status: [draft]         │ Status: [draft]         │ Status: [draft]         │
│ Content:                │ Content:                │ Content:                │
│ "Launch on Monday"      │ "Postponed to Friday"   │ "Emergency on Wednesday"│
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

The user selects one of three resolution options:
1. **Keep Server**: Adopts server state.
2. **Keep Mine**: Adopts incoming device state.
3. **Custom Merge**: An interactive editor allowing the user to combine both edits (e.g. `"Launch Wednesday for Beta, Friday for General Availability"`).

Submitting calls `POST /api/documents/:id/resolve`:
- The server updates the conflict record to `status = 'resolved'`.
- A new version is created with `merge_type = 'manual_resolution'`.
- All devices receive the authoritative resolved version and converge (`TC12`).

---

## 16. Durable Offline Synchronization (IndexedDB)

### Simple Explanation
If your internet cuts out while typing, your edits are saved to your browser's internal database so they won't disappear even if you refresh or close the tab.

### Technical Explanation
SyncSafe implements browser-side persistence using **IndexedDB** (`idb`). Each simulated device maintains a separate, isolated database instance:
* `syncsafe_db_device-laptop-001`
* `syncsafe_db_device-mobile-002`

### Stored Object Stores:
1. `cached_documents`: Holds the local document copy, known server version, and local modification flags.
2. `pending_queue`: An append-only queue of changes waiting for server transmission.

```typescript
interface PendingQueueItem {
  changeId: string;
  documentId: string;
  deviceId: string;
  baseVersion: number;
  payload: Partial<DocumentStructuredFields>;
  timestamp: string;
  status: 'pending' | 'in_flight' | 'acknowledged' | 'conflict';
  retryCount: number;
  lastError: string | null;
}
```

**Restart Survival (`TC03`, `TC10`)**: When the browser is refreshed or reopened, the `ClientSyncCoordinator` reloads the pending queue from IndexedDB and resumes synchronization automatically upon network availability.

---

## 17. Retry Handling & Idempotency (`changeId`)

### Simple Explanation
If the internet drops just as the server saves your work, retrying the save won't create an accidental duplicate version.

### Technical Explanation
In distributed networks, timeouts are ambiguous: the client does not know whether a failure occurred before the server processed the request or while the server's response was returning.

```text
Client ────────────── POST changeId: "uuid-123" ─────────────► Server
                                                                  │
                                                      Server commits change!
                                                      Increments to Version 2.
                                                                  │
Client ◄────────────── [NETWORK TIMEOUT / DROP] ──────────────────X
(Client receives no response; does not know if server processed update)
```

### SyncSafe's Idempotency Solution (`TC08`, `TC09`):
1. A permanent UUID v4 `changeId` is assigned to each edit once and reused across all retries.
2. The server queries the `changes` table for `change_id`.
3. If the `changeId` already exists with `status = 'accepted'`, the server **does not** increment the version or apply the change again.
4. The server returns `{ status: 'already_processed', version: existing.result_version }`.
5. The client removes the change from its queue without duplicate version creation.

---

## 18. Concurrent Write Handling & ACID Transactions

### Simple Explanation
The database makes concurrent edits line up in a safe queue, preventing two devices from corrupting the document at the exact same millisecond.

### Technical Explanation
When two devices submit changes against the same base version simultaneously, SyncSafe uses **SQLite Write-Ahead Logging (WAL)** mode with immediate transaction locks (`db.transaction(...)`):

```text
Laptop (Base V5) ────────┐ (Arrive at same millisecond)
                         ├──► [ SQLite Immediate Write Lock ]
Phone  (Base V5) ────────┘                 │
                                           ▼
                     1. Laptop acquires transaction lock first.
                        └── Reads current_version = 5.
                        └── Validates baseVersion == 5.
                        └── Commits Version 6.
                                           │
                                           ▼
                     2. Phone acquires transaction lock second.
                        └── Reads current_version = 6.
                        └── Detects baseVersion 5 < 6 (Stale Base).
                        └── Evaluates 3-way merge / conflict.
                        └── Zero lost updates (SEC03).
```

---

## 19. Security & Access Control

### 19.1 JWT Authentication
All document endpoints require an `Authorization: Bearer <token>` header. The server verifies the token signature and extracts the authenticated user ID (`req.user.id`).

### 19.2 Server-Enforced Identity (`SEC02`)
The server strictly derives user identity from the cryptographically verified JWT. If a client attempts to inject a spoofed `userId` inside the request body, the server ignores the body parameter and uses `req.user.id`.

### 19.3 Ownership Validation & Zero-Leakage 404s (`SEC01`)
Every database query checks `WHERE id = ? AND owner_id = ?`. If User B attempts to access User A's document, the server responds with:
```json
{ "error": "Document not found or access denied" }
```
HTTP 404 is returned instead of 403 to prevent confirming document existence to unauthorized callers.

### 19.4 Input Validation & Payload Protection (`SEC04`)
All payloads are parsed and validated through **Zod** schemas. Requests exceeding size limits (500KB limit enforced via Express body parser) or containing invalid enum values are rejected with HTTP 400 or HTTP 413.

---

## 20. Client Synchronization State Machine

To enforce the principle of truthfulness in the UI, SyncSafe defines six clear visual synchronization states:

| State Badge | Color | Technical Meaning |
| :--- | :--- | :--- |
| **Synced (V_)** | 🟢 Green | Server confirmed durable acceptance; client cache matches authoritative state. |
| **Saved locally — pending sync (N)** | 🟡 Amber | Edit is persisted in client IndexedDB; waiting for network or server ACK. |
| **Syncing with server...** | 🔵 Blue | HTTP change payload is currently in-flight across the wire. |
| **Conflict Detected** | 🔴 Red | Stale base collision detected; requires explicit user review. |
| **Offline (N queued)** | ⚪ Gray | Device network is offline; edits are stored safely in local queue. |
| **Retry required (N)** | 🟠 Orange | Network failed or timed out; exponential retry backoff is active. |

> **Rule**: The UI never displays "Synced" until the server has confirmed durable storage.

---

## 21. Dual-Device Simulator Interface

To demonstrate multi-device synchronization within a single evaluation environment, SyncSafe includes an interactive **Dual-Device Simulator**:

* **Laptop Persona**: MacBook Pro 16" (Device ID: `device-laptop-001`)
* **Mobile Persona**: Google Pixel 8 Pro (Device ID: `device-mobile-002`)

### Simulator Features:
1. **Isolated Storage**: Each simulator reads and writes to its own distinct IndexedDB database (`syncsafe_db_device-laptop-001` vs. `syncsafe_db_device-mobile-002`).
2. **Network Controls**: Independent **ONLINE / OFFLINE** toggles for each device.
3. **Chaos Engineering Controls**: Configurable artificial network latency sliders (0–2000ms) and simulated network timeout/failure checkboxes (`TC08`).
4. **Queue Inspector**: Dedicated modal displaying pending queue records, retry counters, and payload previews.
5. **Version History Inspector**: Chronological timeline displaying snapshot diffs, authors, and merge types.

---

## 22. Implementation Milestones

All planned engineering milestones are 100% completed:

| Milestone | Deliverables | Verification | Status |
| :--- | :--- | :--- | :--- |
| **Milestone 0: Audit & Architecture** | Scanned workspace, defined stack, designed database schemas, and defined 3-way merge rules. | Blueprint sign-off | ✅ Done |
| **Milestone 1: Data Model & Secure API** | Express + TypeScript API, SQLite schema, JWT authentication, and ownership checks (`SEC01`, `SEC02`). | Unit tests | ✅ Done |
| **Milestone 2: Backend Sync Core** | Transactional concurrency (`SEC03`), base-version validation, 3-way auto-merge (`TC06`), conflict preservation (`TC07`), and idempotency (`TC08`, `TC09`). | Integration tests | ✅ Done |
| **Milestone 3: Durable Client Queue** | Browser IndexedDB wrappers (`idb`), isolated per-device databases, persistent queues surviving app restart (`TC03`, `TC10`). | Reload validation | ✅ Done |
| **Milestone 4: Multi-Device UI** | Dual-device simulator (Laptop vs Mobile), network toggles, 3-way conflict resolver modal, version history inspector. | UI testing | ✅ Done |
| **Milestone 5: Acceptance Test Suite** | Automated test suite verifying all 16 acceptance and security scenarios. | `npm test` | ✅ Done |
| **Milestone 6: Demo Hardening & Delivery** | Guided Demo Stepper, complete documentation, root build scripts, and GitHub repository push. | Git push | ✅ Done |

---

## 23. Testing & Verification (16 / 16 Passed)

SyncSafe’s automated test suite is located in `server/tests/syncsafe.test.ts` and executed using **Vitest** and **Supertest**.

> ### **Verification Result: 16 / 16 Scenarios Passing (100% Pass Rate)**

```
 ✓ server/tests/syncsafe.test.ts (16 scenarios)
   Test Files: 1 passed (1)
   Tests:      16 passed (16)
   Duration:   1.76s
```

### Complete Test Results Matrix

| Test ID | Test Name | Scenario Verified | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Online Edit | Device edits online with baseVersion == 1 | Change accepted; Version 2 created | **PASS** |
| **TC02** | Second Device Sync | Second device fetches document after V2 created | Receives latest authoritative Version 2 | **PASS** |
| **TC03** | Offline Persistence | Device edits while offline | Edit saved to local IndexedDB queue | **PASS** |
| **TC04** | Offline Reconnect | Device reconnects when server unchanged | Queued change accepted cleanly as V2 | **PASS** |
| **TC05** | Stale Base Detection | Device reconnects after server already advanced | Stale base triggers 3-way delta analysis | **PASS** |
| **TC06** | 3-Way Auto-Merge | Non-overlapping fields edited (Status vs Description) | Clean auto-merge creates `auto_merged` V3 | **PASS** |
| **TC07** | Same-Field Conflict | Overlapping edits to Content field | Both branches preserved in `conflicts` table | **PASS** |
| **TC08** | Network Failure | Network fails during upload submission | Item remains in queue; retry does not lose work | **PASS** |
| **TC09** | Idempotency | Same `changeId` submitted twice | Prior outcome returned; no duplicate version | **PASS** |
| **TC10** | App Restart Survival | App reloads while changes are pending offline | Queue survives restart intact from IndexedDB | **PASS** |
| **TC11** | Old Ancestor Base | Edit based on V1 submitted when server is at V4 | Intervening changes evaluated; no overwrite | **PASS** |
| **TC12** | Explicit Resolution | User resolves conflict via modal | Creates `manual_resolution` V; devices converge | **PASS** |
| **SEC01** | Cross-User Access | User B attempts to read/write User A document | Request rejected with 404; zero metadata leak | **PASS** |
| **SEC02** | User ID Spoofing | Client sends forged `userId` in JSON body | Server relies strictly on verified JWT identity | **PASS** |
| **SEC03** | Concurrent Race | Two writes race simultaneously against same base | Transactions serialize safely; no lost updates | **PASS** |
| **SEC04** | Payload Protection | Malformed JSON or oversized payload (>500KB) | Server safely rejects with HTTP 400 / 413 | **PASS** |

---

## 24. Step-by-Step Hackathon Demonstration Script

This 2–3 minute demonstration can be performed manually or triggered step-by-step using the **Guided Demo Script** button in the UI:

* **Step 1**: Open `http://localhost:5173`. Point out the Dual View displaying the **MacBook Pro** and **Pixel 8 Pro** side-by-side.
* **Step 2**: Click **Reset Demo (V1)**. Point out that both devices and the server start at **Version 1**.
* **Step 3**: On the **Laptop**, edit Document Title to `"SyncSafe Architectural Blueprint (V2)"`.
* **Step 4**: Click **Save & Sync** on the Laptop. Point out the badge updating to **Synced (V2)**.
* **Step 5**: Observe the **Phone** updating to Version 2.
* **Step 6**: On the **Phone**, click the **ONLINE** button to switch it to **OFFLINE**.
* **Step 7**: On the **Phone**, change the Status dropdown from `draft` to `in_review`.
* **Step 8**: Click **Save Locally (Queue)** on the Phone. Point out the truthful UI status badge: **Saved locally — pending sync (1)**.
* **Step 9**: On the **Laptop** (still online), edit the Description to: `"Updated Q4 scope notes from laptop team"`.
* **Step 10**: Click **Save & Sync** on the Laptop. The server advances to **Version 3**.
* **Step 11**: On the **Phone**, toggle the network switch back to **ONLINE**.
* **Step 12**: The `ClientSyncCoordinator` transmits the queued phone edit.
* **Step 13**: Explain the **3-Way Auto-Merge**: Because the Phone modified `status` and the Laptop modified `description`, the server merges them into **Version 4 (`auto_merged`)** without asking the user.
* **Step 14**: On the **Laptop**, edit Content to: `"# Architecture Spec\n[Laptop Online Revision]"`. Save to create **Version 5**.
* **Step 15**: On the **Phone**, toggle **OFFLINE** and edit Content to: `"# Architecture Spec\n[Phone Offline Revision]"`. Save locally.
* **Step 16**: On the **Phone**, toggle **ONLINE**.
* **Step 17**: Explain **Conflict Detection**: The server detects that both devices modified `content` differently. It preserves the conflict and displays the red **Conflict Detected** badge.
* **Step 18**: Click **Review Conflict** to open the Conflict Resolver.
* **Step 19**: Show the judges the three columns: **Base (V1)**, **Server (V5)**, and **Incoming (Phone)**.
* **Step 20**: Select **Custom Merge** and edit the combined text in the interactive editor.
* **Step 21**: Click **Commit Resolution**. The server creates **Version 6 (`manual_resolution`)**.
* **Step 22**: Point out that both devices converge to Version 6.
* **Step 23**: Click **History** on either device to display the immutable timeline of Versions 1 through 6.
* **Step 24**: Click **Queue** to show the judges that the queue is empty because the server acknowledged acceptance.
* **Step 25**: Run `npm test` in the terminal to show that all 16 automated tests pass.

---

## 25. Engineering Differentiators

SyncSafe’s engineering advantages are defined by concrete architectural mechanisms:

1. **No Silent Overwrites**: Updates require base-version validation; stale edits cannot overwrite newer server states.
2. **Deterministic 3-Way Auto-Merge**: Non-overlapping structured fields merge automatically, minimizing unnecessary user interruptions.
3. **Conflict Preservation**: Conflicting branches are immutably preserved in relational storage rather than creating disconnected duplicate files on disk.
4. **Explicit Conflict Resolution**: The user retains authority via an interactive 3-way visual merge tool.
5. **Durable Client Queue**: IndexedDB persistence prevents offline data loss across browser reloads or device crashes.
6. **Idempotent Retries**: Stable `changeId` tracking guarantees that retrying timed-out requests never creates duplicate versions.
7. **Transactional Concurrency**: SQLite WAL mode with immediate write transactions serializes simultaneous writes safely (`SEC03`).
8. **Truthful Synchronization UI**: The interface never displays "Synced" until the server has confirmed durable storage.
9. **Immutable History**: Restoring an old version creates a new version rather than modifying history.
10. **Ownership & Authentication**: Server-enforced JWT identity prevents user spoofing and protects document isolation.

---

## 26. Current System Limitations

To maintain engineering credibility, SyncSafe acknowledges its prototype boundaries:

1. **Structured Document Model**: SyncSafe is designed for structured text and Markdown fields (`title`, `status`, `description`, `content`). It does not implement semantic merging for compiled binary files (e.g. `.exe`, `.zip`, `.psd`).
2. **Dual-Device Simulator**: The two devices run as isolated simulator profiles within a single browser runtime. While their IndexedDB storage and network controls are completely isolated, they share the host browser engine.
3. **Database Scale**: SQLite with WAL mode is appropriate for prototypes and edge deployments, but a large-scale commercial cloud service would require a distributed database.
4. **Real-Time Keystroke Collaboration**: Continuous character-by-character live co-authoring (CRDT/OT) is outside the scope of this file synchronization prototype.

---

## 27. Future Architectural Roadmap

The following capabilities are **not currently implemented** and represent future development phases:

* **WebSocket Event Streaming**: Replacing advisory polling with bi-directional WebSocket events for push notifications.
* **CRDT / OT Integration**: Supporting character-by-character real-time co-authoring for rich-text fields.
* **Binary Chunk Synchronization**: Implementing content-defined chunking (FastCDC) and rolling hashes for large media files.
* **Cloud Object Storage**: Offloading document blobs to S3/GCS while maintaining relational metadata in the database.
* **Distributed Database Migration**: Migrating from single-node SQLite to distributed SQL engines (e.g., CockroachDB or Spanner).
* **End-to-End Encryption (E2EE)**: Client-side cryptographic key derivation ensuring the server cannot read document contents.
* **Native Mobile Apps**: Packaging the engine for native iOS/Android using Flutter or React Native with native SQLite bindings.

---

## 28. Comprehensive Judge Questions & Answers

### Q1: Why not simply use Last-Write-Wins (LWW)?
**Answer:** Last-Write-Wins is inherently unsafe for document content. If a laptop user spends hours writing a document and an offline mobile user makes a small edit based on an older version, an LWW system will overwrite the laptop’s newer work when the mobile device reconnects. SyncSafe eliminates silent overwrites by validating base versions.

### Q2: How does SyncSafe detect conflicts?
**Answer:** Every update sends its `baseVersion`. If `baseVersion < current_version`, the server retrieves the common ancestor snapshot and calculates which fields were modified by the server versus the client. If both modified the same field differently, a conflict is detected.

### Q3: How does offline synchronization work?
**Answer:** Edits made while offline are saved immediately to a persistent queue in **IndexedDB**. The UI displays `"Saved locally — pending sync"`. Changes survive tab reloads and system restarts. When connectivity returns, the `ClientSyncCoordinator` drains the queue and sends updates in order.

### Q4: What happens when the network comes back?
**Answer:** The client coordinator detects connectivity and submits queued changes with their original `baseVersion` and `changeId`. The server checks the base version, performs an auto-merge or conflict preservation, and the client removes the queue item only after receiving server acknowledgement.

### Q5: What if the server processed the request but the network response was lost?
**Answer:** The client times out and retries using the exact same `changeId`. The server checks its `changes` table, recognizes the duplicate `changeId`, and returns the previously committed outcome without creating a duplicate version.

### Q6: Why is `changeId` necessary?
**Answer:** Because network timeouts are ambiguous. A client cannot distinguish between a dropped request and a dropped response. A stable `changeId` provides idempotent retry behavior across unreliable connections.

### Q7: What is a 3-way merge?
**Answer:** A 3-way merge compares three versions: the common **Base** ancestor, the current **Server** state, and the **Incoming** client change. By comparing both changes against the base, the server identifies independent field edits and merges non-overlapping changes automatically.

### Q8: What happens when both devices modify the same field?
**Answer:** The server detects an overlapping collision. It refuses to guess human intent, preserves the Server state, Incoming state, and Base state in the `conflicts` table, and requires the user to select or custom-merge the result.

### Q9: How do you secure the API?
**Answer:** All endpoints verify a cryptographically signed JWT. Identity is derived server-side. Document queries verify `WHERE id = ? AND owner_id = ?`. Unauthorized access attempts receive a strict 404 with zero metadata leakage.

### Q10: Why SQLite?
**Answer:** SQLite with Write-Ahead Logging (WAL) provides true ACID transactions, fast zero-configuration setup, atomic serial write locks, and high embedded performance without external database dependencies.

### Q11: Why IndexedDB?
**Answer:** Unlike `localStorage` (which is synchronous, limited to 5MB, and prone to UI blocking), IndexedDB provides asynchronous, structured, durable storage that reliably persists queues across browser restarts.

### Q12: How do you handle concurrent writes?
**Answer:** All change submissions execute inside an atomic SQLite write transaction. Concurrent requests are serialized immediately. The first commit succeeds directly; the second sees an updated version and triggers 3-way merge analysis.

### Q13: How do you prove the system works?
**Answer:** We implemented an automated test suite with Vitest and Supertest covering all 16 acceptance and security scenarios (`TC01`–`TC12` and `SEC01`–`SEC04`). All 16 tests pass with a 100% success rate.

### Q14: What happens if push notifications or WebSockets fail?
**Answer:** Notifications are strictly advisory. The database and REST API remain the single source of truth. Clients always fetch authoritative state directly from the server.

### Q15: How would you scale this to production?
**Answer:** In production, we would migrate to a distributed SQL database (such as CockroachDB or Spanner), partition documents by user/workspace, store file content blobs in S3 with Redis caching, and distribute sync tasks via queue workers.

### Q16: Why didn't you use CRDTs?
**Answer:** CRDTs are designed for character-by-character real-time co-authoring (like Google Docs), but introduce substantial memory overhead, tombstones, and complex mathematical constraints. For document-level and field-level multi-device synchronization, structured 3-way merges and explicit conflict preservation are cleaner, faster, and more auditable.

### Q17: How is this different from a mock UI?
**Answer:** SyncSafe has an operational backend with real database tables, transactional locking, cryptographic JWT authentication, genuine IndexedDB persistence, a field-level 3-way merge engine, and 16 passing automated tests.

### Q18: What would you implement next?
**Answer:** We would implement WebSocket event streaming, integrate S3-compatible chunk storage for large files, and wrap the client in React Native for physical Android and iOS devices.

---

## 29. The 60-Second Spoken Pitch

> *"Judges, when you edit a document on your laptop and simultaneously update it on your phone while offline, what happens? In naive systems, your offline phone edit silently overwrites your laptop work, or you end up with messy 'conflicted copy' files scattered across your drive.*
>
> *We built **SyncSafe** to solve **PS-13: Google Drive – Same File, Multiple Devices** with one uncompromising principle: **Never silently discard a user’s change.***
>
> *SyncSafe is not a mock-up. It is a fully operational synchronization engine built with Express, TypeScript, and SQLite WAL mode. When a device edits offline, changes are persisted to a durable **IndexedDB** queue that survives app restarts. When connectivity returns, SyncSafe checks base versions, automatically merges non-overlapping fields without data loss, and if edits collide on the same field, preserves both branches in a 3-way visual conflict resolver.*
>
> *With idempotent retries, transactional concurrency locking, and a 100% passing test suite across all 16 acceptance and security scenarios, SyncSafe proves that multi-device synchronization can be transparent, secure, and completely reliable. Thank you!"*

---

## 30. End-to-End Architecture & Sync Flow Diagram

```text
┌────────────────────────────────────────────────────────┐
│                   Dual-Device Web UI                   │
│                                                        │
│   ┌───────────────────────┐   ┌────────────────────┐   │
│   │  Laptop Simulator     │   │  Phone Simulator   │   │
│   │  - IndexedDB Cache    │   │  - IndexedDB Cache │   │
│   │  - Pending Queue      │   │  - Pending Queue   │   │
│   │  - Offline Toggle     │   │  - Offline Toggle  │   │
│   └───────────┬───────────┘   └─────────┬──────────┘   │
└───────────────┼─────────────────────────┼──────────────┘
                │ HTTP / REST + Bearer JWT│ HTTP / REST + Bearer JWT
                ▼                         ▼
┌────────────────────────────────────────────────────────┐
│          Express + TypeScript Sync Engine              │
│                                                        │
│   - JWT Authentication & Server-Verified Identity      │
│   - Document Ownership Validation                      │
│   - Zod Payload Schema & Size Validation (SEC04)       │
│   - Idempotency & Duplicate Change Filter (TC08, TC09) │
│   - Transactional Concurrency Control (SEC03)          │
│   - Base-Version Verification Engine                   │
│   - Field-Level 3-Way Auto-Merge Engine (TC06)         │
│   - Conflict Preservation & Resolution Engine (TC07)   │
└───────────────────────────┬────────────────────────────┘
                            │ SQLite Transaction (WAL Mode)
                            ▼
┌────────────────────────────────────────────────────────┐
│              SQLite WAL / ACID Storage                 │
│                                                        │
│  users     ──< devices                                 │
│  documents ──< versions (Immutable Append-Only Log)    │
│  changes   ──< conflicts (Preserved 3-Way Snapshots)   │
└────────────────────────────────────────────────────────┘

Logical Synchronization Lifecycle:
EDIT ──► CACHE ──► QUEUE ──► BASE VERSION CHECK ──► ACCEPT / MERGE / CONFLICT ──► NEW IMMUTABLE VERSION ──► ACKNOWLEDGEMENT ──► CONVERGENCE
```

---

## 31. Final Conclusion

SyncSafe provides a robust, verifiable solution to **PS-13: Google Drive – Same File, Multiple Devices**. By combining base-version concurrency control, field-level 3-way auto-merging, durable client-side IndexedDB persistence, idempotent retries, and transparent 3-way visual conflict resolution, SyncSafe eliminates silent data loss and proves that multi-device file synchronization can be both robust and truthful.

---
*Documentation verified against SyncSafe v1.0.0 (Commit `a2d2ccd` on `main`).*
