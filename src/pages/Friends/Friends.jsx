import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import useAuth from '../../hooks/useAuth'
import { buildUrl } from '../../services/apiClient'
import {
	acceptFriendRequest,
	cancelFriendRequest,
	listFriends,
	listIncomingRequests,
	listOutgoingRequests,
	removeFriend,
	rejectFriendRequest,
	sendFriendRequest,
	searchUsers,
} from '../../services/friends'
import { fetchThread, fetchUnread, markRead, sendMessage } from '../../services/messages'
import { ROUTES } from '../../routes/paths'

function normalizePicturePath(path) {
	if (!path) return '/img/default_pfp.png'
	if (path.startsWith('http://') || path.startsWith('https://')) return path
	return buildUrl(path.replace(/^\/+/, ''))
}

function formatTime(ts) {
	if (!ts) return ''
	const date = new Date(ts * 1000)
	return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })
}

export default function Friends() {
	const { user, token } = useAuth()
	const me = user?.username
	const [friends, setFriends] = useState([])
	const [incoming, setIncoming] = useState([])
	const [outgoing, setOutgoing] = useState([])
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [selectedFriend, setSelectedFriend] = useState(null)
	const [messages, setMessages] = useState([])
	const [messageInput, setMessageInput] = useState('')
	const [loading, setLoading] = useState(true)
	const [chatLoading, setChatLoading] = useState(false)
	const [sending, setSending] = useState(false)
	const [error, setError] = useState('')
	const [unreadMap, setUnreadMap] = useState({})
	const lastIdRef = useRef(0)
	const chatEndRef = useRef(null)

	const selectedUsername = selectedFriend?.username

	const refreshAll = async () => {
		setError('')
		setLoading(true)
		try {
			const [friendsData, incomingData, outgoingData, unreadData] = await Promise.all([
				listFriends(),
				listIncomingRequests(),
				listOutgoingRequests(),
				fetchUnread(),
			])
			setFriends(Array.isArray(friendsData) ? friendsData : [])
			setIncoming(Array.isArray(incomingData) ? incomingData : [])
			setOutgoing(Array.isArray(outgoingData) ? outgoingData : [])
			setUnreadMap(unreadData && typeof unreadData === 'object' ? unreadData : {})
		} catch (err) {
			setError(err?.message || 'Nem sikerült betölteni a barátokat.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (!token) return
		refreshAll()
	}, [token])

	useEffect(() => {
		if (!token) return undefined
		const id = setInterval(async () => {
			try {
				const unread = await fetchUnread()
				if (unread && typeof unread === 'object') setUnreadMap(unread)
			} catch {
				// ignore background errors
			}
		}, 8000)
		return () => clearInterval(id)
	}, [token])

	useEffect(() => {
		if (!selectedUsername || !token) return undefined
		let active = true
		setChatLoading(true)
		setMessages([])
		lastIdRef.current = 0
		fetchThread(selectedUsername, 0)
			.then((data) => {
				if (!active) return
				setMessages(Array.isArray(data?.messages) ? data.messages : [])
				lastIdRef.current = Number(data?.last_id || 0)
			})
			.catch((err) => {
				if (!active) return
				setError(err?.message || 'Nem sikerült betölteni az üzeneteket.')
			})
			.finally(() => {
				if (!active) return
				setChatLoading(false)
			})

		markRead(selectedUsername).then(() => {
			setUnreadMap((prev) => ({ ...prev, [selectedUsername]: 0 }))
		}).catch(() => {})

		const id = setInterval(async () => {
			try {
				const sinceId = lastIdRef.current
				const data = await fetchThread(selectedUsername, sinceId)
				const incomingMessages = Array.isArray(data?.messages) ? data.messages : []
				if (incomingMessages.length > 0) {
					setMessages((prev) => [...prev, ...incomingMessages])
					const lastId = Number(data?.last_id || sinceId)
					lastIdRef.current = Math.max(lastIdRef.current, lastId)
					await markRead(selectedUsername)
					setUnreadMap((prev) => ({ ...prev, [selectedUsername]: 0 }))
				}
			} catch {
				// ignore polling errors
			}
		}, 4000)

		return () => {
			active = false
			clearInterval(id)
		}
	}, [selectedUsername, token])

	useEffect(() => {
		if (!chatEndRef.current) return
		chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
	}, [messages, selectedUsername])

	const handleSearch = async (query, { silent = false } = {}) => {
		if (!silent) setError('')
		const q = query.trim()
		if (!q) {
			setSearchResults([])
			return
		}
		try {
			const data = await searchUsers(q)
			setSearchResults(Array.isArray(data) ? data : [])
		} catch (err) {
			if (!silent) setError(err?.message || 'Nem sikerült keresni.')
		}
	}

	useEffect(() => {
		const q = searchQuery.trim()
		if (!q) {
			setSearchResults([])
			return
		}
		const id = setTimeout(() => {
			handleSearch(q, { silent: true })
		}, 350)
		return () => clearTimeout(id)
	}, [searchQuery])

	const handleSendMessage = async (e) => {
		e.preventDefault()
		if (!selectedUsername || !messageInput.trim()) return
		setSending(true)
		setError('')
		try {
			const content = messageInput.trim()
			const result = await sendMessage(selectedUsername, content)
			const id = Number(result?.id || 0)
			const localMessage = {
				id: id || Date.now(),
				sender: me,
				receiver: selectedUsername,
				content,
				ts: Math.floor(Date.now() / 1000),
				read: false,
			}
			setMessages((prev) => [...prev, localMessage])
			if (id > lastIdRef.current) lastIdRef.current = id
			setMessageInput('')
		} catch (err) {
			setError(err?.message || 'Nem sikerült elküldeni az üzenetet.')
		} finally {
			setSending(false)
		}
	}

	const pendingTotal = useMemo(() => incoming.length + outgoing.length, [incoming.length, outgoing.length])

	if (!token) {
		return (
			<div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start pt-10">
				<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">
					Barátok
				</h1>
				<div className="backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] w-full max-w-[31.25rem] px-6 sm:px-[3.125rem] py-8 sm:py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90">
					<p className="text-center text-[1.5rem] text-[#ff6600]">
						A barátok listához jelentkezz be.{' '}
						<Link to={ROUTES.LOGIN} className="text-[#ffae42] font-semibold hover:underline">Bejelentkezés</Link>
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start pt-10 px-3">
			<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">
				Barátok és Chat
			</h1>

			{error ? (
				<p className="text-center text-[1.25rem] mb-5 font-semibold text-[#ff6600]" aria-live="polite">
					{error}
				</p>
			) : null}

			<div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-6">
				<section className="backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] px-5 py-5 shadow-[0_0_1.25rem_rgba(255,174,66,0.6)]">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-[#ffb366] font-semibold text-2xl">Barátok</h2>
						{pendingTotal > 0 ? (
							<span className="text-xs bg-[#ffaa33]/20 text-[#ffb366] px-2 py-1 rounded-full">+{pendingTotal}</span>
						) : null}
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault()
							handleSearch(searchQuery)
						}}
						className="flex gap-2 mb-4"
					>
						<Input
							name="search"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Felhasználó keresése"
							size="sm"
						/>
						<Button type="submit" variant="secondary" size="sm">Keres</Button>
					</form>

					{loading ? (
						<div className="flex items-center gap-2 text-white/80">
							<Spinner size="sm" />
							<span>Betöltés...</span>
						</div>
					) : (
						<>
							{searchResults.length > 0 ? (
								<div className="mb-5">
									<p className="text-[#ffb366] font-semibold text-lg mb-2">Keresési találatok</p>
									<ul className="space-y-2">
										{searchResults.map((item) => (
											<li key={item.username} className="flex items-center justify-between gap-2 bg-black/40 rounded-xl px-3 py-2">
												<div className="flex items-center gap-3">
													<img src={normalizePicturePath(item.profile_picture)} alt="" className="w-9 h-9 rounded-full object-cover border border-[#ffaa33]/60" />
													<span className="text-white">{item.username}</span>
												</div>
												{item.relation === 'none' ? (
													<Button size="sm" variant="secondary" onClick={() => sendFriendRequest(item.username).then(refreshAll).catch((err) => setError(err?.message || 'Hiba'))}>
														Kérelem
													</Button>
												) : (
													<span className="text-xs text-white/60">{item.relation}</span>
												)}
											</li>
										))}
									</ul>
								</div>
							) : null}

							{incoming.length > 0 ? (
								<div className="mb-5">
									<p className="text-[#ffb366] font-semibold text-lg mb-2">Bejövő kérelmek</p>
									<ul className="space-y-2">
										{incoming.map((item) => (
											<li key={item.username} className="flex items-center justify-between gap-2 bg-black/40 rounded-xl px-3 py-2">
												<div className="flex items-center gap-3">
													<img src={normalizePicturePath(item.profile_picture)} alt="" className="w-9 h-9 rounded-full object-cover border border-[#ffaa33]/60" />
													<span className="text-white">{item.username}</span>
												</div>
												<div className="flex gap-2">
													<Button size="sm" variant="secondary" onClick={() => acceptFriendRequest(item.username).then(refreshAll).catch((err) => setError(err?.message || 'Hiba'))}>
														Elfogad
													</Button>
													<Button size="sm" variant="ghost" onClick={() => rejectFriendRequest(item.username).then(refreshAll).catch((err) => setError(err?.message || 'Hiba'))}>
														Elutasít
													</Button>
												</div>
											</li>
										))}
									</ul>
								</div>
							) : null}

							{outgoing.length > 0 ? (
								<div className="mb-5">
									<p className="text-[#ffb366] font-semibold text-lg mb-2">Kimenő kérelmek</p>
									<ul className="space-y-2">
										{outgoing.map((item) => (
											<li key={item.username} className="flex items-center justify-between gap-2 bg-black/40 rounded-xl px-3 py-2">
												<div className="flex items-center gap-3">
													<img src={normalizePicturePath(item.profile_picture)} alt="" className="w-9 h-9 rounded-full object-cover border border-[#ffaa33]/60" />
													<span className="text-white">{item.username}</span>
												</div>
												<Button size="sm" variant="ghost" onClick={() => cancelFriendRequest(item.username).then(refreshAll).catch((err) => setError(err?.message || 'Hiba'))}>
													Visszavon
												</Button>
											</li>
										))}
									</ul>
								</div>
							) : null}

							<div>
								<p className="text-[#ffb366] font-semibold text-lg mb-2">Barátlista</p>
								{friends.length === 0 ? (
									<p className="text-white/70">Még nincs barátod.</p>
								) : (
									<ul className="space-y-2">
										{friends.map((item) => {
											const unread = Number(unreadMap?.[item.username] || 0)
											const isActive = selectedUsername === item.username
											return (
												<li key={item.username} className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 ${isActive ? 'bg-[#ffaa33]/20' : 'bg-black/40'}`}>
													<button
														type="button"
														className="flex items-center gap-3 text-left flex-1"
														onClick={() => setSelectedFriend(item)}
													>
														<img src={normalizePicturePath(item.profile_picture)} alt="" className="w-10 h-10 rounded-full object-cover border border-[#ffaa33]/60" />
														<span className="text-white">{item.username}</span>
														{unread > 0 ? (
															<span className="ml-auto mr-2 text-xs bg-[#ff7b00] text-white px-2 py-0.5 rounded-full">{unread}</span>
														) : null}
													</button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() => removeFriend(item.username).then(refreshAll).catch((err) => setError(err?.message || 'Hiba'))}
													>
														Eltávolít
													</Button>
												</li>
										)})}
									</ul>
								)}
							</div>
						</>
					)}
				</section>

				<section className="backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] px-5 py-5 shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] flex flex-col min-h-[32rem] h-[calc(100vh-14rem)] max-h-[calc(100vh-14rem)]">
					{selectedFriend ? (
						<>
							<div className="flex items-center gap-3 mb-4">
								<img src={normalizePicturePath(selectedFriend.profile_picture)} alt="" className="w-12 h-12 rounded-full object-cover border border-[#ffaa33]/60" />
								<div>
									<h2 className="text-[#ffb366] font-semibold text-2xl">{selectedFriend.username}</h2>
									<p className="text-white/60 text-sm">Privát chat</p>
								</div>
							</div>

							<div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2 bf-scroll">
								{chatLoading ? (
									<div className="flex items-center gap-2 text-white/80">
										<Spinner size="sm" />
										<span>Üzenetek betöltése...</span>
									</div>
								) : messages.length === 0 ? (
									<p className="text-white/60">Nincs még üzenet. Írj valamit!</p>
								) : (
									messages.map((msg) => {
										const isMine = msg.sender === me
										return (
												<div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
													<div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm md:text-base ${isMine ? 'bg-[#ff7b00] text-white' : 'bg-black/70 text-white/90 border border-[#ffaa33]/40'}`}>
														<p className="whitespace-pre-wrap break-words break-all">{msg.content}</p>
													<span className="block text-xs text-white/60 mt-1 text-right">{formatTime(msg.ts)}</span>
												</div>
											</div>
										)
									})
								)}
								<div ref={chatEndRef} />
							</div>

							<form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
								<textarea
									className="flex-1 min-h-[3rem] max-h-32 overflow-y-auto resize-none rounded-xl border-2 border-[#ffaa33] bg-white/10 text-white placeholder-white/50 px-3 py-2 outline-none focus:border-[#ffae42]"
									placeholder="Írj üzenetet..."
									value={messageInput}
									onChange={(e) => setMessageInput(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
											e.preventDefault()
											handleSendMessage(e)
										}
									}}
									rows={2}
									required
								/>
								<Button type="submit" loading={sending} size="md">Küldés</Button>
							</form>
						</>
					) : (
						<div className="flex flex-1 items-center justify-center text-white/70">
							Válassz egy barátot a chathez.
						</div>
					)}
				</section>
			</div>
		</div>
	)
}
