import React, { useState, useEffect } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { AIAssistant } from './pages/AIAssistant';
import { AIPaymentMemory } from './pages/AIPaymentMemory';
import { PaymentPreview } from './pages/PaymentPreview';
import { PaymentResult } from './pages/PaymentResult';
import { PaymentHistory } from './pages/PaymentHistory';
import { TransactionDetails } from './pages/TransactionDetails';
import { Settings } from './pages/Settings';
import { ParsedAIResponse, Transaction } from './types/payment';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [parsedData, setParsedData] = useState<ParsedAIResponse | null>(null);
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('test');

  useEffect(() => {
    // Check backend health for paypal credentials and client ID
    api.getHealthStatus().then(data => {
      setHasCredentials(data.hasPayPalCredentials);
      if ((data as any).paypalClientId) {
        setPaypalClientId((data as any).paypalClientId);
      }
    }).catch(() => {});
  }, []);

  const handleNavigateWithPrompt = (tab: string, prompt?: string) => {
    if (prompt) {
      setAssistantPrompt(prompt);
    }
    setActiveTab(tab);
  };

  const handleProceedToPreview = (data: ParsedAIResponse) => {
    setParsedData(data);
    setActiveTab('preview');
  };

  const handlePaymentSuccess = (result: { transaction: Transaction; capture: any }) => {
    setCompletedTransaction(result.transaction);
    setActiveTab('result');
  };

  const handleSelectTransaction = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setActiveTab('details');
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: "USD",
        intent: "capture"
      }}
    >
      <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
        
        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          sandboxMode={true}
        />

        {/* Main View Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={handleNavigateWithPrompt}
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {activeTab === 'assistant' && (
            <AIAssistant
              initialPrompt={assistantPrompt}
              onProceedToPreview={handleProceedToPreview}
            />
          )}

          {activeTab === 'memory' && (
            <AIPaymentMemory
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {activeTab === 'preview' && parsedData && (
            <PaymentPreview
              parsedData={parsedData}
              onBack={() => setActiveTab('assistant')}
              onSuccess={handlePaymentSuccess}
              hasCredentials={hasCredentials}
            />
          )}

          {activeTab === 'result' && completedTransaction && (
            <PaymentResult
              transaction={completedTransaction}
              onNewPayment={() => {
                setAssistantPrompt('');
                setParsedData(null);
                setActiveTab('assistant');
              }}
              onViewHistory={() => setActiveTab('history')}
              onAskMemory={() => setActiveTab('memory')}
            />
          )}

          {activeTab === 'history' && (
            <PaymentHistory
              onSelectTransaction={handleSelectTransaction}
            />
          )}

          {activeTab === 'details' && selectedTransaction && (
            <TransactionDetails
              transaction={selectedTransaction}
              onBack={() => setActiveTab('history')}
            />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </main>

        {/* Footer */}
        <Footer />

      </div>
    </PayPalScriptProvider>
  );
};

export default App;
