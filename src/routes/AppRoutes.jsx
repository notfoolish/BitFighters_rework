import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ROUTES } from './paths'

import Navbar from '../components/Navbar/Navbar.jsx'
import Home from '../pages/Home/Home.jsx'
import Leaderboard from '../pages/Leaderboard/Leaderboard.jsx'
import Login from '../pages/Auth/Login/Login.jsx'
import Register from '../pages/Auth/Register/Register.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'

export default function AppRoutes() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Navbar />
				<Routes>
					<Route path={ROUTES.HOME} element={<Home />} />
					<Route path={ROUTES.LEADERBOARD} element={<Leaderboard />} />
					<Route path={ROUTES.LOGIN} element={<Login />} />
					<Route path={ROUTES.REGISTER} element={<Register />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	)
}
