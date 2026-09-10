// JANMITRA Admin Security & Audit Trail Automated Verification Suite
import 'dotenv/config';

const BASE_URL = 'http://127.0.0.1:5000/api';

const results = [];

function record(name, pass, details = '') {
  results.push({ name, pass, details });
  const icon = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: ${name}${details ? ` -> ${details}` : ''}`);
}

async function run() {
  console.log('===========================================================');
  console.log('=== STARTING JANMITRA ADMIN SYSTEM & AUDIT TEST SUITE ===');
  console.log('===========================================================\n');

  let adminToken = '';
  let adminUser = null;
  let regularToken = '';
  let regularUser = null;
  let createdUserId = '';

  const testSuffix = Date.now();
  const testAdminEmail = `admin.sec.${testSuffix}@example.com`;
  const testRegularEmail = `viewer.sec.${testSuffix}@example.com`;
  const provisionedEmail = `officer.prov.${testSuffix}@example.com`;
  const testPassword = 'SecurePassword123!';

  // ==========================================
  // PHASE 1: UNAUTHENTICATED ACCESS CHECKS
  // ==========================================
  console.log('--- Phase 1: Unauthenticated Protection (Expected 401) ---');

  try {
    const res = await fetch(`${BASE_URL}/audit`);
    record('GET /api/audit (Unauthenticated rejection)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/audit (Unauthenticated)', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/admin/settings`);
    record('GET /api/admin/settings (Unauthenticated rejection)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/admin/settings (Unauthenticated)', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maintenanceMode: true }),
    });
    record('PUT /api/admin/settings (Unauthenticated rejection)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('PUT /api/admin/settings (Unauthenticated)', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/admin/stats`);
    record('GET /api/admin/stats (Unauthenticated rejection)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/admin/stats (Unauthenticated)', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/admin/users`);
    record('GET /api/admin/users (Unauthenticated rejection)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/admin/users (Unauthenticated)', false, err.message);
  }

  // ==========================================
  // PHASE 2: SETUP TEST ACCOUNTS
  // ==========================================
  console.log('\n--- Phase 2: Setup Test Accounts ---');

  // Register Admin Account
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Security Test Admin',
        email: testAdminEmail,
        password: testPassword,
        role: 'Admin',
        department: 'Administration & Security',
        designation: 'Chief Administrator',
      }),
    });
    const data = await res.json();
    adminToken = data.token;
    adminUser = data.user;
    record('Register Test Admin Account', res.status === 201 && !!adminToken, `Admin ID: ${adminUser?.id}`);
  } catch (err) {
    record('Register Test Admin Account', false, err.message);
  }

  // Register Regular (Viewer) Account
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Regular Citizen Viewer',
        email: testRegularEmail,
        password: testPassword,
        role: 'Viewer',
      }),
    });
    const data = await res.json();
    regularToken = data.token;
    regularUser = data.user;
    record('Register Regular Viewer Account', res.status === 201 && !!regularToken, `Viewer ID: ${regularUser?.id}`);
  } catch (err) {
    record('Register Regular Viewer Account', false, err.message);
  }

  // ==========================================
  // PHASE 3: RBAC ENFORCEMENT ON REGULAR USER
  // ==========================================
  console.log('\n--- Phase 3: Regular User Forbidden Checks (Expected 403) ---');

  // 1. Regular User accessing Audit Trail API
  try {
    const res = await fetch(`${BASE_URL}/audit`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    record('GET /api/audit (Forbidden for regular user)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/audit (Forbidden check)', false, err.message);
  }

  // 2. Regular User accessing Admin Settings
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    record('GET /api/admin/settings (Forbidden for regular user)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/admin/settings (Forbidden check)', false, err.message);
  }

  // 3. Regular User modifying Admin Settings
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regularToken}`,
      },
      body: JSON.stringify({ maintenanceMode: true }),
    });
    record('PUT /api/admin/settings (Forbidden for regular user)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('PUT /api/admin/settings (Forbidden check)', false, err.message);
  }

  // 4. Regular User accessing Admin Stats
  try {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    record('GET /api/admin/stats (Forbidden for regular user)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/admin/stats (Forbidden check)', false, err.message);
  }

  // 5. Regular User accessing Admin User List
  try {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    record('GET /api/admin/users (Forbidden for regular user)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/admin/users (Forbidden check)', false, err.message);
  }

  // 6. Regular User attempting to modify roles
  try {
    const res = await fetch(`${BASE_URL}/users/${regularUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${regularToken}`,
      },
      body: JSON.stringify({ role: 'Admin' }),
    });
    record('PATCH /api/users/:id (Role escalation blocked for regular user)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('PATCH /api/users/:id (Role escalation check)', false, err.message);
  }

  // 7. Regular User attempting to delete another account
  try {
    const res = await fetch(`${BASE_URL}/users/${adminUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    record('DELETE /api/users/:id (Deletion blocked for regular user)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('DELETE /api/users/:id (Deletion check)', false, err.message);
  }

  // ==========================================
  // PHASE 4: AUTHORIZED ADMIN OPERATIONS
  // ==========================================
  console.log('\n--- Phase 4: Authorized Admin Access & Operations (Expected 200/201) ---');

  // 1. Admin reads stats
  try {
    const res = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record(
      'GET /api/admin/stats (Success Admin)',
      res.status === 200 && data.success && typeof data.stats?.users?.total === 'number',
      `Total users: ${data.stats?.users?.total}, Cases: ${data.stats?.cases?.total}`
    );
  } catch (err) {
    record('GET /api/admin/stats (Success)', false, err.message);
  }

  // 2. Admin reads system settings
  let targetTimeout = 90;
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    const currentTimeout = data.settings?.sessionTimeoutMinutes || 60;
    targetTimeout = currentTimeout === 90 ? 120 : 90;
    record(
      'GET /api/admin/settings (Success Admin)',
      res.status === 200 && data.success && !!data.settings,
      `System Name: ${data.settings?.systemName}, Current Timeout: ${currentTimeout}m -> Target: ${targetTimeout}m`
    );
  } catch (err) {
    record('GET /api/admin/settings (Success)', false, err.message);
  }

  // 3. Admin updates system settings (Generates Audit Trail with diff)
  try {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        sessionTimeoutMinutes: targetTimeout,
        announcement: `Test Security Notice ${testSuffix}`,
      }),
    });
    const data = await res.json();
    record(
      'PUT /api/admin/settings (Success Admin update)',
      res.status === 200 && data.success && data.settings?.sessionTimeoutMinutes === targetTimeout,
      `Updated Timeout: ${data.settings?.sessionTimeoutMinutes} mins`
    );
  } catch (err) {
    record('PUT /api/admin/settings (Success Admin update)', false, err.message);
  }

  // 4. Admin provisions a new user
  try {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        fullName: 'Provisioned Test Officer',
        email: provisionedEmail,
        password: testPassword,
        role: 'Officer',
        department: 'Forensic Investigation',
        designation: 'Sub-Inspector',
      }),
    });
    const data = await res.json();
    createdUserId = data.user?.id;
    record(
      'POST /api/admin/users (Admin provision new user)',
      res.status === 201 && data.success && !!createdUserId,
      `Provisioned User ID: ${createdUserId}, Role: ${data.user?.role}`
    );
  } catch (err) {
    record('POST /api/admin/users (Admin provision user)', false, err.message);
  }

  // 5. Admin modifies user role (Officer -> Senior Officer, Generates Audit Trail with diff)
  try {
    const res = await fetch(`${BASE_URL}/users/${createdUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'Senior Officer' }),
    });
    const data = await res.json();
    record(
      'PATCH /api/users/:id (Admin changes user role)',
      res.status === 200 && data.success && data.data?.role === 'Senior Officer',
      `New role: ${data.data?.role}`
    );
  } catch (err) {
    record('PATCH /api/users/:id (Admin changes role)', false, err.message);
  }

  // 6. Admin deletes user (Generates Audit Trail with before snapshot)
  try {
    const res = await fetch(`${BASE_URL}/users/${createdUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record(
      'DELETE /api/users/:id (Admin deletes user)',
      res.status === 200 && data.success,
      `Deleted message: ${data.data?.message}`
    );
  } catch (err) {
    record('DELETE /api/users/:id (Admin deletes user)', false, err.message);
  }

  // ==========================================
  // PHASE 5: COMPLETE AUDIT TRAIL VERIFICATION
  // ==========================================
  console.log('\n--- Phase 5: Audit Trail Verification & State Change Diffs ---');

  try {
    const res = await fetch(`${BASE_URL}/audit?limit=25`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const logs = await res.json();
    const isArray = Array.isArray(logs);
    record('GET /api/audit (Admin can access Audit Trail)', res.status === 200 && isArray, `Retrieved ${logs.length} logs`);

    if (isArray) {
      // Find the settings update log
      const settingsLog = logs.find(
        (l) => l.action === 'SYSTEM_SETTINGS_UPDATED' && l.changes?.after?.sessionTimeoutMinutes === targetTimeout
      );
      record(
        'Audit Trail records SYSTEM_SETTINGS_UPDATED with before/after diff',
        !!settingsLog &&
          settingsLog.changes?.before?.sessionTimeoutMinutes !== undefined &&
          settingsLog.changes?.after?.sessionTimeoutMinutes === targetTimeout,
        `Actor: ${settingsLog?.accessedBy}, Diff: ${JSON.stringify(settingsLog?.changes?.before)} -> ${JSON.stringify(settingsLog?.changes?.after)}`
      );

      // Find the role update log
      const roleLog = logs.find(
        (l) =>
          l.action === 'USER_ROLE_UPDATED' &&
          l.changes?.before?.role === 'Officer' &&
          l.changes?.after?.role === 'Senior Officer'
      );
      record(
        'Audit Trail records USER_ROLE_UPDATED with before/after diff',
        !!roleLog &&
          roleLog.changes?.before?.role === 'Officer' &&
          roleLog.changes?.after?.role === 'Senior Officer',
        `Target: ${roleLog?.target}, Before: ${roleLog?.changes?.before?.role} -> After: ${roleLog?.changes?.after?.role}`
      );

      // Find the user deletion log
      const deleteLog = logs.find(
        (l) => l.action === 'USER_DELETED' && l.changes?.before?.email === provisionedEmail
      );
      record(
        'Audit Trail records USER_DELETED with target and snapshot',
        !!deleteLog && deleteLog.severity === 'critical',
        `Target: ${deleteLog?.target}, Severity: ${deleteLog?.severity}`
      );
    }
  } catch (err) {
    record('Audit Trail Verification', false, err.message);
  }

  // ==========================================
  // PHASE 6: CLEANUP TEST DATA
  // ==========================================
  console.log('\n--- Phase 6: Database Cleanup ---');
  try {
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    if (adminUser?.id) await User.findByIdAndDelete(adminUser.id);
    if (regularUser?.id) await User.findByIdAndDelete(regularUser.id);
    if (createdUserId) await User.findByIdAndDelete(createdUserId);
    await mongoose.disconnect();
    record('Test Users Cleanup (Admin and Viewer removed)', true);
  } catch (err) {
    record('Database Test Cleanup', false, err.message);
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n===========================================================`);
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${results.length})`);
  console.log(`===========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
