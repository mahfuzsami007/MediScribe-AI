import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthFlow from './components/auth/AuthFlow';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import VoiceRxPage from './pages/VoiceRxPage';
import HistoryPage from './pages/HistoryPage';
import TemplatesPage from './pages/TemplatesPage';
import ProfilePage from './pages/ProfilePage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import ResearchDataPage from './pages/ResearchDataPage';
import PatientViewPage from './pages/PatientViewPage';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthFlow defaultMode="login" />} />
        <Route path="/register" element={<AuthFlow defaultMode="register" />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/prescription" element={<VoiceRxPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/research" element={<ResearchDataPage />} />
          <Route path="/patient-view" element={<PatientViewPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}