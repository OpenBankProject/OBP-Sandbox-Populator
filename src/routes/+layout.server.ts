import { createLogger } from '$lib/utils/logger';
const logger = createLogger('LayoutServer');
import type { RequestEvent } from '@sveltejs/kit';

export interface RootLayoutData {
	userId?: string;
	email?: string;
	username?: string;
}

export async function load(event: RequestEvent) {
	const { session } = event.locals;

	let data: Partial<RootLayoutData> = {};

	// Get information about the user from the session if they are logged in
	if (session?.data?.user) {
		data.userId = session.data.user.user_id;
		data.email = session.data.user.email;
		data.username = session.data.user.username;
	}

	return data as RootLayoutData;
}
