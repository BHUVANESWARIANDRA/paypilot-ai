import { RiskAnalyzer } from '../src/services/risk/riskAnalyzer';
import { FallbackProvider } from '../src/services/ai/fallbackProvider';
import { TransactionRecord } from '../src/types';

export async function runCurrencySafetyTests() {
  console.log('🧪 Starting Currency-Safe Transaction Aggregation & Safety Unit Tests...\n');
  const analyzer = new RiskAnalyzer();
  const fallback = new FallbackProvider();

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

  const multiCurrencyHistory: TransactionRecord[] = [
    {
      id: 'tx-usd-1',
      paypalOrderId: 'ORD-U1',
      recipient: 'Rahul',
      amount: 50.00,
      currency: 'USD',
      purpose: 'repair',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 10,
      riskReasons: [],
      createdAt: '2026-03-01T10:00:00Z'
    },
    {
      id: 'tx-usd-2',
      paypalOrderId: 'ORD-U2',
      recipient: 'Rahul',
      amount: 75.00,
      currency: 'USD',
      purpose: 'cable',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 10,
      riskReasons: [],
      createdAt: '2026-03-02T10:00:00Z'
    },
    {
      id: 'tx-eur-1',
      paypalOrderId: 'ORD-E1',
      recipient: 'Rahul',
      amount: 1000.00,
      currency: 'EUR',
      purpose: 'heavy server setup',
      status: 'COMPLETED',
      riskLevel: 'MEDIUM',
      riskScore: 40,
      riskReasons: [],
      createdAt: '2026-03-03T10:00:00Z'
    },
    {
      id: 'tx-gbp-1',
      paypalOrderId: 'ORD-G1',
      recipient: 'Maria',
      amount: 50.00,
      currency: 'GBP',
      purpose: 'consulting',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 10,
      riskReasons: [],
      createdAt: '2026-03-04T10:00:00Z'
    }
  ];

  // Test A & B: Aggregation logic checks
  console.log('Test A: Single Currency Aggregation');
  const usdTx = multiCurrencyHistory.filter(t => t.currency === 'USD');
  const usdSum = usdTx.reduce((sum, t) => sum + t.amount, 0);
  assert(usdSum === 125.00, 'Single currency USD sum is 125.00', `Got: ${usdSum}`);

  console.log('\nTest B: Multiple Currency Separation (Never Direct Summation)');
  const totalsByCurrency: Record<string, number> = {};
  multiCurrencyHistory.forEach(t => {
    totalsByCurrency[t.currency] = (totalsByCurrency[t.currency] || 0) + t.amount;
  });
  assert(totalsByCurrency['USD'] === 125.00, 'USD total is 125.00', `Got: ${totalsByCurrency['USD']}`);
  assert(totalsByCurrency['EUR'] === 1000.00, 'EUR total is 1000.00', `Got: ${totalsByCurrency['EUR']}`);
  assert(totalsByCurrency['GBP'] === 50.00, 'GBP total is 50.00', `Got: ${totalsByCurrency['GBP']}`);
  const directSum = multiCurrencyHistory.reduce((sum, t) => sum + t.amount, 0);
  assert(directSum !== totalsByCurrency['USD'], 'Unsafe cross-currency direct sum (1175) is NOT presented as USD total', `Direct sum: ${directSum}`);

  // Test C & D: RiskAnalyzer recipient history currency safety
  console.log('\nTest C & D: RiskAnalyzer Recipient USD Average Ignores EUR Transactions');
  const usdAnalysis = analyzer.analyzePayment(
    {
      recipient: 'Rahul',
      amount: 60.00,
      currency: 'USD',
      purpose: 'tune up',
      missingFields: [],
      confidence: 0.95
    },
    multiCurrencyHistory
  );
  // Rahul USD avg should be (50 + 75)/2 = 62.50. EUR 1000 must NOT be included!
  assert(usdAnalysis.historicalContext.recipientFound === true, 'recipientFound is true for Rahul', `Got: ${usdAnalysis.historicalContext.recipientFound}`);
  assert(usdAnalysis.historicalContext.averagePaymentToRecipient === 62.50, 'averagePaymentToRecipient is 62.50 USD (EUR 1000 ignored)', `Got avg: ${usdAnalysis.historicalContext.averagePaymentToRecipient}`);

  // Test E: Recipient with history ONLY in another currency
  console.log('\nTest E: Recipient with History in EUR, current payment in USD');
  const eurOnlyAnalysis = analyzer.analyzePayment(
    {
      recipient: 'Maria',
      amount: 100.00,
      currency: 'USD',
      purpose: 'design fee',
      missingFields: [],
      confidence: 0.95
    },
    multiCurrencyHistory
  );
  // Maria has 1 GBP payment (50.00). When current payment is USD:
  // recipientFound is true (Maria was paid before)
  // averagePaymentToRecipient for USD is null (no prior USD payments to Maria)
  assert(eurOnlyAnalysis.historicalContext.recipientFound === true, 'recipientFound is true (has GBP history)', `Got: ${eurOnlyAnalysis.historicalContext.recipientFound}`);
  assert(eurOnlyAnalysis.historicalContext.averagePaymentToRecipient === null, 'averagePaymentToRecipient is null (0 USD history)', `Got: ${eurOnlyAnalysis.historicalContext.averagePaymentToRecipient}`);

  // Test F: AI Payment Memory Currency Separation
  console.log('\nTest F: Payment Memory Reports Currency-Aware Answer');
  const memoryAnswer = await fallback.answerPaymentMemory('How much did I pay Rahul?', multiCurrencyHistory);
  assert(memoryAnswer.includes('125.00 USD'), 'Memory answer includes 125.00 USD', `Answer: ${memoryAnswer}`);
  assert(memoryAnswer.includes('1000.00 EUR'), 'Memory answer includes 1000.00 EUR', `Answer: ${memoryAnswer}`);
  assert(!memoryAnswer.includes('1175'), 'Memory answer DOES NOT sum across USD and EUR to 1175', `Answer: ${memoryAnswer}`);

  // Test G: Existing Single-Currency behavior unchanged
  console.log('\nTest G: Single Currency Payment Memory');
  const singleCurrencyHistory = multiCurrencyHistory.filter(t => t.recipient === 'Rahul' && t.currency === 'USD');
  const singleAns = await fallback.answerPaymentMemory('How much did I pay Rahul?', singleCurrencyHistory);
  assert(singleAns.includes('125.00 USD'), 'Single currency memory reports USD 125.00', `Answer: ${singleAns}`);

  console.log(`\n======================================================`);
  console.log(`📊 Currency Safety Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runCurrencySafetyTests();
}
