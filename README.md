# PayPilot AI 🚀
> **"Your intelligent assistant for safer, simpler payments."**

Built for the **PayPal AI Hackathon**.

PayPilot AI is an AI-powered payment agent that allows users to describe payment requests in natural language. It understands the request, extracts payment parameters, performs contextual risk and safety analysis, presents a clear payment preview requiring explicit user confirmation, and executes payments securely through **PayPal Sandbox Orders v2 API**.

---

## 🌟 Key Features

1. **Natural Language Payment Extraction**: Parses prompts like *"Pay $50 to Rahul for laptop repair"* into structured attributes (`recipient`, `amount`, `currency`, `purpose`, `notes`).
2. **AI Provider Abstraction**: Switchable provider model (`AIProvider` interface) supporting Google Gemini API, OpenAI GPT, or a deterministic local rule-engine fallback via environment variables (`AI_PROVIDER`).
3. **Context & Risk Analysis Engine**: Automated security analysis scoring transactions (0–100 risk score), flagging missing details, high amounts (> $500, > $2000), or suspicious terms before authorization.
4. **Human-in-the-Loop Explicit Confirmation**: Security-first UX. Payments are **never** automatically executed from AI output alone. Always requires explicit preview verification and confirmation.
5. **Authentic PayPal Sandbox Integration**: Uses official PayPal Orders v2 REST API (`POST /v2/checkout/orders` and `POST /v2/checkout/orders/{id}/capture`). Never uses fake success screens.
6. **Concise AI Payment Summaries**: AI generates personalized, concise transaction receipts post-capture.
7. **Supabase Database & Local Fallback**: Persistent transaction logging supporting Supabase PostgreSQL or zero-config in-memory storage.
8. **Fintech UI & Developer Inspector**: Modern navy/indigo visual style, responsive dashboard, real-time filters, and a raw PayPal JSON payload inspector.

---

## 🏗️ Architecture & Code Structure

```
Devpost/
├── client/                     # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, RiskAnalysisBadge, PayPalButtonContainer)
│   │   ├── pages/              # Dashboard, AIAssistant, PaymentPreview, PaymentResult, PaymentHistory, Settings
│   │   ├── services/           # Axios API Client
│   │   ├── types/              # Typed Interfaces (PaymentDetails, RiskAnalysis, Transaction)
│   │   ├── App.tsx             # Main router & PayPal SDK provider wrapper
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # Environment configuration (env.ts)
│   │   ├── routes/             # Express routes (aiRoutes.ts, paymentRoutes.ts)
│   │   ├── services/
│   │   │   ├── ai/             # AI Abstraction (AIProvider interface, Gemini, OpenAI, Fallback)
│   │   │   ├── db/             # Supabase client & Memory fallback store
│   │   │   ├── paypal/         # Server-side PayPal Orders v2 REST API integration
│   │   │   └── risk/           # Context risk analyzer engine
│   │   ├── types/              # Server interfaces
│   │   └── index.ts            # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── .env.example                # Environment variables template
├── supabase_schema.sql         # Database schema for Supabase
└── README.md                   # Project documentation
```

---

## ⚙️ Quick Start Setup Instructions

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**

### 2. Environment Configuration
Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Edit `.env` to configure your preferred AI provider and credentials:

```env
PORT=5000

# PayPal Sandbox Credentials (from https://developer.paypal.com)
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_MODE=sandbox

# AI Provider ('gemini', 'openai', or 'fallback')
AI_PROVIDER=fallback
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Supabase (Optional for persistent DB)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Running the Server & Client

In the root directory, install dependencies and start the backend & frontend servers:

#### Terminal 1 (Backend Server):
```bash
cd server
npm install
npm run dev
```
Backend will start on `http://localhost:5000`.

#### Terminal 2 (Frontend App):
```bash
cd client
npm install
npm run dev
```
Frontend will start on `http://localhost:3000`.

---

## 💳 Testing PayPal Sandbox Integration

1. Go to `http://localhost:3000`.
2. Click one of the example prompts (e.g. *"Pay $50 to Rahul for laptop repair"*).
3. PayPilot AI extracts recipient, amount, currency, purpose, and conducts context safety checks.
4. Click **Generate Payment Preview**.
5. Check the explicit authorization checkbox.
6. Click **Confirm & Process PayPal Sandbox Payment**.
7. PayPilot AI triggers `POST /api/paypal/create-order` and `POST /api/paypal/capture-order` against `api-m.sandbox.paypal.com`.
8. The real PayPal capture response is received, stored in the database, and an AI summary is generated.

---

## 🗄️ Database Setup (Supabase)

To connect Supabase PostgreSQL:
1. Create a project on [Supabase](https://supabase.com).
2. Open the **SQL Editor** in Supabase dashboard.
3. Paste and run the DDL contents from `supabase_schema.sql`.
4. Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your `.env` file.

---

## 🔒 Security & Best Practices

- **Zero Secret Exposure**: PayPal Client Secret and AI API Keys are **strictly** kept server-side in `server/src/config/env.ts`.
- **Sandbox Compliance**: Exclusively targets PayPal Sandbox endpoints (`api-m.sandbox.paypal.com`).
- **Clean Architecture**: Decoupled routes, services, and AI provider implementations for easy extension.
