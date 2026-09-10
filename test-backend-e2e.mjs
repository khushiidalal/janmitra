
import 'dotenv/config';

const BASE_URL = 'http://127.0.0.1:5000/api';

const results = [];

function record(name, pass, details = '') {
  results.push({ name, pass, details });
  const icon = pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: ${name}${details ? ` -> ${details}` : ''}`);
}

async function run() {
  console.log('=== Starting Janmitra Backend Health & Route Test Suite ===\n');

  let adminToken = '';
  let adminUser = null;
  let viewerToken = '';
  let viewerUser = null;
  let testCaseId = '';
  let testDocumentId = '';
  let testCaseDocId = '';

  const testSuffix = Date.now();
  const testAdminEmail = `test.admin.${testSuffix}@example.com`;
  const testViewerEmail = `test.viewer.${testSuffix}@example.com`;
  const testPassword = 'SecurePassword123!';

  
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    record('GET /api/health', res.status === 200 && data.status === 'ok', `status: ${res.status}, service: ${data.service}`);
  } catch (err) {
    record('GET /api/health', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail }),
    });
    record('POST /api/auth/register (Validation: missing password/name)', res.status === 400, `status: ${res.status}`);
  } catch (err) {
    record('POST /api/auth/register (Validation)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Admin User',
        email: testAdminEmail,
        password: testPassword,
        role: 'Admin',
        department: 'Cyber Crime',
        designation: 'Lead Investigator',
      }),
    });
    const data = await res.json();
    adminToken = data.token;
    adminUser = data.user;
    record('POST /api/auth/register (Success Admin)', res.status === 201 && !!adminToken, `User ID: ${adminUser?.id}`);
  } catch (err) {
    record('POST /api/auth/register (Success Admin)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Duplicate User',
        email: testAdminEmail,
        password: testPassword,
      }),
    });
    record('POST /api/auth/register (Conflict: duplicate email)', res.status === 409, `status: ${res.status}`);
  } catch (err) {
    record('POST /api/auth/register (Conflict)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Viewer User',
        email: testViewerEmail,
        password: testPassword,
        role: 'Viewer',
      }),
    });
    const data = await res.json();
    viewerToken = data.token;
    viewerUser = data.user;
    record('POST /api/auth/register (Success Viewer)', res.status === 201 && !!viewerToken, `User ID: ${viewerUser?.id}`);
  } catch (err) {
    record('POST /api/auth/register (Success Viewer)', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: 'WrongPassword!' }),
    });
    record('POST /api/auth/login (Invalid credentials)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('POST /api/auth/login (Invalid credentials)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail, password: testPassword }),
    });
    const data = await res.json();
    record('POST /api/auth/login (Success)', res.status === 200 && !!data.token, `Token received`);
  } catch (err) {
    record('POST /api/auth/login (Success)', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/auth/me`);
    record('GET /api/auth/me (Unauthorized)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/auth/me (Unauthorized)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('GET /api/auth/me (Success)', res.status === 200 && data.user.email === testAdminEmail, `Email: ${data.user?.email}`);
  } catch (err) {
    record('GET /api/auth/me (Success)', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    record('POST /api/otp/send (Validation: missing email)', res.status === 400, `status: ${res.status}`);
  } catch (err) {
    record('POST /api/otp/send (Validation)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail }),
    });
    record('POST /api/otp/verify (Validation: missing OTP)', res.status === 400, `status: ${res.status}`);
  } catch (err) {
    record('POST /api/otp/verify (Validation)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/phone-otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210' }),
    });
    const data = await res.json();
    record('POST /api/phone-otp/send (Success / Dev Simulation)', res.status === 200 && data.success, `message: ${data.message}`);
  } catch (err) {
    record('POST /api/phone-otp/send', false, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}/phone-otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+919876543210', otp: '123456' }),
    });
    const data = await res.json();
    record('POST /api/phone-otp/verify (Success / Dev Simulation)', res.status === 200 && data.success, `message: ${data.message}`);
  } catch (err) {
    record('POST /api/phone-otp/verify', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/cases`);
    const data = await res.json();
    record('GET /api/cases (List all)', res.status === 200 && Array.isArray(data), `Found ${data.length} cases`);
  } catch (err) {
    record('GET /api/cases', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ description: 'No title provided' }),
    });
    record('POST /api/cases (Validation: missing title)', res.status === 400, `status: ${res.status}`);
  } catch (err) {
    record('POST /api/cases (Validation)', false, err.message);
  }

  
  const samplePdfBase64 = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 44>>stream\nBT\n/F1 24 Tf\n100 700 Td\n(FIR Case Document Legal Report Content) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n0000000212 00000 n \n0000000283 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n377\n%%EOF'
  ).toString('base64');

  try {
    const res = await fetch(`${BASE_URL}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: `Test Investigation Case ${testSuffix}`,
        category: 'Cyber Crime',
        incidentDate: '2026-09-10',
        location: 'Sector 62, Noida',
        description: 'Automated test investigation case description',
        status: 'Active',
        documents: [
          {
            name: 'sample_fir.pdf',
            type: 'PDF',
            category: 'FIR Copy',
            dataUrl: `data:application/pdf;base64,${samplePdfBase64}`,
          },
        ],
      }),
    });
    const data = await res.json();
    testCaseId = data.id || data.caseId;
    testCaseDocId = data.documents?.[0]?.id || data.documents?.[0]?._id;
    record('POST /api/cases (Success)', res.status === 201 && !!testCaseId, `Created Case ID: ${testCaseId}`);
  } catch (err) {
    record('POST /api/cases (Success)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}`);
    const data = await res.json();
    record('GET /api/cases/[id] (Success)', res.status === 200 && data.title.includes(String(testSuffix)), `Title: ${data.title}`);
  } catch (err) {
    record('GET /api/cases/[id] (Success)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/NON_EXISTENT_CASE_99999`);
    record('GET /api/cases/[id] (Not Found)', res.status === 404, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/cases/[id] (Not Found)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    record('PATCH /api/cases/[id] (Unauthorized: missing token)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('PATCH /api/cases/[id] (Unauthorized)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`,
      },
      body: JSON.stringify({ title: 'Viewer Attempt' }),
    });
    record('PATCH /api/cases/[id] (Forbidden: Viewer role)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('PATCH /api/cases/[id] (Forbidden)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ location: 'Updated Test Location' }),
    });
    const data = await res.json();
    record('PATCH /api/cases/[id] (Success Admin)', res.status === 200 && data.location === 'Updated Test Location', `Location: ${data.location}`);
  } catch (err) {
    record('PATCH /api/cases/[id] (Success Admin)', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}/documents/${encodeURIComponent(testCaseDocId)}/ocr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record(
      'POST /api/cases/[id]/documents/[docId]/ocr (Execute OCR)',
      res.status === 200 && data.ocrStatus === 'completed',
      `Confidence: ${data.ocrConfidence}%, Text snippet: "${data.ocrText?.slice(0, 40).replace(/\n/g, ' ')}"`
    );
  } catch (err) {
    record('POST /api/cases/[id]/documents/[docId]/ocr', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}/documents/${encodeURIComponent(testCaseDocId)}/ocr`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record(
      'GET /api/cases/[id]/documents/[docId]/ocr (Fetch Status)',
      res.status === 200 && data.ocrStatus === 'completed',
      `Status: ${data.ocrStatus}, Quality: ${data.ocrQuality}`
    );
  } catch (err) {
    record('GET /api/cases/[id]/documents/[docId]/ocr', false, err.message);
  }

  
  
  try {
    const form = new FormData();
    form.append('caseId', testCaseId);
    form.append('name', 'Unauthorized.pdf');
    form.append('documentType', 'Evidence');
    form.append('file', new Blob(['test'], { type: 'application/pdf' }), 'unauth.pdf');

    const res = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      body: form,
    });
    record('POST /api/documents (Unauthorized: missing token)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('POST /api/documents (Unauthorized)', false, err.message);
  }

  
  try {
    const form = new FormData();
    form.append('caseId', testCaseId);
    form.append('name', 'InvalidType.pdf');
    form.append('documentType', 'CompletelyInvalidType');
    form.append('file', new Blob(['test'], { type: 'application/pdf' }), 'test.pdf');

    const res = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: form,
    });
    record('POST /api/documents (Validation: invalid documentType)', res.status === 400, `status: ${res.status}`);
  } catch (err) {
    record('POST /api/documents (Validation)', false, err.message);
  }

  
  const validPdfBytes = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 50>>stream\nBT\n/F1 24 Tf\n100 700 Td\n(Janmitra Standalone Document Upload Verification) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \n0000000212 00000 n \n0000000283 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n383\n%%EOF'
  );

  try {
    const form = new FormData();
    form.append('caseId', testCaseId);
    form.append('name', 'Standalone_Test_Evidence.pdf');
    form.append('documentType', 'Evidence');
    form.append('description', 'Uploaded via automated test');
    form.append('file', new Blob([validPdfBytes], { type: 'application/pdf' }), 'Standalone_Test_Evidence.pdf');

    const res = await fetch(`${BASE_URL}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: form,
    });
    const data = await res.json();
    testDocumentId = data.id || data._id;
    record('POST /api/documents (Success Upload)', res.status === 201 && !!testDocumentId, `Doc ID: ${testDocumentId}`);
  } catch (err) {
    record('POST /api/documents (Success Upload)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents?caseId=${encodeURIComponent(testCaseId)}`);
    const data = await res.json();
    record('GET /api/documents (List for case)', res.status === 200 && data.length > 0, `Found ${data.length} docs`);
  } catch (err) {
    record('GET /api/documents (List)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}`);
    const data = await res.json();
    record('GET /api/documents/[id] (Success)', res.status === 200 && data.name === 'Standalone_Test_Evidence.pdf', `Name: ${data.name}`);
  } catch (err) {
    record('GET /api/documents/[id] (Success)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}/download`);
    record('GET /api/documents/[id]/download (Unauthorized check)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/documents/[id]/download (Unauthorized)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}/download`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const buf = await res.arrayBuffer();
    record('GET /api/documents/[id]/download (Success)', res.status === 200 && buf.byteLength > 0, `Downloaded ${buf.byteLength} bytes`);
  } catch (err) {
    record('GET /api/documents/[id]/download (Success)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}/ocr`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record(
      'POST /api/documents/[id]/ocr (Process Document OCR)',
      res.status === 200 && data.ocrStatus === 'completed',
      `Confidence: ${data.ocrConfidence}%, Text snippet: "${data.ocrText?.slice(0, 45).replace(/\n/g, ' ')}"`
    );
  } catch (err) {
    record('POST /api/documents/[id]/ocr', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}/ocr`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('GET /api/documents/[id]/ocr (Status)', res.status === 200 && data.ocrStatus === 'completed', `Quality: ${data.ocrQuality}`);
  } catch (err) {
    record('GET /api/documents/[id]/ocr', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked_Doc_Name.pdf' }),
    });
    record('PUT /api/documents/[id] (Unauthorized: missing token)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('PUT /api/documents/[id] (Unauthorized)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ description: 'Updated document description' }),
    });
    const data = await res.json();
    record('PUT /api/documents/[id] (Success)', res.status === 200 && data.description === 'Updated document description', `Description: ${data.description}`);
  } catch (err) {
    record('PUT /api/documents/[id] (Success)', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/draft`);
    const data = await res.json();
    record('GET /api/draft (Anonymous default empty)', res.status === 200 && data.title === '', `Title: "${data.title}"`);
  } catch (err) {
    record('GET /api/draft', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/draft`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ title: 'Draft Case Title In Progress' }),
    });
    const data = await res.json();
    record('PUT /api/draft (Save draft)', res.status === 200 && data.title === 'Draft Case Title In Progress', `Draft Title: "${data.title}"`);
  } catch (err) {
    record('PUT /api/draft', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/draft`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('DELETE /api/draft (Clear draft)', res.status === 200 && data.title === '', 'Draft reset');
  } catch (err) {
    record('DELETE /api/draft', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/audit`);
    record('GET /api/audit (Unauthorized check)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/audit (Unauthorized)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/audit?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('GET /api/audit (Success)', res.status === 200 && Array.isArray(data), `Retrieved ${data.length} audit logs`);
  } catch (err) {
    record('GET /api/audit (Success)', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/users`);
    record('GET /api/users (Unauthorized check)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('GET /api/users (Unauthorized)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('GET /api/users (Success list)', res.status === 200 && data.success, `Total users: ${data.data?.total}`);
  } catch (err) {
    record('GET /api/users (Success)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/users/${viewerUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`,
      },
      body: JSON.stringify({ role: 'Admin' }),
    });
    record('PATCH /api/users/[id] (RBAC: Non-admin cannot elevate role)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('PATCH /api/users/[id] (RBAC role elevation)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/users/${adminUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    record('DELETE /api/users/[id] (RBAC: Non-admin cannot delete users)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('DELETE /api/users/[id] (RBAC delete)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/users/${adminUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('DELETE /api/users/[id] (Cannot delete own account)', res.status === 400, `status: ${res.status}`);
  } catch (err) {
    record('DELETE /api/users/[id] (Self delete)', false, err.message);
  }

  
  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}`, {
      method: 'DELETE',
    });
    record('DELETE /api/documents/[id] (Unauthorized check)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('DELETE /api/documents/[id] (Unauthorized)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/documents/${testDocumentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('DELETE /api/documents/[id] (Success Admin)', res.status === 200 && data.success, `message: ${data.message}`);
  } catch (err) {
    record('DELETE /api/documents/[id] (Success)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}`, {
      method: 'DELETE',
    });
    record('DELETE /api/cases/[id] (Unauthorized check)', res.status === 401, `status: ${res.status}`);
  } catch (err) {
    record('DELETE /api/cases/[id] (Unauthorized)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    record('DELETE /api/cases/[id] (Forbidden for Viewer)', res.status === 403, `status: ${res.status}`);
  } catch (err) {
    record('DELETE /api/cases/[id] (Forbidden)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/cases/${encodeURIComponent(testCaseId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('DELETE /api/cases/[id] (Success Admin)', res.status === 200 && data.success, `message: ${data.message}`);
  } catch (err) {
    record('DELETE /api/cases/[id] (Success)', false, err.message);
  }

  
  try {
    const res = await fetch(`${BASE_URL}/users/${viewerUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    record('DELETE /api/users/[id] (Success Admin delete test user)', res.status === 200 && data.success, `Deleted Viewer User`);
  } catch (err) {
    record('DELETE /api/users/[id] (Success)', false, err.message);
  }

  
  try {
    
    const mongoose = (await import('mongoose')).default;
    await mongoose.connect(process.env.MONGODB_URI);
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    await User.findByIdAndDelete(adminUser.id);
    await mongoose.disconnect();
    record('Database Test Cleanup (Admin user removed)', true);
  } catch (err) {
    record('Database Test Cleanup', false, err.message);
  }

  
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n========================================`);
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${results.length})`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
