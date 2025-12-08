import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DecoderWorkflow from './pages/DecoderWorkflow';
import BreakManagement from './pages/BreakManagement';
import SupervisorDashboard from './pages/SupervisorDashboard';
import Login from './pages/Login';
import StoreView from './pages/StoreView';
import PerformanceReport from './pages/PerformanceReport';
import PrescriptionReport from './pages/PrescriptionReport';

// Mock Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/decoder"
          element={
            <ProtectedRoute>
              <DecoderWorkflow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/break"
          element={
            <ProtectedRoute>
              <BreakManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor"
          element={
            <ProtectedRoute>
              <SupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/store" element={<StoreView />} />
        <Route
          path="/performance-report"
          element={
            <ProtectedRoute>
              <PerformanceReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prescription-report"
          element={
            <ProtectedRoute>
              <PrescriptionReport />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
