import { jsonFetch } from './apiClient'

export async function fetchLeaderboard() {
	return jsonFetch('/backend/leaderboard.php', {
		method: 'GET'
	})
}
