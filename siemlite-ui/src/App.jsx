import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IncidentList from './pages/incidents/IncidentList';
import IncidentDetail from './pages/incidents/IncidentDetail';
import Assets from './pages/Assets';
import ThreatTypes from './pages/ThreatTypes';
import Analytics from './pages/Analytics';
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents"
          element={
            <ProtectedRoute>
              <IncidentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/:id"
          element={
            <ProtectedRoute>
              <IncidentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/incidents/new"
          element={
            <ProtectedRoute>
              <Placeholder title="Report Incident" />
            </ProtectedRoute>
          }
        />
        <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/threat-types" element={<ProtectedRoute><ThreatTypes /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly>
              <Placeholder title="Users" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-log"
          element={
            <ProtectedRoute adminOnly>
              <Placeholder title="Audit Log" />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
