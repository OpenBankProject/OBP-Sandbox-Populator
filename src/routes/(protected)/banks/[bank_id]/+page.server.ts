import type { PageServerLoad } from './$types';
import { OBPClient } from '$lib/obp/client';
import { env } from '$env/dynamic/public';
import type { FxRate } from '$lib/obp/types';

// Target currencies used in sandbox population (rates from/to BWP)
const TARGET_CURRENCIES = ['EUR', 'USD', 'GBP', 'ZAR', 'KES', 'NGN', 'EGP', 'GHS', 'TZS', 'UGX', 'ZMW', 'NAD', 'CNY'];
const BASE_CURRENCY = 'BWP';

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
			// Try to get registered currencies first
			currencies = await client.getCurrenciesAtBank(bank_id);
		} catch (e) {
			console.error('Failed to fetch currencies:', e);
		}

		// Fetch FX rates for known currency pairs (BWP to/from target currencies)
		const foundCurrencies = new Set<string>();
		for (const targetCurrency of TARGET_CURRENCIES) {
			// Forward rate: BWP -> target
			const forwardRate = await client.getFxRate(bank_id, BASE_CURRENCY, targetCurrency);
			if (forwardRate) {
				fxRates.push(forwardRate);
				foundCurrencies.add(BASE_CURRENCY);
				foundCurrencies.add(targetCurrency);
			}

			// Reverse rate: target -> BWP
			const reverseRate = await client.getFxRate(bank_id, targetCurrency, BASE_CURRENCY);
			if (reverseRate) {
				fxRates.push(reverseRate);
				foundCurrencies.add(BASE_CURRENCY);
				foundCurrencies.add(targetCurrency);
			}
		}

		// Merge found currencies with registered currencies
		if (foundCurrencies.size > 0) {
			currencies = [...new Set([...currencies, ...foundCurrencies])].sort();
		}

		return { bank_id, bank, currencies, fxRates };
	} catch (e) {
		console.error('Failed to fetch bank:', e);
		return { bank_id, bank: null, currencies: [], fxRates: [] };
	}
};
