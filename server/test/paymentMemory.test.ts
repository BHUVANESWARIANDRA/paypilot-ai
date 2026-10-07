import { FallbackProvider } from '../src/services/ai/fallbackProvider';
import { TransactionRecord } from '../src/types';

export async function runPaymentMemoryTests() {
  console.log('🧪 Starting AI Payment Memory Engine Unit Tests...\n');
  const provider = new FallbackProvider();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${testName} - ${detail || ''}`);
      failed++;
    }
  }

  // Mock sample dataset including COMPLETED, FAILED, and CANCELLED transactions
  const mockTransactions: TransactionRecord[] = [
    {
      id: 'tx-1',
      paypalOrderId: 'ORD-1',
      recipient: 'Rahul',
      amount: 50.00,
      currency: 'USD',
      purpose: 'laptop repair',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 10,
      riskReasons: [],
      createdAt: new Date('2026-03-01').toISOString()
    },
    {
      id: 'tx-2',
      paypalOrderId: 'ORD-2',
      recipient: 'Maria',
      amount: 25.00,
      currency: 'USD',
      purpose: 'dinner split',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 5,
      riskReasons: [],
      createdAt: new Date('2026-03-02').toISOString()
    },
    {
      id: 'tx-3',
      paypalOrderId: 'ORD-3',
      recipient: 'ABC Services',
      amount: 120.00,
      currency: 'USD',
      purpose: 'website hosting',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 15,
      riskReasons: [],
      createdAt: new Date('2026-03-03').toISOString()
    },
    {
      id: 'tx-4',
      paypalOrderId: 'ORD-4',
      recipient: 'Rahul',
      amount: 500.00,
      currency: 'USD',
      purpose: 'failed hardware upgrade',
      status: 'FAILED', // SHOULD BE EXCLUDED!
      riskLevel: 'HIGH',
      riskScore: 90,
      riskReasons: [],
      createdAt: new Date('2026-03-04').toISOString()
    },
    {
      id: 'tx-5',
      paypalOrderId: 'ORD-5',
      recipient: 'Maria',
      amount: 200.00,
      currency: 'USD',
      purpose: 'cancelled concert tickets',
      status: 'CANCELLED', // SHOULD BE EXCLUDED!
      riskLevel: 'MEDIUM',
      riskScore: 40,
      riskReasons: [],
      createdAt: new Date('2026-03-05').toISOString()
    }
  ];

  // Test 1: Matching recipient query ("How much did I pay Rahul?")
  console.log('Test 1: Recipient Search ("How much did I pay Rahul?")');
  const ans1 = await provider.answerPaymentMemory("How much did I pay Rahul?", mockTransactions);
  assert(ans1.includes('Rahul') && ans1.includes('50.00'), 'Returns Rahul payment of 50.00', `Got: ${ans1}`);
  assert(!ans1.includes('500.00'), 'Excludes FAILED transaction of 500.00', `Got: ${ans1}`);

  // Test 2: Calculating total spending ("How much did I spend this month?")
  console.log('\nTest 2: Total Spending Calculation ("How much did I spend this month?")');
  const ans2 = await provider.answerPaymentMemory("How much did I spend this month?", mockTransactions);
  // Total completed = 50 + 25 + 120 = 195.00
  assert(ans2.includes('195.00') && ans2.includes('3'), 'Calculates correct total of 195.00 across 3 completed payments', `Got: ${ans2}`);

  // Test 3: Largest payment query ("What was my largest payment?")
  console.log('\nTest 3: Largest Payment Query ("What was my largest payment?")');
  const ans3 = await provider.answerPaymentMemory("What was my largest payment?", mockTransactions);
  assert(ans3.includes('ABC Services') && ans3.includes('120.00'), 'Identifies ABC Services 120.00 as largest COMPLETED payment', `Got: ${ans3}`);
  assert(!ans3.includes('500.00'), 'Does not pick FAILED 500.00 payment as largest', `Got: ${ans3}`);

  // Test 4: Category/Purpose search ("What did I spend on food?")
  console.log('\nTest 4: Category/Purpose Search ("What did I spend on dinner?")');
  const ans4 = await provider.answerPaymentMemory("What did I spend on dinner?", mockTransactions);
  assert(ans4.includes('25.00') && ans4.includes('dinner'), 'Identifies 25.00 spent on dinner', `Got: ${ans4}`);

  // Test 5: No matching transaction ("How much did I pay Elon Musk?")
  console.log('\nTest 5: Unmatched Transaction Query ("How much did I pay Elon Musk?")');
  const ans5 = await provider.answerPaymentMemory("How much did I pay Elon Musk?", mockTransactions);
  assert(ans5.includes("couldn't find a matching transaction"), 'Returns clean no-match security response', `Got: ${ans5}`);

  // Test 6: Empty transaction history
  console.log('\nTest 6: Empty Transaction History');
  const ans6 = await provider.answerPaymentMemory("How much did I pay Rahul?", []);
  assert(ans6.includes("couldn't find any completed transactions"), 'Handles empty history gracefully', `Got: ${ans6}`);

  // Test 7: Verify FAILED/CANCELLED transactions strictly excluded
  console.log('\nTest 7: Verification that FAILED/CANCELLED transactions are excluded');
  const ans7 = await provider.answerPaymentMemory("Show payments to Maria", mockTransactions);
  assert(ans7.includes('25.00') && !ans7.includes('200.00'), 'Only counts COMPLETED 25.00 payment to Maria', `Got: ${ans7}`);

  console.log(`\n======================================================`);
  console.log(`📊 AI Payment Memory Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPaymentMemoryTests();
}
