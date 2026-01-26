import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/paths'
import useAuth from '../../hooks/useAuth'

export default function Navbar() {
	const [open, setOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	const { user, logout } = useAuth()
	const isAuth = !!user

	const common = [
		{ to: ROUTES.HOME, label: 'Kezdőlap' },
		{ to: ROUTES.LEADERBOARD, label: 'Ranglista' },
		{ to: ROUTES.PATCH_NOTES, label: 'Patch Notes' },
	]

	const nav = isAuth
		? [...common, { to: ROUTES.FRIENDS, label: 'Barátok' }, { to: ROUTES.PROFILE, label: 'Profil' }]
		: [...common, { to: ROUTES.LOGIN, label: 'Bejelentkezés' }, { to: ROUTES.REGISTER, label: 'Regisztráció' }]

	const linkBase =
		'text-[#ffaa33] font-semibold transition rounded-xl px-3 py-2 hover:bg-[#ffaa33]/15 hover:text-[#ffae42] hover:shadow-[0_0_12px_#ffaa33]'

	const closeMenu = () => setOpen(false)
	const onLogout = () => {
		logout()
		setOpen(false)
		navigate(ROUTES.HOME)
	}

	return (
		<nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 border-b-2 border-[#ffaa33]/70 shadow-[0_4px_12px_rgba(255,174,66,0.4)]">
			<div className="mx-auto max-w-7xl px-4">
				<div className="h-16 flex items-center justify-between">
					<button
						type="button"
						aria-label={open ? 'Menü bezárása' : 'Menü megnyitása'}
						aria-expanded={open}
						onClick={() => setOpen((v) => !v)}
						className="md:hidden text-[#ffaa33] p-2 rounded-lg hover:bg-[#ffaa33]/15 hover:text-[#ffae42] focus:outline-none focus:ring-2 focus:ring-[#ffaa33]/60"
					>
						<i className={`bx ${open ? 'bx-x' : 'bx-menu'} text-3xl leading-none`} />
					</button>

					<ul className="hidden md:flex items-center gap-6 lg:gap-8">
						{nav.map((item) => {
							const active = location.pathname === item.to
							return (
								<li key={item.label}>
									<Link
										to={item.to}
										className={`${linkBase} text-xl lg:text-2xl ${active ? 'bg-[#ffaa33]/15 text-[#ffae42]' : ''}`}
									>
										{item.label}
									</Link>
								</li>
							)
						})}
						{isAuth && (
							<li>
								<button
									type="button"
									onClick={onLogout}
									className="text-[#ffaa33] font-semibold text-xl lg:text-2xl rounded-xl px-3 py-2 hover:bg-[#ffaa33]/15 hover:text-[#ffae42] hover:shadow-[0_0_12px_#ffaa33]"
								>
									Kijelentkezés
								</button>
							</li>
						)}
					</ul>
				</div>

				<div className={`${open ? 'block' : 'hidden'} md:hidden pb-4`}>
					<ul className="flex flex-col gap-2">
						{nav.map((item) => {
							const active = location.pathname === item.to
							return (
								<li key={item.label}>
									<Link
										to={item.to}
										onClick={closeMenu}
										className={`${linkBase} block text-xl w-full` + (active ? ' bg-[#ffaa33]/15 text-[#ffae42]' : '')}
									>
										{item.label}
									</Link>
								</li>
							)
						})}
						{isAuth && (
							<li>
								<button
									type="button"
									onClick={onLogout}
									className="w-full text-left block text-[#ffaa33] font-semibold text-xl rounded-xl px-3 py-2 hover:bg-[#ffaa33]/15 hover:text-[#ffae42] hover:shadow-[0_0_12px_#ffaa33]"
								>
									Kijelentkezés
								</button>
							</li>
						)}
					</ul>
				</div>
			</div>
		</nav>
	)
}
