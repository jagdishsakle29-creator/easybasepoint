import assert from 'assert';

console.log('====================================================');
console.log('🧪 TESTING USER TRANSACTION & ORDER PRIVACY ISOLATION');
console.log('====================================================\n');

// 1. Ownership matcher simulation (identical to our implementations)
const isUserOwner = (user, item) => {
  if (!user || !user.id) return false;
  if (item.userId && item.userId === user.id) return true;
  const userPhone = (user.phone || '').replace(/[^0-9]/g, '');
  const itemPhone = (item.userPhone || item.metadata?.phone || '').replace(/[^0-9]/g, '');
  if (userPhone.length >= 10 && itemPhone.length >= 10 && itemPhone.endsWith(userPhone.slice(-10))) {
    return true;
  }
  return false;
};

// Test Users
const userAlice = { id: 'usr-alice-101', name: 'Alice', phone: '9876500001' };
const userBob = { id: 'usr-bob-202', name: 'Bob', phone: '9876500002' };
const userCharlie = { id: 'usr-charlie-303', name: 'Charlie', phone: '9876500003' };

// Global ledger deposits
const allDeposits = [
  { id: 'DEP-1', userId: 'usr-alice-101', userPhone: '9876500001', amount: 500, status: 'completed', createdAt: '2026-09-13T01:00:00Z' },
  { id: 'DEP-2', userId: 'usr-bob-202', userPhone: '9876500002', amount: 1500, status: 'pending', createdAt: '2026-09-13T01:05:00Z' },
  { id: 'DEP-3', userId: 'usr-alice-101', userPhone: '9876500001', amount: 3000, status: 'completed', createdAt: '2026-09-13T01:10:00Z' },
];

// Global ledger withdrawals
const allWithdrawals = [
  { id: 'WDR-1', userId: 'usr-alice-101', userPhone: '9876500001', amount: 1000, status: 'completed', createdAt: '2026-09-13T01:15:00Z' },
  { id: 'WDR-2', userId: 'usr-bob-202', userPhone: '9876500002', amount: 500, status: 'pending', createdAt: '2026-09-13T01:20:00Z' },
];

// Global transactions
const allTransactions = [
  { id: 'TXN-1', userId: 'usr-alice-101', type: 'deposit', amount: 500, referenceId: 'DEP-1' },
  { id: 'TXN-2', userId: 'usr-bob-202', type: 'deposit', amount: 1500, referenceId: 'DEP-2' },
  { id: 'TXN-3', userId: 'usr-alice-101', type: 'quota_purchase', amount: 2100 },
  { id: 'TXN-4', userId: 'usr-alice-101', type: 'withdrawal', amount: 1000, referenceId: 'WDR-1' },
  { id: 'TXN-5', userId: 'usr-bob-202', type: 'withdrawal', amount: 500, referenceId: 'WDR-2' },
  { id: 'TXN-6', userId: 'usr-charlie-303', type: 'reward', amount: 50, note: 'Welcome Bonus' },
];

console.log('--- TEST 1: Alice View (Only Alice data) ---');
const aliceDeps = allDeposits.filter((d) => isUserOwner(userAlice, d));
const aliceWiths = allWithdrawals.filter((w) => isUserOwner(userAlice, w));
const aliceTxns = allTransactions.filter((t) => isUserOwner(userAlice, t));

assert.strictEqual(aliceDeps.length, 2, 'Alice should only see 2 deposits');
assert.strictEqual(aliceDeps.every((d) => d.userId === 'usr-alice-101'), true, 'All deposits must belong to Alice');
assert.strictEqual(aliceWiths.length, 1, 'Alice should only see 1 withdrawal');
assert.strictEqual(aliceTxns.length, 3, 'Alice should only see 3 transactions');
assert.strictEqual(aliceTxns.some((t) => t.userId === 'usr-bob-202'), false, 'Alice must NEVER see Bob transactions');
console.log('✓ TEST 1 PASSED: Alice only sees Alice items\n');

console.log('--- TEST 2: Bob View (Only Bob data) ---');
const bobDeps = allDeposits.filter((d) => isUserOwner(userBob, d));
const bobWiths = allWithdrawals.filter((w) => isUserOwner(userBob, w));
const bobTxns = allTransactions.filter((t) => isUserOwner(userBob, t));

assert.strictEqual(bobDeps.length, 1, 'Bob should only see 1 deposit');
assert.strictEqual(bobDeps[0].id, 'DEP-2', 'Bob deposit must be DEP-2');
assert.strictEqual(bobWiths.length, 1, 'Bob should only see 1 withdrawal');
assert.strictEqual(bobTxns.length, 2, 'Bob should only see 2 transactions');
assert.strictEqual(bobTxns.some((t) => t.userId === 'usr-alice-101'), false, 'Bob must NEVER see Alice transactions');
console.log('✓ TEST 2 PASSED: Bob only sees Bob items\n');

console.log('--- TEST 3: Charlie View (Brand new user - ₹50 bonus only) ---');
const charlieDeps = allDeposits.filter((d) => isUserOwner(userCharlie, d));
const charlieWiths = allWithdrawals.filter((w) => isUserOwner(userCharlie, w));
const charlieTxns = allTransactions.filter((t) => isUserOwner(userCharlie, t));

assert.strictEqual(charlieDeps.length, 0, 'Charlie has 0 deposits');
assert.strictEqual(charlieWiths.length, 0, 'Charlie has 0 withdrawals');
assert.strictEqual(charlieTxns.length, 1, 'Charlie only has 1 transaction (Signup bonus)');
assert.strictEqual(charlieTxns[0].amount, 50, 'Signup bonus amount must be 50');
console.log('✓ TEST 3 PASSED: New account starts cleanly without other accounts data\n');

console.log('--- TEST 4: Phone Matching Fallback (Even without userId match) ---');
const unlinkedDeposit = { id: 'DEP-UNLINKED', userId: '', userPhone: '+91 98765 00001', amount: 500 };
assert.strictEqual(isUserOwner(userAlice, unlinkedDeposit), true, 'Alice phone must match formatted userPhone');
assert.strictEqual(isUserOwner(userBob, unlinkedDeposit), false, 'Bob must not match Alice phone');
console.log('✓ TEST 4 PASSED: Clean 10-digit phone match works seamlessly\n');

console.log('====================================================');
console.log('🎉 ALL USER TRANSACTION & ORDER PRIVACY TESTS PASSED!');
console.log('====================================================');
