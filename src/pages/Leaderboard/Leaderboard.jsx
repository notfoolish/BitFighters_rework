import { useEffect, useMemo, useState } from 'react'

import Spinner from '../../components/ui/Spinner.jsx'
import { fetchLeaderboard } from '../../services/leaderboard.js'

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
	const trimmed = path.replace(/^\/+/, '')
	return `/${trimmed}`
}

export default function Leaderboard() {
	const [rows, setRows] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		let isMounted = true
		setLoading(true)
		setError('')
		fetchLeaderboard()
			.then((data) => {
				if (!isMounted) return
				setRows(Array.isArray(data) ? data : [])
			})
			.catch((err) => {
				if (!isMounted) return
				setError(err?.message || 'Nem sikerült betölteni a ranglistát')
				setRows([])
			})
			.finally(() => {
				if (!isMounted) return
				setLoading(false)
			})

		return () => {
			isMounted = false
		}
	}, [])

	const data = useMemo(() => rows.map((user) => ({
		...user,
		highest_score: Number(user?.highest_score ?? 0),
		profile_picture: normalizePicturePath(user?.profile_picture)
	})), [rows])

	return (
		<div className="px-2">
			<h2 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000] mb-8 font-bold text-3xl sm:text-4xl md:text-5xl pt-5">
				🏆 Leaderboard
			</h2>
			{loading && (
				<div className="flex items-center justify-center gap-3 text-white/80 mb-6">
					<Spinner size="md" />
					<span>Betöltés...</span>
				</div>
			)}
			{error && !loading && (
				<div className="text-center text-red-300 mb-6">
					{error}
				</div>
			)}
			<div className="w-full max-w-[720px] mx-auto overflow-x-auto rounded-2xl shadow-[0_0_22px_rgba(255,174,66,0.6)] backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 opacity-90 transition-opacity hover:opacity-100">
				<table className="w-full border-separate border-spacing-0">
					<thead>
						<tr>
							{['Profilkép','Felhasználónév','Legmagasabb pontszám','Rang'].map((label) => (
								<th
									key={label}
									className={`bg-[#ff7b00] text-white font-bold text-center px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 text-base sm:text-lg md:text-xl first:rounded-tl-2xl last:rounded-tr-2xl`}
								>
									{label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{data.length === 0 && !loading ? (
							<tr>
								<td
									colSpan={4}
									className="px-3 sm:px-5 md:px-6 py-6 text-center text-white/70"
								>
									Nincs megjeleníthető eredmény.
								</td>
							</tr>
						) : (
							data.map((user, idx) => {
								const score = user.highest_score ?? 0
								const rank = getRank(score)
								const profilePic = normalizePicturePath(user.profile_picture)
								return (
									<tr
										key={`${user.username}-${idx}`}
										className="even:bg-[rgba(255,183,102,0.15)] hover:bg-[rgba(255,183,102,0.3)]"
									>
										<td className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 text-center whitespace-nowrap text-base sm:text-lg md:text-xl border-b border-[#ffb366]">
											<img
												src={profilePic}
												alt="Profilkép"
												className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full mx-auto"
												onError={(e) => { e.currentTarget.src = '/img/default_pfp.png' }}
											/>
										</td>
										<td className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 text-center whitespace-nowrap text-base sm:text-lg md:text-xl border-b border-[#ffb366]">
											{user.username || '-'}
										</td>
										<td className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 text-center whitespace-nowrap text-base sm:text-lg md:text-xl border-b border-[#ffb366]">
											{score}
										</td>
										<td className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 text-center whitespace-nowrap text-base sm:text-lg md:text-xl border-b border-[#ffb366]">
											{rank}
										</td>
									</tr>
								)
							})
						)}
					</tbody>
				</table>
			</div>
		</div>
	)
}
