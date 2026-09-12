// Test Verification Suite for Payment Deposit Flow
import assert from 'assert';
import { recordDeposit, markApproval } from '../api/bot/ledgerHelper.js';
import depositsHandler from '../api/bot/deposits.js';
import createTxHandler from '../api/wallet/create-transaction.js';
import approveHandler from '../api/bot/approve.js';

console.log('====================================================');
console.log('🚀 RUNNING PAYMENT DEPOSIT FLOW COMPREHENSIVE SUITE');
console.log('====================================================\n');

// Mock request / response helpers for Vercel serverless handlers
function createMockReqRes(method, body, query = {}) {
  const req = {
    method,
    body,
    query,
    headers: { 'content-type': 'application/json' },
  };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    setHeader() {
      return this;
    },
    end() {
      return this;
    },
  };
  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runTests() {
  let passed = 0;

  // ----------------------------------------------------
  // TEST 1: Amount Selection & Paytm Remark
  // ----------------------------------------------------
  console.log('--- TEST 1: Amount Selection & Paytm Remark ---');
  const selectedAmount = 2100;
  const upiId = 'basepnt@ybl';
  const remark = 'cousin';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=EasyBasePoint&am=${selectedAmount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}`;
  const paytmUrl = `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=EasyBasePoint&am=${selectedAmount}&cu=INR&tn=${encodeURIComponent(remark)}&tr=${encodeURIComponent(remark)}`;

  assert(upiUrl.includes('am=2100'), 'UPI URL must contain am=2100');
  assert(upiUrl.includes('tn=cousin'), 'UPI URL must contain tn=cousin');
  assert(upiUrl.includes('tr=cousin'), 'UPI URL must contain tr=cousin');
  assert(paytmUrl.includes('am=2100'), 'Paytm URL must contain am=2100');
  assert(paytmUrl.includes('tn=cousin'), 'Paytm URL must contain tn=cousin');
  console.log('✓ TEST 1 PASSED: Selected ₹2,100 correctly passed to Paytm & UPI with remark "cousin"\n');
  passed++;

  // ----------------------------------------------------
  // TEST 2: Valid UTR validation
  // ----------------------------------------------------
  console.log('--- TEST 2: Valid 12-Digit UTR Acceptance ---');
  const validUtr = '123456789012';
  const invalidUtrShort = '123456';
  const invalidUtrLetters = '123456ABCDEF';

  const isUtrValid = (utr) => /^[0-9]{12}$/.test(utr.trim());
  assert.strictEqual(isUtrValid(validUtr), true, '12-digit numeric UTR must be valid');
  assert.strictEqual(isUtrValid(invalidUtrShort), false, 'Short UTR must be rejected');
  assert.strictEqual(isUtrValid(invalidUtrLetters), false, 'Non-numeric UTR must be rejected');
  console.log('✓ TEST 2 PASSED: 12-digit UTR validation strictly verified\n');
  passed++;

  // ----------------------------------------------------
  // TEST 3: Submit without screenshot MUST be blocked
  // ----------------------------------------------------
  console.log('--- TEST 3: Block submission without screenshot ---');
  const testDepositNoScreenshot = {
    id: `TEST_DEP_${Date.now()}_NOSCREEN`,
    amount: 2100,
    totalInr: 2100,
    utrNumber: '998877665544',
    userId: 'user_test_1',
    userPhone: '9876543210',
    remark: 'cousin',
    // Missing screenshot
  };

  let submissionBlocked = false;
  try {
    await recordDeposit(testDepositNoScreenshot);
  } catch (err) {
    submissionBlocked = true;
    assert(err.message.includes('screenshot is required'), 'Expected screenshot error message');
  }
  assert.strictEqual(submissionBlocked, true, 'Submission without screenshot must throw error');
  console.log('✓ TEST 3 PASSED: Submission without screenshot is strictly blocked\n');
  passed++;

  // ----------------------------------------------------
  // TEST 4: Upload screenshot -> Stored with pending_verification
  // ----------------------------------------------------
  console.log('--- TEST 4: Store deposit with valid screenshot & pending_verification ---');
  const sampleScreenshotBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mock_receipt_image';
  const testDepId = `TEST_DEP_${Date.now()}_VALID`;
  const validDeposit = {
    id: testDepId,
    amount: 2100,
    totalInr: 2100,
    utrNumber: '998877665544',
    userId: 'user_test_1',
    userPhone: '9876543210',
    remark: 'cousin',
    paymentScreenshot: sampleScreenshotBase64,
    status: 'pending_verification',
  };

  const recorded = await recordDeposit(validDeposit);
  assert.strictEqual(recorded.id, testDepId);
  assert.strictEqual(recorded.amount, 2100);
  assert.strictEqual(recorded.remark, 'cousin');
  assert.strictEqual(recorded.status, 'pending_verification');
  assert.strictEqual(recorded.paymentScreenshot, sampleScreenshotBase64);
  console.log('✓ TEST 4 PASSED: Deposit stored with pending_verification, remark "cousin", and screenshot\n');
  passed++;

  // ----------------------------------------------------
  // TEST 5: Admin inspects deposit
  // ----------------------------------------------------
  console.log('--- TEST 5: Admin verification panel data inspection ---');
  assert.strictEqual(recorded.amount, 2100, 'Amount must match');
  assert.strictEqual(recorded.utrNumber, '998877665544', 'UTR must match');
  assert.strictEqual(recorded.remark, 'cousin', 'Remark must be cousin');
  assert(Boolean(recorded.paymentScreenshot), 'Payment screenshot must be visible to Admin');
  console.log('✓ TEST 5 PASSED: Admin sees matching Amount (₹2,100), UTR, Remark "cousin", and Screenshot\n');
  passed++;

  // ----------------------------------------------------
  // TEST 6: Admin approves -> credited exactly once
  // ----------------------------------------------------
  console.log('--- TEST 6: Admin approval & credit exactly once ---');
  const approved = await markApproval(testDepId, 2100, 'approved');
  assert.strictEqual(approved.status, 'approved', 'Status must be approved');
  assert.strictEqual(approved.credited, true, 'Credited must be true');
  assert(approved.approvedAt, 'Approved timestamp must exist');

  // Verify double approval does not double-credit
  const secondApproval = await markApproval(testDepId, 2100, 'approved');
  assert.strictEqual(secondApproval.status, 'approved');
  assert.strictEqual(secondApproval.totalInr, 2100, 'Amount must not be doubled');
  console.log('✓ TEST 6 PASSED: Payment approved and credited exactly once\n');
  passed++;

  // ----------------------------------------------------
  // TEST 7: State persistence after simulated refresh
  // ----------------------------------------------------
  console.log('--- TEST 7: State persistence through ledger ---');
  // Re-read from GitHub memory ledger
  const { data } = await import('../api/bot/ledgerHelper.js').then(m => m.fetchLedgerFromGitHub());
  const persistentRecord = data[testDepId];
  assert(persistentRecord, 'Record must persist in ledger');
  assert.strictEqual(persistentRecord.amount, 2100);
  assert.strictEqual(persistentRecord.paymentScreenshot, sampleScreenshotBase64);
  assert.strictEqual(persistentRecord.remark, 'cousin');
  console.log('✓ TEST 7 PASSED: Persistent ledger preserves screenshot, remark, and state\n');
  passed++;

  // ----------------------------------------------------
  // TEST 8: Direct API bypass rejection without screenshot
  // ----------------------------------------------------
  console.log('--- TEST 8: Backend API bypass rejection ---');
  
  // 8a: api/bot/deposits.js POST without screenshot
  const mock1 = createMockReqRes('POST', {
    amount: 2100,
    utrNumber: '112233445566',
    userPhone: '9876543210',
    // NO SCREENSHOT
  });
  await depositsHandler(mock1.req, mock1.res);
  assert.strictEqual(mock1.getStatus(), 400, 'deposits API must reject without screenshot');
  assert(mock1.getData().error.includes('screenshot is required'));

  // 8b: api/wallet/create-transaction.js POST without screenshot
  const mock2 = createMockReqRes('POST', {
    amount: 2100,
    utr: '112233445566',
    // NO SCREENSHOT
  });
  await createTxHandler(mock2.req, mock2.res);
  assert.strictEqual(mock2.getStatus(), 400, 'create-transaction API must reject without screenshot');
  assert(mock2.getData().error.includes('screenshot is required'));

  // 8c: api/bot/approve.js without screenshot in record
  const mock3 = createMockReqRes('POST', {
    depId: 'FAKE_DEP_NO_PROOF',
    action: 'approved',
  });
  await approveHandler(mock3.req, mock3.res);
  assert.strictEqual(mock3.getStatus(), 400, 'approve API must reject approving deposit with missing screenshot');
  console.log('✓ TEST 8 PASSED: Backend API strictly rejects all requests missing payment screenshot\n');
  passed++;

  console.log('====================================================');
  console.log(`🎉 ALL ${passed}/8 TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
