function getRank(score) {
	if (score >= 1000) return '💎 Diamond'
	if (score >= 700) return '🔷 Platinum'
	if (score >= 500) return '🥇 Gold'
	if (score >= 300) return '🥈 Silver'
	if (score >= 100) return '🥉 Bronz'
	return '🎮 Kezdő'
}

const sampleData = [
	{ username: 'PlayerOne', highest_score: 1200, profile_picture: '/img/default_pfp.png' },
	{ username: 'RetroHero', highest_score: 780, profile_picture: '/img/default_pfp.png' },
	{ username: 'CoopMaster', highest_score: 520, profile_picture: '/img/default_pfp.png' },
	{ username: 'ArenaPro', highest_score: 350, profile_picture: '/img/default_pfp.png' },
	{ username: 'Newbie', highest_score: 60, profile_picture: '/img/default_pfp.png' },
]

// Inline Tailwind classes; removed CSS modules

export default function Leaderboard() {
	return (
		<div className="px-2">
			<h2 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000] mb-8 font-bold text-4xl sm:text-5xl md:text-[48px] pt-5">
				🏆 Leaderboard
			</h2>
			<div className="w-[90%] max-w-[950px] mx-auto overflow-x-auto rounded-2xl shadow-[0_0_22px_rgba(255,174,66,0.6)] backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 opacity-90 transition-opacity hover:opacity-100">
				<table className="w-full border-separate border-spacing-0">
					<thead>
						<tr>
							{['Profilkép','Felhasználónév','Legmagasabb pontszám','Rang'].map((label) => (
								<th
									key={label}
									className={`bg-[#ff7b00] text-white font-bold text-center px-3 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-base sm:text-2xl md:text-[30px] first:rounded-tl-2xl last:rounded-tr-2xl`}
								>
									{label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{sampleData.map((user, idx) => {
							const score = user.highest_score ?? 0
							const rank = getRank(score)
							const profilePic = user.profile_picture && user.profile_picture !== 'img/default_pfp.png'
								? user.profile_picture
								: '/img/default_pfp.png'
							return (
								<tr
									key={`${user.username}-${idx}`}
									className="even:bg-[rgba(255,183,102,0.15)] hover:bg-[rgba(255,183,102,0.3)]"
								>
									<td className="px-3 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-center whitespace-nowrap text-base sm:text-lg md:text-[30px] border-b border-[#ffb366]">
										<img
											src={profilePic}
											alt="Profilkép"
											className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full mx-auto"
											onError={(e) => { e.currentTarget.src = '/img/default_pfp.png' }}
										/>
									</td>
									<td className="px-3 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-center whitespace-nowrap text-base sm:text-lg md:text-[30px] border-b border-[#ffb366]">
										{user.username || '-'}
									</td>
									<td className="px-3 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-center whitespace-nowrap text-base sm:text-lg md:text-[30px] border-b border-[#ffb366]">
										{score}
									</td>
									<td className="px-3 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 text-center whitespace-nowrap text-base sm:text-lg md:text-[30px] border-b border-[#ffb366]">
										{rank}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}
