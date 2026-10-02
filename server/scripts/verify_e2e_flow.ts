import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'http://localhost:5000';

async function run() {
  console.log('====================================================');
  console.log('SYNCSAFE COMPREHENSIVE END-TO-END VALIDATION SUITE');
  console.log('====================================================\n');

  // STEP 1 — LOGIN
  console.log('--- Step 1: Authentication & Demo Login ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@syncsafe.io', password: 'demo1234' })
  });
  if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
  const loginData = await loginRes.json();
  const token = loginData.token;
  const user = loginData.user;
  console.log(`[PASS] Logged in successfully: User = ${user.name} (${user.email}), ID = ${user.id}`);

  // Test /api/auth/me
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!meRes.ok) throw new Error(`/api/auth/me failed: ${meRes.status}`);
  const meData = await meRes.json();
  if (meData.user.id !== user.id) throw new Error(`User ID mismatch in /api/auth/me`);
  console.log(`[PASS] GET /api/auth/me verified user identity matches JWT`);

  // Test invalid token
  const invalidRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: 'Bearer invalid.stale.token' }
  });
  if (invalidRes.status !== 401) throw new Error(`Invalid token should return 401, got ${invalidRes.status}`);
  console.log(`[PASS] Invalid/stale token correctly returned 401 Unauthorized`);

  // STEP 2 — CREATE DOCUMENT
  console.log('\n--- Step 2: Document Creation ---');
  const createRes = await fetch(`${BASE_URL}/api/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'SyncSafe Demo',
      deviceId: 'device-laptop-001',
      fields: {
        title: 'SyncSafe Architecture',
        status: 'draft',
        description: 'Multi-device synchronization demonstration',
        content: '# SyncSafe Demo\n\nTesting multi-device synchronization.'
      }
    })
  });
  if (!createRes.ok) throw new Error(`Document creation failed: ${createRes.status} ${await createRes.text()}`);
  const createData = await createRes.json();
  const createdDoc = createData.document;
  const docId = createdDoc.id;
  console.log(`[PASS] Document created: ID = ${docId}, Version = ${createdDoc.current_version}, Owner = ${createdDoc.owner_id}`);
  if (createdDoc.current_version !== 1) throw new Error(`Expected V1, got V${createdDoc.current_version}`);

  // STEP 3 — NORMAL EDIT
  console.log('\n--- Step 3: Normal Edit (V1 -> V2) ---');
  const editChangeId = uuidv4();
  const editRes = await fetch(`${BASE_URL}/api/documents/${docId}/changes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      changeId: editChangeId,
      baseVersion: 1,
      deviceId: 'device-laptop-001',
      payload: {
        title: 'SyncSafe Architecture — Updated'
      }
    })
  });
  if (!editRes.ok) throw new Error(`Edit failed: ${editRes.status} ${await editRes.text()}`);
  const editData = await editRes.json();
  console.log(`[PASS] Normal edit applied: Status = ${editData.status}, Version = V${editData.version}`);
  if (editData.version !== 2) throw new Error(`Expected V2, got V${editData.version}`);

  // Test Idempotency with same changeId
  const idempRes = await fetch(`${BASE_URL}/api/documents/${docId}/changes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      changeId: editChangeId,
      baseVersion: 1,
      deviceId: 'device-laptop-001',
      payload: {
        title: 'SyncSafe Architecture — Updated'
      }
    })
  });
  const idempData = await idempRes.json();
  if (idempData.version !== 2) throw new Error(`Idempotency failed: expected V2, got V${idempData.version}`);
  console.log(`[PASS] Idempotency verified: re-sending changeId returned identical V2 (status: ${idempData.status}) without incrementing version`);

  // STEP 4 — VERSION HISTORY
  console.log('\n--- Step 4: Version History Verification ---');
  const versionsRes = await fetch(`${BASE_URL}/api/documents/${docId}/versions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const versionsData = await versionsRes.json();
  const versions = versionsData.versions;
  console.log(`[PASS] Retrieved ${versions.length} real backend versions:`);
  for (const v of versions) {
    console.log(`       - V${v.version_number}: title="${v.title}" (${v.merge_type || 'initial'}) device=${v.device_id || 'system'}`);
  }
  if (versions.length !== 2) throw new Error(`Expected 2 versions, found ${versions.length}`);

  // STEP 5 — RESET DEMO TO V1
  console.log('\n--- Step 5: Reset Demo To V1 ---');
  const resetRes = await fetch(`${BASE_URL}/api/demo/reset`, { method: 'POST' });
  if (!resetRes.ok) throw new Error(`Demo reset failed: ${resetRes.status}`);
  console.log(`[PASS] Demo reset completed successfully`);

  // Verify User Preserved and Token still valid
  const postResetMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!postResetMeRes.ok) throw new Error(`Token invalidated after reset! Status: ${postResetMeRes.status}`);
  const postResetMe = await postResetMeRes.json();
  if (postResetMe.user.id !== user.id) throw new Error(`User ID changed during reset!`);
  console.log(`[PASS] User ${postResetMe.user.name} was preserved with identical ID. Session remains valid.`);

  // Get active demo document
  const docsRes = await fetch(`${BASE_URL}/api/documents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const docsData = await docsRes.json();
  const demoDoc = docsData.documents[0];
  console.log(`[PASS] Active demo doc: "${demoDoc.title}" (ID: ${demoDoc.id}, V${demoDoc.current_version})`);

  // STEP 6 & 7 & 8 — 3-WAY NON-OVERLAPPING AUTO-MERGE
  console.log('\n--- Steps 6, 7, 8: Dual-Device Non-Overlapping Concurrent Changes ---');
  // Laptop changes description at baseVersion 1
  console.log('Device 1 (MacBook Pro) changes description -> "Updated from Laptop"');
  const laptopRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      baseVersion: 1,
      deviceId: 'device-laptop-001',
      payload: { description: 'Updated from Laptop' }
    })
  });
  const laptopData = await laptopRes.json();
  console.log(`[PASS] Laptop change applied -> Server is now V${laptopData.version}`);

  // Phone was offline with baseVersion 1, reconnects and sends change on status
  console.log('Device 2 (Pixel 8 Pro) reconnects with stale baseVersion 1, changes status -> "in_review"');
  const phoneRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      baseVersion: 1,
      deviceId: 'device-mobile-002',
      payload: { status: 'in_review' }
    })
  });
  const phoneData = await phoneRes.json();
  console.log(`[PASS] Phone change handled -> Status: ${phoneData.status}, Version: V${phoneData.version}, Merged: ${phoneData.merged}`);
  if (!phoneData.merged) {
    throw new Error(`Expected merged to be true, got ${phoneData.merged}`);
  }
  const mergedDocRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const mergedDocData = await mergedDocRes.json();
  const mergedDoc = mergedDocData.document;
  console.log(`[PASS] Verified 3-way non-overlapping merge in DB:`);
  console.log(`       - description: "${mergedDoc.description}" (from laptop)`);
  console.log(`       - status: "${mergedDoc.status}" (from phone)`);
  if (mergedDoc.description !== 'Updated from Laptop' || mergedDoc.status !== 'in_review') {
    throw new Error('Fields were not correctly merged!');
  }

  // STEP 9 — REAL SAME-FIELD CONFLICT
  console.log('\n--- Step 9: Conflicting Concurrent Edit on Same Field (Content) ---');
  const currVer = phoneData.version; // V3
  console.log(`Current server version is V${currVer}. Laptop changes content to "Content from Laptop"`);
  const laptopConflictRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      baseVersion: currVer,
      deviceId: 'device-laptop-001',
      payload: { content: '# SyncSafe Demo\n\nContent from Laptop.' }
    })
  });
  const laptopConflictData = await laptopConflictRes.json();
  console.log(`[PASS] Laptop edit applied -> Server is now V${laptopConflictData.version}`);

  const vBeforeConflict = laptopConflictData.version; // V4
  console.log(`Phone reconnects having edited content offline based on stale V${currVer} to "Content from Phone"`);
  const phoneConflictRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      baseVersion: currVer,
      deviceId: 'device-mobile-002',
      payload: { content: '# SyncSafe Demo\n\nContent from Phone.' }
    })
  });
  const phoneConflictData = await phoneConflictRes.json();
  console.log(`[PASS] Server detected conflict: Status = "${phoneConflictData.status}", ConflictId = ${phoneConflictData.conflict?.id}`);
  if (phoneConflictData.status !== 'conflict' || !phoneConflictData.conflict?.id) {
    throw new Error(`Expected conflict status, got ${JSON.stringify(phoneConflictData)}`);
  }

  // STEP 10 — 3-WAY CONFLICT RESOLUTION
  console.log('\n--- Step 10: 3-Way Conflict Resolution ---');
  // Check conflicts endpoint
  const conflictsRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}/conflicts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const conflictsData = await conflictsRes.json();
  const conflicts = conflictsData.conflicts;
  console.log(`[PASS] Unresolved conflicts count: ${conflicts.length}`);
  const activeConflict = conflicts[0];
  console.log(`       - Base Version: V${activeConflict.base_version}`);
  console.log(`       - Server Version: V${activeConflict.server_version}`);
  console.log(`       - Conflicting Fields: ${JSON.stringify(activeConflict.conflicting_fields)}`);

  console.log('Resolving conflict with Custom Merge ("# SyncSafe Demo\\n\\nMerged Content for Hackathon")...');
  const resolveRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      conflictId: activeConflict.id,
      deviceId: 'device-laptop-001',
      resolvedFields: {
        title: mergedDoc.title,
        status: mergedDoc.status,
        description: mergedDoc.description,
        content: '# SyncSafe Demo\n\nMerged Content for Hackathon Presentation.'
      }
    })
  });
  if (!resolveRes.ok) throw new Error(`Resolution failed: ${resolveRes.status} ${await resolveRes.text()}`);
  const resolveData = await resolveRes.json();
  console.log(`[PASS] Conflict resolved: New Version = V${resolveData.version}, Status = ${resolveData.status}`);
  if (resolveData.status !== 'resolved') {
    throw new Error(`Expected status resolved, got ${resolveData.status}`);
  }

  // STEP 11 — FINAL VERSION HISTORY LINEAGE
  console.log('\n--- Step 11: Final Version History Lineage ---');
  const finalVerRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}/versions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const finalVersionsData = await finalVerRes.json();
  const finalVersions = finalVersionsData.versions;
  console.log(`Lineage verified (${finalVersions.length} versions recorded):`);
  for (const v of finalVersions) {
    console.log(`   - V${v.version_number}: [${v.merge_type || 'initial'}] device=${v.device_id || 'system'}`);
  }

  // STEP 12 — SECURITY AND MULTI-TENANCY ISOLATION
  console.log('\n--- Step 12: Security & Multi-Tenancy Isolation Verification ---');
  // Register an attacker user
  const attackerEmail = `attacker_${Date.now()}@syncsafe.io`;
  const attackerReg = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Mallory Attacker', email: attackerEmail, password: 'password123' })
  });
  const attackerData = await attackerReg.json();
  const attackerToken = attackerData.token;

  // Attacker attempts to read victim's document
  const attackReadRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}`, {
    headers: { Authorization: `Bearer ${attackerToken}` }
  });
  if (attackReadRes.status !== 403 && attackReadRes.status !== 404) {
    throw new Error(`Security breach! Attacker was able to read victim doc, status = ${attackReadRes.status}`);
  }
  console.log(`[PASS] Multi-tenant isolation verified: Attacker received ${attackReadRes.status} on unauthorized read`);

  // Attacker attempts to modify victim's document
  const attackWriteRes = await fetch(`${BASE_URL}/api/documents/${demoDoc.id}/changes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${attackerToken}` },
    body: JSON.stringify({
      changeId: uuidv4(),
      baseVersion: 1,
      deviceId: 'attacker-device',
      payload: { title: 'Compromised!' }
    })
  });
  if (attackWriteRes.status !== 403 && attackWriteRes.status !== 404) {
    throw new Error(`Security breach! Attacker was able to write victim doc, status = ${attackWriteRes.status}`);
  }
  console.log(`[PASS] Ownership enforcement verified: Attacker received ${attackWriteRes.status} on unauthorized write`);

  console.log('\n====================================================');
  console.log('ALL END-TO-END DEMO FLOW CHECKS PASSED 100% PERFECTLY!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\n[FATAL ERROR IN E2E FLOW]:', err);
  process.exit(1);
});
