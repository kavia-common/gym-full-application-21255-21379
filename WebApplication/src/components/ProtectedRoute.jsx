import { Navigate, Outlet } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function ProtectedRoute({ isAuthed, allowedRoles, userRole, redirectTo = "/login" }) {
  /**
   * Gate route access based on authentication and optional role list.
   * - If not authed -> redirect
   * - If allowedRoles provided and userRole not included -> redirect to dashboard
   */
  if (!isAuthed) return <Navigate to={redirectTo} replace />;
  if (allowedRoles?.length && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
