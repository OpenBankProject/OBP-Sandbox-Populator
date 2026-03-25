import { createLogger } from '$lib/utils/logger';
const logger = createLogger('CsvImportServer');
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { OBPClient } from '$lib/obp/client';
import { env } from '$env/dynamic/public';
import {
	parseBanksCsv,
	parseAccountsCsv,
	parseCustomersCsv,
	parseCounterpartiesCsv,
	parseTransactionsCsv,
	parseFxRatesCsv
} from '$lib/csv/parser';

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.session?.data?.user;
	return {
		username: user?.username || 'unknown'
	};
};

export const actions: Actions = {
	import: async ({ request, locals }) => {
		const session = locals.session;
		const accessToken = session?.data?.oauth?.access_token;
		const user = session?.data?.user;

		if (!accessToken || !user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const banksCsv = (formData.get('banks_csv') as string) || '';
		const accountsCsv = (formData.get('accounts_csv') as string) || '';
		const customersCsv = (formData.get('customers_csv') as string) || '';
		const counterpartiesCsv = (formData.get('counterparties_csv') as string) || '';
		const transactionsCsv = (formData.get('transactions_csv') as string) || '';
		const fxRatesCsv = (formData.get('fx_rates_csv') as string) || '';

		const client = new OBPClient(env.PUBLIC_OBP_BASE_URL, 'v6.0.0', accessToken);

		const results: {
			banks: Array<{ bank_id: string; name: string; status: string }>;
			accounts: Array<{ account_id: string; bank: string; label: string; status: string }>;
			customers: Array<{ customer_id: string; name: string; type: string; status: string }>;
			customerAccountLinks: Array<{ customer: string; account: string; status: string }>;
			counterparties: Array<{ name: string; bank: string; account: string; status: string }>;
			transactions: Array<{ from: string; to: string; amount: string; status: string }>;
			fxRates: Array<{ from: string; to: string; rate: string; status: string }>;
			errors: string[];
		} = {
			banks: [],
			accounts: [],
			customers: [],
			customerAccountLinks: [],
			counterparties: [],
			transactions: [],
			fxRates: [],
			errors: []
		};

		// Lookup maps: business-friendly name -> OBP ID
		const bankIdMap: Record<string, string> = {}; // short_code -> bank_id
		const accountIdMap: Record<string, string> = {}; // "bank_short_code::account_name" -> account_id
		const customerIdMap: Record<string, string> = {}; // "bank_short_code::customer_name" -> customer_id

		// ─── Step 1: Create Banks ──────────────────────────────────────────
		if (banksCsv.trim()) {
			const parsed = parseBanksCsv(banksCsv);
			if (parsed.errors.length > 0) {
				results.errors.push(...parsed.errors.map((e) => `banks.csv: ${e}`));
			}

			for (const row of parsed.rows) {
				const bankId = row.short_code.toLowerCase();
				try {
					const exists = await client.bankExists(bankId);
					if (exists) {
						logger.info(`Bank ${bankId} already exists, reusing`);
						bankIdMap[row.short_code] = bankId;
						results.banks.push({ bank_id: bankId, name: row.name, status: 'existed' });
					} else {
						const bank = await client.createBank({
							bank_id: bankId,
							full_name: row.name,
							bank_code: row.short_code,
							logo: row.logo_url,
							website: row.website
						});

						// Grant entitlements at new bank
						const roles = [
							'CanCreateAccount',
							'CanCreateHistoricalTransactionAtBank',
							'CanCreateCustomer',
							'CanGetCustomersAtOneBank',
							'CanCreateUserCustomerLink',
							'CanGetUserCustomerLink',
							'CanCreateCustomerAccountLink',
							'CanCreateFxRate',
							'CanCreateFxRateAtAnyBank'
						];
						for (const role of roles) {
							try {
								await client.createEntitlement(user.user_id, bank.bank_id, role);
							} catch (entErr: any) {
								logger.warn(`Could not grant ${role} at ${bank.bank_id}: ${entErr.message}`);
							}
						}

						bankIdMap[row.short_code] = bank.bank_id;
						results.banks.push({ bank_id: bank.bank_id, name: row.name, status: 'created' });
						logger.info(`Created bank: ${bank.bank_id}`);
					}
				} catch (e: any) {
					results.errors.push(`Failed to create bank '${row.name}': ${e.message}`);
					logger.error(`Failed to create bank ${row.name}:`, e);
				}
				await delay(100);
			}
		}

		// ─── Step 2: Create Accounts ───────────────────────────────────────
		if (accountsCsv.trim()) {
			const parsed = parseAccountsCsv(accountsCsv);
			if (parsed.errors.length > 0) {
				results.errors.push(...parsed.errors.map((e) => `accounts.csv: ${e}`));
			}

			for (const row of parsed.rows) {
				const bankId = bankIdMap[row.bank];
				if (!bankId) {
					results.errors.push(
						`accounts.csv: bank '${row.bank}' not found. Make sure it matches a 'short_code' in banks.csv.`
					);
					continue;
				}

				try {
					const account = await client.createAccount(bankId, {
						label: row.account_name,
						currency: row.currency,
						balance: { currency: row.currency, amount: '0' },
						user_id: user.user_id
					});

					const key = `${row.bank}::${row.account_name}`;
					accountIdMap[key] = account.account_id;
					results.accounts.push({
						account_id: account.account_id,
						bank: row.bank,
						label: row.account_name,
						status: 'created'
					});
					logger.info(`Created account: ${row.account_name} at ${bankId}`);
				} catch (e: any) {
					results.errors.push(`Failed to create account '${row.account_name}' at bank '${row.bank}': ${e.message}`);
					logger.error(`Failed to create account:`, e);
				}
				await delay(100);
			}
		}

		// ─── Step 3: Create Customers ──────────────────────────────────────
		if (customersCsv.trim()) {
			const parsed = parseCustomersCsv(customersCsv);
			if (parsed.errors.length > 0) {
				results.errors.push(...parsed.errors.map((e) => `customers.csv: ${e}`));
			}

			for (const row of parsed.rows) {
				const bankId = bankIdMap[row.bank];
				if (!bankId) {
					results.errors.push(
						`customers.csv: bank '${row.bank}' not found for customer '${row.name}'.`
					);
					continue;
				}

				try {
					let customerId: string;

					if (row.type === 'corporate') {
						const customer = await client.createCorporateCustomer(bankId, {
							legal_name: row.name,
							mobile_phone_number: row.phone,
							email: row.email,
							customer_type: 'CORPORATE'
						});
						customerId = customer.customer_id;
					} else {
						const customer = await client.createCustomer(bankId, {
							legal_name: row.name,
							mobile_phone_number: row.phone,
							email: row.email,
							date_of_birth: row.date_of_birth,
							title: row.title,
							employment_status: row.employment_status,
							highest_education_attained: row.education,
							relationship_status: row.relationship_status
						});
						customerId = customer.customer_id;
					}

					const key = `${row.bank}::${row.name}`;
					customerIdMap[key] = customerId;
					results.customers.push({
						customer_id: customerId,
						name: row.name,
						type: row.type,
						status: 'created'
					});

					// Link user to customer
					try {
						await client.createUserCustomerLink(bankId, {
							user_id: user.user_id,
							customer_id: customerId
						});
					} catch (linkErr: any) {
						logger.warn(`Could not create user-customer link for ${row.name}: ${linkErr.message}`);
					}

					logger.info(`Created ${row.type} customer: ${row.name} at ${bankId}`);
				} catch (e: any) {
					results.errors.push(`Failed to create customer '${row.name}': ${e.message}`);
					logger.error(`Failed to create customer:`, e);
				}
				await delay(100);
			}
		}

		// ─── Step 4: Auto-link customers to accounts (via account_holder) ──
		if (accountsCsv.trim() && customersCsv.trim()) {
			const parsedAccounts = parseAccountsCsv(accountsCsv);
			for (const row of parsedAccounts.rows) {
				if (!row.account_holder) continue;

				const bankId = bankIdMap[row.bank];
				const accountKey = `${row.bank}::${row.account_name}`;
				const customerKey = `${row.bank}::${row.account_holder}`;
				const accountId = accountIdMap[accountKey];
				const customerId = customerIdMap[customerKey];

				if (!bankId || !accountId || !customerId) {
					if (!customerId) {
						results.errors.push(
							`Could not link account '${row.account_name}' to customer '${row.account_holder}': customer not found at bank '${row.bank}'.`
						);
					}
					continue;
				}

				try {
					await client.createCustomerAccountLink(bankId, {
						customer_id: customerId,
						bank_id: bankId,
						account_id: accountId,
						relationship_type: 'Owner'
					});
					results.customerAccountLinks.push({
						customer: row.account_holder,
						account: row.account_name,
						status: 'created'
					});
					logger.info(`Linked customer '${row.account_holder}' to account '${row.account_name}'`);
				} catch (e: any) {
					results.errors.push(
						`Failed to link customer '${row.account_holder}' to account '${row.account_name}': ${e.message}`
					);
					logger.warn(`Customer-account link failed:`, e);
				}
				await delay(50);
			}
		}

		// ─── Step 5: Create Counterparties ─────────────────────────────────
		if (counterpartiesCsv.trim()) {
			const parsed = parseCounterpartiesCsv(counterpartiesCsv);
			if (parsed.errors.length > 0) {
				results.errors.push(...parsed.errors.map((e) => `counterparties.csv: ${e}`));
			}

			for (const row of parsed.rows) {
				const bankId = bankIdMap[row.bank];
				const accountKey = `${row.bank}::${row.account}`;
				const accountId = accountIdMap[accountKey];

				if (!bankId || !accountId) {
					results.errors.push(
						`counterparties.csv: could not find bank '${row.bank}' or account '${row.account}' for counterparty '${row.business_name}'.`
					);
					continue;
				}

				try {
					await client.createCounterparty(bankId, accountId, {
						name: row.business_name,
						description: row.description || '',
						currency: row.currency || 'EUR',
						other_account_routing_scheme: 'OBP',
						other_account_routing_address: '',
						other_bank_routing_scheme: 'OBP',
						other_bank_routing_address: ''
					});
					results.counterparties.push({
						name: row.business_name,
						bank: row.bank,
						account: row.account,
						status: 'created'
					});
					logger.info(`Created counterparty: ${row.business_name}`);
				} catch (e: any) {
					results.errors.push(`Failed to create counterparty '${row.business_name}': ${e.message}`);
					logger.error(`Failed to create counterparty:`, e);
				}
				await delay(100);
			}
		}

		// ─── Step 6: Create Transactions ───────────────────────────────────
		if (transactionsCsv.trim()) {
			const parsed = parseTransactionsCsv(transactionsCsv);
			if (parsed.errors.length > 0) {
				results.errors.push(...parsed.errors.map((e) => `transactions.csv: ${e}`));
			}

			for (const row of parsed.rows) {
				const fromBankId = bankIdMap[row.from_bank];
				const fromAccountKey = `${row.from_bank}::${row.from_account}`;
				const toAccountKey = `${row.to_bank}::${row.to_account}`;
				const fromAccountId = accountIdMap[fromAccountKey];
				const toAccountId = accountIdMap[toAccountKey];

				if (!fromBankId) {
					results.errors.push(`transactions.csv: bank '${row.from_bank}' not found.`);
					continue;
				}
				if (!fromAccountId) {
					results.errors.push(
						`transactions.csv: account '${row.from_account}' at bank '${row.from_bank}' not found.`
					);
					continue;
				}
				if (!toAccountId) {
					results.errors.push(
						`transactions.csv: account '${row.to_account}' at bank '${row.to_bank}' not found.`
					);
					continue;
				}

				const postedDate = new Date(row.date).toISOString();

				try {
					const txn = await client.createHistoricalTransaction(fromBankId, {
						from_account_id: fromAccountId,
						to_account_id: toAccountId,
						value: {
							currency: row.currency,
							amount: row.amount
						},
						description: row.description || 'CSV import',
						posted: postedDate,
						completed: postedDate,
						type: 'SANDBOX_TAN',
						charge_policy: 'SHARED'
					});
					results.transactions.push({
						from: `${row.from_bank}/${row.from_account}`,
						to: `${row.to_bank}/${row.to_account}`,
						amount: `${row.amount} ${row.currency}`,
						status: 'created'
					});
					logger.info(`Created transaction: ${row.amount} ${row.currency}`);
				} catch (e: any) {
					results.errors.push(
						`Failed to create transaction (${row.from_account} -> ${row.to_account}, ${row.amount} ${row.currency}): ${e.message}`
					);
					logger.error(`Failed to create transaction:`, e);
				}
				await delay(100);
			}
		}

		// ─── Step 7: Create FX Rates ───────────────────────────────────────
		if (fxRatesCsv.trim()) {
			const parsed = parseFxRatesCsv(fxRatesCsv);
			if (parsed.errors.length > 0) {
				results.errors.push(...parsed.errors.map((e) => `fx_rates.csv: ${e}`));
			}

			for (const row of parsed.rows) {
				const bankId = bankIdMap[row.bank];
				if (!bankId) {
					results.errors.push(`fx_rates.csv: bank '${row.bank}' not found.`);
					continue;
				}

				const effectiveDate = row.date ? new Date(row.date).toISOString() : new Date().toISOString();
				const rate = parseFloat(row.rate);

				try {
					await client.createFxRate(bankId, {
						bank_id: bankId,
						from_currency_code: row.from_currency,
						to_currency_code: row.to_currency,
						conversion_value: rate,
						inverse_conversion_value: 1 / rate,
						effective_date: effectiveDate
					});
					results.fxRates.push({
						from: row.from_currency,
						to: row.to_currency,
						rate: row.rate,
						status: 'created'
					});
					logger.info(`Created FX rate: ${row.from_currency}->${row.to_currency} = ${row.rate}`);
				} catch (e: any) {
					results.errors.push(
						`Failed to create FX rate ${row.from_currency}->${row.to_currency}: ${e.message}`
					);
					logger.error(`Failed to create FX rate:`, e);
				}
				await delay(50);
			}
		}

		const totalCreated =
			results.banks.filter((b) => b.status === 'created').length +
			results.accounts.filter((a) => a.status === 'created').length +
			results.customers.filter((c) => c.status === 'created').length +
			results.customerAccountLinks.filter((l) => l.status === 'created').length +
			results.counterparties.filter((c) => c.status === 'created').length +
			results.transactions.filter((t) => t.status === 'created').length +
			results.fxRates.filter((f) => f.status === 'created').length;

		logger.info(`CSV import complete. ${totalCreated} entities created, ${results.errors.length} errors.`);

		return { results };
	}
};
