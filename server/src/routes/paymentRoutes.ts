import { Router, Request, Response } from 'express';
import { paypalService } from '../services/paypal/paypalService';
import { databaseService } from '../services/db/databaseService';
import { aiService } from '../services/ai/aiService';
import { riskAnalyzer } from '../services/risk/riskAnalyzer';

const router = Router();

const handleCreateOrder = async (req: Request, res: Response) => {
  try {
    const { paymentDetails } = req.body;
    if (!paymentDetails) {
      return res.status(400).json({ error: 'Missing paymentDetails in request body' });
    }

    const validation = paypalService.validatePaymentInput(paymentDetails);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid payment parameters',
        details: validation.errors
      });
    }

    const order = await paypalService.createOrder(paymentDetails);

    return res.json({
      success: true,
      orderId: order.orderId,
      status: order.status,
      approveUrl: order.approveUrl,
      raw: order.raw
    });
  } catch (err: any) {
    console.error('[Create Order Route Error]', err.message);
    return res.status(500).json({ error: err.message || 'Failed to create PayPal sandbox order' });
  }
};

const handleCaptureOrder = async (req: Request, res: Response) => {
  try {
    const { orderId, paymentDetails } = req.body;
    if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
      return res.status(400).json({ error: 'Valid orderId string is required to capture payment' });
    }

    const existingTx = await databaseService.getTransactionById(orderId);
    if (existingTx && existingTx.status === 'COMPLETED') {
      console.log(`[PayPal Capture] Order ${orderId} was already captured and finalized.`);
      return res.json({
        success: true,
        message: 'Order was already captured and finalized.',
        transaction: existingTx,
        capture: { captureId: existingTx.paypalCaptureId, status: 'COMPLETED', raw: existingTx.rawPaypalResponse }
      });
    }

    const captureResult = await paypalService.captureOrder(orderId);

    if (captureResult.status !== 'COMPLETED') {
      if (paymentDetails) {
        await databaseService.saveTransaction({
          paypalOrderId: orderId,
          paypalCaptureId: captureResult.captureId,
          recipient: paymentDetails.recipient || 'Unknown',
          amount: paymentDetails.amount || 0,
          currency: paymentDetails.currency || 'USD',
          purpose: paymentDetails.purpose || 'Failed Payment',
          notes: paymentDetails.notes,
          status: 'FAILED',
          riskLevel: 'HIGH',
          riskScore: 100,
          riskReasons: [`PayPal capture failed with status: ${captureResult.status}`],
          aiSummary: `Payment failed. PayPal capture returned status: ${captureResult.status}.`,
          rawPaypalResponse: captureResult.raw
        });
      }

      return res.status(400).json({
        success: false,
        error: `Payment capture failed. PayPal status: ${captureResult.status}`,
        capture: captureResult
      });
    }

    // Retrieve database history for risk analysis recalculation
    const history = await databaseService.getTransactions();
    const risk = paymentDetails ? riskAnalyzer.analyzePayment({
      recipient: paymentDetails.recipient,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      purpose: paymentDetails.purpose,
      notes: paymentDetails.notes,
      missingFields: [],
      confidence: (paymentDetails.confidenceScore || 95) / 100
    }, history) : { riskLevel: 'LOW', riskScore: 10, factors: [] };

    let aiSummary = '';
    if (paymentDetails) {
      aiSummary = await aiService.generateSummary(paymentDetails, orderId, captureResult.status);
    } else {
      aiSummary = `PayPal Sandbox Order ${orderId} successfully captured on ${new Date().toISOString()}.`;
    }

    const savedRecord = await databaseService.saveTransaction({
      paypalOrderId: orderId,
      paypalCaptureId: captureResult.captureId,
      recipient: paymentDetails?.recipient || 'PayPal Recipient',
      amount: paymentDetails?.amount || 0,
      currency: paymentDetails?.currency || 'USD',
      purpose: paymentDetails?.purpose || 'PayPal Payment',
      notes: paymentDetails?.notes || '',
      status: 'COMPLETED',
      riskLevel: risk.riskLevel as any,
      riskScore: risk.riskScore,
      riskReasons: (risk as any).reasons || (risk as any).factors?.map((f: any) => f.message) || [],
      aiSummary,
      rawPaypalResponse: captureResult.raw
    });

    return res.json({
      success: true,
      message: 'Payment successfully captured and confirmed by PayPal Sandbox.',
      transaction: savedRecord,
      capture: captureResult
    });
  } catch (err: any) {
    console.error('[Capture Order Route Error]', err.message);
    return res.status(500).json({ error: err.message || 'Failed to capture PayPal sandbox order' });
  }
};

router.post('/payments/create-order', handleCreateOrder);
router.post('/payments/capture-order', handleCaptureOrder);

router.post('/paypal/create-order', handleCreateOrder);
router.post('/paypal/capture-order', handleCaptureOrder);

router.get('/transactions', async (_req: Request, res: Response) => {
  try {
    const transactions = await databaseService.getTransactions();
    const completed = transactions.filter(t => t.status === 'COMPLETED');

    const totalsByCurrency: Record<string, number> = {};
    completed.forEach(t => {
      const curr = (t.currency || 'USD').toUpperCase();
      totalsByCurrency[curr] = Math.round(((totalsByCurrency[curr] || 0) + t.amount) * 100) / 100;
    });

    const uniqueCurrencies = Object.keys(totalsByCurrency);
    const totalVolume = uniqueCurrencies.length === 1 ? totalsByCurrency[uniqueCurrencies[0]] : null;

    const completedCount = completed.length;
    const lowRiskCount = transactions.filter(t => t.riskLevel === 'LOW').length;
    const isSupabase = databaseService.isSupabaseConnected();

    return res.json({
      transactions,
      stats: {
        totalVolume,
        totalsByCurrency,
        totalCount: transactions.length,
        completedCount,
        lowRiskCount,
        safetyRating: transactions.length ? Math.round((lowRiskCount / transactions.length) * 100) : 100
      },
      databaseMode: isSupabase ? 'SUPABASE' : 'MEMORY'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch transactions' });
  }
});

router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tx = await databaseService.getTransactionById(id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    return res.json(tx);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch transaction' });
  }
});

export default router;
