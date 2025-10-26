import { Navigate, Outlet } from 'react-router-dom';

/**
 * Resolve a user's default home path by role.
 */
function roleHome(role) {
  if (role === 'admin') return '/admin';
  if (role === 'trainer') return '/trainer';
  if (role === 'member') return '/member';
  return '/dashboard';
}

// PUBLIC_INTERFACE
export default function ProtectedRoute({ isAuthed, allowedRoles, userRole, redirectTo = "/login" }) {
  /**
   * Gate route access based on authentication and optional role list.
   * - If not authed -> redirect
   * - If allowedRoles provided and userRole not included -> redirect to the role's home
   */
  if (!isAuthed) return <Navigate to={redirectTo} replace />;
  if (allowedRoles?.length && !allowedRoles.includes(userRole)) {
    return <Navigate to={roleHome(userRole)} replace />;
  }
  return <Outlet />;
}
