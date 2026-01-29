import { createLogger } from '$lib/utils/logger';
const logger = createLogger('TransactionDetail');
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	const accessToken = session?.data?.oauth?.access_token;

	if (!accessToken) {
		throw error(401, 'Not authenticated');
	}

	const { bank_id, account_id, transaction_id } = params;

	const url = `${env.PUBLIC_OBP_BASE_URL}/obp/v6.0.0/banks/${bank_id}/accounts/${account_id}/owner/transactions/${transaction_id}/transaction`;

	logger.info(`Fetching transaction: ${url}`);

	const response = await fetch(url, {
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		logger.error(`Failed to fetch transaction: ${response.status}`, errorData);
		throw error(response.status, errorData.message || 'Failed to fetch transaction');
	}

	const transaction = await response.json();
	logger.debug('Transaction data:', transaction);

	return {
		transaction,
		bank_id,
		account_id,
		transaction_id
	};
};
