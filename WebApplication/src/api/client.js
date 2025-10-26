import axios from 'axios';
import { ENDPOINTS } from './endpoints';

/**
 * API base URL is configured via REACT_APP_API_URL.
 * Do not hardcode backend URLs.
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * In-memory auth token and refresh control flags.
 * We intentionally avoid persistent storage per requirements.
 */
let inMemoryToken = null;
let isRefreshing = false;
let refreshPromise = null;

/**
 * Subscribers waiting for a token refresh to complete.
 * Each subscriber is a function that will be called with the new token.
 */
const refreshSubscribers = [];

/** Notify all queued subscribers with the fresh token. */
function notifySubscribers(newToken) {
  while (refreshSubscribers.length) {
    const cb = refreshSubscribers.shift();
    try {
      cb(newToken);
    } catch (e) {
      // ignore subscriber errors
    }
  }
}

/** Queue a subscriber to be notified once refresh completes. */
function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

// PUBLIC_INTERFACE
export function setAuthToken(token) {
  /** Set in-memory auth token used for subsequent API calls. */
  inMemoryToken = token || null;
}

// PUBLIC_INTERFACE
export function getAuthToken() {
  /** Get current in-memory auth token, if any. */
  return inMemoryToken;
}

// PUBLIC_INTERFACE
export function clearAuthAndRedirect() {
  /**
   * Clear in-memory auth and redirect to login on hard auth failure.
   * This ensures the app recovers cleanly after refresh failures.
   */
  inMemoryToken = null;
  try {
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  } catch (_) {
    // noop
  }
}

/**
 * Construct the axios instance with sane defaults.
 */
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

/**
 * Attach Authorization header for all outgoing requests when we have a token.
 */
http.interceptors.request.use((config) => {
  const token = inMemoryToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Attempt a token refresh when we get a 401 response.
 * - Only attempt refresh once per request (_retry flag).
 * - While a refresh is in progress, queue subsequent 401s to wait for completion.
 * - On refresh success, retry original request.
 * - On refresh failure, clear auth and redirect to login.
 */
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status || 0;
    const originalRequest = error?.config;

    // Normalize error for non-401s or if no config available
    if (status !== 401 || !originalRequest) {
      const normalized = {
        status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          'Unknown error',
        data: error?.response?.data || null,
      };
      return Promise.reject(normalized);
    }

    // Avoid infinite loops
    if (originalRequest._retry) {
      // Already retried and still 401 -> hard logout
      clearAuthAndRedirect();
      const normalized = {
        status,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          'Unauthorized',
        data: error?.response?.data || null,
      };
      return Promise.reject(normalized);
    }
    originalRequest._retry = true;

    // If a refresh is already running, queue this request to wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          if (!newToken) {
            clearAuthAndRedirect();
            return reject({ status: 401, message: 'Unauthorized' });
          }
          // Update header and retry
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          http(originalRequest).then(resolve).catch((err) => {
            const normalized = {
              status: err?.response?.status || 0,
              message:
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                err?.message ||
                'Unknown error',
              data: err?.response?.data || null,
            };
            reject(normalized);
          });
        });
      });
    }

    // Start a new refresh flow
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        // Call refresh endpoint. We assume it returns { access_token: "..." }
        const response = await axios.post(
          `${API_BASE_URL}${ENDPOINTS.AUTH.REFRESH}`,
          {},
          { withCredentials: true, timeout: 15000 }
        );
        const newToken =
          response?.data?.access_token || response?.data?.token || null;
        if (!newToken) throw new Error('No token in refresh response');

        // Update in-memory token and notify subscribers
        setAuthToken(newToken);
        notifySubscribers(newToken);
        return newToken;
      } catch (e) {
        // Refresh failed; notify subscribers with null and logout
        notifySubscribers(null);
        clearAuthAndRedirect();
        throw e;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    // Wait for refresh and retry the original request
    try {
      const newToken = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      const retryRes = await http(originalRequest);
      return retryRes;
    } catch (e) {
      const normalized = {
        status: 401,
        message: 'Unauthorized',
        data: null,
      };
      return Promise.reject(normalized);
    }
  }
);

// Lightweight helpers

// PUBLIC_INTERFACE
export async function apiGet(url, config = {}) {
  /** Perform GET request to backend API. Returns response data. Throws normalized error. */
  const res = await http.get(url, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function apiPost(url, body = {}, config = {}) {
  /** Perform POST request to backend API. Returns response data. Throws normalized error. */
  const res = await http.post(url, body, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function apiPatch(url, body = {}, config = {}) {
  /** Perform PATCH request to backend API. Returns response data. Throws normalized error. */
  const res = await http.patch(url, body, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function apiDelete(url, config = {}) {
  /** Perform DELETE request to backend API. Returns response data. Throws normalized error. */
  const res = await http.delete(url, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function fakeAuth(username, password) {
  /**
   * Temporary stub for local demo.
   * Replace with real API call to ENDPOINTS.AUTH.LOGIN later.
   * For demo:
   *  - admin@demo => role admin
   *  - trainer@demo => role trainer
   *  - member@demo => role member
   */
  await new Promise((r) => setTimeout(r, 500));
  const users = {
    'admin@demo': { role: 'admin' },
    'trainer@demo': { role: 'trainer' },
    'member@demo': { role: 'member' },
  };
  const user = users[username];
  if (!user || password !== 'password') {
    const err = { status: 401, message: 'Invalid credentials' };
    throw err;
  }
  const token = btoa(`${username}:${user.role}:${Date.now()}`);
  setAuthToken(token);
  return { access_token: token, role: user.role, user: { email: username } };
}

export default http;
