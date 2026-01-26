import AppRoutes from './routes/AppRoutes.jsx'

export default function App() {
	return (
		<div
			className="min-h-screen text-white"
			style={{
				backgroundImage: "url(/img/Background.png)",
				backgroundAttachment: 'fixed',
				backgroundRepeat: 'no-repeat',
				backgroundSize: '100% 100%',
				backgroundColor: '#000',
			}}
		>
			<main className="px-4 sm:px-6 lg:px-8 pt-24 pb-10">
				<AppRoutes />
			</main>
		</div>
	)
}
