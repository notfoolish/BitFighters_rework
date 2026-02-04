import { jsonFetch } from './apiClient'

export function fetchThread(username, sinceId = 0) {
	const q = encodeURIComponent(username)
	const suffix = sinceId > 0 ? `&since_id=${sinceId}` : ''
	return jsonFetch(`/backend/messages.php?action=thread&user=${q}${suffix}`, { auth: true })
}

export function fetchUnread(fromUser) {
	if (fromUser) {
		const q = encodeURIComponent(fromUser)
		return jsonFetch(`/backend/messages.php?action=unread&from=${q}`, { auth: true })
	}
	return jsonFetch('/backend/messages.php?action=unread', { auth: true })
}

export function sendMessage(to, content) {
	return jsonFetch('/backend/messages.php', {
		method: 'POST',
		body: { action: 'send', to, content },
		auth: true,
	})
}

export function markRead(from) {
	return jsonFetch('/backend/messages.php', {
		method: 'POST',
		body: { action: 'mark_read', from },
		auth: true,
	})
}
