import dotenv from 'dotenv';
import path from 'path';

// Load server/.env and root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
  PAYPAL_BASE_URL: process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com',
  AI_PROVIDER: (process.env.AI_PROVIDER || 'fallback').toLowerCase(),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  RISK_MEDIUM_THRESHOLD: parseFloat(process.env.RISK_MEDIUM_THRESHOLD || '500'),
  RISK_HIGH_THRESHOLD: parseFloat(process.env.RISK_HIGH_THRESHOLD || '2000')
};
