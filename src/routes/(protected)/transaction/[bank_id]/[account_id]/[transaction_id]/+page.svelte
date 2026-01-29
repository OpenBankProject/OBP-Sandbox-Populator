<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowLeft, ArrowRight, Calendar, CreditCard, Hash, FileText } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const txn = data.transaction;
</script>

<div class="p-8 w-full max-w-4xl mx-auto">
	<div class="mb-6">
		<a href="/populate" class="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm">
			<ArrowLeft class="size-4" />
			Back to Populate
		</a>
	</div>

	<h1 class="h1 mb-2">Transaction Detail</h1>
	<p class="text-surface-400 mb-8">
		Transaction <code class="text-xs bg-surface-700 px-2 py-1 rounded">{data.transaction_id}</code>
	</p>

	<div class="card p-6 preset-filled-surface-50-950 space-y-6">
		<!-- Transaction ID -->
		<div class="flex items-start gap-3">
			<Hash class="size-5 text-secondary-500 mt-0.5" />
			<div>
				<p class="text-sm text-surface-400">Transaction ID</p>
				<p class="font-mono text-sm">{txn.id}</p>
			</div>
		</div>

		<!-- Value -->
		<div class="flex items-start gap-3">
			<CreditCard class="size-5 text-secondary-500 mt-0.5" />
			<div>
				<p class="text-sm text-surface-400">Amount</p>
				<p class="text-2xl font-semibold text-primary-400">
					{txn.details?.value?.amount} {txn.details?.value?.currency}
				</p>
			</div>
		</div>

		<!-- Description -->
		{#if txn.details?.description}
			<div class="flex items-start gap-3">
				<FileText class="size-5 text-secondary-500 mt-0.5" />
				<div>
					<p class="text-sm text-surface-400">Description</p>
					<p>{txn.details.description}</p>
				</div>
			</div>
		{/if}

		<!-- Dates -->
		<div class="flex items-start gap-3">
			<Calendar class="size-5 text-secondary-500 mt-0.5" />
			<div class="grid grid-cols-2 gap-4">
				<div>
					<p class="text-sm text-surface-400">Posted</p>
					<p>{txn.details?.posted ? new Date(txn.details.posted).toLocaleString() : 'N/A'}</p>
				</div>
				<div>
					<p class="text-sm text-surface-400">Completed</p>
					<p>{txn.details?.completed ? new Date(txn.details.completed).toLocaleString() : 'N/A'}</p>
				</div>
			</div>
		</div>

		<!-- Accounts -->
		<div class="border-t border-surface-700 pt-6">
			<h2 class="h4 mb-4">Accounts</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
				<!-- This Account -->
				<div class="p-4 rounded-lg bg-surface-800/50">
					<p class="text-xs text-surface-400 mb-1">This Account</p>
					<p class="font-mono text-sm break-all">{txn.this_account?.id || 'N/A'}</p>
					{#if txn.this_account?.bank_routing}
						<p class="text-xs text-surface-500 mt-1">
							{txn.this_account.bank_routing.scheme}: {txn.this_account.bank_routing.address}
						</p>
					{/if}
				</div>

				<!-- Arrow -->
				<div class="flex justify-center">
					<ArrowRight class="size-6 text-tertiary-500" />
				</div>

				<!-- Other Account -->
				<div class="p-4 rounded-lg bg-surface-800/50">
					<p class="text-xs text-surface-400 mb-1">Other Account</p>
					<p class="font-mono text-sm break-all">{txn.other_account?.id || 'N/A'}</p>
					{#if txn.other_account?.holder?.name}
						<p class="text-xs text-surface-500 mt-1">{txn.other_account.holder.name}</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Type -->
		{#if txn.details?.type}
			<div class="border-t border-surface-700 pt-6">
				<p class="text-sm text-surface-400">Transaction Type</p>
				<p class="font-mono">{txn.details.type}</p>
			</div>
		{/if}

		<!-- Raw JSON (collapsible) -->
		<details class="border-t border-surface-700 pt-6">
			<summary class="cursor-pointer text-sm text-surface-400 hover:text-surface-300">
				View Raw JSON
			</summary>
			<pre class="mt-4 p-4 bg-surface-900 rounded-lg overflow-x-auto text-xs">{JSON.stringify(txn, null, 2)}</pre>
		</details>
	</div>
</div>
