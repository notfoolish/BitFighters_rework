import { useState } from 'react'
import Input from '../../../../src/components/ui/Input'
import Button from '../../../../src/components/ui/Button'

export default function ChangePassword() {
	const [current, setCurrent] = useState('')
	const [next, setNext] = useState('')
	const [confirm, setConfirm] = useState('')
	const [msg, setMsg] = useState('')
	const [ok, setOk] = useState(false)
	const [loading, setLoading] = useState(false)

	const onSubmit = async (e) => {
		e.preventDefault()
		setMsg('')
		setOk(false)
		if (next.length < 6) {
			setMsg('Az új jelszó legalább 6 karakter legyen.')
			return
		}
		if (next !== confirm) {
			setMsg('A jelszavak nem egyeznek.')
			return
		}
		setLoading(true)
		try {
			// TODO: Replace with real API call
			await new Promise((r) => setTimeout(r, 600))
			setOk(true)
			setMsg('Jelszócsere elküldve (demó).')
			setCurrent(''); setNext(''); setConfirm('')
		} catch (e1) {
			setOk(false)
			setMsg('Hiba történt.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="w-full flex flex-col items-center">
			<h1 className="text-center text-[#ff7b00] drop-shadow-[0_0_10px_#000000] mt-10 mb-7 font-bold text-[3rem]">Jelszócsere</h1>
			<form onSubmit={onSubmit} className="backdrop-blur-[20px] bg-black/65 border-2 border-[#ffaa33]/70 rounded-[1.25rem] max-w-[36rem] w-full mb-[3.75rem] px-[3.125rem] py-[2.5rem] shadow-[0_0_1.25rem_rgba(255,174,66,0.6)] opacity-90 transition-opacity hover:opacity-100">
				<Input label="Jelenlegi jelszó:" type="password" name="current" value={current} onChange={(e)=>setCurrent(e.target.value)} size="lg" required className="mt-[0.625rem]" />
				<Input label="Új jelszó:" type="password" name="next" value={next} onChange={(e)=>setNext(e.target.value)} size="lg" required className="mt-[0.625rem]" />
				<Input label="Új jelszó megerősítése:" type="password" name="confirm" value={confirm} onChange={(e)=>setConfirm(e.target.value)} size="lg" required className="mt-[0.625rem]" />
				<Button type="submit" loading={loading} block size="lg" className="mt-[2.1875rem]">Jelszó módosítása</Button>
				{msg ? (
					<p className={`text-center text-[1.5rem] mt-[1.5625rem] font-semibold ${ok ? 'text-green-500' : 'text-[#ff6600]'}`} aria-live="polite">{msg}</p>
				) : null}
			</form>
		</div>
	)
}
