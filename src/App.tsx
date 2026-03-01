import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import ProtectedRoute from './components/ProtectedRoute'
import { Toaster } from './components/ui/toaster'

// Pages
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import EventsPage from './pages/EventsPage'
import CommunityPage from './pages/CommunityPage'
import FAQPage from './pages/FAQPage'
import ContactPage from './pages/ContactPage'
import ToolkitPage from './pages/ToolkitPage'
import HostDashboard from './pages/HostDashboard'
import AdminDashboard from './pages/AdminDashboard'
import EventDetailsPage from './pages/EventDetailsPage'
import EventResultsPage from './pages/EventResultsPage'
import LocationPage from './pages/LocationPage'
import AuthContinue from './pages/AuthContinue'
import ToolkitDetailsPage from './pages/ToolkitDetailsPage'
import CourseRegistrationPage from './pages/CourseRegistrationPage'
import CourseEnrollmentPage from './pages/CourseEnrollmentPage'
import CourseDashboard from './pages/CourseDashboard'
import CourseCertificate from './pages/CourseCertificate'
import ProfilePage from './pages/ProfilePage'
import HostPage from './pages/HostPage'
import HostDirectoryPage from './pages/HostDirectoryPage'
import OrganizerBookletPage from './pages/OrganizerBookletPage'
import CertificateFlowDemo from './pages/CertificateFlowDemo'
import DonatePage from './pages/DonatePage'
import DonationSuccessPage from './pages/DonationSuccessPage'
import SupportersPage from './pages/SupportersPage'
import UserManagementPage from './pages/UserManagementPage'
import PasswordManagementPage from './pages/PasswordManagementPage'
import AdminCertificateFix from './pages/AdminCertificateFix'
import AdminHighlightsPage from './pages/AdminHighlightsPage'
import AdminCarouselPage from './pages/AdminCarouselPage'
import AdminCertificateCreator from './pages/AdminCertificateCreator'
import SignInPage from './pages/SignInPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import StorageDebugPage from './pages/StorageDebugPage'
import MigratePage from './pages/MigratePage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/events/:id/results" element={
              <ProtectedRoute requiredFeature="manage_events" redirectMessage="Only approved hosts can update event results.">
                <EventResultsPage />
              </ProtectedRoute>
            } />
            <Route path="/location/:location" element={<LocationPage />} />
            <Route path="/community" element={
              <ProtectedRoute 
                allowedRoles={['host', 'admin']}
                redirectMessage="You need to be a host to access the community forum."
              >
                <CommunityPage />
              </ProtectedRoute>
            } />

            {/* Toolkit pages are public: teaser + library and toolkit detail pages */}
            <Route path="/toolkit" element={<ToolkitPage />} />
            <Route path="/toolkit/:id" element={<ToolkitDetailsPage />} />

            <Route path="/host-dashboard" element={
              <ProtectedRoute 
                requiredFeature="host_dashboard"
                redirectMessage="You need to be a certified host to access the dashboard."
              >
                <HostDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requiredFeature="admin_dashboard">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredFeature="admin_dashboard">
                <UserManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/passwords" element={
              <ProtectedRoute requiredFeature="admin_dashboard">
                <PasswordManagementPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/certificate-fix" element={
              <ProtectedRoute requiredFeature="admin_dashboard">
                <AdminCertificateFix />
              </ProtectedRoute>
            } />
            <Route path="/admin/highlights" element={
              <ProtectedRoute requiredFeature="admin_dashboard">
                <AdminHighlightsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/carousel" element={
              <ProtectedRoute requiredFeature="admin_dashboard">
                <AdminCarouselPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/certificate-creator" element={
              <ProtectedRoute requiredFeature="admin_dashboard">
                <AdminCertificateCreator />
              </ProtectedRoute>
            } />
            <Route path="/auth/continue" element={<AuthContinue />} />
            <Route path="/course/train-the-trainer" element={<CourseRegistrationPage />} />
            <Route path="/course/enroll" element={<CourseEnrollmentPage />} />
            <Route path="/course/dashboard" element={
              <ProtectedRoute requiredFeature="course_content">
                <CourseDashboard />
              </ProtectedRoute>
            } />
            <Route path="/course/certificate" element={
              <ProtectedRoute allowedRoles={['participant','host','admin']}>
                <CourseCertificate />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute requiredFeature="profile">
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/host/:id" element={<HostPage />} />
            <Route path="/host-directory" element={<HostDirectoryPage />} />
            <Route path="/organizer-booklet" element={<OrganizerBookletPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/supporters" element={<SupportersPage />} />
            <Route path="/sponsors" element={<SupportersPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/debug/storage" element={<StorageDebugPage />} />
            <Route path="/migrate" element={
              <ProtectedRoute requiredFeature="admin_dashboard">
                <MigratePage />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App