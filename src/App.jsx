import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DecoderWorkflow from './pages/DecoderWorkflow';
import BreakManagement from './pages/BreakManagement';
import BreakMonitoring from './pages/BreakMonitoring';
import SupervisorDashboard from './pages/SupervisorDashboard';
import Login from './pages/Login';
import StoreView from './pages/StoreView';
import PerformanceReport from './pages/PerformanceReport';
import PrescriptionReport from './pages/PrescriptionReport';
import LocationReport from './pages/LocationReport';
import PrescriptionSaleReport from './pages/PrescriptionSaleReport';
import DecoderEfficiencyReport from './pages/DecoderEfficiencyReport';

import StoreOrderSearch from './pages/StoreOrderSearch';
import VerificationWorkflow from './pages/VerificationWorkflow';

// Mock Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => {
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
        <Route
          path="/break-monitoring"
          element={
            <ProtectedRoute>
              <BreakMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store"
          element={
            <ProtectedRoute>
              <StoreView />
            </ProtectedRoute>
          }
        />
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
        <Route
          path="/location-report"
          element={
            <ProtectedRoute>
              <LocationReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prescription-sale-report"
          element={
            <ProtectedRoute>
              <PrescriptionSaleReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/decoder-efficiency-report"
          element={
            <ProtectedRoute>
              <DecoderEfficiencyReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/store-search"
          element={
            <ProtectedRoute>
              <StoreOrderSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verification"
          element={
            <ProtectedRoute>
              <VerificationWorkflow />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
