import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext({
	user: null,
	token: null,
	login: async (_credentials) => {},
	logout: () => {},
})

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null)
	const [token, setToken] = useState(null)

	useEffect(() => {
		try {
			const raw = localStorage.getItem('bf_auth')
			if (raw) {
				const { user: u, token: t } = JSON.parse(raw)
				if (t) setToken(t)
				if (u) setUser(u)
			}
		} catch {}
	}, [])

	useEffect(() => {
		try {
			if (token) {
				localStorage.setItem('bf_auth', JSON.stringify({ user, token }))
			} else {
				localStorage.removeItem('bf_auth')
			}
		} catch {}
	}, [user, token])

	const login = async ({ username, token: incomingToken, profile }) => {
		setUser(profile || { username })
		setToken(incomingToken || 'dev-token')
	}

	const logout = () => {
		setUser(null)
		setToken(null)
	}

	const value = useMemo(() => ({ user, token, login, logout }), [user, token])

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
	return useContext(AuthContext)
}
