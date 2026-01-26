import React from 'react'

const sizes = {
	sm: 'h-4 w-4 border-2',
	md: 'h-6 w-6 border-2',
	lg: 'h-8 w-8 border-4'
}

export default function Spinner({ size = 'md', className = '' }) {
	const cls = [
		'inline-block animate-spin rounded-full border-white/70 border-t-transparent',
		sizes[size] || sizes.md,
		className
	].join(' ').trim()
	return <span className={cls} />
}

