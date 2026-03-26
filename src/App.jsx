import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location]);
  return null;
}
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import TourDaikoku from './pages/TourDaikoku';
import TourUmihotaru from './pages/TourUmihotaru';
import About from './pages/About';

import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import MasterAvailability from './pages/MasterAvailability';
import ProtectedRoute from './components/ProtectedRoute';
import DebugVehicles from './pages/DebugVehicles';
import SeoGuideDaikoku from './pages/SeoGuideDaikoku';
import SeoGuideUmihotaru from './pages/SeoGuideUmihotaru';
import ImportBookings from './pages/ImportBookings';
import './firebase'; // Initialize Firebase

function App() {
  return (
    <Router>
      <PageViewTracker />
      <div className="site-wrapper">
        <main className="site-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tours/daikoku-pa" element={<TourDaikoku />} />
            <Route path="/tours/umihotaru-pa" element={<TourUmihotaru />} />
            <Route path="/about" element={<About />} />
            
            <Route path="/guide/daikoku-parking" element={<SeoGuideDaikoku />} />
            <Route path="/guide/umihotaru-pa" element={<SeoGuideUmihotaru />} />
            <Route path="/driver/:vehicleId" element={<DriverDashboard />} />
            <Route path="/master-schedule" element={<MasterAvailability />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/debug" element={<DebugVehicles />} />
            <Route path="/import" element={<ImportBookings />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
