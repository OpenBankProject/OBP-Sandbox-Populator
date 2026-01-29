import type { PageServerLoad } from './$types';
import { OBPClient } from '$lib/obp/client';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	const accessToken = session?.data?.oauth?.access_token;

	if (!accessToken) {
		return { accounts: [], selectedAccount: null, transactions: [] };
	}

	const client = new OBPClient(env.PUBLIC_OBP_BASE_URL, 'v6.0.0', accessToken);

	try {
		const accounts = await client.getMyAccounts();

		// Check if an account is selected via query param
		const selectedAccountId = url.searchParams.get('account');
		const selectedBankId = url.searchParams.get('bank');

		let selectedAccount = null;
		let transactions: any[] = [];

		if (selectedAccountId && selectedBankId) {
			selectedAccount = accounts.find(
				(a) => a.id === selectedAccountId && a.bank_id === selectedBankId
			);

			if (selectedAccount) {
				try {
					transactions = await client.getTransactionsForAccount(
						selectedBankId,
						selectedAccountId
					);
				} catch (e) {
					console.error('Failed to fetch transactions:', e);
				}
			}
		}

		return { accounts, selectedAccount, transactions };
	} catch (e) {
		console.error('Failed to fetch accounts:', e);
		return { accounts: [], selectedAccount: null, transactions: [] };
	}
};
