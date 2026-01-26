import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'

export default function Login() {
	const navigate = useNavigate()
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [loading, setLoading] = useState(false)
	const [msg, setMsg] = useState('')
	const [isSuccess, setIsSuccess] = useState(false)

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setMsg('')
		setIsSuccess(false)

		try {
			const res = await fetch('https://bitfighters.eu/api/login.php', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			})
			const data = await res.json().catch(() => ({}))

			const ok = res.ok
			const message = data?.message || (ok ? 'Sikeres bejelentkezés!' : 'Hibás adatok')
			setMsg(message)
			setIsSuccess(!!ok)

			if (ok && data?.token) {
				localStorage.setItem('token', data.token)
				localStorage.setItem('username', username)
				navigate('/profile')
			}
		} catch (err) {
			setMsg('Hiba történt a kapcsolat során.')
			setIsSuccess(false)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="w-full flex flex-col items-center">
			<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">Bejelentkezés</h1>

			<form onSubmit={handleSubmit} className="backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] max-w-[31.25rem] w-full mb-[3.75rem] px-[3.125rem] py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90 transition-opacity hover:opacity-100">
				<Input
					label="Felhasználónév:"
					name="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
					autoComplete="username"
					size="lg"
					className="mt-[0.625rem]"
				/>

				<div className="relative">
					<Input
						label="Jelszó:"
						name="password"
						type={showPassword ? 'text' : 'password'}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						autoComplete="current-password"
						size="lg"
						className="mt-[0.625rem] pr-12"
					/>
					<i
						className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} absolute right-[0.875rem] top-[3.4rem] sm:top-[3.4rem] md:top-[3.6rem] -translate-y-1/2 cursor-pointer text-[#ffaa33] text-[1.75rem] select-none leading-none`}
						onClick={() => setShowPassword((s) => !s)}
						aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword((s) => !s) }}
					/>
				</div>

				<Button type="submit" loading={loading} block size="lg" className="mt-[2.1875rem]">
					Bejelentkezés
				</Button>

				{msg ? (
					<p className={`text-center text-[2.1875rem] mt-[1.5625rem] font-semibold ${isSuccess ? 'text-green-500' : 'text-[#ff6600]'}`} aria-live="polite">
						{msg}
					</p>
				) : null}
			</form>
		</div>
	)
}

