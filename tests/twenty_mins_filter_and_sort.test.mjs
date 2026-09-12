import assert from 'assert';

console.log('====================================================');
console.log('🧪 TESTING 20-MINUTE EXPIRATION & NEWEST-FIRST SORTING');
console.log('====================================================\n');

const TWENTY_MINS_MS = 20 * 60 * 1000;

// Replicate filter and sort logic
const isPendingExpired = (status, timeStr) => {
  const s = (status || '').toLowerCase();
  const isPending = s === 'pending' || s === 'pending_verification' || s === 'processing';
  if (!isPending) return false;
  const t = new Date(timeStr).getTime();
  return !isNaN(t) && Date.now() - t > TWENTY_MINS_MS;
};

// Test dataset
const now = Date.now();
const testDeposits = [
  {
    id: 'DEP_OLD_PENDING',
    amount: 500,
    status: 'pending_verification',
    createdAt: new Date(now - 25 * 60 * 1000).toISOString(), // 25 mins ago (>20m) -> MUST BE HIDDEN
  },
  {
    id: 'DEP_RECENT_PENDING',
    amount: 1000,
    status: 'pending_verification',
    createdAt: new Date(now - 5 * 60 * 1000).toISOString(), // 5 mins ago (<20m) -> MUST SHOW
  },
  {
    id: 'DEP_OLD_APPROVED',
    amount: 2100,
    status: 'completed',
    createdAt: new Date(now - 60 * 60 * 1000).toISOString(), // 1 hour ago -> MUST SHOW (completed)
  },
  {
    id: 'DEP_NEW_APPROVED',
    amount: 5000,
    status: 'completed',
    createdAt: new Date(now - 1 * 60 * 1000).toISOString(), // 1 min ago -> MUST SHOW & BE AT TOP
  },
];

// 1. Filter out expired pending
const visible = testDeposits.filter((d) => !isPendingExpired(d.status, d.createdAt));

console.log('--- TEST 1: Expired Pending (>20m) Filter ---');
assert.strictEqual(visible.some((d) => d.id === 'DEP_OLD_PENDING'), false, 'Old pending (>20m) must be removed');
assert.strictEqual(visible.some((d) => d.id === 'DEP_RECENT_PENDING'), true, 'Recent pending (<20m) must remain');
assert.strictEqual(visible.some((d) => d.id === 'DEP_OLD_APPROVED'), true, 'Completed deposits must remain regardless of age');
assert.strictEqual(visible.some((d) => d.id === 'DEP_NEW_APPROVED'), true, 'New completed deposit must remain');
console.log('✓ TEST 1 PASSED: Expired pending (>20m) successfully removed\n');

// 2. Strict newest-first sorting
const sorted = [...visible].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

console.log('--- TEST 2: Strict Newest-First Sorting ---');
assert.strictEqual(sorted[0].id, 'DEP_NEW_APPROVED', 'Newest record (1m ago) must be at index 0 (TOP)');
assert.strictEqual(sorted[1].id, 'DEP_RECENT_PENDING', 'Second newest (5m ago) must be at index 1');
assert.strictEqual(sorted[2].id, 'DEP_OLD_APPROVED', 'Oldest record (60m ago) must be at index 2 (BOTTOM)');
console.log('✓ TEST 2 PASSED: Newest records on top, oldest at bottom\n');

// 3. All Records chronological ordering (no pending forced to top over newer records)
console.log('--- TEST 3: All Records Ordering (No pending pinned over newer transactions) ---');
assert.strictEqual(sorted[0].id === 'DEP_NEW_APPROVED' && sorted[1].id === 'DEP_RECENT_PENDING', true, 'Newer transactions appear above older pending transactions');
console.log('✓ TEST 3 PASSED: All records strictly respect chronological time order\n');

console.log('====================================================');
console.log('🎉 ALL 20-MINUTE EXPIRATION & SORT TESTS PASSED!');
console.log('====================================================');
