import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

let inMemoryToken = null;

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

/**
 * Axios instance with interceptors:
 * - baseURL from REACT_APP_API_URL
 * - Authorization header when token is present
 * - Basic error normalization
 */
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000
});

http.interceptors.request.use((config) => {
  const token = inMemoryToken;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error) => {
    const normalized = {
      status: error?.response?.status || 0,
      message:
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Unknown error',
      data: error?.response?.data || null
    };
    return Promise.reject(normalized);
  }
);

// Lightweight helpers

// PUBLIC_INTERFACE
export async function apiGet(url, config = {}) {
  /** Perform GET request to backend API. Returns {data}. Throws normalized error. */
  const res = await http.get(url, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function apiPost(url, body = {}, config = {}) {
  /** Perform POST request to backend API. Returns {data}. Throws normalized error. */
  const res = await http.post(url, body, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function apiPatch(url, body = {}, config = {}) {
  /** Perform PATCH request to backend API. Returns {data}. Throws normalized error. */
  const res = await http.patch(url, body, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function apiDelete(url, config = {}) {
  /** Perform DELETE request to backend API. Returns {data}. Throws normalized error. */
  const res = await http.delete(url, config);
  return res.data;
}

// PUBLIC_INTERFACE
export async function fakeAuth(username, password) {
  /**
   * Minimal auth stub. Replace with real API call to /auth/login on Backend later.
   * For demo:
   *  - admin@demo => role admin
   *  - trainer@demo => role trainer
   *  - member@demo => role member
   */
  await new Promise((r) => setTimeout(r, 500));
  const users = {
    'admin@demo': { role: 'admin' },
    'trainer@demo': { role: 'trainer' },
    'member@demo': { role: 'member' }
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
