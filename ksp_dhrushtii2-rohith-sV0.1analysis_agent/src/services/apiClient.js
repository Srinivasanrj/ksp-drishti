/**
 * Centralized API Client (SOLID - DIP)
 * Provides environment-driven endpoint URL resolution and request wrappers.
 */

export const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://127.0.0.1:5000'
).replace(/\/$/, '');

export function getApiUrl(endpoint) {
  if (!endpoint) return API_BASE_URL;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) return endpoint;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export async function postJson(endpoint, body, options = {}) {
  const url = getApiUrl(endpoint);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: JSON.stringify(body),
    ...options
  });
  return response;
}
