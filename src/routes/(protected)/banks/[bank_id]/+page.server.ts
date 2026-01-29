import type { PageServerLoad } from './$types';
import { OBPClient } from '$lib/obp/client';
import { env } from '$env/dynamic/public';
import type { FxRate } from '$lib/obp/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	const accessToken = session?.data?.oauth?.access_token;
	const { bank_id } = params;

	if (!accessToken) {
		return { bank_id, bank: null, currencies: [], fxRates: [] };
	}

	const client = new OBPClient(env.PUBLIC_OBP_BASE_URL, 'v6.0.0', accessToken);

	try {
		const bank = await client.getBank(bank_id);
		let currencies: string[] = [];
		let fxRates: FxRate[] = [];

		try {
			currencies = await client.getCurrenciesAtBank(bank_id);

			// Get FX rates for all currency pairs
			for (const fromCurrency of currencies) {
				for (const toCurrency of currencies) {
					if (fromCurrency !== toCurrency) {
						const rate = await client.getFxRate(bank_id, fromCurrency, toCurrency);
						if (rate) {
							fxRates.push(rate);
						}
					}
				}
			}
		} catch (e) {
			console.error('Failed to fetch currencies/rates:', e);
		}

		return { bank_id, bank, currencies, fxRates };
	} catch (e) {
		console.error('Failed to fetch bank:', e);
		return { bank_id, bank: null, currencies: [], fxRates: [] };
	}
};
