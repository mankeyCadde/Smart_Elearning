const API_BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

const ACCESS_KEY = 'sl_access';
const REFRESH_KEY = 'sl_refresh';
const USER_KEY = 'sl_user';

export const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);

export const setTokens = (access, refresh) => {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
};

export const setCachedUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getCachedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
};

export class ApiError extends Error {
  constructor(message, status = 0, fields = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

function extractMessage(data) {
  if (!data || typeof data !== 'object') return 'Something went wrong.';
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) return data.detail[0];
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (Array.isArray(value) && value.length > 0) {
      if (typeof value[0] === 'string') return value[0];
      if (value[0] && typeof value[0] === 'object') {
        const nested = extractMessage(value[0]);
        if (nested) return nested;
      }
    } else if (typeof value === 'string') {
      return value;
    }
  }
  return 'Something went wrong.';
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  setTokens(data.access, data.refresh || refresh);
  return data.access;
}

export async function apiFetch(endpoint, options = {}) {
  const { method = 'GET', body, isFormData = false, auth = true, retried = false } = options;

  const headers = {};
  if (auth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Network error. Is the server running?');
  }

  if (res.status === 401 && auth && !retried) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiFetch(endpoint, { ...options, retried: true });
    }
    clearTokens();
    throw new ApiError('Your session has expired. Please log in again.', 401);
  }

  if (res.status === 204) return null;

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new ApiError(extractMessage(data), res.status, data);
  }

  return data;
}

export { API_BASE };