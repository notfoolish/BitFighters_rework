import AppRoutes from './routes/AppRoutes.jsx'
import AnimatedCursor from './components/ui/AnimatedCursor.jsx'
import ThreeBackground from './components/background/ThreeBackground.jsx'
export default function App() {
	return (
		<div className="min-h-screen text-white">
			<ThreeBackground />
			<AnimatedCursor respectReducedMotion={false} />
			<main className="relative z-10 px-4 sm:px-6 lg:px-8 pt-24 pb-10">
				<AppRoutes />
			</main>
		</div>
	)
}
