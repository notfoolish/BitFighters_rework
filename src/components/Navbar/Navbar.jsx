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

	const iconNav = [
		{ type: 'link', to: ROUTES.HOME, label: 'Kezdőlap', icon: 'fa-solid fa-house' },
		{
			type: isAuth ? 'download' : 'link',
			to: isAuth ? '/BitFightersLauncherSetup.exe' : ROUTES.LOGIN,
			label: 'Letöltés',
			icon: 'fa-solid fa-download',
		},
		{
			type: 'link',
			to: isAuth ? ROUTES.PROFILE : ROUTES.LOGIN,
			label: 'Profil',
			icon: 'fa-solid fa-user',
		},
		...(isAuth
			? [
					{ type: 'link', to: ROUTES.LEADERBOARD, label: 'Ranglista', icon: 'fa-solid fa-trophy' },
					{ type: 'button', label: 'Kijelentkezés', icon: 'fa-solid fa-right-from-bracket' },
			  ]
			: []),
	]

	const linkBase =
		'inline-flex items-center justify-center text-[#ffaa33] transition rounded-2xl h-12 w-12 bg-black/80 backdrop-blur-md border border-[#ffaa33]/70 shadow-[0_10px_24px_rgba(0,0,0,0.55)] hover:bg-black hover:text-[#ffae42] hover:shadow-[0_0_14px_#ffaa33]'
	const linkBaseMobile =
		'inline-flex items-center gap-3 text-[#ffaa33] transition rounded-2xl h-12 w-full px-4 bg-black/80 backdrop-blur-md border border-[#ffaa33]/70 shadow-[0_10px_24px_rgba(0,0,0,0.55)] hover:bg-black hover:text-[#ffae42] hover:shadow-[0_0_14px_#ffaa33]'

	const onLogout = () => {
		logout()
		navigate(ROUTES.HOME)
	}

	const renderItem = (item, { className = linkBase, showLabel = false, onClick } = {}) => {
		const active = item.type === 'link' && location.pathname === item.to
		const labelClass = showLabel ? 'text-lg' : 'sr-only'
		if (item.type === 'anchor') {
			return (
				<li key={item.label}>
					<a href={item.to} className={`${className} ${active ? 'bg-[#ffaa33]/15 text-[#ffae42]' : ''}`} onClick={onClick}>
						<i className={`${item.icon} text-xl`} aria-hidden="true" />
						<span className={labelClass}>{item.label}</span>
					</a>
				</li>
			)
		}
		if (item.type === 'download') {
			return (
				<li key={item.label}>
					<a href={item.to} download className={className} aria-label={item.label} onClick={onClick}>
						<i className={`${item.icon} text-xl`} aria-hidden="true" />
						<span className={labelClass}>{item.label}</span>
					</a>
				</li>
			)
		}
		if (item.type === 'button') {
			return (
				<li key={item.label}>
					<button
						type="button"
						onClick={() => {
							onLogout()
							if (onClick) onClick()
						}}
						className={className}
						aria-label={item.label}
					>
						<i className={`${item.icon} text-xl`} aria-hidden="true" />
						<span className={labelClass}>{item.label}</span>
					</button>
				</li>
			)
		}
		return (
			<li key={item.label}>
				<Link
					to={item.to}
					className={`${className} ${active ? 'bg-[#ffaa33]/15 text-[#ffae42]' : ''}`}
					aria-label={item.label}
					onClick={onClick}
				>
					<i className={`${item.icon} text-xl`} aria-hidden="true" />
					<span className={labelClass}>{item.label}</span>
				</Link>
			</li>
		)
	}
	return (
		<nav className="fixed top-4 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2">
			<div className="px-4">
				<div className="flex items-center justify-end md:hidden">
					<button
						type="button"
						onClick={() => setOpen((v) => !v)}
						aria-expanded={open}
						aria-label={open ? 'Menü bezárása' : 'Menü megnyitása'}
						className="inline-flex items-center justify-center rounded-2xl h-12 w-12 text-[#ffaa33] bg-black/80 border border-[#ffaa33]/70 shadow-[0_10px_24px_rgba(0,0,0,0.55)]"
					>
						<i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'} text-xl`} aria-hidden="true" />
					</button>
				</div>

				<ul className="mx-auto hidden md:flex items-center justify-center gap-5 rounded-[2rem] border border-[#ffaa33]/40 bg-black/70 px-5 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.55)] backdrop-blur-xl">
					{iconNav.map((item) => renderItem(item))}
				</ul>

				{open && (
					<div className="md:hidden mt-3 rounded-2xl border border-[#ffaa33]/40 bg-black/80 px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.55)] backdrop-blur-xl">
						<ul className="flex flex-col gap-3">
							{iconNav.map((item) => renderItem(item, {
								className: linkBaseMobile,
								showLabel: true,
								onClick: () => setOpen(false)
							}))}
						</ul>
					</div>
				)}
			</div>
		</nav>
	)
}
