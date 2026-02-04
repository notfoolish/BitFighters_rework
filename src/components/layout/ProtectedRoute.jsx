import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'
import { ROUTES } from '../../routes/paths'

export default function ProtectedRoute({ children }) {
	const { token, initialized } = useAuth()
	const location = useLocation()

	if (!initialized) {
		return null
	}

	if (!token) {
		return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
	}

	return children
}
