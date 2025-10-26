export const ENDPOINTS = {
  AUTH: {
    // PUBLIC_INTERFACE
    LOGIN: '/auth/login',
    // PUBLIC_INTERFACE
    REFRESH: '/auth/refresh',
    // PUBLIC_INTERFACE
    LOGOUT: '/auth/logout'
  },
  USERS: {
    // PUBLIC_INTERFACE
    ME: '/users/me'
  },
  CLASSES: {
    // PUBLIC_INTERFACE
    LIST: '/classes',
    // PUBLIC_INTERFACE
    BOOK: (id) => `/classes/${id}/book`,
  },
  WORKOUTS: {
    // PUBLIC_INTERFACE
    LIST: '/workouts',
    // PUBLIC_INTERFACE
    DETAIL: (id) => `/workouts/${id}`,
    // PUBLIC_INTERFACE
    MINE: '/workouts/mine'
  },
  ADMIN: {
    // PUBLIC_INTERFACE
    REPORTS: '/admin/reports'
  }
};

export default ENDPOINTS;
