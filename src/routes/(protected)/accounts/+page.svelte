<script lang="ts">
	import type { PageData } from './$types';
	import { Wallet, Building, ExternalLink } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Group accounts by bank
	const accountsByBank = $derived(() => {
		const grouped: Record<string, typeof data.accounts> = {};
		for (const account of data.accounts) {
			const bankId = account.bank_id;
			if (!grouped[bankId]) {
				grouped[bankId] = [];
			}
			grouped[bankId].push(account);
		}
		return grouped;
	});
</script>

<div class="p-8 w-full max-w-4xl mx-auto">
	<h1 class="h1 mb-2">My Accounts</h1>
	<p class="text-surface-400 mb-8">
		{data.accounts.length} account{data.accounts.length !== 1 ? 's' : ''} across {Object.keys(accountsByBank()).length} bank{Object.keys(accountsByBank()).length !== 1 ? 's' : ''}
	</p>

	{#if data.accounts.length === 0}
		<div class="card p-8 preset-filled-surface-50-950 text-center">
			<Wallet class="size-12 mx-auto mb-4 text-surface-400" />
			<p class="text-surface-400">No accounts found.</p>
			<a href="/populate" class="btn preset-filled-primary-500 mt-4">Create Accounts</a>
		</div>
	{:else}
		<div class="space-y-6">
			{#each Object.entries(accountsByBank()) as [bankId, accounts]}
				<div class="card preset-filled-surface-50-950">
					<div class="p-4 border-b border-surface-700 flex items-center gap-2">
						<Building class="size-5 text-secondary-500" />
						<h2 class="font-semibold">{bankId}</h2>
						<span class="text-sm text-surface-400">({accounts.length} account{accounts.length !== 1 ? 's' : ''})</span>
					</div>
					<div class="divide-y divide-surface-700">
						{#each accounts as account}
							<a
								href="/account/{bankId}/{account.id}"
								class="p-4 flex items-center justify-between hover:bg-surface-800/50 transition-colors"
							>
								<div class="flex items-center gap-3">
									<Wallet class="size-5 text-primary-400" />
									<div>
										<p class="font-medium">{account.label || account.id}</p>
										<p class="text-xs text-surface-400 font-mono">{account.id}</p>
									</div>
								</div>
								<div class="flex items-center gap-4">
									{#if account.balance}
										<span class="text-lg font-semibold text-primary-400">
											{account.balance.amount} {account.balance.currency}
										</span>
									{/if}
									<ExternalLink class="size-4 text-surface-400" />
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
