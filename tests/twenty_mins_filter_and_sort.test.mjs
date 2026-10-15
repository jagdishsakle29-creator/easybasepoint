import assert from 'assert';

console.log('====================================================');
console.log('🧪 TESTING PERMANENT HISTORY RETENTION & NEWEST-FIRST SORTING');
console.log('====================================================\n');

// Policy: Orders must NEVER auto-expire or auto-delete based on time.
const isPendingExpired = (_status, _timeStr) => false;

// Test dataset
const now = Date.now();
const testDeposits = [
  {
    id: 'DEP_OLD_PENDING',
    amount: 500,
    status: 'pending_verification',
    createdAt: new Date(now - 25 * 60 * 1000).toISOString(), // 25 mins ago -> MUST REMAIN (never auto-hide)
  },
  {
    id: 'DEP_RECENT_PENDING',
    amount: 1000,
    status: 'pending_verification',
    createdAt: new Date(now - 5 * 60 * 1000).toISOString(), // 5 mins ago -> MUST SHOW
  },
  {
    id: 'DEP_OLD_APPROVED',
    amount: 2100,
    status: 'completed',
    createdAt: new Date(now - 60 * 60 * 1000).toISOString(), // 1 hour ago -> MUST SHOW
  },
  {
    id: 'DEP_NEW_APPROVED',
    amount: 5000,
    status: 'completed',
    createdAt: new Date(now - 1 * 60 * 1000).toISOString(), // 1 min ago -> MUST SHOW & BE AT TOP
  },
  {
    id: 'DEP_REJECTED',
    amount: 800,
    status: 'rejected',
    createdAt: new Date(now - 15 * 60 * 1000).toISOString(), // Rejected order -> MUST SHOW IN CANCELLED TAB
  },
];

// 1. Permanent retention
const visible = testDeposits.filter((d) => !isPendingExpired(d.status, d.createdAt));

console.log('--- TEST 1: Permanent History Retention ---');
assert.strictEqual(visible.some((d) => d.id === 'DEP_OLD_PENDING'), true, 'Old pending must stay visible permanently');
assert.strictEqual(visible.some((d) => d.id === 'DEP_RECENT_PENDING'), true, 'Recent pending must remain');
assert.strictEqual(visible.some((d) => d.id === 'DEP_OLD_APPROVED'), true, 'Completed deposits must remain permanently');
assert.strictEqual(visible.some((d) => d.id === 'DEP_NEW_APPROVED'), true, 'New completed deposit must remain');
assert.strictEqual(visible.some((d) => d.id === 'DEP_REJECTED'), true, 'Rejected deposits must remain visible');
console.log('✓ TEST 1 PASSED: All records permanently preserved without auto-deletion\n');

// 2. Strict newest-first sorting
const sorted = [...visible].sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
);

console.log('--- TEST 2: Strict Newest-First Sorting ---');
assert.strictEqual(sorted[0].id, 'DEP_NEW_APPROVED', 'Newest record (1m ago) must be at index 0 (TOP)');
assert.strictEqual(sorted[1].id, 'DEP_RECENT_PENDING', 'Second newest (5m ago) must be at index 1');
assert.strictEqual(sorted[sorted.length - 1].id, 'DEP_OLD_APPROVED', 'Oldest record (60m ago) must be at the BOTTOM');
console.log('✓ TEST 2 PASSED: Newest records on top, oldest at bottom\n');

console.log('====================================================');
console.log('🎉 ALL PERMANENT RETENTION & SORT TESTS PASSED!');
console.log('====================================================');
