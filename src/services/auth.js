import { jsonFetch } from './apiClient'

export async function login(username, password) {
	return jsonFetch('/backend/login.php', {
		method: 'POST',
		body: { username, password }
	})
}

export async function register(username, email, password) {
	return jsonFetch('/backend/register.php', {
		method: 'POST',
		body: { username, email, password }
	})
}

export async function verifyOtp(email, code) {
	return jsonFetch('/backend/verify-otp.php', {
		method: 'POST',
		body: { email, code }
	})
}

export async function resendOtp(email) {
	return jsonFetch('/backend/resend-otp.php', {
		method: 'POST',
		body: { email }
	})
}

export async function changePassword(newPassword) {
	return jsonFetch('/backend/change-password.php', {
		method: 'POST',
		body: { newPassword },
		auth: true
	})
}

export async function changeUsername(newUsername) {
	return jsonFetch('/backend/change-username.php', {
		method: 'POST',
		body: { newUsername },
		auth: true
	})
}

export async function deleteAccount() {
	return jsonFetch('/backend/delete_account.php', {
		method: 'DELETE',
		auth: true
	})
}
