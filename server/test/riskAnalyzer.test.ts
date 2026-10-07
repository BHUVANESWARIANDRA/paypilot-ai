import { RiskAnalyzer } from '../src/services/risk/riskAnalyzer';
import { TransactionRecord } from '../src/types';

export async function runRiskAnalyzerTests() {
  console.log('🧪 Starting Explainable & Database-Grounded RiskAnalyzer Unit Tests...\n');
  const analyzer = new RiskAnalyzer();

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

  // Mock Database History Dataset (including COMPLETED, FAILED, and CANCELLED transactions)
  const mockHistory: TransactionRecord[] = [
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
      createdAt: '2026-03-01T10:00:00Z'
    },
    {
      id: 'tx-2',
      paypalOrderId: 'ORD-2',
      recipient: 'Rahul',
      amount: 50.00,
      currency: 'USD',
      purpose: 'diagnostic fee',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 10,
      riskReasons: [],
      createdAt: '2026-03-02T10:00:00Z'
    },
    {
      id: 'tx-3',
      paypalOrderId: 'ORD-3',
      recipient: 'Rahul',
      amount: 75.00,
      currency: 'USD',
      purpose: 'cable replacement',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 10,
      riskReasons: [],
      createdAt: '2026-03-03T10:00:00Z'
    },
    {
      id: 'tx-4',
      paypalOrderId: 'ORD-4',
      recipient: 'Rahul',
      amount: 50.00,
      currency: 'USD',
      purpose: 'screen wipe',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 10,
      riskReasons: [],
      createdAt: '2026-03-04T10:00:00Z'
    },
    {
      id: 'tx-5',
      paypalOrderId: 'ORD-5',
      recipient: 'Maria',
      amount: 25.00,
      currency: 'USD',
      purpose: 'dinner split',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 5,
      riskReasons: [],
      createdAt: '2026-03-05T10:00:00Z'
    },
    {
      id: 'tx-6',
      paypalOrderId: 'ORD-6',
      recipient: 'Rahul',
      amount: 5000.00,
      currency: 'USD',
      purpose: 'failed hardware upgrade',
      status: 'FAILED', // SHOULD BE EXCLUDED FROM COMPLETED HISTORY!
      riskLevel: 'HIGH',
      riskScore: 90,
      riskReasons: [],
      createdAt: '2026-03-06T10:00:00Z'
    }
  ];

  // Test 1: Baseline Low amount valid payment without history
  console.log('Test 1: Low Amount Valid Payment Without History');
  const res1 = analyzer.analyzePayment({
    recipient: 'Rahul',
    amount: 50,
    currency: 'USD',
    purpose: 'laptop repair',
    missingFields: [],
    confidence: 0.95
  });
  assert(res1.level === 'LOW', 'Low risk level', `Got level: ${res1.level}`);
  assert(res1.score < 35, 'Low risk score', `Got score: ${res1.score}`);

  // Test 2: First-Time Recipient Detection (A. First-time recipient)
  console.log('\nTest 2: First-Time Recipient Detection ("NewRecipient")');
  const res2 = analyzer.analyzePayment(
    {
      recipient: 'NewRecipient',
      amount: 50,
      currency: 'USD',
      purpose: 'book purchase',
      missingFields: [],
      confidence: 0.95
    },
    mockHistory
  );
  assert(res2.historicalContext.recipientFound === false, 'recipientFound is false', `Got: ${res2.historicalContext.recipientFound}`);
  assert(res2.reasons.some(r => r.includes('First-time payment to recipient')), 'Generates first-time recipient reason', `Reasons: ${res2.reasons.join(', ')}`);
  assert(res2.score > res1.score, 'Risk score increases appropriately for first-time recipient', `Score: ${res2.score}`);

  // Test 3: Known Recipient Check (B. Known recipient & C. Normal historical amount)
  console.log('\nTest 3: Known Recipient with Normal Historical Amount ($50 vs $56.25 avg)');
  const res3 = analyzer.analyzePayment(
    {
      recipient: 'Rahul',
      amount: 50,
      currency: 'USD',
      purpose: 'cleaning service',
      missingFields: [],
      confidence: 0.95
    },
    mockHistory
  );
  assert(res3.historicalContext.recipientFound === true, 'recipientFound is true', `Got: ${res3.historicalContext.recipientFound}`);
  assert(res3.historicalContext.previousPaymentCount === 4, 'previousPaymentCount is 4', `Got count: ${res3.historicalContext.previousPaymentCount}`);
  assert(res3.historicalContext.averagePaymentToRecipient === 56.25, 'averagePaymentToRecipient is 56.25', `Got avg: ${res3.historicalContext.averagePaymentToRecipient}`);
  assert(!res3.reasons.some(r => r.includes('First-time payment')), 'No first-time recipient warning');
  assert(!res3.reasons.some(r => r.includes('significantly higher than your historical average')), 'No unusual amount warning');

  // Test 4: Unusual Historical Amount to Recipient (D. Unusual historical amount)
  console.log('\nTest 4: Unusual Historical Amount ($500 vs $56.25 avg)');
  const res4 = analyzer.analyzePayment(
    {
      recipient: 'Rahul',
      amount: 500,
      currency: 'USD',
      purpose: 'major server repair',
      missingFields: [],
      confidence: 0.95
    },
    mockHistory
  );
  assert(res4.reasons.some(r => r.includes('significantly higher than your historical average payment to Rahul ($56.25)')), 'Generates historical average comparison reason', `Reasons: ${res4.reasons.join(', ')}`);
  assert(res4.score > res3.score, 'Risk score increases due to unusual historical amount', `Score: ${res4.score}`);

  // Test 5: Insufficient User History (E. Insufficient history)
  console.log('\nTest 5: Insufficient History (< 3 transactions)');
  const smallHistory: TransactionRecord[] = [mockHistory[0], mockHistory[1]]; // Only 2 completed
  const res5 = analyzer.analyzePayment(
    {
      recipient: 'Maria',
      amount: 50,
      currency: 'USD',
      purpose: 'lunch',
      missingFields: [],
      confidence: 0.95
    },
    smallHistory
  );
  assert(res5.historicalContext.userAveragePayment === null, 'userAveragePayment is null for history < 3', `Got: ${res5.historicalContext.userAveragePayment}`);

  // Test 6: User-Level Spending Pattern (F. User-level unusual amount)
  console.log('\nTest 6: User-Level Spending Pattern (> 3x User Average)');
  // Total completed in mockHistory = 50+50+75+50+25 = 250 / 5 = 50.00 avg
  const res6 = analyzer.analyzePayment(
    {
      recipient: 'NewRecipient',
      amount: 250,
      currency: 'USD',
      purpose: 'gadget',
      missingFields: [],
      confidence: 0.95
    },
    mockHistory
  );
  assert(res6.historicalContext.userAveragePayment === 50, 'userAveragePayment is 50', `Got user avg: ${res6.historicalContext.userAveragePayment}`);
  assert(res6.reasons.some(r => r.includes('unusually higher than your overall average payment activity ($50.00)')), 'Generates user overall average warning', `Reasons: ${res6.reasons.join(', ')}`);

  // Test 7: Exclude FAILED/CANCELLED transactions (G. Excluded non-completed)
  console.log('\nTest 7: Exclusion of FAILED/CANCELLED transactions from completed history');
  // mockHistory contains a FAILED payment of 5000.00 to Rahul. If included, average would be > 1000.
  // With strict filtering, Rahul avg = 56.25.
  assert(res4.historicalContext.averagePaymentToRecipient === 56.25, 'Average excludes FAILED 5000.00 payment', `Got avg: ${res4.historicalContext.averagePaymentToRecipient}`);

  // Test 8: Tone & Safety Rule Check
  console.log('\nTest 8: Tone & Safety Language Rule Check');
  const forbiddenWords = ['fraud', 'scammer', 'dangerous', 'illegal', 'crime'];
  const fullText = (res4.reasons.join(' ') + ' ' + res4.recommendation).toLowerCase();
  const hasForbidden = forbiddenWords.some(w => fullText.includes(w));
  assert(!hasForbidden, 'Contains NO forbidden accusatory words', `Text: ${fullText}`);

  console.log(`\n======================================================`);
  console.log(`📊 Risk Analyzer Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runRiskAnalyzerTests();
}
