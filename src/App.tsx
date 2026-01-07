import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/dashboard/Dashboard';
import { ReportList } from '@/pages/reports/ReportList';
import { ReportPage } from '@/pages/reports/ReportPage';
import { ArrestList } from '@/pages/arrests/ArrestList';
import { ArrestPage } from '@/pages/arrests/ArrestPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { InvestigationList } from '@/pages/investigations/InvestigationList';
import { InvestigationPage } from '@/pages/investigations/InvestigationPage';
import { CivilianList } from '@/pages/civilians/CivilianList';
import { CivilianProfile } from '@/pages/civilians/CivilianProfile';
import { VehicleList } from '@/pages/vehicles/VehicleList';
import { WeaponList } from '@/pages/weapons/WeaponList';
import { TeamsPage } from '@/pages/teams/TeamsPage';
import { InboxPage } from '@/pages/teams/InboxPage';
import { PDFV2Playground } from '@/pages/reports/PDFV2Playground';

import { useEffect } from 'react';

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/reports" element={<ReportList />} />
            <Route path="/reports/new" element={<ReportPage />} />
            <Route path="/reports/:id" element={<ReportPage />} />

            <Route path="/arrests" element={<ArrestList />} />
            <Route path="/arrests/new" element={<ArrestPage />} />
            <Route path="/arrests/:id" element={<ArrestPage />} />

            <Route path="/investigations" element={<InvestigationList />} />
            <Route path="/investigations/new" element={<InvestigationPage />} />
            <Route path="/investigations/:id" element={<InvestigationPage />} />

            <Route path="/admin" element={<AdminPage />} />

            <Route path="/civilians" element={<CivilianList />} />
            <Route path="/civilians/:id" element={<CivilianProfile />} />
            <Route path="/vehicles" element={<VehicleList />} />
            <Route path="/weapons" element={<WeaponList />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/inbox" element={<InboxPage />} />
            <Route path="/teams/:id" element={<TeamsPage />} />
            <Route path="/pdf-v2" element={<PDFV2Playground />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
