import { jsonFetch } from './apiClient'

export function listFriends() {
	return jsonFetch('/backend/friends.php?action=list', { auth: true })
}

export function listIncomingRequests() {
	return jsonFetch('/backend/friends.php?action=incoming', { auth: true })
}

export function listOutgoingRequests() {
	return jsonFetch('/backend/friends.php?action=outgoing', { auth: true })
}

export function searchUsers(query) {
	const q = encodeURIComponent(query)
	return jsonFetch(`/backend/friends.php?action=search&q=${q}`, { auth: true })
}

export function sendFriendRequest(username) {
	return jsonFetch('/backend/friends.php', {
		method: 'POST',
		body: { action: 'request', username },
		auth: true,
	})
}

export function acceptFriendRequest(username) {
	return jsonFetch('/backend/friends.php', {
		method: 'POST',
		body: { action: 'accept', username },
		auth: true,
	})
}

export function rejectFriendRequest(username) {
	return jsonFetch('/backend/friends.php', {
		method: 'POST',
		body: { action: 'reject', username },
		auth: true,
	})
}

export function cancelFriendRequest(username) {
	return jsonFetch('/backend/friends.php', {
		method: 'POST',
		body: { action: 'cancel', username },
		auth: true,
	})
}

export function removeFriend(username) {
	return jsonFetch('/backend/friends.php', {
		method: 'POST',
		body: { action: 'remove', username },
		auth: true,
	})
}
