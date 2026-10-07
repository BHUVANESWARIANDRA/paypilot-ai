import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import aiRoutes from './routes/aiRoutes';
import paymentRoutes from './routes/paymentRoutes';

const app = express();
const PORT = ENV.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api', paymentRoutes); // handles /api/payments/*, /api/paypal/*, /api/transactions

// System Health & Config Endpoint
app.get('/api/health', (_req, res) => {
  const hasCreds = Boolean(ENV.PAYPAL_CLIENT_ID && ENV.PAYPAL_CLIENT_SECRET && !ENV.PAYPAL_CLIENT_ID.startsWith('your_'));
  res.json({
    app: 'PayPilot AI Backend Server',
    status: 'ONLINE',
    env: ENV.NODE_ENV,
    paypalMode: ENV.PAYPAL_MODE,
    paypalClientId: hasCreds ? ENV.PAYPAL_CLIENT_ID : 'test',
    hasPayPalCredentials: hasCreds,
    aiProvider: ENV.AI_PROVIDER,
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
  ======================================================
  🚀 PayPilot AI Backend Server Listening on Port ${PORT}
  ======================================================
  Mode: ${ENV.NODE_ENV}
  PayPal Sandbox: ${ENV.PAYPAL_MODE}
  AI Provider: ${ENV.AI_PROVIDER.toUpperCase()}
  Health check: http://localhost:${PORT}/api/health
  ======================================================
  `);
});
