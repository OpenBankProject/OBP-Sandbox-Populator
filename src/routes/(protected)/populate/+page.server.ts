import { createLogger } from '$lib/utils/logger';
const logger = createLogger('PopulateServer');
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { OBPClient } from '$lib/obp/client';
import { env } from '$env/dynamic/public';
import { getBusinesses, getBusinessForCounterparty } from '$lib/data/botswana-businesses';

// FX rates for African currencies and others (relative to BWP)
const FX_RATES: Record<string, number> = {
	EUR: 0.068, // 1 BWP = 0.068 EUR
	USD: 0.074, // 1 BWP = 0.074 USD
	GBP: 0.058, // 1 BWP = 0.058 GBP
	ZAR: 1.37, // 1 BWP = 1.37 ZAR
	KES: 11.5, // 1 BWP = 11.5 KES
	NGN: 115, // 1 BWP = 115 NGN
	EGP: 2.28, // 1 BWP = 2.28 EGP
	GHS: 0.92, // 1 BWP = 0.92 GHS
	TZS: 186, // 1 BWP = 186 TZS
	UGX: 275, // 1 BWP = 275 UGX
	ZMW: 1.88, // 1 BWP = 1.88 ZMW
	NAD: 1.37, // 1 BWP = 1.37 NAD
	CNY: 0.53 // 1 BWP = 0.53 CNY
};

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.session?.data?.user;
	return {
		username: user?.username || 'unknown',
		defaults: {
			numBanks: 2,
			numAccountsPerBank: 5,
			country: 'Botswana',
			currency: 'BWP'
		}
	};
};

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getUsernamePrefix(username: string): string {
	// Truncate to 8 characters and lowercase
	return username.slice(0, 8).toLowerCase();
}

export const actions: Actions = {
	populate: async ({ request, locals }) => {
		const session = locals.session;
		const accessToken = session?.data?.oauth?.access_token;
		const user = session?.data?.user;

		if (!accessToken || !user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const numBanks = parseInt(formData.get('numBanks') as string) || 2;
		const numAccountsPerBank = parseInt(formData.get('numAccountsPerBank') as string) || 5;
		const currency = (formData.get('currency') as string) || 'BWP';
		const createCounterparties = formData.get('createCounterparties') === 'on';
		const createFxRates = formData.get('createFxRates') === 'on';
		const createTransactions = formData.get('createTransactions') === 'on';

		const client = new OBPClient(
			env.PUBLIC_OBP_BASE_URL,
			'v5.1.0',
			accessToken
		);

		const results: {
			banks: Array<{ id: string; name: string }>;
			accounts: Array<{ id: string; bankId: string; label: string }>;
			counterparties: number;
			fxRates: number;
			transactions: number;
			errors: string[];
		} = {
			banks: [],
			accounts: [],
			counterparties: 0,
			fxRates: 0,
			transactions: 0,
			errors: []
		};

		const usernamePrefix = getUsernamePrefix(user.username);

		try {
			// Create Banks
			logger.info(`Creating ${numBanks} banks...`);
			for (let i = 1; i <= numBanks; i++) {
				const bankId = `${usernamePrefix}.bank${i}.bw`;
				const bankName = `${user.username} Test Bank ${i}`;

				try {
					// Check if bank exists
					const exists = await client.bankExists(bankId);
					if (exists) {
						logger.info(`Bank ${bankId} already exists, skipping`);
						results.banks.push({ id: bankId, name: bankName });
					} else {
						const bank = await client.createBank({
							bank_id: bankId,
							full_name: bankName,
							short_name: `TB${i}`,
							bank_code: `TB${i}BW`
						});
						results.banks.push({ id: bank.bank_id, name: bank.full_name });
						logger.info(`Created bank: ${bank.bank_id}`);
					}
				} catch (e: any) {
					const errorMsg = `Failed to create bank ${bankId}: ${e.message}`;
					logger.error(errorMsg);
					results.errors.push(errorMsg);
				}

				await delay(100); // Rate limiting delay
			}

			// Create Accounts for each bank
			logger.info(`Creating ${numAccountsPerBank} accounts per bank...`);
			for (const bank of results.banks) {
				for (let j = 1; j <= numAccountsPerBank; j++) {
					try {
						const account = await client.createAccount(bank.id, {
							label: `Account ${j}`,
							currency: currency,
							balance: { amount: '0', currency: currency },
							user_id: user.user_id
						});
						results.accounts.push({
							id: account.account_id,
							bankId: bank.id,
							label: account.label
						});
						logger.info(`Created account: ${account.account_id} at ${bank.id}`);
					} catch (e: any) {
						const errorMsg = `Failed to create account at ${bank.id}: ${e.message}`;
						logger.error(errorMsg);
						results.errors.push(errorMsg);
					}
					await delay(100);
				}
			}

			// Create Counterparties
			if (createCounterparties && results.accounts.length > 0) {
				logger.info('Creating counterparties...');
				const businesses = getBusinesses(10); // Get first 10 businesses
				const firstAccount = results.accounts[0];

				for (const business of businesses) {
					try {
						const payload = getBusinessForCounterparty(business, currency);
						await client.createCounterparty(firstAccount.bankId, firstAccount.id, payload);
						results.counterparties++;
						logger.info(`Created counterparty: ${business.name}`);
					} catch (e: any) {
						const errorMsg = `Failed to create counterparty ${business.name}: ${e.message}`;
						logger.error(errorMsg);
						results.errors.push(errorMsg);
					}
					await delay(100);
				}
			}

			// Create FX Rates
			if (createFxRates && results.banks.length > 0) {
				logger.info('Creating FX rates...');
				for (const bank of results.banks) {
					for (const [targetCurrency, rate] of Object.entries(FX_RATES)) {
						try {
							await client.createFxRate(bank.id, {
								from_currency_code: currency,
								to_currency_code: targetCurrency,
								conversion_value: rate,
								effective_date: new Date().toISOString()
							});
							// Also create reverse rate
							await client.createFxRate(bank.id, {
								from_currency_code: targetCurrency,
								to_currency_code: currency,
								conversion_value: 1 / rate,
								effective_date: new Date().toISOString()
							});
							results.fxRates += 2;
						} catch (e: any) {
							// FX rate errors are common (duplicates), just log debug
							logger.debug(`FX rate error for ${bank.id}: ${e.message}`);
						}
						await delay(50);
					}
				}
				logger.info(`Created ${results.fxRates} FX rates`);
			}

			// Create Historical Transactions
			if (createTransactions && results.accounts.length >= 2) {
				logger.info('Creating historical transactions...');
				const bankAccounts: Record<string, string[]> = {};

				// Group accounts by bank
				for (const account of results.accounts) {
					if (!bankAccounts[account.bankId]) {
						bankAccounts[account.bankId] = [];
					}
					bankAccounts[account.bankId].push(account.id);
				}

				// Create transactions within each bank
				const now = new Date();
				for (const [bankId, accountIds] of Object.entries(bankAccounts)) {
					if (accountIds.length < 2) continue;

					// Create some transactions over the last 12 months
					for (let month = 0; month < 12; month++) {
						const date = new Date(now);
						date.setMonth(date.getMonth() - month);
						const dateStr = date.toISOString();

						// Random transaction between accounts
						const fromIdx = Math.floor(Math.random() * accountIds.length);
						let toIdx = Math.floor(Math.random() * accountIds.length);
						while (toIdx === fromIdx) {
							toIdx = Math.floor(Math.random() * accountIds.length);
						}

						try {
							await client.createHistoricalTransaction(bankId, {
								from_account_id: accountIds[fromIdx],
								to_account_id: accountIds[toIdx],
								value: {
									currency: currency,
									amount: (Math.random() * 1000 + 100).toFixed(2)
								},
								description: `Monthly transfer ${month + 1}`,
								posted: dateStr,
								completed: dateStr
							});
							results.transactions++;
						} catch (e: any) {
							logger.debug(`Transaction error: ${e.message}`);
						}
						await delay(100);
					}
				}
				logger.info(`Created ${results.transactions} historical transactions`);
			}

			return {
				success: true,
				results
			};
		} catch (e: any) {
			logger.error('Population failed:', e);
			return fail(500, {
				error: e.message || 'Population failed',
				results
			});
		}
	}
};
