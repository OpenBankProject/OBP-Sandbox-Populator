<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import {
		Upload,
		Loader2,
		CheckCircle,
		XCircle,
		FileSpreadsheet,
		Download,
		Building,
		Wallet,
		Users,
		TrendingUp,
		ArrowRightLeft,
		Link
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isLoading = $state(false);

	// CSV text content (read from uploaded files client-side)
	let banksCsv = $state('');
	let accountsCsv = $state('');
	let customersCsv = $state('');
	let counterpartiesCsv = $state('');
	let transactionsCsv = $state('');
	let fxRatesCsv = $state('');

	// Preview row counts
	let banksCount = $derived(countCsvRows(banksCsv));
	let accountsCount = $derived(countCsvRows(accountsCsv));
	let customersCount = $derived(countCsvRows(customersCsv));
	let counterpartiesCount = $derived(countCsvRows(counterpartiesCsv));
	let transactionsCount = $derived(countCsvRows(transactionsCsv));
	let fxRatesCount = $derived(countCsvRows(fxRatesCsv));

	function countCsvRows(csv: string): number {
		if (!csv.trim()) return 0;
		const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== '');
		return Math.max(0, lines.length - 1); // minus header
	}

	function handleFileUpload(event: Event, setter: (value: string) => void) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			setter(e.target?.result as string);
		};
		reader.readAsText(file);
	}

	function hasAnyCsv(): boolean {
		return !!(
			banksCsv.trim() ||
			accountsCsv.trim() ||
			customersCsv.trim() ||
			counterpartiesCsv.trim() ||
			transactionsCsv.trim() ||
			fxRatesCsv.trim()
		);
	}

	// Template CSV content for download
	const templates: Record<string, { filename: string; content: string }> = {
		banks: {
			filename: 'banks_template.csv',
			content: `name,short_code,website,logo_url
First National Bank,FNB,https://fnb.example.com,
Community Savings Bank,CSB,https://csb.example.com,`
		},
		accounts: {
			filename: 'accounts_template.csv',
			content: `bank,account_name,currency,opening_balance,account_holder
FNB,Business Current Account,USD,0,Jane Smith
FNB,Savings Account,USD,0,Jane Smith
CSB,Trading Account,EUR,0,Acme Corp`
		},
		customers: {
			filename: 'customers_template.csv',
			content: `name,type,phone,email,date_of_birth,title,employment_status,education,relationship_status,category,bank
Jane Smith,individual,+1 555 0101,jane@example.com,1985-03-15,Ms,employed,Bachelor,single,,FNB
John Doe,individual,+1 555 0102,john@example.com,1978-11-22,Mr,employed,Master,married,,FNB
Acme Corp,corporate,+1 555 0200,info@acme.example.com,,,,,,,CSB`
		},
		counterparties: {
			filename: 'counterparties_template.csv',
			content: `business_name,description,category,location,currency,bank,account
Coffee House,Local coffee shop,Food & Beverage,Main Street,USD,FNB,Business Current Account
Office Supplies Co,Office supply store,Retail,Downtown,USD,FNB,Business Current Account`
		},
		transactions: {
			filename: 'transactions_template.csv',
			content: `date,from_account,from_bank,to_account,to_bank,amount,currency,description
2024-06-15,Business Current Account,FNB,Savings Account,FNB,500.00,USD,Monthly savings transfer
2024-06-16,Business Current Account,FNB,Savings Account,FNB,250.00,USD,Expense reimbursement`
		},
		fx_rates: {
			filename: 'fx_rates_template.csv',
			content: `bank,from_currency,to_currency,rate,date
FNB,USD,EUR,0.92,2024-06-15
FNB,USD,GBP,0.79,2024-06-15
FNB,EUR,USD,1.09,2024-06-15`
		}
	};

	// Example data — a complete, realistic set you can import right away
	const exampleData = {
		banks: `name,short_code,website,logo_url
Greenfield Community Bank,GCB,https://gcb.example.com,
Riverside Savings & Loans,RSL,https://rsl.example.com,`,
		accounts: `bank,account_name,currency,opening_balance,account_holder
GCB,Main Operating Account,USD,0,Maria Garcia
GCB,Payroll Account,USD,0,Maria Garcia
GCB,Tax Reserve Account,USD,0,James Chen
GCB,Marketing Budget,USD,0,Sunrise Bakery Ltd
RSL,Euro Trading Account,EUR,0,James Chen
RSL,Investment Account,EUR,0,Sunrise Bakery Ltd`,
		customers: `name,type,phone,email,date_of_birth,title,employment_status,education,relationship_status,category,bank
Maria Garcia,individual,+1 555 0101,maria.garcia@example.com,1985-03-15,Ms,employed,Bachelor,married,,GCB
James Chen,individual,+1 555 0102,james.chen@example.com,1978-11-22,Mr,self-employed,Master,single,,GCB
Priya Patel,individual,+1 555 0103,priya.patel@example.com,1992-07-08,Dr,employed,Doctorate,married,,GCB
Sunrise Bakery Ltd,corporate,+1 555 0200,info@sunrisebakery.example.com,,,,,,Food & Beverage,GCB
James Chen,individual,+44 20 7946 0102,james.chen@example.com,1978-11-22,Mr,self-employed,Master,single,,RSL
Sunrise Bakery Ltd,corporate,+44 20 7946 0200,info@sunrisebakery.example.com,,,,,,Food & Beverage,RSL`,
		counterparties: `business_name,description,category,location,currency,bank,account
Daily Grind Coffee,Artisan coffee roaster and cafe,Food & Beverage,High Street,USD,GCB,Main Operating Account
TechParts Direct,Computer hardware and components,Retail - Electronics,Industrial Park,USD,GCB,Main Operating Account
Green Valley Farms,Organic produce supplier,Agriculture,Valley Road,USD,GCB,Main Operating Account
CloudHost Solutions,Web hosting and cloud services,Technology,Downtown,USD,GCB,Marketing Budget
Euro Office Supplies,Stationery and office equipment,Retail,Amsterdam,EUR,RSL,Euro Trading Account`,
		transactions: `date,from_account,from_bank,to_account,to_bank,amount,currency,description
2024-06-01,Main Operating Account,GCB,Payroll Account,GCB,12500.00,USD,June payroll funding
2024-06-05,Main Operating Account,GCB,Tax Reserve Account,GCB,3200.00,USD,Quarterly tax provision
2024-06-10,Main Operating Account,GCB,Marketing Budget,GCB,2000.00,USD,Q3 marketing budget
2024-06-15,Payroll Account,GCB,Main Operating Account,GCB,850.00,USD,Payroll correction refund
2024-06-20,Euro Trading Account,RSL,Investment Account,RSL,5000.00,EUR,Investment transfer`,
		fx_rates: `bank,from_currency,to_currency,rate,date
GCB,USD,EUR,0.92,2024-06-15
GCB,USD,GBP,0.79,2024-06-15
GCB,EUR,USD,1.09,2024-06-15
GCB,GBP,USD,1.27,2024-06-15
RSL,EUR,USD,1.09,2024-06-15
RSL,EUR,GBP,0.86,2024-06-15
RSL,USD,EUR,0.92,2024-06-15`
	};

	function downloadCsv(filename: string, content: string) {
		const blob = new Blob([content], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function downloadTemplate(key: string) {
		const template = templates[key];
		downloadCsv(template.filename, template.content);
	}

	function downloadExample(key: string) {
		const content = exampleData[key as keyof typeof exampleData];
		if (content) {
			downloadCsv(`example_${key}.csv`, content);
		}
	}
</script>

<div class="p-8 w-full">
	<h1 class="h1 mb-2">Import from CSV</h1>
	<p class="text-surface-400 mb-2">
		Upload CSV files to populate your OBP sandbox as <span class="text-secondary-400"
			>{data.username}</span
		>
	</p>
	<p class="text-surface-500 text-sm mb-8">
		Use plain business-friendly column names. The app maps them to OBP API calls automatically.
		Download templates or examples below for each data type.
	</p>

	<form
		method="POST"
		action="?/import"
		use:enhance={() => {
			isLoading = true;
			return async ({ update }) => {
				await update();
				isLoading = false;
			};
		}}
	>
		<!-- Hidden fields with CSV content -->
		<input type="hidden" name="banks_csv" value={banksCsv} />
		<input type="hidden" name="accounts_csv" value={accountsCsv} />
		<input type="hidden" name="customers_csv" value={customersCsv} />
		<input type="hidden" name="counterparties_csv" value={counterpartiesCsv} />
		<input type="hidden" name="transactions_csv" value={transactionsCsv} />
		<input type="hidden" name="fx_rates_csv" value={fxRatesCsv} />

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Left column: Upload -->
			<div class="space-y-4">
				<!-- Banks CSV -->
				{@render csvUploadSection(
					'banks',
					'Banks',
					Building,
					banksCount,
					'name, short_code, website, logo_url',
					(v) => (banksCsv = v)
				)}

				<!-- Accounts CSV -->
				{@render csvUploadSection(
					'accounts',
					'Accounts',
					Wallet,
					accountsCount,
					'bank, account_name, currency, opening_balance, account_holder',
					(v) => (accountsCsv = v)
				)}

				<!-- Customers CSV -->
				{@render csvUploadSection(
					'customers',
					'Customers',
					Users,
					customersCount,
					'name, type, phone, email, date_of_birth, title, bank',
					(v) => (customersCsv = v)
				)}

				<!-- Counterparties CSV -->
				{@render csvUploadSection(
					'counterparties',
					'Counterparties',
					ArrowRightLeft,
					counterpartiesCount,
					'business_name, description, category, bank, account',
					(v) => (counterpartiesCsv = v)
				)}

				<!-- Transactions CSV -->
				{@render csvUploadSection(
					'transactions',
					'Transactions',
					TrendingUp,
					transactionsCount,
					'date, from_account, from_bank, to_account, to_bank, amount, currency',
					(v) => (transactionsCsv = v)
				)}

				<!-- FX Rates CSV -->
				{@render csvUploadSection(
					'fx_rates',
					'FX Rates',
					Link,
					fxRatesCount,
					'bank, from_currency, to_currency, rate, date',
					(v) => (fxRatesCsv = v)
				)}

				<!-- Submit -->
				<button
					type="submit"
					class="btn preset-filled-primary-500 w-full"
					disabled={isLoading || !hasAnyCsv()}
				>
					{#if isLoading}
						<Loader2 class="size-4 animate-spin" />
						Importing...
					{:else}
						<Upload class="size-4" />
						Import CSV Data
					{/if}
				</button>
			</div>

			<!-- Right column: Results -->
			<div class="space-y-4">
				{#if form?.results}
					<div class="card p-6 preset-filled-surface-50-950">
						<h2 class="h3 mb-4 flex items-center gap-2">
							<CheckCircle class="size-5 text-success-500" />
							Import Results
						</h2>

						{#if form.results.banks.length > 0}
							{@render resultSection('Banks', form.results.banks, (b) => `${b.name} (${b.bank_id}) - ${b.status}`)}
						{/if}

						{#if form.results.accounts.length > 0}
							{@render resultSection('Accounts', form.results.accounts, (a) => `${a.label} at ${a.bank} - ${a.status}`)}
						{/if}

						{#if form.results.customers.length > 0}
							{@render resultSection('Customers', form.results.customers, (c) => `${c.name} (${c.type}) - ${c.status}`)}
						{/if}

						{#if form.results.customerAccountLinks.length > 0}
							{@render resultSection('Customer-Account Links', form.results.customerAccountLinks, (l) => `${l.customer} -> ${l.account} - ${l.status}`)}
						{/if}

						{#if form.results.counterparties.length > 0}
							{@render resultSection('Counterparties', form.results.counterparties, (c) => `${c.name} at ${c.bank}/${c.account} - ${c.status}`)}
						{/if}

						{#if form.results.transactions.length > 0}
							{@render resultSection('Transactions', form.results.transactions, (t) => `${t.from} -> ${t.to}: ${t.amount} - ${t.status}`)}
						{/if}

						{#if form.results.fxRates.length > 0}
							{@render resultSection('FX Rates', form.results.fxRates, (f) => `${f.from} -> ${f.to}: ${f.rate} - ${f.status}`)}
						{/if}
					</div>

					{#if form.results.errors.length > 0}
						<div class="card p-6 preset-filled-surface-50-950 border border-error-500/30">
							<h3 class="h4 mb-3 flex items-center gap-2 text-error-400">
								<XCircle class="size-5" />
								Errors ({form.results.errors.length})
							</h3>
							<ul class="space-y-1 text-sm">
								{#each form.results.errors as error}
									<li class="text-error-300">{error}</li>
								{/each}
							</ul>
						</div>
					{/if}
				{:else}
					<div class="card p-6 preset-filled-surface-50-950">
						<h2 class="h3 mb-4 flex items-center gap-2">
							<FileSpreadsheet class="size-5 text-secondary-500" />
							How it works
						</h2>
						<ol class="space-y-3 text-sm text-surface-300">
							<li>
								<strong class="text-surface-50">1. Download templates</strong> - Click the
								download button on each section to get a CSV template with the expected columns.
							</li>
							<li>
								<strong class="text-surface-50">2. Fill in your data</strong> - Use plain
								business names. For example, use a bank's short code (like "FNB") and reference
								it in accounts and customers.
							</li>
							<li>
								<strong class="text-surface-50">3. Upload CSVs</strong> - Upload one or more
								CSV files. You don't need all of them - just upload what you have.
							</li>
							<li>
								<strong class="text-surface-50">4. Import</strong> - The app processes files in
								order: Banks, Accounts, Customers, Customer-Account Links,
								Counterparties, Transactions, FX Rates.
							</li>
						</ol>

						<h3 class="h4 mt-6 mb-3">Cross-references</h3>
						<ul class="space-y-2 text-sm text-surface-300">
							<li>
								<code class="bg-surface-700 px-1 rounded">bank</code> in accounts.csv must match
								<code class="bg-surface-700 px-1 rounded">short_code</code> in banks.csv
							</li>
							<li>
								<code class="bg-surface-700 px-1 rounded">account_holder</code> in accounts.csv must
								match <code class="bg-surface-700 px-1 rounded">name</code> in customers.csv (auto-links
								the customer to the account)
							</li>
							<li>
								<code class="bg-surface-700 px-1 rounded">account</code> in counterparties.csv must
								match <code class="bg-surface-700 px-1 rounded">account_name</code> in accounts.csv
							</li>
						</ul>
					</div>
				{/if}
			</div>
		</div>
	</form>
</div>

{#snippet csvUploadSection(key: string, label: string, Icon: any, rowCount: number, columns: string, setter: (v: string) => void)}
	<div class="card p-4 preset-filled-surface-50-950">
		<div class="flex items-center justify-between mb-2">
			<h3 class="text-sm font-medium flex items-center gap-2">
				<Icon class="size-4 text-secondary-500" />
				{label}
				{#if rowCount > 0}
					<span class="badge preset-filled-secondary-500 text-xs">{rowCount} rows</span>
				{/if}
			</h3>
			<div class="flex gap-2">
				<button
					type="button"
					class="btn btn-sm preset-outlined-surface-50-950"
					onclick={() => downloadTemplate(key)}
				>
					<Download class="size-3" />
					Template
				</button>
				<button
					type="button"
					class="btn btn-sm preset-filled-secondary-500"
					onclick={() => downloadExample(key)}
				>
					<Download class="size-3" />
					Example
				</button>
			</div>
		</div>
		<p class="text-xs text-surface-500 mb-2">Columns: {columns}</p>
		<input
			type="file"
			accept=".csv,text/csv"
			class="input w-full text-sm"
			disabled={isLoading}
			onchange={(e) => handleFileUpload(e, setter)}
		/>
	</div>
{/snippet}

{#snippet resultSection(title: string, items: any[], formatter: (item: any) => string)}
	<div class="mb-4">
		<h3 class="text-sm font-medium mb-2">
			{title}
			<span class="badge preset-filled-success-500 text-xs ml-1">{items.length}</span>
		</h3>
		<ul class="space-y-1 text-xs text-surface-300">
			{#each items as item}
				<li class="flex items-center gap-1">
					{#if item.status === 'created'}
						<CheckCircle class="size-3 text-success-500 flex-shrink-0" />
					{:else}
						<CheckCircle class="size-3 text-warning-500 flex-shrink-0" />
					{/if}
					{formatter(item)}
				</li>
			{/each}
		</ul>
	</div>
{/snippet}
