<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowLeft, Wallet, Hash, Building, CreditCard, Tag, Route } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const account = data.account;
</script>

<div class="p-8 w-full max-w-4xl mx-auto">
	<div class="mb-6">
		<a href="/populate" class="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm">
			<ArrowLeft class="size-4" />
			Back to Populate
		</a>
	</div>

	<h1 class="h1 mb-2">Account Detail</h1>
	<p class="text-surface-400 mb-8">
		Account <code class="text-xs bg-surface-700 px-2 py-1 rounded">{data.account_id}</code>
	</p>

	<div class="card p-6 preset-filled-surface-50-950 space-y-6">
		<!-- Account ID -->
		<div class="flex items-start gap-3">
			<Hash class="size-5 text-secondary-500 mt-0.5" />
			<div>
				<p class="text-sm text-surface-400">Account ID</p>
				<p class="font-mono text-sm">{account.id || account.account_id}</p>
			</div>
		</div>

		<!-- Label -->
		{#if account.label}
			<div class="flex items-start gap-3">
				<Tag class="size-5 text-secondary-500 mt-0.5" />
				<div>
					<p class="text-sm text-surface-400">Label</p>
					<p>{account.label}</p>
				</div>
			</div>
		{/if}

		<!-- Bank -->
		<div class="flex items-start gap-3">
			<Building class="size-5 text-secondary-500 mt-0.5" />
			<div>
				<p class="text-sm text-surface-400">Bank ID</p>
				<p class="font-mono text-sm">{data.bank_id}</p>
			</div>
		</div>

		<!-- Balance -->
		{#if account.balance}
			<div class="flex items-start gap-3">
				<Wallet class="size-5 text-secondary-500 mt-0.5" />
				<div>
					<p class="text-sm text-surface-400">Balance</p>
					<p class="text-2xl font-semibold text-primary-400">
						{account.balance.amount} {account.balance.currency}
					</p>
				</div>
			</div>
		{/if}

		<!-- Currency -->
		{#if account.currency}
			<div class="flex items-start gap-3">
				<CreditCard class="size-5 text-secondary-500 mt-0.5" />
				<div>
					<p class="text-sm text-surface-400">Currency</p>
					<p>{account.currency}</p>
				</div>
			</div>
		{/if}

		<!-- Account Routings -->
		{#if account.account_routings && account.account_routings.length > 0}
			<div class="border-t border-surface-700 pt-6">
				<div class="flex items-center gap-2 mb-4">
					<Route class="size-5 text-secondary-500" />
					<h2 class="h4">Account Routings</h2>
				</div>
				<div class="space-y-2">
					{#each account.account_routings as routing}
						<div class="p-3 rounded-lg bg-surface-800/50">
							<p class="text-xs text-surface-400">{routing.scheme}</p>
							<p class="font-mono text-sm">{routing.address}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Views -->
		{#if account.views_available && account.views_available.length > 0}
			<div class="border-t border-surface-700 pt-6">
				<h2 class="h4 mb-4">Available Views</h2>
				<div class="flex flex-wrap gap-2">
					{#each account.views_available as view}
						<span class="px-2 py-1 text-xs bg-surface-700 rounded">{view.id}</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Raw JSON (collapsible) -->
		<details class="border-t border-surface-700 pt-6">
			<summary class="cursor-pointer text-sm text-surface-400 hover:text-surface-300">
				View Raw JSON
			</summary>
			<pre class="mt-4 p-4 bg-surface-900 rounded-lg overflow-x-auto text-xs">{JSON.stringify(account, null, 2)}</pre>
		</details>
	</div>
</div>
