import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Calculator } from './components/Calculator/Calculator';
import { Payment } from './components/Payment/Payment';
import { Setup } from './components/Setup/Setup';
import { HelocStrategy } from './components/HelocStrategy/HelocStrategy';
import { OptimalStrategy } from './components/OptimalStrategy/OptimalStrategy';
import { TargetYearStrategy } from './components/TargetYearStrategy/TargetYearStrategy';
import { InvestmentComparison } from './components/InvestmentComparison/InvestmentComparison';
import { Login } from './components/Login/Login';
import { Signup } from './components/Signup/Signup';
import { Navigation } from './components/shared/Navigation';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const showNav = location.pathname !== '/setup' && location.pathname !== '/login' && location.pathname !== '/signup' && location.pathname !== '/';

  return (
    <div className="min-h-screen bg-gray-100">
      {showNav && <Navigation />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
        <Route path="/heloc-strategy" element={<ProtectedRoute><HelocStrategy /></ProtectedRoute>} />
        <Route path="/optimal-strategy" element={<ProtectedRoute><OptimalStrategy /></ProtectedRoute>} />
        <Route path="/target-year-strategy" element={<ProtectedRoute><TargetYearStrategy /></ProtectedRoute>} />
        <Route path="/investment-comparison" element={<ProtectedRoute><InvestmentComparison /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
