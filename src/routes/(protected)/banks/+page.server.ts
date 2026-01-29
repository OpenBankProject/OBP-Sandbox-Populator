import type { PageServerLoad } from './$types';
import { OBPClient } from '$lib/obp/client';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	const accessToken = session?.data?.oauth?.access_token;

	if (!accessToken) {
		return { banks: [] };
	}

	const client = new OBPClient(env.PUBLIC_OBP_BASE_URL, 'v6.0.0', accessToken);

	try {
		const { banks } = await client.getBanks();
		return { banks };
	} catch (e) {
		console.error('Failed to fetch banks:', e);
		return { banks: [] };
	}
};
