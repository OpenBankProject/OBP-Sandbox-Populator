/**
 * CSV parser and mapper for business-friendly CSV files.
 *
 * Parses CSV text into typed arrays and maps business-friendly column names
 * to OBP API payload structures.
 */

// ─── Raw parsed row types (business-friendly column names) ─────────────────

export interface CsvBankRow {
	name: string;
	short_code: string;
	website?: string;
	logo_url?: string;
}

export interface CsvAccountRow {
	bank: string;
	account_name: string;
	currency: string;
	opening_balance?: string;
	account_holder?: string;
}

export interface CsvCustomerRow {
	name: string;
	type: string; // 'individual' or 'corporate'
	phone: string;
	email?: string;
	date_of_birth?: string;
	title?: string;
	employment_status?: string;
	education?: string;
	relationship_status?: string;
	category?: string; // for corporate
	bank: string;
}

export interface CsvCounterpartyRow {
	business_name: string;
	description?: string;
	category?: string;
	location?: string;
	currency?: string;
	bank: string;
	account: string;
}

export interface CsvTransactionRow {
	date: string;
	from_account: string;
	from_bank: string;
	to_account: string;
	to_bank: string;
	amount: string;
	currency: string;
	description?: string;
}

export interface CsvFxRateRow {
	bank: string;
	from_currency: string;
	to_currency: string;
	rate: string;
	date?: string;
}

// ─── Parsed CSV result with validation ─────────────────────────────────────

export interface CsvParseResult<T> {
	rows: T[];
	errors: string[];
	headers: string[];
}

// ─── Core CSV parser ───────────────────────────────────────────────────────

function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
	const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
	if (lines.length === 0) return { headers: [], rows: [] };

	const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
	const rows: Record<string, string>[] = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCsvLine(lines[i]);
		const row: Record<string, string> = {};
		for (let j = 0; j < headers.length; j++) {
			row[headers[j]] = (values[j] || '').trim();
		}
		rows.push(row);
	}

	return { headers, rows };
}

/** Parse a single CSV line handling quoted fields */
function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (inQuotes) {
			if (char === '"') {
				if (i + 1 < line.length && line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === ',') {
				result.push(current);
				current = '';
			} else {
				current += char;
			}
		}
	}
	result.push(current);
	return result;
}

// ─── Typed parsers for each CSV type ───────────────────────────────────────

export function parseBanksCsv(text: string): CsvParseResult<CsvBankRow> {
	const { headers, rows } = parseCsvText(text);
	const errors: string[] = [];
	const parsed: CsvBankRow[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const lineNum = i + 2; // +2 for 1-based + header row
		if (!row.name) errors.push(`Row ${lineNum}: missing 'name'`);
		if (!row.short_code) errors.push(`Row ${lineNum}: missing 'short_code'`);
		if (row.name && row.short_code) {
			parsed.push({
				name: row.name,
				short_code: row.short_code,
				website: row.website || undefined,
				logo_url: row.logo_url || undefined
			});
		}
	}

	return { rows: parsed, errors, headers };
}

export function parseAccountsCsv(text: string): CsvParseResult<CsvAccountRow> {
	const { headers, rows } = parseCsvText(text);
	const errors: string[] = [];
	const parsed: CsvAccountRow[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const lineNum = i + 2;
		if (!row.bank) errors.push(`Row ${lineNum}: missing 'bank'`);
		if (!row.account_name) errors.push(`Row ${lineNum}: missing 'account_name'`);
		if (!row.currency) errors.push(`Row ${lineNum}: missing 'currency'`);
		if (row.bank && row.account_name && row.currency) {
			parsed.push({
				bank: row.bank,
				account_name: row.account_name,
				currency: row.currency,
				opening_balance: row.opening_balance || '0',
				account_holder: row.account_holder || undefined
			});
		}
	}

	return { rows: parsed, errors, headers };
}

export function parseCustomersCsv(text: string): CsvParseResult<CsvCustomerRow> {
	const { headers, rows } = parseCsvText(text);
	const errors: string[] = [];
	const parsed: CsvCustomerRow[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const lineNum = i + 2;
		if (!row.name) errors.push(`Row ${lineNum}: missing 'name'`);
		if (!row.type) errors.push(`Row ${lineNum}: missing 'type'`);
		if (!row.phone) errors.push(`Row ${lineNum}: missing 'phone'`);
		if (!row.bank) errors.push(`Row ${lineNum}: missing 'bank'`);
		if (row.type && !['individual', 'corporate'].includes(row.type.toLowerCase())) {
			errors.push(`Row ${lineNum}: 'type' must be 'individual' or 'corporate'`);
		}
		if (row.name && row.type && row.phone && row.bank) {
			parsed.push({
				name: row.name,
				type: row.type.toLowerCase(),
				phone: row.phone,
				email: row.email || undefined,
				date_of_birth: row.date_of_birth || undefined,
				title: row.title || undefined,
				employment_status: row.employment_status || undefined,
				education: row.education || undefined,
				relationship_status: row.relationship_status || undefined,
				category: row.category || undefined,
				bank: row.bank
			});
		}
	}

	return { rows: parsed, errors, headers };
}

export function parseCounterpartiesCsv(text: string): CsvParseResult<CsvCounterpartyRow> {
	const { headers, rows } = parseCsvText(text);
	const errors: string[] = [];
	const parsed: CsvCounterpartyRow[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const lineNum = i + 2;
		if (!row.business_name) errors.push(`Row ${lineNum}: missing 'business_name'`);
		if (!row.bank) errors.push(`Row ${lineNum}: missing 'bank'`);
		if (!row.account) errors.push(`Row ${lineNum}: missing 'account'`);
		if (row.business_name && row.bank && row.account) {
			parsed.push({
				business_name: row.business_name,
				description: row.description || undefined,
				category: row.category || undefined,
				location: row.location || undefined,
				currency: row.currency || undefined,
				bank: row.bank,
				account: row.account
			});
		}
	}

	return { rows: parsed, errors, headers };
}

export function parseTransactionsCsv(text: string): CsvParseResult<CsvTransactionRow> {
	const { headers, rows } = parseCsvText(text);
	const errors: string[] = [];
	const parsed: CsvTransactionRow[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const lineNum = i + 2;
		if (!row.date) errors.push(`Row ${lineNum}: missing 'date'`);
		if (!row.from_account) errors.push(`Row ${lineNum}: missing 'from_account'`);
		if (!row.from_bank) errors.push(`Row ${lineNum}: missing 'from_bank'`);
		if (!row.to_account) errors.push(`Row ${lineNum}: missing 'to_account'`);
		if (!row.to_bank) errors.push(`Row ${lineNum}: missing 'to_bank'`);
		if (!row.amount) errors.push(`Row ${lineNum}: missing 'amount'`);
		if (!row.currency) errors.push(`Row ${lineNum}: missing 'currency'`);
		if (row.amount && isNaN(parseFloat(row.amount))) {
			errors.push(`Row ${lineNum}: 'amount' must be a number`);
		}
		if (row.date && row.from_account && row.from_bank && row.to_account && row.to_bank && row.amount && row.currency) {
			parsed.push({
				date: row.date,
				from_account: row.from_account,
				from_bank: row.from_bank,
				to_account: row.to_account,
				to_bank: row.to_bank,
				amount: row.amount,
				currency: row.currency,
				description: row.description || undefined
			});
		}
	}

	return { rows: parsed, errors, headers };
}

export function parseFxRatesCsv(text: string): CsvParseResult<CsvFxRateRow> {
	const { headers, rows } = parseCsvText(text);
	const errors: string[] = [];
	const parsed: CsvFxRateRow[] = [];

	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const lineNum = i + 2;
		if (!row.bank) errors.push(`Row ${lineNum}: missing 'bank'`);
		if (!row.from_currency) errors.push(`Row ${lineNum}: missing 'from_currency'`);
		if (!row.to_currency) errors.push(`Row ${lineNum}: missing 'to_currency'`);
		if (!row.rate) errors.push(`Row ${lineNum}: missing 'rate'`);
		if (row.rate && isNaN(parseFloat(row.rate))) {
			errors.push(`Row ${lineNum}: 'rate' must be a number`);
		}
		if (row.bank && row.from_currency && row.to_currency && row.rate) {
			parsed.push({
				bank: row.bank,
				from_currency: row.from_currency,
				to_currency: row.to_currency,
				rate: row.rate,
				date: row.date || undefined
			});
		}
	}

	return { rows: parsed, errors, headers };
}
