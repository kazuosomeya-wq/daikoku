import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import MasterAvailability from './pages/MasterAvailability';
import ProtectedRoute from './components/ProtectedRoute';
import './firebase'; // Initialize Firebase

function App() {
  return (
    <div className="app-main-wrapper">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/driver/:vehicleId" element={<DriverDashboard />} />
          <Route path="/master-schedule" element={<MasterAvailability />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
      <footer style={{ textAlign: 'center', padding: '1rem', color: '#666', fontSize: '0.8rem' }}>
        v1.15 - Vehicle Prices Updated
      </footer>
    </div>
  );
}

export default App;
