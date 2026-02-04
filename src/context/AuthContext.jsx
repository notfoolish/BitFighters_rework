import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext({
	user: null,
	token: null,
	initialized: false,
	login: async (_credentials) => {},
	logout: () => {},
})

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [token, setToken] = useState(null)
	const [initialized, setInitialized] = useState(false)

	useEffect(() => {
		try {
			const raw = localStorage.getItem('bf_auth')
			if (raw) {
				const { user: u, token: t } = JSON.parse(raw)
				if (t) setToken(t)
				if (u) setUser(u)
			}
		} catch {}
		setInitialized(true)
	}, [])

	useEffect(() => {
		try {
			if (!initialized) return
			if (token) {
				localStorage.setItem('bf_auth', JSON.stringify({ user, token }))
			} else {
				localStorage.removeItem('bf_auth')
			}
		} catch {}
	}, [user, token, initialized])

	const login = async ({ user: incomingUser, token: incomingToken, profile }) => {
		setUser(incomingUser || profile || null)
		setToken(incomingToken || 'dev-token')
	}

	const logout = () => {
		setUser(null)
		setToken(null)
	}

	const value = useMemo(() => ({ user, token, initialized, login, logout }), [user, token, initialized])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
	return useContext(AuthContext)
}
