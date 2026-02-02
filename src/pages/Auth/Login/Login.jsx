import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../../components/ui/Input'
import Button from '../../../components/ui/Button'
import useAuth from '../../../hooks/useAuth'
import { login as apiLogin } from '../../../services/auth'
import { ROUTES } from '../../../routes/paths'

export default function Login() {
	const navigate = useNavigate()
	const { login } = useAuth()
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
			const data = await apiLogin(username, password)
			setMsg('Sikeres bejelentkezés!')
			setIsSuccess(true)

			if (data?.token) {
				login({ username, token: data.token, profile: { username } })
				navigate(ROUTES.HOME)
			}
		} catch (err) {
			if (err?.status === 403) {
				setMsg('Az email címed nincs megerősítve. Kérjük, add meg a megerősítő kódot a regisztráció után.')
			} else {
				setMsg(err?.message || 'Hiba történt a kapcsolat során.')
			}
			setIsSuccess(false)
		} finally {
			setLoading(false)
		}
	}


	const formClass =
		'backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] w-full max-w-[31.25rem] mb-[3.75rem] px-6 sm:px-[3.125rem] py-8 sm:py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90 transition-opacity hover:opacity-100'

	return (
		<div className="w-full min-h-[calc(100vh-5rem)] flex flex-col items-center justify-start pt-10">
			<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">Bejelentkezés</h1>

			<form onSubmit={handleSubmit} className={formClass}>
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
					autoComplete="current-password"
					size="lg"
					className="mt-[0.625rem] pr-12"
					rightAdornment={
						<i
							className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} absolute right-[0.875rem] top-1/2 -translate-y-1/2 cursor-pointer text-[#ffaa33] text-[1.75rem] select-none leading-none`}
							onClick={() => setShowPassword((s) => !s)}
							aria-label={showPassword ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowPassword((s) => !s) }}
						/>
					}
				/>

				<Button type="submit" loading={loading} block size="lg" className="mt-[2.1875rem]">
					Bejelentkezés
				</Button>


				{msg ? (
					<p className={`text-center text-[2.1875rem] mt-[1.5625rem] font-semibold ${isSuccess ? 'text-green-500' : 'text-[#ff6600]'}`} aria-live="polite">
						{msg}
					</p>
				) : null}

				<p className="mt-6 text-center text-[1.75rem] text-[#ffaa33]">
					Nincs még fiókod?{' '}
					<Link to={ROUTES.REGISTER} className="font-semibold text-[#ffae42] hover:underline">
						Regisztrálj itt
					</Link>
				</p>
			</form>
		</div>
	)
}

