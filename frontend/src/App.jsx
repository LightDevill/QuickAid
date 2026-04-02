import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import SOSFloatingButton from './components/common/SOSFloatingButton';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import HospitalDetailPage from './pages/HospitalDetailPage';
import BookingPage from './pages/BookingPage';
import BookingStatusPage from './pages/BookingStatusPage';
import MyBookingsPage from './pages/MyBookingsPage';
import SOSPage from './pages/SOSPage';
import AmbulanceTrackingPage from './pages/AmbulanceTrackingPage';
import NotFoundPage from './pages/NotFoundPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

// Components
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/common/RoleGuard';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Toaster position="top-right" />
        <Navbar />

        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/access-denied" element={<AccessDeniedPage />} />

            {/* Protected Routes (All Roles) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleGuard allowedRoles={['citizen', 'hospital_admin', 'quickaid_admin']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['citizen', 'quickaid_admin']} />}>
                <Route path="/my-bookings" element={<MyBookingsPage />} />
              </Route>

              {/* Citizen Specific Routes */}
              <Route element={<RoleGuard allowedRoles={['citizen', 'quickaid_admin']} />}>
                <Route path="/search" element={<SearchPage />} />
                <Route path="/hospital/:id" element={<HospitalDetailPage />} />
                <Route path="/book/:hospitalId" element={<BookingPage />} />
                <Route path="/booking/:hospitalId" element={<BookingPage />} />
                <Route path="/bookings" element={<Navigate to="/my-bookings" replace />} />
                <Route path="/sos" element={<SOSPage />} />
                <Route path="/ambulance-tracking" element={<AmbulanceTrackingPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={['citizen', 'hospital_admin', 'quickaid_admin']} />}>
                <Route path="/booking-status/:id" element={<BookingStatusPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>

        <Footer />
        <SOSFloatingButton />
      </div>
    </Router>
  );
}

export default App;
