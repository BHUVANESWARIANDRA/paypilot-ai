import { Router, Request, Response } from 'express';
import { aiService } from '../services/ai/aiService';
import { riskAnalyzer } from '../services/risk/riskAnalyzer';
import { databaseService } from '../services/db/databaseService';

const router = Router();

// POST /api/ai/parse-payment
router.post('/parse-payment', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required and must be a string' });
    }

    const paymentIntent = await aiService.parsePrompt(prompt);
    
    // Retrieve historical completed transactions for database-grounded risk analysis
    const history = await databaseService.getTransactions();
    const riskAnalysis = riskAnalyzer.analyzePayment(paymentIntent, history);

    return res.json({
      paymentIntent,
      paymentDetails: {
        recipient: paymentIntent.recipient || 'Unspecified Recipient',
        amount: paymentIntent.amount || 0,
        currency: paymentIntent.currency,
        purpose: paymentIntent.purpose || 'Payment',
        notes: paymentIntent.notes,
        confidenceScore: Math.round(paymentIntent.confidence * 100),
        missingFields: paymentIntent.missingFields
      },
      riskAnalysis,
      rawPrompt: prompt,
      providerUsed: aiService.getProviderName()
    });
  } catch (err: any) {
    console.error('[AI Parse Route Error]', err);
    return res.status(500).json({ error: err.message || 'Internal server error processing payment AI prompt' });
  }
});

// POST /api/ai/summarize-payment
router.post('/summarize-payment', async (req: Request, res: Response) => {
  try {
    const { paymentDetails, paypalOrderId, status } = req.body;
    if (!paymentDetails || !paypalOrderId) {
      return res.status(400).json({ error: 'paymentDetails and paypalOrderId are required' });
    }

    const summary = await aiService.generateSummary(paymentDetails, paypalOrderId, status || 'COMPLETED');
    return res.json({ summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate payment summary' });
  }
});

// POST /api/ai/payment-memory
router.post('/payment-memory', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'A valid question string is required' });
    }

    const allTx = await databaseService.getTransactions();
    const completedTx = allTx.filter(t => t.status === 'COMPLETED');

    const answer = await aiService.answerPaymentMemory(question, completedTx);

    const words = question.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !['how', 'much', 'did', 'pay', 'show', 'the', 'what', 'for', 'spend', 'spent', 'on'].includes(w));
    const matchingTransactions = completedTx.filter(t => {
      const rec = t.recipient.toLowerCase();
      const pur = t.purpose.toLowerCase();
      return words.some(w => rec.includes(w) || pur.includes(w));
    });

    return res.json({
      question: question.trim(),
      answer,
      matchingTransactions: matchingTransactions.length > 0 ? matchingTransactions : completedTx.slice(0, 3),
      totalMatches: matchingTransactions.length,
      totalCompletedTransactions: completedTx.length,
      providerUsed: aiService.getProviderName()
    });
  } catch (err: any) {
    console.error('[AI Payment Memory Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to process AI payment memory request' });
  }
});

// GET /api/ai/status
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    provider: aiService.getProviderName(),
    status: 'ACTIVE'
  });
});

export default router;
