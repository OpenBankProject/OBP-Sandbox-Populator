import type { PageServerLoad } from './$types';
import { OBPClient } from '$lib/obp/client';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	const accessToken = session?.data?.oauth?.access_token;

	if (!accessToken) {
		return { accounts: [] };
	}

	const client = new OBPClient(env.PUBLIC_OBP_BASE_URL, 'v6.0.0', accessToken);

	try {
		const accounts = await client.getMyAccounts();
		return { accounts };
	} catch (e) {
		console.error('Failed to fetch accounts:', e);
		return { accounts: [] };
	}
};
