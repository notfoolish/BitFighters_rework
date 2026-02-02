export const API_BASE = import.meta.env?.VITE_API_BASE_URL || ''

export function buildUrl(path) {
	if (!path) return API_BASE
	if (/^https?:\/\//i.test(path)) return path
	const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE
	const suffix = path.startsWith('/') ? path : `/${path}`
	return `${base}${suffix}`
}

export function getAuthToken() {
	try {
		const raw = localStorage.getItem('bf_auth')
		if (!raw) return null
		const parsed = JSON.parse(raw)
		return parsed?.token || null
	} catch {
		return null
	}
}

export async function jsonFetch(path, options = {}) {
	const {
		method = 'GET',
		body,
		headers = {},
		auth = false,
	} = options

	const requestHeaders = { ...headers }
	let requestBody = body

	if (auth) {
		const token = getAuthToken()
		if (token) {
			requestHeaders.Authorization = `Bearer ${token}`
		}
	}

	if (body && !(body instanceof FormData)) {
		requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json'
		requestBody = JSON.stringify(body)
	}

	const response = await fetch(buildUrl(path), {
		method,
		headers: requestHeaders,
		body: requestBody,
	})

	let data = null
	try {
		data = await response.json()
	} catch {
		data = null
	}

	if (!response.ok) {
		const message = data?.message || `Request failed (${response.status})`
		const error = new Error(message)
		error.status = response.status
		error.data = data
		throw error
	}

	return data
}
