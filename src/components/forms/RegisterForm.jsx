import { useState } from 'react'

export default function RegisterForm() {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [msg, setMsg] = useState('')
	const [isSuccess, setIsSuccess] = useState(false)
	const [loading, setLoading] = useState(false)

	const onSubmit = async (e) => {
		e.preventDefault()
		setMsg('')
		setIsSuccess(false)

		if (password !== confirm) {
			setMsg('A jelszavak nem egyeznek!')
			setIsSuccess(false)
			return
		}

		setLoading(true)
		try {
			const res = await fetch('https://bitfighters.eu/api/register.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			})
			let data
			try {
				data = await res.json()
			} catch (_) {
				data = {}
			}
			const ok = res.ok
			setMsg(data?.message || (ok ? 'Sikeres regisztráció!' : 'Hiba történt'))
			setIsSuccess(ok)
			if (ok) {
				setUsername('')
				setPassword('')
				setConfirm('')
			}
		} catch (err) {
			setMsg('Kapcsolati hiba!')
			setIsSuccess(false)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start pt-10">
			<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">
				Regisztráció
			</h1>

			<form
				onSubmit={onSubmit}
				className="backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] w-full max-w-[31.25rem] mb-[3.75rem] px-[3.125rem] py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90 transition-opacity hover:opacity-100"
			>
				<label className="text-[1.625rem] block mt-[1.5625rem] text-[#ffb366] font-semibold">
					Felhasználónév:
					<input
						type="text"
						required
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="w-full px-[0.6875rem] py-[0.6875rem] mt-[0.625rem] rounded-[0.875rem] border-2 border-[#ffaa33] text-[1.5625rem] bg-white/15 text-white shadow-[0_0_0.625rem_#ffaa33] outline-none transition focus:shadow-[0_0_1.375rem_#ffae42,0_0_2.125rem_#ffaa33] focus:border-[#ffae42] focus:bg-white/30"
					/>
				</label>

				<label className="text-[1.625rem] block mt-[1.5625rem] text-[#ffb366] font-semibold">
					Jelszó:
					<div className="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-[0.6875rem] py-[0.6875rem] mt-[0.625rem] rounded-[0.875rem] border-2 border-[#ffaa33] text-[1.5625rem] bg-white/15 text-white shadow-[0_0_0.625rem_#ffaa33] outline-none transition focus:shadow-[0_0_1.375rem_#ffae42,0_0_2.125rem_#ffaa33] focus:border-[#ffae42] focus:bg-white/30 pr-12"
						/>
						<i
							role="button"
							aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
							className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} absolute right-[0.875rem] top-1/2 -translate-y-1/2 cursor-pointer text-[#ffaa33] text-[1.75rem] select-none leading-none mt-[5px]`}
							onClick={() => setShowPassword((v) => !v)}
						/>
					</div>
				</label>

				<label className="text-[1.625rem] block mt-[1.5625rem] text-[#ffb366] font-semibold">
					Jelszó megerősítése:
					<div className="relative">
						<input
							type={showConfirm ? 'text' : 'password'}
							required
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							className="w-full px-[0.6875rem] py-[0.6875rem] mt-[0.625rem] rounded-[0.875rem] border-2 border-[#ffaa33] text-[1.5625rem] bg-white/15 text-white shadow-[0_0_0.625rem_#ffaa33] outline-none transition focus:shadow-[0_0_1.375rem_#ffae42,0_0_2.125rem_#ffaa33] focus:border-[#ffae42] focus:bg-white/30 pr-12"
						/>
						<i
							role="button"
							aria-label={showConfirm ? 'Megerősítő jelszó elrejtése' : 'Megerősítő jelszó megjelenítése'}
							className={`bx ${showConfirm ? 'bx-show' : 'bx-hide'} absolute right-[0.875rem] top-1/2 -translate-y-1/2 cursor-pointer text-[#ffaa33] text-[1.75rem] select-none leading-none mt-[5px]`}
							onClick={() => setShowConfirm((v) => !v)}
						/>
					</div>
				</label>

				<button
					type="submit"
					disabled={loading}
					className="w-full py-[1.375rem] mt-[2.1875rem] text-[1.875rem] rounded-[1.125rem] border-0 bg-gradient-to-r from-[#ffaa33] to-[#ff7b00] text-white font-bold shadow-[0_0_1.25rem_#ffaa33] transition hover:from-[#ff9900] hover:to-[#ff6600] hover:shadow-[0_0_1.5625rem_#ffae42] hover:scale-[1.03] disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{loading ? 'Feldolgozás…' : 'Regisztráció'}
				</button>

				{msg ? (
					<p
						className={`text-center text-[2.1875rem] mt-[1.5625rem] mb-0 font-semibold ${isSuccess ? 'text-green-500' : 'text-[#ff6600]'}`}
						aria-live="polite"
					>
						{msg}
					</p>
				) : null}
			</form>
		</div>
	)
}

