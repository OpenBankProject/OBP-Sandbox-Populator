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
		obpBaseUrl: env.PUBLIC_OBP_BASE_URL,
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

function removeVowels(str: string): string {
	return str.replace(/[aeiou]/gi, '');
}

function getUsernamePrefix(username: string): string {
	// Lowercase, remove special characters, keep only alphanumeric, remove vowels
	const cleaned = username.toLowerCase().replace(/[^a-z0-9]/g, '');
	return removeVowels(cleaned).slice(0, 4);
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
			'v6.0.0',
			accessToken
		);

		const results: {
			banks: Array<{ bank_id: string; bank_code: string; full_name: string }>;
			accounts: Array<{ account_id: string; bank_id: string; label: string; currency: string }>;
			counterparties: Array<{ name: string; bank_id: string; account_id: string }>;
			fxRates: Array<{ bank_id: string; from_currency: string; to_currency: string; rate: number }>;
			transactions: Array<{ transaction_id: string; bank_id: string; from_account_id: string; to_account_id: string; amount: string }>;
			errors: string[];
		} = {
			banks: [],
			accounts: [],
			counterparties: [],
			fxRates: [],
			transactions: [],
			errors: []
		};

		const usernamePrefix = getUsernamePrefix(user.username);

		try {
			// Create Banks
			logger.info(`Creating ${numBanks} banks...`);
			for (let i = 1; i <= numBanks; i++) {
				const bankId = `${usernamePrefix}.bnk.${i}`;
				const bankName = `${user.username} Test Bank ${i}`;

				const bank_code = `TB${i}BW`;
				try {
					// Check if bank exists
					const exists = await client.bankExists(bankId);
					if (exists) {
						logger.info(`Bank ${bankId} already exists, skipping`);
						results.banks.push({ bank_id: bankId, bank_code, full_name: bankName });
					} else {
						const bank = await client.createBank({
							bank_id: bankId,
							full_name: bankName,
							short_name: `TB${i}`,
							bank_code: bank_code
						});
						logger.debug('Bank creation response:', JSON.stringify(bank));
						results.banks.push({
							bank_id: bank.bank_id,
							bank_code: bank.bank_code,
							full_name: bank.full_name
						});
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
					const label = `Account ${j}`;
					try {
						const account = await client.createAccount(bank.bank_id, {
							label: label,
							currency: currency,
							balance: { amount: '0', currency: currency },
							user_id: user.user_id
						});
						logger.debug('Account creation response:', JSON.stringify(account));
						results.accounts.push({
							account_id: account.account_id,
							bank_id: bank.bank_id,
							label: account.label,
							currency: account.currency
						});
						logger.info(`Created account: ${account.account_id} at ${bank.bank_id}`);
					} catch (e: any) {
						const errorMsg = `Failed to create account at ${bank.bank_id}: ${e.message}`;
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
						await client.createCounterparty(firstAccount.bank_id, firstAccount.account_id, payload);
						results.counterparties.push({
							name: business.name,
							bank_id: firstAccount.bank_id,
							account_id: firstAccount.account_id
						});
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
							const effectiveDate = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
							await client.createFxRate(bank.bank_id, {
								from_currency_code: currency,
								to_currency_code: targetCurrency,
								conversion_value: rate,
								effective_date: effectiveDate
							});
							results.fxRates.push({
								bank_id: bank.bank_id,
								from_currency: currency,
								to_currency: targetCurrency,
								rate: rate
							});
							// Also create reverse rate
							await client.createFxRate(bank.bank_id, {
								from_currency_code: targetCurrency,
								to_currency_code: currency,
								conversion_value: 1 / rate,
								effective_date: effectiveDate
							});
							results.fxRates.push({
								bank_id: bank.bank_id,
								from_currency: targetCurrency,
								to_currency: currency,
								rate: parseFloat((1 / rate).toFixed(6))
							});
						} catch (e: any) {
							const errorMsg = `FX rate ${currency}→${targetCurrency} at ${bank.bank_id}: ${e.message}`;
							logger.error(errorMsg);
							results.errors.push(errorMsg);
						}
						await delay(50);
					}
				}
				logger.info(`Created ${results.fxRates.length} FX rates`);
			}

			// Create Historical Transactions
			if (createTransactions && results.accounts.length >= 2) {
				logger.info('Creating historical transactions...');
				const bankAccounts: Record<string, string[]> = {};

				// Group accounts by bank
				for (const account of results.accounts) {
					if (!bankAccounts[account.bank_id]) {
						bankAccounts[account.bank_id] = [];
					}
					bankAccounts[account.bank_id].push(account.account_id);
				}

				// Create transactions within each bank
				const now = new Date();
				for (const [bank_id, account_ids] of Object.entries(bankAccounts)) {
					if (account_ids.length < 2) continue;

					// Create some transactions over the last 12 months
					for (let month = 0; month < 12; month++) {
						const date = new Date(now);
						date.setMonth(date.getMonth() - month);
						const dateStr = date.toISOString().replace(/\.\d{3}Z$/, 'Z');

						// Random transaction between accounts
						const fromIdx = Math.floor(Math.random() * account_ids.length);
						let toIdx = Math.floor(Math.random() * account_ids.length);
						while (toIdx === fromIdx) {
							toIdx = Math.floor(Math.random() * account_ids.length);
						}

						try {
							const amount = (Math.random() * 1000 + 100).toFixed(2);
							const txn = await client.createHistoricalTransaction(bank_id, {
								from_account_id: account_ids[fromIdx],
								to_account_id: account_ids[toIdx],
								value: {
									currency: currency,
									amount: amount
								},
								description: `Monthly transfer ${month + 1}`,
								posted: dateStr,
								completed: dateStr
							});
							logger.debug('Transaction creation response:', JSON.stringify(txn));
							results.transactions.push({
								transaction_id: txn.transaction_id,
								bank_id: bank_id,
								from_account_id: account_ids[fromIdx],
								to_account_id: account_ids[toIdx],
								amount: `${amount} ${currency}`
							});
						} catch (e: any) {
							const errorMsg = `Transaction at ${bank_id}: ${e.message}`;
							logger.error(errorMsg);
							results.errors.push(errorMsg);
						}
						await delay(100);
					}
				}
				logger.info(`Created ${results.transactions.length} historical transactions`);
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
