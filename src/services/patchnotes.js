import { jsonFetch } from './apiClient'

export async function fetchPatchnotes() {
	return jsonFetch('/backend/patchnotes.php', {
		method: 'GET'
	})
}
