import { useEffect } from 'react'

export default function Modal({
	open,
	onClose,
	title,
	children,
	actions,
	ariaLabel
}) {
	useEffect(() => {
		if (!open) return
		const handleKeyDown = (event) => {
			if (event.key === 'Escape') {
				onClose?.()
			}
		}
		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [open, onClose])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center px-4"
			role="dialog"
			aria-modal="true"
			aria-label={ariaLabel || title}
		>
			<div
				className="absolute inset-0 bg-black/70 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div
				className="relative w-full max-w-md rounded-2xl border-2 border-[#ffaa33]/70 bg-black/85 shadow-[0_0_20px_rgba(255,170,51,0.5)]"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="px-6 py-5">
					{title ? (
						<h3 className="text-[#ffb366] text-2xl font-semibold">
							{title}
						</h3>
					) : null}
					<div className="mt-3 text-white/90 text-base leading-relaxed">
						{children}
					</div>
				</div>
				{actions ? (
					<div className="px-6 pb-6 flex flex-wrap gap-3 justify-end">
						{actions}
					</div>
				) : null}
			</div>
		</div>
	)
}
