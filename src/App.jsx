import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import './firebase'; // Initialize Firebase

function App() {
  return (
    <div className="app-main-wrapper">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
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
        v1.13 - Vehicle Names Standardized
      </footer>
    </div>
  );
}

export default App;
