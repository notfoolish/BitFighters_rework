import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

const DEFAULT_COUNT = 24

const createFloaters = (count, width, height) =>
	Array.from({ length: count }, () => {
		const size = 10 + Math.random() * 18
		return {
			x: Math.random() * width,
			y: Math.random() * height,
			vx: (Math.random() - 0.5) * 0.4,
			vy: (Math.random() - 0.5) * 0.4,
			size,
			opacity: 0.35 + Math.random() * 0.35,
		}
	})

export default function InteractiveFloaters({
	enabled = true,
	count = DEFAULT_COUNT,
	respectReducedMotion = true,
}) {
	const reduceMotion = useReducedMotion()
	const wrapperRef = useRef(null)
	const mouseRef = useRef({ x: -1000, y: -1000 })
	const rafRef = useRef(null)
	const floatersRef = useRef([])
	const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight })

	const [floaters, setFloaters] = useState(() =>
		createFloaters(count, sizeRef.current.width, sizeRef.current.height),
	)

	useEffect(() => {
		floatersRef.current = floaters
	}, [floaters])

	const canRun = enabled && (!reduceMotion || !respectReducedMotion)

	useEffect(() => {
		if (!canRun) {
			return
		}

		const handleResize = () => {
			sizeRef.current = {
				width: window.innerWidth,
				height: window.innerHeight,
			}
		}

		const handleMove = (event) => {
			mouseRef.current = { x: event.clientX, y: event.clientY }
		}

		window.addEventListener('resize', handleResize)
		window.addEventListener('mousemove', handleMove)

		return () => {
			window.removeEventListener('resize', handleResize)
			window.removeEventListener('mousemove', handleMove)
		}
	}, [canRun])

	useEffect(() => {
		if (!canRun) {
			return
		}

		floatersRef.current = createFloaters(
			count,
			sizeRef.current.width,
			sizeRef.current.height,
		)
		setFloaters(floatersRef.current.map((floater) => ({ ...floater })))

		const tick = () => {
			const { width, height } = sizeRef.current
			const { x: mouseX, y: mouseY } = mouseRef.current
			const pushRadius = 140
			const pushStrength = 0.8
			const drift = 0.015

			const next = floatersRef.current.map((floater) => {
				let { x, y, vx, vy, size, opacity } = floater

				const dx = x - mouseX
				const dy = y - mouseY
				const dist = Math.hypot(dx, dy)
				if (dist < pushRadius) {
					const force = ((pushRadius - dist) / pushRadius) * pushStrength
					vx += (dx / (dist || 1)) * force
					vy += (dy / (dist || 1)) * force
				}

				vx += (Math.random() - 0.5) * drift
				vy += (Math.random() - 0.5) * drift
				vx *= 0.98
				vy *= 0.98

				x += vx
				y += vy

				if (x < -size) x = width + size
				if (x > width + size) x = -size
				if (y < -size) y = height + size
				if (y > height + size) y = -size

				return { x, y, vx, vy, size, opacity }
			})

			floatersRef.current = next
			setFloaters(next.map((floater) => ({ ...floater })))
			rafRef.current = window.requestAnimationFrame(tick)
		}

		rafRef.current = window.requestAnimationFrame(tick)

		return () => {
			if (rafRef.current) {
				window.cancelAnimationFrame(rafRef.current)
			}
		}
	}, [canRun, count])

	const renderedFloaters = useMemo(
		() =>
			floaters.map((floater, index) => (
				<span
					key={index}
					className="background-floater"
					style={{
						width: floater.size,
						height: floater.size,
						opacity: floater.opacity,
						transform: `translate3d(${floater.x}px, ${floater.y}px, 0)`,
					}}
				/>
			)),
		[floaters],
	)

	if (!canRun) {
		return null
	}

	return (
		<div className="background-floaters" ref={wrapperRef} aria-hidden="true">
			{renderedFloaters}
		</div>
	)
}
