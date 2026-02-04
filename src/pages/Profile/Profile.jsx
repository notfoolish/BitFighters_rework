import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import useAuth from '../../hooks/useAuth'
import { jsonFetch, buildUrl } from '../../services/apiClient'
import { changeUsername, deleteAccount } from '../../services/auth'
import { ROUTES } from '../../routes/paths'

function getRank(score) {
	if (score >= 1000) return '💎 Diamond'
	if (score >= 700) return '🔷 Platinum'
	if (score >= 500) return '🥇 Gold'
	if (score >= 300) return '🥈 Silver'
	if (score >= 100) return '🥉 Bronz'
	return '🎮 Kezdő'
}

function normalizePicturePath(path) {
	if (!path) return '/img/default_pfp.png'
	if (path.startsWith('http://') || path.startsWith('https://')) return path
	return buildUrl(path.replace(/^\/+/, ''))
}

export default function Profile() {
	const navigate = useNavigate()
	const { token, login, logout } = useAuth()
	const [profile, setProfile] = useState(null)
	const [history, setHistory] = useState([])
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [message, setMessage] = useState('')
	const [editMode, setEditMode] = useState(false)
	const [usernameInput, setUsernameInput] = useState('')
	const [avatarFile, setAvatarFile] = useState(null)
	const [avatarPreview, setAvatarPreview] = useState('')
	const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

	useEffect(() => {
		if (!token) {
			setLoading(false)
			return
		}

		let isMounted = true
		setLoading(true)
		setMessage('')
		Promise.all([
			jsonFetch('/backend/profile.php', { auth: true }),
			jsonFetch('/backend/match_history.php', { auth: true })
		])
			.then(([profileData, historyData]) => {
				if (!isMounted) return
				setProfile(profileData)
				setUsernameInput(profileData?.username || '')
				setAvatarPreview(normalizePicturePath(profileData?.profile_picture))
				setHistory(Array.isArray(historyData) ? historyData : [])
			})
			.catch((err) => {
				if (!isMounted) return
				setMessage(err?.message || 'Nem sikerült betölteni a profilt.')
				setProfile(null)
				setHistory([])
			})
			.finally(() => {
				if (!isMounted) return
				setLoading(false)
			})

		return () => {
			isMounted = false
		}
	}, [token])

	const rankText = useMemo(() => {
		const score = Number(profile?.highest_score ?? profile?.score ?? 0)
		return `${getRank(score)}${profile?.rank ? ` (${profile.rank}. helyezett)` : ''}`
	}, [profile])

	const onFileChange = (e) => {
		const file = e.target.files?.[0]
		if (!file) {
			setAvatarFile(null)
			setAvatarPreview(normalizePicturePath(profile?.profile_picture))
			return
		}
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
		if (!allowedTypes.includes(file.type)) {
			setMessage('Csak JPEG, PNG és GIF képek engedélyezettek!')
			return
		}
		if (file.size > 5 * 1024 * 1024) {
			setMessage('A fájl túl nagy! Maximum 5MB engedélyezett.')
			return
		}
		setAvatarFile(file)
		setAvatarPreview(URL.createObjectURL(file))
	}

	const onSave = async () => {
		if (!profile) return
		setMessage('')
		setSaving(true)

		const updates = []
		let updatedProfile = { ...profile }
		let newToken = null
		try {
			if (usernameInput.trim() && usernameInput.trim() !== profile.username) {
				const data = await changeUsername(usernameInput.trim())
				newToken = data?.token || null
				updatedProfile = { ...updatedProfile, username: usernameInput.trim() }
				updates.push('Felhasználónév frissítve')
			}

			if (avatarFile) {
				const formData = new FormData()
				formData.append('profile_picture', avatarFile)
				const data = await jsonFetch('/backend/profile_picture.php', {
					method: 'POST',
					body: formData,
					auth: true
				})
				if (data?.picture_url) {
					updatedProfile = { ...updatedProfile, profile_picture: data.picture_url }
					setAvatarPreview(normalizePicturePath(data.picture_url))
				}
				updates.push('Profilkép frissítve')
			}

			if (updates.length === 0) {
				setMessage('Nem történt változás.')
				return
			}

			setProfile(updatedProfile)
			setAvatarFile(null)
			setEditMode(false)
			setMessage(updates.join(' · '))
			if (newToken) {
				login({ username: updatedProfile.username, token: newToken, profile: { username: updatedProfile.username } })
			}
		} catch (err) {
			setMessage(err?.message || 'Nem sikerült menteni a módosításokat.')
		} finally {
			setSaving(false)
		}
	}

	const onDeleteAccount = async () => {
		const confirmed = window.confirm('Biztosan törölni szeretnéd a fiókodat? Ez a művelet visszavonhatatlan!')
		if (!confirmed) return
		const doubleConfirmed = window.confirm('Ez véglegesen törli az összes adatodat! Biztos vagy benne?')
		if (!doubleConfirmed) return
		try {
			await deleteAccount()
			logout()
			navigate(ROUTES.HOME)
		} catch (err) {
			setMessage(err?.message || 'Hiba történt a fiók törlése során.')
		}
	}

	const handleConfirmLogout = () => {
		setLogoutConfirmOpen(false)
		logout()
		navigate(ROUTES.HOME)
	}

	if (!token) {
		return (
			<div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start pt-10">
				<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">
					Profil
				</h1>
				<div className="backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] w-full max-w-[31.25rem] px-6 sm:px-[3.125rem] py-8 sm:py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90">
					<p className="text-center text-[1.5rem] text-[#ff6600]">
						A profil megtekintéséhez jelentkezz be.{' '}
						<Link to={ROUTES.LOGIN} className="text-[#ffae42] font-semibold hover:underline">Bejelentkezés</Link>
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start pt-10 px-3">
			<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">
				Profil
			</h1>

			{message ? (
				<p className="text-center text-[1.75rem] mb-6 font-semibold text-[#ff6600]" aria-live="polite">
					{message}
				</p>
			) : null}

			{loading ? (
				<div className="flex items-center gap-3 text-white/80">
					<Spinner size="md" />
					<span>Betöltés...</span>
				</div>
			) : (
				<>
					<section className="w-full max-w-5xl backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] px-6 sm:px-[3.125rem] py-8 sm:py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90 transition-opacity hover:opacity-100">
						<h2 className="text-[#ffb366] font-semibold text-2xl mb-6">Felhasználói adatok</h2>

						<div className="flex flex-col items-center gap-4 mb-8">
							<img
								src={avatarPreview || '/img/default_pfp.png'}
								alt="Profilkép"
								className="w-36 h-36 rounded-full object-cover border-2 border-[#ffaa33]/70 shadow-[0_0_12px_#ffaa33]"
								onError={(e) => { e.currentTarget.src = '/img/default_pfp.png' }}
							/>
							{editMode && (
								<div>
									<input
										type="file"
										id="profile-picture-input"
										accept="image/*"
										className="hidden"
										onChange={onFileChange}
									/>
									<label
										htmlFor="profile-picture-input"
										className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-[#ffaa33] px-4 py-2 text-[#ffaa33] hover:bg-[#ffaa33]/10"
									>
										Profilkép feltöltése
									</label>
								</div>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
							<div>
								<p className="text-[#ffb366] font-semibold text-xl mb-2">Felhasználónév</p>
								{editMode ? (
									<Input
										name="username"
										value={usernameInput}
										onChange={(e) => setUsernameInput(e.target.value)}
										size="md"
									/>
								) : (
									<p className="text-white text-2xl">{profile?.username || '-'}</p>
								)}
							</div>
							<div>
								<p className="text-[#ffb366] font-semibold text-xl mb-2">Legmagasabb pontszám</p>
								<p className="text-white text-2xl">{profile?.highest_score ?? profile?.score ?? 0}</p>
							</div>
							<div>
								<p className="text-[#ffb366] font-semibold text-xl mb-2">Rangsor</p>
								<p className="text-white text-2xl">{rankText}</p>
							</div>
						</div>

						<div className="mt-8 flex flex-wrap gap-3 justify-center">
							{!editMode ? (
								<Button variant="secondary" size="lg" onClick={() => setEditMode(true)}>
									Adatok szerkesztése
								</Button>
							) : (
								<>
									<Button variant="ghost" size="lg" onClick={() => {
										setEditMode(false)
										setUsernameInput(profile?.username || '')
										setAvatarFile(null)
										setAvatarPreview(normalizePicturePath(profile?.profile_picture))
									}}>
										Vissza
									</Button>
									<Button size="lg" loading={saving} onClick={onSave}>
										Mentés
									</Button>
								</>
							)}
						</div>
					</section>

					<section className="w-full max-w-5xl mt-8 backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] px-6 sm:px-[3.125rem] py-8 sm:py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90 transition-opacity hover:opacity-100">
						<h2 className="text-[#ffb366] font-semibold text-2xl mb-6">Meccselőzmények</h2>
						<div className="overflow-x-auto">
							<table className="w-full border-separate border-spacing-0">
								<thead>
									<tr>
										{['Felhasználónév', 'Dátum', 'Pontszám'].map((label) => (
											<th
												key={label}
												className="bg-[#ff7b00] text-white font-bold text-center px-4 py-3 text-base sm:text-lg"
											>
												{label}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{history.length === 0 ? (
										<tr>
											<td colSpan={3} className="px-4 py-6 text-center text-white/70">
												Nincs elérhető meccs.
											</td>
										</tr>
									) : (
										history.map((match, idx) => (
											<tr key={`${match.username}-${idx}`} className="even:bg-[rgba(255,183,102,0.15)]">
												<td className="px-4 py-3 text-center border-b border-[#ffb366]">
													{match.username}
												</td>
												<td className="px-4 py-3 text-center border-b border-[#ffb366]">
													{match.created_at ? new Date(match.created_at).toLocaleString('hu-HU') : '-'}
												</td>
												<td className="px-4 py-3 text-center border-b border-[#ffb366]">
													{match.score}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</section>

					<section className="w-full max-w-5xl mt-8 backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] px-6 sm:px-[3.125rem] py-8 sm:py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90 transition-opacity hover:opacity-100">
						<h2 className="text-[#ffb366] font-semibold text-2xl mb-6">Fiók műveletek</h2>
						<div className="flex flex-wrap gap-3">
							<Button variant="secondary" size="lg" onClick={() => navigate(ROUTES.CHANGE_PASSWORD)}>
								Jelszó módosítása
							</Button>
							<Button
								variant="outline"
								size="lg"
								onClick={() => setLogoutConfirmOpen(true)}
							>
								Kijelentkezés
							</Button>
							<Button
								variant="primary"
								size="lg"
								className="bg-red-600 hover:bg-red-700 shadow-[0_0_12px_rgba(220,53,69,0.7)]"
								onClick={onDeleteAccount}
							>
								Fiók törlése
							</Button>
						</div>
					</section>
				</>
			)}

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
		</div>
	)
}
