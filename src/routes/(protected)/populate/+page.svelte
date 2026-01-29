<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import {
		Database,
		Loader2,
		CheckCircle,
		XCircle,
		Building,
		Wallet,
		Users,
		TrendingUp,
		History
	} from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let isLoading = $state(false);
	let numBanks = $state(data.defaults.numBanks);
	let numAccountsPerBank = $state(data.defaults.numAccountsPerBank);
	let currency = $state(data.defaults.currency);
	let createCounterparties = $state(true);
	let createFxRates = $state(true);
	let createTransactions = $state(true);
</script>

<div class="p-8 max-w-4xl mx-auto">
	<h1 class="h1 mb-2">Populate Sandbox</h1>
	<p class="text-surface-400 mb-8">
		Configure and create test data for your OBP sandbox as <span class="text-secondary-400"
			>{data.username}</span
		>
	</p>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
		<!-- Configuration Panel -->
		<div class="card p-6 preset-filled-surface-50-950">
			<h2 class="h3 mb-4 flex items-center gap-2">
				<Database class="size-5 text-secondary-500" />
				Configuration
			</h2>

			<form
				method="POST"
				action="?/populate"
				use:enhance={() => {
					isLoading = true;
					return async ({ update }) => {
						await update();
						isLoading = false;
					};
				}}
				class="space-y-4"
			>
				<!-- Number of Banks -->
				<div>
					<label for="numBanks" class="block text-sm font-medium mb-1">Number of Banks</label>
					<input
						type="number"
						id="numBanks"
						name="numBanks"
						bind:value={numBanks}
						min="1"
						max="5"
						class="input w-full"
						disabled={isLoading}
					/>
					<p class="text-xs text-surface-500 mt-1">Banks will be named: {data.username}.bank1.bw</p>
				</div>

				<!-- Accounts per Bank -->
				<div>
					<label for="numAccountsPerBank" class="block text-sm font-medium mb-1"
						>Accounts per Bank</label
					>
					<input
						type="number"
						id="numAccountsPerBank"
						name="numAccountsPerBank"
						bind:value={numAccountsPerBank}
						min="1"
						max="10"
						class="input w-full"
						disabled={isLoading}
					/>
				</div>

				<!-- Currency -->
				<div>
					<label for="currency" class="block text-sm font-medium mb-1">Currency</label>
					<select
						id="currency"
						name="currency"
						bind:value={currency}
						class="select w-full"
						disabled={isLoading}
					>
						<option value="BWP">BWP - Botswana Pula</option>
						<option value="USD">USD - US Dollar</option>
						<option value="EUR">EUR - Euro</option>
						<option value="GBP">GBP - British Pound</option>
						<option value="ZAR">ZAR - South African Rand</option>
					</select>
				</div>

				<hr class="border-surface-700" />

				<!-- Optional Features -->
				<div class="space-y-3">
					<p class="text-sm font-medium">Additional Data</p>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="createCounterparties"
							bind:checked={createCounterparties}
							class="checkbox"
							disabled={isLoading}
						/>
						<span class="flex items-center gap-2">
							<Users class="size-4 text-tertiary-500" />
							Create Counterparties (Botswana businesses)
						</span>
					</label>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="createFxRates"
							bind:checked={createFxRates}
							class="checkbox"
							disabled={isLoading}
						/>
						<span class="flex items-center gap-2">
							<TrendingUp class="size-4 text-tertiary-500" />
							Create FX Rates (African currencies + CNY)
						</span>
					</label>

					<label class="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							name="createTransactions"
							bind:checked={createTransactions}
							class="checkbox"
							disabled={isLoading}
						/>
						<span class="flex items-center gap-2">
							<History class="size-4 text-tertiary-500" />
							Create Historical Transactions (12 months)
						</span>
					</label>
				</div>

				<button
					type="submit"
					class="btn preset-filled-primary-500 w-full mt-6"
					disabled={isLoading}
				>
					{#if isLoading}
						<Loader2 class="size-5 animate-spin mr-2" />
						Populating...
					{:else}
						<Database class="size-5 mr-2" />
						Populate Sandbox
					{/if}
				</button>
			</form>
		</div>

		<!-- Results Panel -->
		<div class="card p-6 preset-filled-surface-50-950">
			<h2 class="h3 mb-4 flex items-center gap-2">
				{#if form?.success}
					<CheckCircle class="size-5 text-success-500" />
				{:else if form?.error}
					<XCircle class="size-5 text-error-500" />
				{:else}
					<Database class="size-5 text-surface-500" />
				{/if}
				Results
			</h2>

			{#if isLoading}
				<div class="flex flex-col items-center justify-center py-12 text-surface-400">
					<Loader2 class="size-12 animate-spin mb-4" />
					<p>Creating sandbox data...</p>
					<p class="text-sm mt-2">This may take a moment</p>
				</div>
			{:else if form?.success && form.results}
				<div class="space-y-4">
					<!-- Banks -->
					<div class="p-3 rounded-lg bg-surface-800/50">
						<div class="flex items-center gap-2 mb-2">
							<Building class="size-4 text-secondary-500" />
							<span class="font-medium">Banks Created: {form.results.banks.length}</span>
						</div>
						{#if form.results.banks.length > 0}
							<ul class="text-sm text-surface-400 ml-6 space-y-1">
								{#each form.results.banks as bank}
									<li>{bank.id}</li>
								{/each}
							</ul>
						{/if}
					</div>

					<!-- Accounts -->
					<div class="p-3 rounded-lg bg-surface-800/50">
						<div class="flex items-center gap-2">
							<Wallet class="size-4 text-secondary-500" />
							<span class="font-medium">Accounts Created: {form.results.accounts.length}</span>
						</div>
					</div>

					<!-- Counterparties -->
					<div class="p-3 rounded-lg bg-surface-800/50">
						<div class="flex items-center gap-2">
							<Users class="size-4 text-secondary-500" />
							<span class="font-medium">Counterparties: {form.results.counterparties}</span>
						</div>
					</div>

					<!-- FX Rates -->
					<div class="p-3 rounded-lg bg-surface-800/50">
						<div class="flex items-center gap-2">
							<TrendingUp class="size-4 text-secondary-500" />
							<span class="font-medium">FX Rates: {form.results.fxRates}</span>
						</div>
					</div>

					<!-- Transactions -->
					<div class="p-3 rounded-lg bg-surface-800/50">
						<div class="flex items-center gap-2">
							<History class="size-4 text-secondary-500" />
							<span class="font-medium">Transactions: {form.results.transactions}</span>
						</div>
					</div>

					<!-- Errors -->
					{#if form.results.errors && form.results.errors.length > 0}
						<div class="p-3 rounded-lg bg-error-900/30 border border-error-700">
							<div class="flex items-center gap-2 mb-2">
								<XCircle class="size-4 text-error-500" />
								<span class="font-medium text-error-400"
									>Errors: {form.results.errors.length}</span
								>
							</div>
							<ul class="text-sm text-error-300 ml-6 space-y-1 max-h-32 overflow-y-auto">
								{#each form.results.errors.slice(0, 5) as error}
									<li class="truncate">{error}</li>
								{/each}
								{#if form.results.errors.length > 5}
									<li class="text-error-400">...and {form.results.errors.length - 5} more</li>
								{/if}
							</ul>
						</div>
					{/if}
				</div>
			{:else if form?.error}
				<div class="p-4 rounded-lg bg-error-900/30 border border-error-700">
					<p class="text-error-400">{form.error}</p>
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-12 text-surface-500">
					<Database class="size-12 mb-4 opacity-50" />
					<p>Configure options and click "Populate Sandbox"</p>
					<p class="text-sm mt-2">Results will appear here</p>
				</div>
			{/if}
		</div>
	</div>
</div>
