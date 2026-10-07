import { FallbackProvider } from '../src/services/ai/fallbackProvider';
import { validateAndSanitizePaymentIntent } from '../src/services/ai/paymentIntentSchema';

export async function runPaymentEngineTests() {
  console.log('🧪 Starting PayPilot AI Payment Engine Unit Tests...\n');
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

  // Test 1: Complete request ("Pay $100 to Rahul for laptop repair")
  console.log('Test 1: Complete Payment Intent Request');
  const res1 = await provider.parsePaymentPrompt("Pay $100 to Rahul for laptop repair");
  assert(res1.recipient === 'Rahul', 'Extract recipient', `Expected Rahul, got ${res1.recipient}`);
  assert(res1.amount === 100, 'Extract amount', `Expected 100, got ${res1.amount}`);
  assert(res1.currency === 'USD', 'Extract currency USD', `Expected USD, got ${res1.currency}`);
  assert(res1.purpose?.toLowerCase() === 'laptop repair', 'Extract purpose', `Expected laptop repair, got ${res1.purpose}`);
  assert(res1.missingFields.length === 0, 'No missing fields', `Expected 0 missing, got ${res1.missingFields.join(', ')}`);
  assert(res1.confidence >= 0.90, 'High confidence score', `Got ${res1.confidence}`);
  assert(typeof res1.confirmationMessage === 'string', 'Confirmation message present', `Got ${res1.confirmationMessage}`);

  // Test 2: Missing amount & purpose ("Pay Rahul")
  console.log('\nTest 2: Request Missing Amount & Purpose');
  const res2 = await provider.parsePaymentPrompt("Pay Rahul");
  assert(res2.recipient === 'Rahul', 'Extract recipient', `Expected Rahul, got ${res2.recipient}`);
  assert(res2.amount === null, 'Amount is null', `Expected null, got ${res2.amount}`);
  assert(res2.missingFields.includes('amount'), 'Missing amount detected', `Missing fields: ${res2.missingFields.join(', ')}`);
  assert(res2.missingFields.includes('purpose'), 'Missing purpose detected', `Missing fields: ${res2.missingFields.join(', ')}`);
  assert(typeof res2.clarificationMessage === 'string', 'Clarification message present asking for info', `Got ${res2.clarificationMessage}`);

  // Test 3: Missing recipient ("Pay $50 for dinner")
  console.log('\nTest 3: Request Missing Recipient');
  const res3 = await provider.parsePaymentPrompt("Pay $50 for dinner");
  assert(res3.recipient === null, 'Recipient is null', `Expected null, got ${res3.recipient}`);
  assert(res3.amount === 50, 'Extract amount 50', `Expected 50, got ${res3.amount}`);
  assert(res3.purpose?.toLowerCase() === 'dinner', 'Extract purpose dinner', `Expected dinner, got ${res3.purpose}`);
  assert(res3.missingFields.includes('recipient'), 'Missing recipient detected', `Missing fields: ${res3.missingFields.join(', ')}`);
  assert(typeof res3.clarificationMessage === 'string', 'Clarification message present', `Got ${res3.clarificationMessage}`);

  // Test 4: Euro currency & notes ("Send €25 to Maria for dinner with notes split Italian bill")
  console.log('\nTest 4: Currency EUR & Notes Extraction');
  const res4 = await provider.parsePaymentPrompt("Send €25 to Maria for dinner with notes split Italian bill");
  assert(res4.recipient === 'Maria', 'Extract recipient Maria', `Got ${res4.recipient}`);
  assert(res4.amount === 25, 'Extract amount 25', `Got ${res4.amount}`);
  assert(res4.currency === 'EUR', 'Extract currency EUR', `Got ${res4.currency}`);
  assert(res4.purpose?.toLowerCase() === 'dinner', 'Extract purpose dinner', `Got ${res4.purpose}`);
  assert(res4.notes === 'split Italian bill', 'Extract notes', `Got ${res4.notes}`);
  assert(res4.missingFields.length === 0, 'No missing fields', `Got ${res4.missingFields.join(', ')}`);

  // Test 5: Vendor payment ("Pay $120 to ABC Services for website hosting")
  console.log('\nTest 5: Vendor Payment Request');
  const res5 = await provider.parsePaymentPrompt("Pay $120 to ABC Services for website hosting");
  assert(res5.recipient === 'ABC Services', 'Extract recipient ABC Services', `Got ${res5.recipient}`);
  assert(res5.amount === 120, 'Extract amount 120', `Got ${res5.amount}`);
  assert(res5.purpose?.toLowerCase() === 'website hosting', 'Extract purpose website hosting', `Got ${res5.purpose}`);

  // Test 6: Schema Sanity Validator Direct Check
  console.log('\nTest 6: Direct Schema Sanitization Test');
  const sanitized = validateAndSanitizePaymentIntent({
    recipient: '  John Doe  ',
    amount: '99.999',
    currency: 'usd',
    purpose: '  Consulting  ',
    confidence: 0.95
  }, "Pay John Doe $99.999 for consulting");

  assert(sanitized.recipient === 'John Doe', 'Sanitize recipient whitespace', `Got ${sanitized.recipient}`);
  assert(sanitized.amount === 100, 'Round amount to 2 decimals', `Got ${sanitized.amount}`);
  assert(sanitized.currency === 'USD', 'Uppercase currency', `Got ${sanitized.currency}`);
  assert(sanitized.purpose === 'Consulting', 'Sanitize purpose whitespace', `Got ${sanitized.purpose}`);
  assert(sanitized.missingFields.length === 0, 'Sanitized missingFields empty', `Got ${sanitized.missingFields}`);

  console.log(`\n======================================================`);
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// Auto-run if executed directly
if (require.main === module) {
  runPaymentEngineTests();
}
