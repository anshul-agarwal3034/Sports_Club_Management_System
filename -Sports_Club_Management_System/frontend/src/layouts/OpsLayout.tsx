import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import {
  getStoredUser,
  normalizeRole,
  canRoleAccessRoute,
  getRoleDashboard,
} from '@/lib/roles';
import { OwnerSidebar } from '@/components/OwnerSidebar';
import { OperationalHeader } from '@/components/OperationalHeader';

export const OpsLayout: React.FC = () => {
  const location = useLocation();
  const user = getStoredUser();

  // 1. Unauthenticated users go to /login
  if (!user || !user.role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = normalizeRole(user.role);
  const pathname = location.pathname;

  // 2. Non-ops users (e.g. players/members) redirect to their public destination
  if (role === 'PLAYER' || role === 'UNKNOWN') {
    return <Navigate to={getRoleDashboard(role, user.club_slug)} replace />;
  }

  // 3. Remove general Portal link from navigation: redirect /portal to user's dashboard
  if (pathname === '/portal') {
    const dashboardRoute = getRoleDashboard(role, user.club_slug);
    return <Navigate to={dashboardRoute} replace />;
  }

  // 4. Role Guard: prevent accessing other roles' dashboards or unauthorized tools
  if (!canRoleAccessRoute(role, pathname)) {
    const dashboardRoute = getRoleDashboard(role, user.club_slug);
    // Prevent redirect loops
    if (dashboardRoute !== pathname) {
      return <Navigate to={dashboardRoute} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // 5. Render dedicated layout for Owner vs Single-Screen Roles
  if (role === 'OWNER') {
    return (
      <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col lg:flex-row selection:bg-[#006c49] selection:text-white">
        <OwnerSidebar user={user} />
        <main className="flex-1 lg:ml-64 w-full min-h-screen overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col selection:bg-[#006c49] selection:text-white">
      <OperationalHeader user={user} role={role} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};
