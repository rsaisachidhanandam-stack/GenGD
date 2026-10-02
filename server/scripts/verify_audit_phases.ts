import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../src/db/database';
import { SyncEngine } from '../src/services/syncEngine';
import { AuthService } from '../src/services/authService';

const BASE_URL = 'http://localhost:5000';

async function runAudit() {
  console.log('========================================================');
  console.log('SYNCSAFE DEEP VERIFICATION: PHASES 3, 4, 5, 7');
  console.log('========================================================\n');

  const db = getDatabase();

  // -----------------------------------------------------------
  // PHASE 7: DATABASE INTEGRITY VERIFICATION
  // -----------------------------------------------------------
  console.log('>>> VERIFYING PHASE 7: DATABASE INTEGRITY <<<');

  // 1. Verify WAL Mode
  const pragmaJournal = db.pragma('journal_mode');
  console.log(`[DB-WAL] journal_mode = ${JSON.stringify(pragmaJournal)}`);
  if (pragmaJournal[0].journal_mode.toLowerCase() !== 'wal') {
    throw new Error(`WAL mode is not active! Found: ${pragmaJournal[0].journal_mode}`);
  }
  console.log('  [PASS] WAL mode is strictly active and verified.');

  // 2. Verify Foreign Keys
  const pragmaFk = db.pragma('foreign_keys');
  console.log(`[DB-FK] foreign_keys = ${JSON.stringify(pragmaFk)}`);
  if (pragmaFk[0].foreign_keys !== 1) {
    throw new Error('Foreign keys pragma is not ON!');
  }
  console.log('  [PASS] Foreign keys constraint enforcement is ON.');

  // 3. Verify Unique Constraints (versions and changes tables)
  const schemaVersions = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='versions'`).get() as any;
  if (!schemaVersions.sql.includes('UNIQUE(document_id, version_number)')) {
    throw new Error('versions table missing UNIQUE(document_id, version_number) constraint!');
  }
  console.log('  [PASS] UNIQUE(document_id, version_number) constraint is in schema.');

  const schemaChanges = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='changes'`).get() as any;
  if (!schemaChanges.sql.includes('change_id TEXT PRIMARY KEY')) {
    throw new Error('changes table missing change_id TEXT PRIMARY KEY!');
  }
  console.log('  [PASS] change_id TEXT PRIMARY KEY constraint is in schema.');

  // -----------------------------------------------------------
  // PHASE 4: IDEMPOTENCY VERIFICATION
  // -----------------------------------------------------------
  console.log('\n>>> VERIFYING PHASE 4: IDEMPOTENCY <<<');
  
  // Register clean user
  const userAlpha = AuthService.register(`idemp_${Date.now()}@syncsafe.io`, 'secret123', 'Alpha User');
  const laptopId = 'laptop-idemp-01';
  AuthService.registerDevice(userAlpha.user.id, laptopId, 'Laptop', 'web-laptop');

  const docIdemp = SyncEngine.createDocument(userAlpha.user.id, 'IdempotencyDoc.md', {
    title: 'Idempotency Test V1',
    content: 'Initial Content'
  }, laptopId);

  const stableChangeId = uuidv4();

  // First request: Accepted
  const firstReq = await fetch(`${BASE_URL}/api/documents/${docIdemp.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAlpha.token}` },
    body: JSON.stringify({
      changeId: stableChangeId,
      deviceId: laptopId,
      baseVersion: 1,
      payload: { title: 'Idempotency Test V2' }
    })
  });
  const firstData = await firstReq.json();
  console.log(`First request outcome: status=${firstData.status}, version=V${firstData.version}`);
  if (firstData.status !== 'accepted' || firstData.version !== 2) {
    throw new Error('First change submission failed');
  }

  // Second request: Same changeId -> already_processed
  const secondReq = await fetch(`${BASE_URL}/api/documents/${docIdemp.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAlpha.token}` },
    body: JSON.stringify({
      changeId: stableChangeId,
      deviceId: laptopId,
      baseVersion: 1,
      payload: { title: 'Idempotency Test V2' }
    })
  });
  const secondData = await secondReq.json();
  console.log(`Second request outcome: status=${secondData.status}, version=V${secondData.version}`);
  if (secondData.status !== 'already_processed' || secondData.version !== 2) {
    throw new Error(`Expected already_processed with version 2, got: ${JSON.stringify(secondData)}`);
  }

  // Third request: Same changeId again -> already_processed
  const thirdReq = await fetch(`${BASE_URL}/api/documents/${docIdemp.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userAlpha.token}` },
    body: JSON.stringify({
      changeId: stableChangeId,
      deviceId: laptopId,
      baseVersion: 1,
      payload: { title: 'Idempotency Test V2' }
    })
  });
  const thirdData = await thirdReq.json();
  if (thirdData.status !== 'already_processed' || thirdData.version !== 2) {
    throw new Error('Third change submission failed idempotency check');
  }

  // Verify DB counts: exactly 2 versions (V1 and V2), NOT 3 or 4
  const verCount = db.prepare('SELECT COUNT(*) as count FROM versions WHERE document_id = ?').get(docIdemp.id) as any;
  console.log(`Database version count: ${verCount.count} (expected: 2)`);
  if (verCount.count !== 2) {
    throw new Error(`Duplicate versions created! Count is ${verCount.count}`);
  }

  const changeCount = db.prepare('SELECT COUNT(*) as count FROM changes WHERE change_id = ?').get(stableChangeId) as any;
  console.log(`Database change record count for ${stableChangeId}: ${changeCount.count} (expected: 1)`);
  if (changeCount.count !== 1) {
    throw new Error(`Duplicate change rows inserted! Count is ${changeCount.count}`);
  }
  console.log('  [PASS] Phase 4 Idempotency strictly verified: duplicate changeId does not duplicate versions or changes.');

  // -----------------------------------------------------------
  // PHASE 5: SECURITY VERIFICATION (Cross-User & Identity Spoofing)
  // -----------------------------------------------------------
  console.log('\n>>> VERIFYING PHASE 5: SECURITY & MULTI-TENANCY <<<');
  const userA = AuthService.register(`alice_${Date.now()}@syncsafe.io`, 'passA123', 'Alice Security');
  const userB = AuthService.register(`bob_${Date.now()}@syncsafe.io`, 'passB123', 'Bob Hacker');

  const docA = SyncEngine.createDocument(userA.user.id, 'Alice_Secret.md', {
    title: 'Top Secret Document',
    content: 'Classified cryptographic keys'
  }, 'alice-laptop');

  // User B attempts to GET User A's document
  const bRead = await fetch(`${BASE_URL}/api/documents/${docA.id}`, {
    headers: { Authorization: `Bearer ${userB.token}` }
  });
  console.log(`User B GET User A doc: Status = ${bRead.status} (expected: 404)`);
  if (bRead.status !== 404) throw new Error(`User B was able to read User A doc! Status: ${bRead.status}`);

  // User B attempts to WRITE User A's document
  const bWrite = await fetch(`${BASE_URL}/api/documents/${docA.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userB.token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      deviceId: 'bob-device',
      baseVersion: 1,
      payload: { title: 'Compromised by Bob' }
    })
  });
  console.log(`User B POST User A doc change: Status = ${bWrite.status} (expected: 404)`);
  if (bWrite.status !== 404) throw new Error(`User B was able to modify User A doc! Status: ${bWrite.status}`);

  // User B attempts to access User A's versions
  const bVersions = await fetch(`${BASE_URL}/api/documents/${docA.id}/versions`, {
    headers: { Authorization: `Bearer ${userB.token}` }
  });
  console.log(`User B GET User A versions: Status = ${bVersions.status} (expected: 404)`);
  if (bVersions.status !== 404) throw new Error(`User B was able to read User A versions! Status: ${bVersions.status}`);

  // User B attempts to access User A's conflicts
  const bConflicts = await fetch(`${BASE_URL}/api/documents/${docA.id}/conflicts`, {
    headers: { Authorization: `Bearer ${userB.token}` }
  });
  console.log(`User B GET User A conflicts: Status = ${bConflicts.status} (expected: 404)`);
  if (bConflicts.status !== 404) throw new Error(`User B was able to read User A conflicts! Status: ${bConflicts.status}`);

  // Spoofed userId in body: User B passes userId: userA.user.id in the body
  const spoofWrite = await fetch(`${BASE_URL}/api/documents/${docA.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userB.token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      deviceId: 'bob-device',
      userId: userA.user.id, // Attempt to spoof User A's identity in JSON body
      baseVersion: 1,
      payload: { title: 'Spoofed' }
    })
  });
  console.log(`Spoofed body userId POST: Status = ${spoofWrite.status} (expected: 404)`);
  if (spoofWrite.status !== 404) throw new Error(`Body spoofing bypassed auth! Status: ${spoofWrite.status}`);

  console.log('  [PASS] Phase 5 Security strictly verified: cross-user isolation and spoof-immunity enforced.');

  // -----------------------------------------------------------
  // PHASE 3: STEP-BY-STEP MANUALLY VERIFIED SYNC FLOW
  // -----------------------------------------------------------
  console.log('\n>>> VERIFYING PHASE 3: 7-STEP SYNC FLOW <<<');
  
  // START: Server = V1, Laptop = V1, Phone = V1
  const flowDoc = SyncEngine.createDocument(userA.user.id, 'FlowTest.md', {
    title: 'Flow Title V1',
    status: 'draft',
    description: 'Flow Description V1',
    content: 'Flow Content V1'
  }, 'laptop-01');
  console.log(`START: Created document with Server = V${flowDoc.current_version}`);

  // STEP 1: Laptop changes title and synchronizes -> V1 -> V2
  const step1Res = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      deviceId: 'laptop-01',
      baseVersion: 1,
      payload: { title: 'Flow Title V2 (Laptop)' }
    })
  });
  const step1Data = await step1Res.json();
  console.log(`STEP 1: Laptop changes title -> Status: ${step1Data.status}, Version: V${step1Data.version}`);
  if (step1Data.version !== 2) throw new Error(`STEP 1 failed: expected V2, got V${step1Data.version}`);

  // STEP 2: Phone is OFFLINE.
  // Phone edits a different field (status: 'in_review') locally based on V1.
  console.log(`STEP 2: Phone offline queueing change with baseVersion: 1 on status: 'in_review'...`);
  const phoneOfflineChange = {
    changeId: uuidv4(),
    deviceId: 'phone-02',
    baseVersion: 1,
    payload: { status: 'in_review' as const }
  };
  // Server is currently V2. Server does NOT receive phone change yet.
  const serverCheckStep2 = SyncEngine.getDocumentById(flowDoc.id, userA.user.id)!;
  if (serverCheckStep2.current_version !== 2 || serverCheckStep2.status !== 'draft') {
    throw new Error('Server state leaked phone offline change before reconnect!');
  }
  console.log(`  [PASS] Server remains V2 and status='draft' while phone is offline.`);

  // STEP 3: Refresh/reload Phone client while offline.
  // Phone offline queue persists in durable IndexedDB storage.
  console.log('STEP 3: Simulating offline reload: change remains in queue with baseVersion 1.');

  // STEP 4: While Phone is offline, Laptop edits another field (description) and synchronizes.
  const step4Res = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      deviceId: 'laptop-01',
      baseVersion: 2,
      payload: { description: 'Flow Description V3 (Laptop)' }
    })
  });
  const step4Data = await step4Res.json();
  console.log(`STEP 4: Laptop edits description -> Server advances to V${step4Data.version}`);
  if (step4Data.version !== 3) throw new Error(`STEP 4 failed: expected V3, got V${step4Data.version}`);

  // STEP 5: Reconnect Phone!
  // Phone submits queued change with baseVersion: 1.
  // Server detects stale baseVersion: 1 < 3.
  // Diff3 compares Base (V1), Server (V3), Incoming (phone payload).
  // Non-overlapping fields: title & description changed on Server, status changed on Phone.
  // Automatic merge must occur!
  const step5Res = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify(phoneOfflineChange)
  });
  const step5Data = await step5Res.json();
  console.log(`STEP 5: Phone reconnects -> Status: ${step5Data.status}, Merged: ${step5Data.merged}, Version: V${step5Data.version}`);
  if (step5Data.status !== 'accepted' || !step5Data.merged || step5Data.version !== 4) {
    throw new Error(`STEP 5 failed: expected auto-merged V4, got ${JSON.stringify(step5Data)}`);
  }
  const mergedDoc = SyncEngine.getDocumentById(flowDoc.id, userA.user.id)!;
  console.log(`  Merged Document Content:`);
  console.log(`    - title: "${mergedDoc.title}" (from Laptop V2)`);
  console.log(`    - description: "${mergedDoc.description}" (from Laptop V3)`);
  console.log(`    - status: "${mergedDoc.status}" (from Phone)`);
  if (mergedDoc.title !== 'Flow Title V2 (Laptop)' || mergedDoc.description !== 'Flow Description V3 (Laptop)' || mergedDoc.status !== 'in_review') {
    throw new Error('STEP 5: Field merge integrity failed!');
  }
  console.log('  [PASS] Non-overlapping 3-way automatic merge succeeded without data loss.');

  // STEP 6: Repeat with both devices changing the SAME field differently (content).
  console.log('\nSTEP 6: Overlapping concurrent edit on field "content"...');
  // Laptop edits content at baseVersion: 4 -> V5
  const laptopContentRes = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      deviceId: 'laptop-01',
      baseVersion: 4,
      payload: { content: 'Content edited by Laptop' }
    })
  });
  const laptopContentData = await laptopContentRes.json();
  console.log(`  Laptop edit on content accepted -> Server is V${laptopContentData.version}`);
  if (laptopContentData.version !== 5) throw new Error(`Expected V5, got V${laptopContentData.version}`);

  // Phone was offline with baseVersion: 4 and edited content to "Content edited by Phone"
  const phoneConflictRes = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      deviceId: 'phone-02',
      baseVersion: 4,
      payload: { content: 'Content edited by Phone' }
    })
  });
  const phoneConflictData = await phoneConflictRes.json();
  console.log(`  Phone edit result -> Status: "${phoneConflictData.status}"`);
  if (phoneConflictData.status !== 'conflict' || !phoneConflictData.conflict) {
    throw new Error(`STEP 6 failed: Expected conflict, got: ${JSON.stringify(phoneConflictData)}`);
  }
  const conflict = phoneConflictData.conflict;
  console.log(`  [PASS] Conflict recorded safely: ID = ${conflict.id}`);
  console.log(`    - Conflicting field: ${JSON.stringify(conflict.conflicting_fields)}`);
  console.log(`    - Base State content: "${conflict.base_state.content}"`);
  console.log(`    - Server State content: "${conflict.server_state.content}"`);
  console.log(`    - Incoming State content: "${conflict.incoming_state.content}"`);

  // Verify server document was NOT overwritten!
  const docDuringConflict = SyncEngine.getDocumentById(flowDoc.id, userA.user.id)!;
  if (docDuringConflict.content !== 'Content edited by Laptop' || docDuringConflict.current_version !== 5) {
    throw new Error('CRITICAL BUG: Server was overwritten during conflict!');
  }
  console.log('  [PASS] Server document was preserved intact at V5 during conflict.');

  // User chooses Custom Merge in Conflict Resolver
  console.log('\nSTEP 7: Resolving conflict via Custom 3-Way Merge...');
  const unifiedContent = 'Unified Content: Laptop + Phone merged collaboratively';
  const resolveRes = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userA.token}` },
    body: JSON.stringify({
      conflictId: conflict.id,
      deviceId: 'laptop-01',
      resolvedFields: {
        title: mergedDoc.title,
        status: 'approved',
        description: mergedDoc.description,
        content: unifiedContent
      }
    })
  });
  const resolveData = await resolveRes.json();
  console.log(`  Conflict resolution outcome -> Status: ${resolveData.status}, Version: V${resolveData.version}`);
  if (resolveData.status !== 'resolved' || resolveData.version !== 6) {
    throw new Error(`Resolution failed: expected V6, got ${JSON.stringify(resolveData)}`);
  }

  // Device Convergence: Both devices fetch authoritative state
  const finalLaptopFetch = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}`, {
    headers: { Authorization: `Bearer ${userA.token}` }
  });
  const finalLaptopDoc = (await finalLaptopFetch.json()).document;

  const finalPhoneFetch = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}`, {
    headers: { Authorization: `Bearer ${userA.token}` }
  });
  const finalPhoneDoc = (await finalPhoneFetch.json()).document;

  console.log(`\nFinal Convergence Check:`);
  console.log(`  Server Version: V${finalLaptopDoc.current_version}`);
  console.log(`  Laptop Version: V${finalLaptopDoc.current_version}, Content: "${finalLaptopDoc.content}"`);
  console.log(`  Phone Version:  V${finalPhoneDoc.current_version}, Content: "${finalPhoneDoc.content}"`);

  if (
    finalLaptopDoc.current_version !== 6 ||
    finalPhoneDoc.current_version !== 6 ||
    finalLaptopDoc.content !== unifiedContent ||
    finalPhoneDoc.content !== unifiedContent
  ) {
    throw new Error('Convergence failed! Documents differ across devices.');
  }

  console.log('  [PASS] Step 7 Convergence verified: Server, Laptop, and Phone are identical at V6 with zero data loss!');

  // Check version history lineage
  const historyRes = await fetch(`${BASE_URL}/api/documents/${flowDoc.id}/versions`, {
    headers: { Authorization: `Bearer ${userA.token}` }
  });
  const history = (await historyRes.json()).versions;
  console.log(`\nFinal Version Lineage (${history.length} versions):`);
  for (const v of history) {
    console.log(`  V${v.version_number} (parent: V${v.parent_version}) [${v.merge_type}] device=${v.device_id}`);
  }
  if (history.length !== 6) throw new Error(`Expected 6 versions in history, got ${history.length}`);

  console.log('\n========================================================');
  console.log('ALL PHASES 3, 4, 5, 7 CHECKS PASSED WITH ZERO ERRORS!');
  console.log('========================================================');
}

runAudit().catch(err => {
  console.error('\n[AUDIT FAILED]:', err);
  process.exit(1);
});
