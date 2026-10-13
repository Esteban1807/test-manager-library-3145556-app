// Client for the Manager Library API (docs: api-contract.md).
// Every error from the API has the same body: { code, message, details }.

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message ?? 'No se pudo completar la operación. Revisa tu conexión e inténtalo de nuevo.');
    this.status = status;
    this.code = body?.code ?? 'NETWORK_ERROR';
    this.details = body?.details ?? [];
  }
}

let onSessionExpired = () => {};

// The session provider registers here so an expired token sends the user back to the login
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

function buildUrl(path, query) {
  const url = new URL(BASE_URL + path);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function send(path, { method = 'GET', body, form, query, token } = {}) {
  const headers = { Accept: 'application/json' };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  let response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: form ?? (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, null);
  }

  if (response.status === 401 && token) {
    onSessionExpired();
  }

  return response;
}

export async function api(path, options = {}) {
  const response = await send(path, options);

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) throw new ApiError(response.status, data);

  return data;
}

// Covers are served as binary and need the token, so they cannot be a plain <img src>
export async function fetchCover(bookId, token) {
  const response = await send(`/books/${bookId}/cover`, { token });

  if (!response.ok) return null;

  return URL.createObjectURL(await response.blob());
}
