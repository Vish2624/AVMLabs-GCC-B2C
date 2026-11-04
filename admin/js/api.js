// Client for the admin API.

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.details);
  return data;
}

const profileUrl = (id) => `/api/admin/profiles/${encodeURIComponent(id)}`;
const subUrl = (id) => `/api/admin/subprofiles/${encodeURIComponent(id)}`;
const testUrl = (id) => `/api/admin/tests/${encodeURIComponent(id)}`;

export const api = {
  session: () => request('GET', '/api/admin/session'),
  login: (password) => request('POST', '/api/admin/session', { password }),
  logout: () => request('DELETE', '/api/admin/session'),
  catalog: () => request('GET', '/api/admin/catalog'),
  listProfiles: () => request('GET', '/api/admin/profiles'),
  createProfile: (profile) => request('POST', '/api/admin/profiles', profile),
  updateProfile: (profile) => request('PUT', profileUrl(profile.id), profile),
  deleteProfile: (id) => request('DELETE', profileUrl(id)),
  listSubProfiles: () => request('GET', '/api/admin/subprofiles'),
  createSubProfile: (sub) => request('POST', '/api/admin/subprofiles', sub),
  updateSubProfile: (id, sub) => request('PUT', subUrl(id), sub),
  deleteSubProfile: (id) => request('DELETE', subUrl(id)),
  createTest: (test) => request('POST', '/api/admin/tests', test),
  updateTest: (test) => request('PUT', testUrl(test.id), test),
  deleteTest: (id) => request('DELETE', testUrl(id)),
  saveCentres: (centres) => request('PUT', '/api/centres', centres),
};
