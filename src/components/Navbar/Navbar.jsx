import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/paths'
import useAuth from '../../hooks/useAuth'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { listIncomingRequests } from '../../services/friends'
import { fetchUnread } from '../../services/messages'

export default function Navbar() {
	const [open, setOpen] = useState(false)
	const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	const { user, logout } = useAuth()
	const isAuth = !!user
	const [incomingCount, setIncomingCount] = useState(0)
	const [unreadCount, setUnreadCount] = useState(0)

	useEffect(() => {
		if (!isAuth) {
			setIncomingCount(0)
			setUnreadCount(0)
			return
		}
		let active = true
		const refresh = async () => {
			try {
				const [incoming, unread] = await Promise.all([
					listIncomingRequests(),
					fetchUnread(),
				])
				if (!active) return
				setIncomingCount(Array.isArray(incoming) ? incoming.length : 0)
				if (unread && typeof unread === 'object') {
					const total = Object.values(unread).reduce((sum, val) => sum + Number(val || 0), 0)
					setUnreadCount(total)
				} else {
					setUnreadCount(0)
				}
			} catch {
				if (!active) return
				setIncomingCount(0)
				setUnreadCount(0)
			}
		}

		refresh()
		const id = setInterval(refresh, 8000)
		return () => {
			active = false
			clearInterval(id)
		}
	}, [isAuth])

	const friendsBadge = useMemo(() => incomingCount + unreadCount, [incomingCount, unreadCount])

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
					{ type: 'link', to: ROUTES.FRIENDS, label: 'Barátok', icon: 'fa-solid fa-user-group', badge: friendsBadge },
					{ type: 'link', to: ROUTES.LEADERBOARD, label: 'Ranglista', icon: 'fa-solid fa-trophy' },
					{ type: 'button', label: 'Kijelentkezés', icon: 'fa-solid fa-right-from-bracket' },
			  ]
			: []),
	]

	const linkBase =
		'inline-flex items-center justify-center text-[#ffaa33] transition rounded-2xl h-12 w-12 bg-black/80 backdrop-blur-md border border-[#ffaa33]/70 shadow-[0_10px_24px_rgba(0,0,0,0.55)] hover:bg-black hover:text-[#ffae42] hover:shadow-[0_0_14px_#ffaa33]'
	const linkBaseDesktop =
		'inline-flex flex-col items-center justify-center gap-1 text-[#ffaa33] transition rounded-2xl h-16 w-16 bg-black/80 backdrop-blur-md border border-[#ffaa33]/70 shadow-[0_10px_24px_rgba(0,0,0,0.55)] hover:bg-black hover:text-[#ffae42] hover:shadow-[0_0_14px_#ffaa33]'
	const linkBaseMobile =
		'inline-flex items-center gap-3 text-[#ffaa33] transition rounded-2xl h-12 w-full px-4 bg-black/80 backdrop-blur-md border border-[#ffaa33]/70 shadow-[0_10px_24px_rgba(0,0,0,0.55)] hover:bg-black hover:text-[#ffae42] hover:shadow-[0_0_14px_#ffaa33]'

	const requestLogout = () => {
		setLogoutConfirmOpen(true)
	}

	const handleConfirmLogout = () => {
		setLogoutConfirmOpen(false)
		logout()
		navigate(ROUTES.HOME)
		setOpen(false)
	}

	const renderItem = (item, { className = linkBase, showLabel = false, labelClassName = 'text-lg', onClick } = {}) => {
		const active = item.type === 'link' && location.pathname === item.to
		const labelClass = showLabel ? labelClassName : 'sr-only'
		const badge = Number(item.badge || 0)
		const badgeEl = badge > 0 ? (
			<span className="absolute -top-2 -right-2 min-w-[1.35rem] h-6 px-1 rounded-full bg-[#ff7b00] text-white text-xs font-bold flex items-center justify-center shadow-[0_0_10px_rgba(255,123,0,0.8)]">
				{badge > 99 ? '99+' : badge}
			</span>
		) : null
		if (item.type === 'anchor') {
			return (
				<li key={item.label}>
					<a href={item.to} className={`${className} ${active ? 'bg-[#ffaa33]/15 text-[#ffae42]' : ''} relative`} onClick={onClick}>
						<i className={`${item.icon} text-xl`} aria-hidden="true" />
						<span className={labelClass}>{item.label}</span>
						{badgeEl}
					</a>
				</li>
			)
		}
		if (item.type === 'download') {
			return (
				<li key={item.label}>
					<a href={item.to} download className={`${className} relative`} aria-label={item.label} onClick={onClick}>
						<i className={`${item.icon} text-xl`} aria-hidden="true" />
						<span className={labelClass}>{item.label}</span>
						{badgeEl}
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
							requestLogout()
							if (onClick) onClick()
						}}
						className={`${className} relative`}
						aria-label={item.label}
					>
						<i className={`${item.icon} text-xl`} aria-hidden="true" />
						<span className={labelClass}>{item.label}</span>
						{badgeEl}
					</button>
				</li>
			)
		}
		return (
			<li key={item.label}>
				<Link
					to={item.to}
					className={`${className} ${active ? 'bg-[#ffaa33]/15 text-[#ffae42]' : ''} relative`}
					aria-label={item.label}
					onClick={onClick}
				>
					<i className={`${item.icon} text-xl`} aria-hidden="true" />
					<span className={labelClass}>{item.label}</span>
					{badgeEl}
				</Link>
			</li>
		)
	}
	return (
		<>
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
					{iconNav.map((item) => renderItem(item, {
						className: linkBaseDesktop,
						showLabel: true,
						labelClassName: 'text-[0.7rem] leading-tight',
					}))}
				</ul>

				{open && (
					<div className="md:hidden mt-3 rounded-2xl border border-[#ffaa33]/40 bg-black/80 px-4 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.55)] backdrop-blur-xl">
						<ul className="flex flex-col gap-3">
							{iconNav.map((item) => renderItem(item, {
								className: linkBaseMobile,
								showLabel: true,
								labelClassName: 'text-lg',
								onClick: () => setOpen(false)
							}))}
						</ul>
					</div>
				)}
				</div>
			</nav>

			<Modal
				open={logoutConfirmOpen}
				onClose={() => setLogoutConfirmOpen(false)}
				title="Kijelentkezés"
			>
				Biztosan ki szeretnél jelentkezni?
				<div className="mt-5 flex flex-wrap gap-3 justify-end">
					<Button variant="ghost" onClick={() => setLogoutConfirmOpen(false)}>
						Mégse
					</Button>
					<Button variant="primary" onClick={handleConfirmLogout}>
						Kijelentkezés
					</Button>
				</div>
			</Modal>
		</>
	)
}
