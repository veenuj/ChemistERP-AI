import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard'; // Import your new Dashboard
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import AiCopilot from './pages/AiCopilot';
import TransactionHistory from './pages/TransactionHistory';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Default to Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/ai-copilot" element={<AiCopilot />} />
          <Route path="/history" element={<TransactionHistory />} />
        </Routes>
      </Layout>
    </Router>
  );
}