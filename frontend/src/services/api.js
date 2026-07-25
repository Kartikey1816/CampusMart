export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1'

export async function api(path, { token, headers, body, ...options } = {}) {
  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body instanceof FormData || body === undefined ? body : JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the backend. Start it with `npm run dev` from the backend folder, then try again.')
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || payload.error || 'Something went wrong. Please try again.')
  return payload
}
