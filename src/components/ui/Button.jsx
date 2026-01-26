import React from 'react'

const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition focus:outline-none focus:ring-2 focus:ring-[#ffae42]/50 disabled:opacity-70 disabled:cursor-not-allowed'

const variants = {
	primary: 'text-white border-0 bg-[linear-gradient(to_right,#ffaa33,#ff7b00)] shadow-[0_0_12px_#ff7b00] hover:bg-[linear-gradient(to_right,#ff9900,#ff6600)] hover:shadow-[0_0_18px_#ffae42]',
	secondary: 'text-[#ffaa33] border border-[#ffaa33] bg-transparent hover:bg-[#ffaa33]/15 hover:text-[#ffae42] shadow-[0_0_8px_rgba(255,170,51,0.4)] hover:shadow-[0_0_12px_#ffaa33]',
	outline: 'bg-transparent text-white border-2 border-[#ffaa33]/70 hover:border-[#ff7b00] hover:text-[#ffae42]',
	ghost: 'bg-transparent text-white hover:text-[#ffae42] hover:bg-white/5'
}

const sizes = {
	sm: 'text-sm px-3 py-1.5',
	md: 'text-base px-4 py-2',
	lg: 'text-xl px-5 py-3'
}

export default function Button({
	children,
	variant = 'primary',
	size = 'md',
	loading = false,
	block = false,
	className = '',
	type = 'button',
	...props
}) {
	const cls = [
		base,
		variants[variant] || variants.primary,
		sizes[size] || sizes.md,
		block ? 'w-full' : '',
		className
	].join(' ').trim()

	return (
		<button type={type} className={cls} disabled={loading || props.disabled} {...props}>
			{loading && (
				<span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
			)}
			{children}
		</button>
	)
}

