import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../routes/paths'

export default function Home() {
	const [loggedIn, setLoggedIn] = useState(false)
	const [selectedPatch, setSelectedPatch] = useState('')
  const navigate = useNavigate()

	useEffect(() => {
		const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null
		setLoggedIn(!!token)
	}, [])

	const patchNotes = useMemo(
		() => [
			{ id: '1.0.0', title: '1.0.0 – Kezdő kiadás', content: 'Első stabil verzió, alap játékmódok és UI.' },
			{ id: '1.1.0', title: '1.1.0 – Egyensúly frissítés', content: 'Fegyver balansz, hibajavítások és teljesítmény.' },
		],
		[]
	)

	const currentPatch = useMemo(() => patchNotes.find(p => p.id === selectedPatch), [patchNotes, selectedPatch])

	return (
		<div className="max-w-[1000px] mx-auto">
			<div className="flex justify-center">
				<img
					src="/img/Logo.png"
					alt="BitFighters Logo"
					className={`w-[350px] rounded-2xl transition-transform duration-300 hover:animate-pulse shadow-[0_0_0_rgba(255,165,0,0)] hover:shadow-[0_0_40px_10px_rgba(255,165,0,0.8)] sm:w-[450px] md:w-[700px]`}
				/>
			</div>

			{loggedIn ? (
				<section id="download" className={`backdrop-blur-xl bg-black/65 border-2 border-[#ffaa33]/70 rounded-2xl mx-auto mt-8 mb-6 px-6 py-8 shadow-[0_0_20px_rgba(255,174,66,0.6)] w-full text-center md:w-2/3`}>
					<p id="letoltes" className={`-mt-2 text-5xl font-bold mb-2 text-white sm:text-6xl md:text-7xl`}>
						játék letöltése
					</p>
					<a href="/BitFighters/BitFightersLauncherSetup.exe" download className="inline-block">
						<i className={`bx bx-arrow-in-down-square-half text-white w-[70%] text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] p-3 rounded-[30px] border-[3px] border-[#ffaa33] bg-[linear-gradient(to_right,#ffaa33,#ff7b00)] shadow-[0_0_20px_#ff7b00] transition-transform duration-300 hover:scale-110 hover:bg-[linear-gradient(to_right,#ff9900,#ff6600)] hover:shadow-[0_0_25px_#ffae42]`}></i>
					</a>
				</section>
			) : (
				<section id="Lock-selection" className={`backdrop-blur-xl bg-black/65 border-2 border-[#ffaa33]/70 rounded-2xl mx-auto mt-8 mb-6 px-6 py-10 shadow-[0_0_20px_rgba(255,174,66,0.6)] text-center`}>
					<p className={`text-white font-bold text-2xl mb-6 sm:text-3xl md:text-5xl`}>
						Regisztrálj vagy jelentkezz be a játék letöltéséhez!
					</p>
					<div className="flex justify-center gap-4 sm:gap-6 mt-4 flex-col sm:flex-row">
						<button onClick={() => navigate(ROUTES.REGISTER)} className={`bg-transparent text-[#ffaa33] text-2xl md:text-3xl font-semibold px-5 py-2 cursor-pointer border-2 border-[#ffaa33] rounded-xl transition shadow-[0_0_8px_rgba(255,170,51,0.4)] hover:bg-[#ffaa33]/15 hover:text-[#ffae42] hover:shadow-[0_0_12px_#ffaa33]`}>
							Regisztráció
						</button>
						<button onClick={() => navigate(ROUTES.LOGIN)} className={`bg-transparent text-[#ffaa33] text-2xl md:text-3xl font-semibold px-5 py-2 cursor-pointer border-2 border-[#ffaa33] rounded-xl transition shadow-[0_0_8px_rgba(255,170,51,0.4)] hover:bg-[#ffaa33]/15 hover:text-[#ffae42] hover:shadow-[0_0_12px_#ffaa33]`}>
							Bejelentkezés
						</button>
					</div>
				</section>
			)}

			{!loggedIn && (
				<>
					<Section>
						<p className="text-[18px] sm:text-[22px] md:text-[26px] leading-relaxed">
							BitFighters egy 2D-s, retro-stílusú, pixeles grafikájú, gyors ütemű akciójáték, ahol a játékosok hullámokban (wave)
							érkező ellenfelek ellen küzdenek. A játék különböző játékmódokat kínál, köztük egyjátékos, kooperatív és 1v1
							multiplayer lehetőségeket is, így minden játékos megtalálhatja a számára legizgalmasabb kihívást.
						</p>
					</Section>

					<Section>
						<h2 className="text-[#ffae42] text-[26px] sm:text-[32px] md:text-[36px] font-semibold">🎮 Fő játékmódok:</h2>
						<ul className="mt-5 pl-6 text-[18px] sm:text-[20px] md:text-[24px] list-disc">
							<li className="mb-4">
								Wave mód (Single / Coop) Védd meg magad (vagy a társaddal együtt) a végtelenül érkező, fokozatosan erősödő ellenségek ellen.
								Minden egyes wave után választhatsz fejlesztéseket, új fegyvereket, vagy visszatöltheted az életerődet.
							</li>
							<li className="mb-4">
								1v1 PvP mód Harcolj egy másik játékossal egy arénában! Tiszta skill, gyors reakció és taktikai gondolkodás dönt arról, ki lesz a győztes.
							</li>
							<li className="mb-1">
								Coop Wave mód Két játékos együttműködve próbál túlélni, miközben az ellenségek egyre többen és erősebbek lesznek. Használjátok ki
								egymás képességeit és osszátok meg az erőforrásokat! (A jövőben tervezett módok: 2v2 PvP, időre menő kihívások, túlélőverseny, Boss Run stb.)
							</li>
						</ul>
					</Section>

					<Section>
						<h2 className="text-[#ffae42] text-[26px] sm:text-[32px] md:text-[36px] font-semibold">🕹️ Jellemzők:</h2>
						<ul className="mt-5 pl-6 text-[18px] sm:text-[20px] md:text-[24px] list-disc">
							<li>2D-s</li>
							<li>Pixeles látványvilág retró hangulattal</li>
							<li>Gyors dinamikus harcrendszer</li>
							<li>Fejleszthető karakterek és fegyverek</li>
							<li>Változatos ellenfelek és pályák</li>
							<li>Lokális és online multiplayer támogatás</li>
							<li>Ranglista</li>
							<li>Statisztikák</li>
							<li>Kihívások</li>
						</ul>
					</Section>
				</>
			)}

			<section id="patch-notes" className={`backdrop-blur-xl bg-black/70 border-2 border-[#ffaa33]/70 rounded-2xl mx-auto mt-10 px-6 py-10 shadow-[0_0_20px_rgba(255,174,66,0.6)] max-w-[900px]`}>
				<label htmlFor="patchNotesDropdown" className={`text-white font-bold text-2xl block text-center tracking-wide mb-4 sm:text-3xl`}>
					Patch Notes:
				</label>
				<div className="flex justify-center">
					<select id="patchNotesDropdown" value={selectedPatch} onChange={(e) => setSelectedPatch(e.target.value)} className={`w-full text-base px-4 py-3 bg-[#111] text-white border-2 border-[#ffaa33]/70 rounded-lg mb-6 outline-none focus:border-[#ff7b00] sm:w-4/5 md:w-3/5 sm:text-lg`}>
						<option value="">Válassz egy patch note-ot</option>
						{patchNotes.map(p => (
							<option key={p.id} value={p.id}>{p.title}</option>
						))}
					</select>
				</div>
				<h3 id="patchNoteTitle" className={`text-[#ff7b00] text-xl mt-2 mb-2 sm:text-2xl`}>
					{currentPatch?.title || ''}
				</h3>
				<div id="patchNoteContent" className={`text-base sm:text-lg text-white bg-[#222] rounded-xl px-5 py-4 min-h-[120px] border border-[#444]`}>
					{currentPatch?.content || ''}
				</div>
			</section>
		</div>
	)
}

function Section({ children }) {
	return (
		<section className={`backdrop-blur-xl bg-black/65 border-2 border-[#ffaa33]/70 rounded-2xl mx-auto my-6 px-6 py-8 shadow-[0_0_20px_rgba(255,174,66,0.6)] opacity-90 hover:opacity-100 transition-opacity md:px-12 md:py-10`}>
			{children}
		</section>
	)
}
