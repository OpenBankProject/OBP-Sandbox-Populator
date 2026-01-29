import { createLogger } from '$lib/utils/logger';
const logger = createLogger('AccountDetail');
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	const accessToken = session?.data?.oauth?.access_token;

	if (!accessToken) {
		throw error(401, 'Not authenticated');
	}

	const { bank_id, account_id } = params;

	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${accessToken}`
	};

	// Fetch account details
	const accountUrl = `${env.PUBLIC_OBP_BASE_URL}/obp/v6.0.0/banks/${bank_id}/accounts/${account_id}/owner/account`;
	logger.info(`Fetching account: ${accountUrl}`);

	const accountResponse = await fetch(accountUrl, { headers });

	if (!accountResponse.ok) {
		const errorData = await accountResponse.json().catch(() => ({}));
		logger.error(`Failed to fetch account: ${accountResponse.status}`, errorData);
		throw error(accountResponse.status, errorData.message || 'Failed to fetch account');
	}

	const account = await accountResponse.json();
	logger.debug('Account data:', account);

	// Fetch counterparties for this account
	const counterpartiesUrl = `${env.PUBLIC_OBP_BASE_URL}/obp/v6.0.0/banks/${bank_id}/accounts/${account_id}/owner/counterparties`;
	logger.info(`Fetching counterparties: ${counterpartiesUrl}`);

	let counterparties: any[] = [];
	try {
		const counterpartiesResponse = await fetch(counterpartiesUrl, { headers });
		if (counterpartiesResponse.ok) {
			const data = await counterpartiesResponse.json();
			counterparties = data.counterparties || [];
			logger.debug(`Found ${counterparties.length} counterparties`);
		} else {
			logger.warn(`Failed to fetch counterparties: ${counterpartiesResponse.status}`);
		}
	} catch (e) {
		logger.warn('Error fetching counterparties:', e);
	}

	return {
		account,
		counterparties,
		bank_id,
		account_id
	};
};
