import AppRoutes from './routes/AppRoutes.jsx'

export default function App() {
	return (
		<div className="min-h-screen text-white">
			<div className="app-bg" aria-hidden="true" />
			<main className="px-4 sm:px-6 lg:px-8 pt-24 pb-10">
				<AppRoutes />
			</main>
		</div>
	)
}
