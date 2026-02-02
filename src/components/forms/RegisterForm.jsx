import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as apiLogin, register as apiRegister, resendOtp, verifyOtp } from '../../services/auth'
import useAuth from '../../hooks/useAuth'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function RegisterForm() {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [email, setEmail] = useState('')
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [confirm, setConfirm] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [otp, setOtp] = useState('')
	const [msg, setMsg] = useState('')
	const [isSuccess, setIsSuccess] = useState(false)
	const [loading, setLoading] = useState(false)
	const [verifying, setVerifying] = useState(false)
	const [resending, setResending] = useState(false)
	const [resendCountdown, setResendCountdown] = useState(0)

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
			await apiRegister(username, email, password)
			setMsg('Sikeres regisztráció! A megerősítő kódot elküldtük emailben.')
			setIsSuccess(true)
		} catch (err) {
			setMsg(err?.message || 'Kapcsolati hiba!')
			setIsSuccess(false)
		} finally {
			setLoading(false)
		}
	}

	const onVerify = async () => {
		setMsg('')
		setVerifying(true)
		try {
			await verifyOtp(email, otp)
			const data = await apiLogin(username, password)
			if (data?.token) {
				login({ username, token: data.token, profile: { username } })
				navigate('/')
				return
			}
			setMsg('Email megerősítve! Sikeres bejelentkezés...')
			setOtp('')
			setEmail('')
			setUsername('')
			setPassword('')
			setConfirm('')
		} catch (err) {
			setMsg(err?.message || 'Hibás megerősítő kód.')
		} finally {
			setVerifying(false)
		}
	}

	const onResend = async () => {
		if (resendCountdown > 0) return
		setResending(true)
		setMsg('')
		try {
			await resendOtp(email)
			setMsg('Új megerősítő kód elküldve emailben.')
			setIsSuccess(true)
			setResendCountdown(60)
		} catch (err) {
			setMsg(err?.message || 'Nem sikerült elküldeni a megerősítő kódot.')
			setIsSuccess(false)
		} finally {
			setResending(false)
		}
	}

	useEffect(() => {
		if (resendCountdown <= 0) return
		const timer = setInterval(() => {
			setResendCountdown((s) => (s > 0 ? s - 1 : 0))
		}, 1000)
		return () => clearInterval(timer)
	}, [resendCountdown])

	const formClass =
		'backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] w-full max-w-[31.25rem] mb-[3.75rem] px-6 sm:px-[3.125rem] py-8 sm:py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90 transition-opacity hover:opacity-100'

	return (
		<div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start pt-10">
			<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">
				Regisztráció
			</h1>

			{msg ? (
				<p
					className="text-center text-[2.1875rem] mb-6 font-semibold text-[#ff6600]"
					aria-live="polite"
				>
					{msg}
				</p>
			) : null}

			{!isSuccess ? (
				<form onSubmit={onSubmit} className={formClass}>
					<Input
						label="Email:"
						name="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						autoComplete="email"
						size="lg"
						className="mt-[0.625rem]"
					/>

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

					<Input
						label="Jelszó:"
						name="password"
						type={showPassword ? 'text' : 'password'}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						autoComplete="new-password"
						size="lg"
						className="mt-[0.625rem] pr-12"
						rightAdornment={
							<i
								role="button"
								aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
								className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} absolute right-[0.875rem] top-1/2 -translate-y-1/2 cursor-pointer text-[#ffaa33] text-[1.75rem] select-none leading-none`}
								onClick={() => setShowPassword((v) => !v)}
							/>
						}
					/>

					<Input
						label="Jelszó megerősítése:"
						name="confirm"
						type={showConfirm ? 'text' : 'password'}
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						required
						autoComplete="new-password"
						size="lg"
						className="mt-[0.625rem] pr-12"
						rightAdornment={
							<i
								role="button"
								aria-label={showConfirm ? 'Megerősítő jelszó elrejtése' : 'Megerősítő jelszó megjelenítése'}
								className={`bx ${showConfirm ? 'bx-show' : 'bx-hide'} absolute right-[0.875rem] top-1/2 -translate-y-1/2 cursor-pointer text-[#ffaa33] text-[1.75rem] select-none leading-none`}
								onClick={() => setShowConfirm((v) => !v)}
							/>
						}
					/>

					<Button type="submit" loading={loading} block size="lg" className="mt-[2.1875rem]">
						{loading ? 'Feldolgozás…' : 'Regisztráció'}
					</Button>
				</form>
			) : (
				<div className={formClass}>
					<Input
						label="Megerősítő kód:"
						name="otp"
						value={otp}
						onChange={(e) => setOtp(e.target.value)}
						required
						size="lg"
						className="mt-[0.625rem]"
					/>
					<Button type="button" loading={verifying} block size="lg" className="mt-4" onClick={onVerify}>
						{verifying ? 'Ellenőrzés…' : 'Megerősítés'}
					</Button>
					<button
						type="button"
						onClick={onResend}
						disabled={resending || resendCountdown > 0}
						className="mt-3 w-full text-center text-[1.5rem] text-[#ffaa33] hover:text-[#ffae42]"
					>
						{resending
							? 'Küldés…'
							: resendCountdown > 0
								? `Új megerősítő kód ${resendCountdown} mp`
								: 'Új megerősítő kód kérése'}
					</button>
				</div>
			)}
		</div>
	)
}

