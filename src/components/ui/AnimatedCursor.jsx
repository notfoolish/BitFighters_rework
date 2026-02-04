import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const TRAIL_POINTS = 8

const buildTrail = (count) =>
	Array.from({ length: count }, (_, index) => ({
		x: -1000,
		y: -1000,
		opacity: 1 - index / count,
		scale: 1 - index / (count * 1.4),
	}))

export default function AnimatedCursor({ enabled = true, respectReducedMotion = true }) {
	const reduceMotion = useReducedMotion()
	const [trail, setTrail] = useState(() => buildTrail(TRAIL_POINTS))
	const targetRef = useRef({ x: -1000, y: -1000 })
	const rafRef = useRef(null)
	const trailRef = useRef(trail)

	useEffect(() => {
		trailRef.current = trail
	}, [trail])

	useEffect(() => {
		if (!enabled || (reduceMotion && respectReducedMotion)) {
			return
		}

		const handleMove = (event) => {
			targetRef.current = { x: event.clientX, y: event.clientY }
		}

		const handleLeave = () => {
			targetRef.current = { x: -1000, y: -1000 }
		}

		window.addEventListener('mousemove', handleMove)
		window.addEventListener('mouseleave', handleLeave)
		window.addEventListener('blur', handleLeave)

		const tick = () => {
			const next = trailRef.current.map((point, index) => {
				const prev = index === 0 ? targetRef.current : trailRef.current[index - 1]
				const ease = 0.18
				return {
					...point,
					x: point.x + (prev.x - point.x) * ease,
					y: point.y + (prev.y - point.y) * ease,
				}
			})

			trailRef.current = next
			setTrail(next)
			rafRef.current = window.requestAnimationFrame(tick)
		}

		rafRef.current = window.requestAnimationFrame(tick)

		return () => {
			window.removeEventListener('mousemove', handleMove)
			window.removeEventListener('mouseleave', handleLeave)
			window.removeEventListener('blur', handleLeave)
			if (rafRef.current) {
				window.cancelAnimationFrame(rafRef.current)
			}
		}
	}, [enabled, reduceMotion, respectReducedMotion])

	if (!enabled || (reduceMotion && respectReducedMotion)) {
		return null
	}

	const renderedTrail = useMemo(
		() =>
			trail.map((point, index) => (
				<span
					key={index}
					className="cursor-trail__dot"
					style={{
						opacity: point.opacity,
						transform: `translate3d(${point.x}px, ${point.y}px, 0) scale(${point.scale})`,
					}}
				/>
			)),
		[trail],
	)

	return (
		<div className="cursor-trail" aria-hidden="true">
			{renderedTrail}
		</div>
	)
}
