import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeBackground({ enabled = true }) {
	const containerRef = useRef(null)
	const frameRef = useRef(null)
	const rendererRef = useRef(null)
	const sceneRef = useRef(null)
	const cameraRef = useRef(null)
	const gridRef = useRef(null)
	const geometryRef = useRef(null)
	const basePositionsRef = useRef(null)
	const mouseRef = useRef(new THREE.Vector2(9999, 9999))
	const targetRef = useRef(new THREE.Vector2(9999, 9999))

	useEffect(() => {
		if (!enabled || !containerRef.current) {
			return
		}

		const container = containerRef.current
		const width = container.clientWidth || window.innerWidth
		const height = container.clientHeight || window.innerHeight

		const scene = new THREE.Scene()
		sceneRef.current = scene

		const camera = new THREE.PerspectiveCamera(60, width / height, 1, 1000)
		camera.position.z = 200
		cameraRef.current = camera

		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
		renderer.setSize(width, height)
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		rendererRef.current = renderer
		container.appendChild(renderer.domElement)

		const isMobileRef = { current: false }

		const material = new THREE.LineBasicMaterial({
			color: new THREE.Color('#ffae42'),
			transparent: true,
			opacity: 0.45,
		})

		const isMobileDevice = () =>
			window.matchMedia?.('(pointer: coarse)')?.matches ||
			window.innerWidth < 768

		const updateQuality = () => {
			isMobileRef.current = isMobileDevice()
			material.opacity = isMobileRef.current ? 0.28 : 0.45
		}

		const buildGrid = () => {
			if (gridRef.current) {
				scene.remove(gridRef.current)
				gridRef.current.geometry.dispose()
			}

			const viewHeight =
				2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
			const viewWidth = viewHeight * camera.aspect
			const gridWidth = viewWidth * 0.95
			const gridHeight = viewHeight * 0.95
			const segmentsX = isMobileRef.current ? 28 : 56
			const segmentsY = isMobileRef.current ? 18 : 32

			const plane = new THREE.PlaneGeometry(gridWidth, gridHeight, segmentsX, segmentsY)
			const wireframe = new THREE.WireframeGeometry(plane)
			geometryRef.current = wireframe
			basePositionsRef.current = new Float32Array(
				wireframe.attributes.position.array,
			)

			const line = new THREE.LineSegments(wireframe, material)
			gridRef.current = line
			scene.add(line)
		}

		updateQuality()
		buildGrid()

		const inputState = {
			lastInputTime: performance.now(),
			idleDelay: 1200,
			orientationActive: false,
		}

		const setInput = (clientX, clientY) => {
			const bounds = container.getBoundingClientRect()
			const x = ((clientX - bounds.left) / bounds.width) * 2 - 1
			const y = -((clientY - bounds.top) / bounds.height) * 2 + 1
			targetRef.current.set(x, y)
			inputState.lastInputTime = performance.now()
		}

		const handlePointerMove = (event) => {
			setInput(event.clientX, event.clientY)
		}

		const handleTouchMove = (event) => {
			if (event.touches?.length) {
				const touch = event.touches[0]
				setInput(touch.clientX, touch.clientY)
			}
		}

		const handleLeave = () => {
			targetRef.current.set(9999, 9999)
		}

		const handleOrientation = (event) => {
			if (!inputState.orientationActive) {
				return
			}
			const gamma = Math.max(-45, Math.min(45, event.gamma ?? 0))
			const beta = Math.max(-45, Math.min(45, event.beta ?? 0))
			const x = (gamma / 45) * 1.45
			const y = (-beta / 45) * 1.45
			targetRef.current.set(x, y)
			inputState.lastInputTime = performance.now()
		}

		const maybeEnableOrientation = async () => {
			if (inputState.orientationActive) {
				return
			}
			if (typeof DeviceOrientationEvent === 'undefined') {
				return
			}
			if (typeof DeviceOrientationEvent.requestPermission === 'function') {
				try {
					const permission = await DeviceOrientationEvent.requestPermission()
					if (permission !== 'granted') {
						return
					}
				} catch (error) {
					return
				}
			}
			inputState.orientationActive = true
			window.addEventListener('deviceorientation', handleOrientation)
		}

		const shouldAutoEnableOrientation =
			window.matchMedia?.('(pointer: coarse)')?.matches &&
			typeof DeviceOrientationEvent !== 'undefined' &&
			typeof DeviceOrientationEvent.requestPermission !== 'function'

		const handleResize = () => {
			const nextWidth = container.clientWidth || window.innerWidth
			const nextHeight = container.clientHeight || window.innerHeight
			camera.aspect = nextWidth / nextHeight
			camera.updateProjectionMatrix()
			renderer.setSize(nextWidth, nextHeight)
			updateQuality()
			buildGrid()
		}

		container.addEventListener('pointermove', handlePointerMove)
		container.addEventListener('pointerleave', handleLeave)
		container.addEventListener('touchmove', handleTouchMove, { passive: true })
		container.addEventListener('touchend', handleLeave)
		container.addEventListener('pointerdown', maybeEnableOrientation)
		container.addEventListener('touchstart', maybeEnableOrientation, { passive: true })
		window.addEventListener('deviceorientation', handleOrientation)
		window.addEventListener('pointermove', handlePointerMove)
		window.addEventListener('pointerleave', handleLeave)
		window.addEventListener('resize', handleResize)

		if (shouldAutoEnableOrientation) {
			inputState.orientationActive = true
			window.addEventListener('deviceorientation', handleOrientation)
		}

		const raycaster = new THREE.Raycaster()
		const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
		const intersection = new THREE.Vector3()

		const animate = () => {
			const geometry = geometryRef.current
			const basePositions = basePositionsRef.current
			if (!geometry || !basePositions) {
				frameRef.current = window.requestAnimationFrame(animate)
				return
			}

			const pos = geometry.getAttribute('position')
			const now = performance.now()
			const time = now * 0.001
			if (
				now - inputState.lastInputTime > inputState.idleDelay &&
				!inputState.orientationActive
			) {
				const wanderX = Math.sin(time * 0.6) * 0.4
				const wanderY = Math.cos(time * 0.45) * 0.35
				targetRef.current.set(wanderX, wanderY)
			}

			if (targetRef.current.x > 9000) {
				mouseRef.current.set(9999, 9999)
			} else {
				mouseRef.current.lerp(targetRef.current, 0.08)
			}

			raycaster.setFromCamera(mouseRef.current, camera)
			raycaster.ray.intersectPlane(plane, intersection)

			const mobileMode = isMobileRef.current
			const influenceRadius = mobileMode ? 46 : 60
			const influenceRadiusSq = influenceRadius * influenceRadius
			const pushStrength = mobileMode ? 6 : 10
			const waveStrength = mobileMode ? 1.2 : 2

			for (let i = 0; i < pos.count; i += 1) {
				const i3 = i * 3
				const baseX = basePositions[i3]
				const baseY = basePositions[i3 + 1]
				const baseZ = basePositions[i3 + 2]

				const dx = baseX - intersection.x
				const dy = baseY - intersection.y
				const distSq = dx * dx + dy * dy
				const influence = distSq < influenceRadiusSq
					? Math.exp(-distSq / (influenceRadiusSq * 0.6))
					: 0

				const dist = Math.sqrt(distSq) || 1
				const push = influence * pushStrength
				const wave =
					Math.sin((baseX + time * 12) * 0.06) +
					Math.cos((baseY + time * 10) * 0.05)

				const x = baseX + (dx / dist) * push * 0.35
				const y = baseY + (dy / dist) * push * 0.35
				const z = baseZ + influence * pushStrength * 0.35 + wave * waveStrength

				pos.array[i3] = x
				pos.array[i3 + 1] = y
				pos.array[i3 + 2] = z
			}

			pos.needsUpdate = true
			renderer.render(scene, camera)
			frameRef.current = window.requestAnimationFrame(animate)
		}

		frameRef.current = window.requestAnimationFrame(animate)

		return () => {
			container.removeEventListener('pointermove', handlePointerMove)
			container.removeEventListener('pointerleave', handleLeave)
			container.removeEventListener('touchmove', handleTouchMove)
			container.removeEventListener('touchend', handleLeave)
			container.removeEventListener('pointerdown', maybeEnableOrientation)
			container.removeEventListener('touchstart', maybeEnableOrientation)
			window.removeEventListener('deviceorientation', handleOrientation)
			window.removeEventListener('pointermove', handlePointerMove)
			window.removeEventListener('pointerleave', handleLeave)
			window.removeEventListener('resize', handleResize)
			if (frameRef.current) {
				window.cancelAnimationFrame(frameRef.current)
			}
			if (gridRef.current) {
				scene.remove(gridRef.current)
				gridRef.current.geometry.dispose()
			}
			if (geometryRef.current) {
				geometryRef.current.dispose()
			}
			material.dispose()
			if (rendererRef.current) {
				rendererRef.current.dispose()
				if (rendererRef.current.domElement?.parentNode) {
					rendererRef.current.domElement.parentNode.removeChild(
						rendererRef.current.domElement,
					)
				}
			}
			scene.clear()
		}
	}, [enabled])

	return <div className="three-background" ref={containerRef} aria-hidden="true" />
}
