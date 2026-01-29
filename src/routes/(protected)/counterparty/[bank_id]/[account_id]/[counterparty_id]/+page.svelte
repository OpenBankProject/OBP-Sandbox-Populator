<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowLeft, Users, Hash, Building, CreditCard, FileText, Route, CheckCircle, XCircle } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const cp = data.counterparty;
</script>

<div class="p-8 w-full max-w-4xl mx-auto">
	<div class="mb-6">
		<a href="/populate" class="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm">
			<ArrowLeft class="size-4" />
			Back to Populate
		</a>
	</div>

	<h1 class="h1 mb-2">Counterparty Detail</h1>
	<p class="text-surface-400 mb-8">
		Counterparty <code class="text-xs bg-surface-700 px-2 py-1 rounded">{data.counterparty_id}</code>
	</p>

	<div class="card p-6 preset-filled-surface-50-950 space-y-6">
		<!-- Name -->
		<div class="flex items-start gap-3">
			<Users class="size-5 text-secondary-500 mt-0.5" />
			<div>
				<p class="text-sm text-surface-400">Name</p>
				<p class="text-xl font-semibold">{cp.name}</p>
			</div>
		</div>

		<!-- Counterparty ID -->
		<div class="flex items-start gap-3">
			<Hash class="size-5 text-secondary-500 mt-0.5" />
			<div>
				<p class="text-sm text-surface-400">Counterparty ID</p>
				<p class="font-mono text-sm">{cp.counterparty_id}</p>
			</div>
		</div>

		<!-- Description -->
		{#if cp.description}
			<div class="flex items-start gap-3">
				<FileText class="size-5 text-secondary-500 mt-0.5" />
				<div>
					<p class="text-sm text-surface-400">Description</p>
					<p>{cp.description}</p>
				</div>
			</div>
		{/if}

		<!-- Currency -->
		{#if cp.currency}
			<div class="flex items-start gap-3">
				<CreditCard class="size-5 text-secondary-500 mt-0.5" />
				<div>
					<p class="text-sm text-surface-400">Currency</p>
					<p>{cp.currency}</p>
				</div>
			</div>
		{/if}

		<!-- Is Beneficiary -->
		<div class="flex items-start gap-3">
			{#if cp.is_beneficiary}
				<CheckCircle class="size-5 text-success-500 mt-0.5" />
			{:else}
				<XCircle class="size-5 text-error-500 mt-0.5" />
			{/if}
			<div>
				<p class="text-sm text-surface-400">Beneficiary Status</p>
				<p>{cp.is_beneficiary ? 'Is a beneficiary' : 'Not a beneficiary'}</p>
			</div>
		</div>

		<!-- Bank Routing -->
		{#if cp.other_bank_routing_scheme || cp.other_bank_routing_address}
			<div class="border-t border-surface-700 pt-6">
				<div class="flex items-center gap-2 mb-4">
					<Building class="size-5 text-secondary-500" />
					<h2 class="h4">Bank Routing</h2>
				</div>
				<div class="p-3 rounded-lg bg-surface-800/50">
					<p class="text-xs text-surface-400">{cp.other_bank_routing_scheme || 'N/A'}</p>
					<p class="font-mono text-sm">{cp.other_bank_routing_address || 'N/A'}</p>
				</div>
			</div>
		{/if}

		<!-- Account Routing -->
		{#if cp.other_account_routing_scheme || cp.other_account_routing_address}
			<div class="border-t border-surface-700 pt-6">
				<div class="flex items-center gap-2 mb-4">
					<Route class="size-5 text-secondary-500" />
					<h2 class="h4">Account Routing</h2>
				</div>
				<div class="space-y-2">
					<div class="p-3 rounded-lg bg-surface-800/50">
						<p class="text-xs text-surface-400">{cp.other_account_routing_scheme || 'Primary'}</p>
						<p class="font-mono text-sm">{cp.other_account_routing_address || 'N/A'}</p>
					</div>
					{#if cp.other_account_secondary_routing_scheme || cp.other_account_secondary_routing_address}
						<div class="p-3 rounded-lg bg-surface-800/50">
							<p class="text-xs text-surface-400">{cp.other_account_secondary_routing_scheme || 'Secondary'}</p>
							<p class="font-mono text-sm">{cp.other_account_secondary_routing_address || 'N/A'}</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Bespoke Fields -->
		{#if cp.bespoke && cp.bespoke.length > 0}
			<div class="border-t border-surface-700 pt-6">
				<h2 class="h4 mb-4">Custom Fields</h2>
				<div class="space-y-2">
					{#each cp.bespoke as field}
						<div class="p-3 rounded-lg bg-surface-800/50">
							<p class="text-xs text-surface-400">{field.key}</p>
							<p class="text-sm">{field.value}</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Raw JSON (collapsible) -->
		<details class="border-t border-surface-700 pt-6">
			<summary class="cursor-pointer text-sm text-surface-400 hover:text-surface-300">
				View Raw JSON
			</summary>
			<pre class="mt-4 p-4 bg-surface-900 rounded-lg overflow-x-auto text-xs">{JSON.stringify(cp, null, 2)}</pre>
		</details>
	</div>
</div>
