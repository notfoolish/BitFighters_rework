import React, { forwardRef } from 'react'

const base = 'w-full rounded-xl border-2 border-[#ffaa33] bg-white/15 text-white placeholder-white/60 shadow-[0_0_10px_#ffaa33] outline-none transition focus:shadow-[0_0_22px_#ffae42,0_0_28px_#ffaa33] focus:border-[#ffae42] focus:bg-white/25'

const sizes = {
	sm: 'text-sm px-3 py-2',
	md: 'text-lg px-4 py-2.5',
	lg: 'text-[1.25rem] px-5 py-3'
}

const Input = forwardRef(function Input({
	label,
	error,
	size = 'md',
	className = '',
	id,
	rightAdornment,
	...props
}, ref) {
	const inputId = id || props.name
	const cls = [base, sizes[size] || sizes.md, className].join(' ').trim()

	return (
		<div className="w-full">
			{label && (
				<label htmlFor={inputId} className="block mt-4 text-[#ffb366] font-semibold text-xl">
					{label}
				</label>
			)}
			<div className={rightAdornment ? 'relative' : ''}>
				<input id={inputId} ref={ref} className={cls} {...props} />
				{rightAdornment}
			</div>
			{error && (
				<p className="mt-2 text-sm text-red-400">{error}</p>
			)}
		</div>
	)
})

export default Input

