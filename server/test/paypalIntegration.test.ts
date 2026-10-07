import { PayPalService } from '../src/services/paypal/paypalService';

export async function runPayPalIntegrationTests() {
  console.log('🧪 Starting PayPal Sandbox Service Integration Tests...\n');
  const paypal = new PayPalService();

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

  // Test 1: Input Validation - Reject Invalid Amount
  console.log('Test 1: Rejection of Invalid Payment Amount');
  const check1 = paypal.validatePaymentInput({ amount: -50, currency: 'USD', recipient: 'Rahul', purpose: 'repair' });
  assert(!check1.valid, 'Reject negative amount', `Errors: ${check1.errors.join(', ')}`);
  assert(check1.errors.some(e => e.includes('positive number')), 'Amount error message present');

  // Test 2: Input Validation - Reject Unsupported Currency
  console.log('\nTest 2: Rejection of Unsupported Currency Code');
  const check2 = paypal.validatePaymentInput({ amount: 100, currency: 'INVALID_CURR', recipient: 'Rahul', purpose: 'repair' });
  assert(!check2.valid, 'Reject invalid currency code', `Errors: ${check2.errors.join(', ')}`);

  // Test 3: Input Validation - Reject Missing Recipient
  console.log('\nTest 3: Rejection of Missing Recipient');
  const check3 = paypal.validatePaymentInput({ amount: 100, currency: 'USD', recipient: '', purpose: 'repair' });
  assert(!check3.valid, 'Reject empty recipient', `Errors: ${check3.errors.join(', ')}`);

  // Test 4: Input Validation - Accept Valid Input Payload
  console.log('\nTest 4: Acceptance of Valid Payment Request');
  const check4 = paypal.validatePaymentInput({ amount: 100, currency: 'USD', recipient: 'Rahul', purpose: 'Laptop repair service' });
  assert(check4.valid, 'Accept valid payload', `Errors: ${check4.errors.join(', ')}`);

  // Test 5: Missing Credentials Error Handling Check
  console.log('\nTest 5: Clear Error Reporting when Credentials are Missing');
  if (!paypal.isCredentialsConfigured()) {
    try {
      await paypal.getAccessToken();
      assert(false, 'Should throw error when credentials missing');
    } catch (err: any) {
      assert(err.message.includes('unconfigured') || err.message.includes('missing'), 'Throws clear configuration error', err.message);
    }
  } else {
    console.log('  ℹ️ Credentials present in environment. Testing live token generation...');
    try {
      const token = await paypal.getAccessToken();
      assert(Boolean(token), 'Generates valid OAuth token');
    } catch (err: any) {
      assert(false, 'OAuth token generation', err.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`📊 PayPal Integration Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPayPalIntegrationTests();
}
