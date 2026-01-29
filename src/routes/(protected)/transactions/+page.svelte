<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { ArrowDownLeft, ArrowUpRight, Wallet, ExternalLink, ChevronDown } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	function getTransactionUrl(bankId: string, accountId: string, transactionId: string) {
		return `/transaction/${bankId}/${accountId}/${transactionId}`;
	}

	function formatDate(dateString: string | undefined) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function handleAccountSelect(event: Event) {
		const select = event.target as HTMLSelectElement;
		const value = select.value;
		if (value) {
			const [bankId, accountId] = value.split('|');
			goto(`/transactions?bank=${bankId}&account=${accountId}`);
		} else {
			goto('/transactions');
		}
	}

	// Split transactions into incoming and outgoing
	// Incoming: positive amounts (money coming in)
	// Outgoing: negative amounts (money going out)
	const incomingTransactions = $derived(
		data.transactions.filter((txn) => {
			const amount = parseFloat(txn.details?.value?.amount || '0');
			return amount >= 0;
		})
	);

	const outgoingTransactions = $derived(
		data.transactions.filter((txn) => {
			const amount = parseFloat(txn.details?.value?.amount || '0');
			return amount < 0;
		})
	);

	const currentSelectValue = $derived(
		data.selectedAccount ? `${data.selectedAccount.bank_id}|${data.selectedAccount.id}` : ''
	);

	// Find the bank_id for an account by looking it up in the user's accounts
	function getAccountLink(otherAccount: { id?: string; bank_id?: string } | undefined): { bankId: string; accountId: string } | null {
		if (!otherAccount?.id) return null;

		// First try direct bank_id if available
		if (otherAccount.bank_id) {
			return { bankId: otherAccount.bank_id, accountId: otherAccount.id };
		}

		// Otherwise look up in user's accounts
		const found = data.accounts.find((a) => a.id === otherAccount.id);
		if (found) {
			return { bankId: found.bank_id, accountId: found.id };
		}

		return null;
	}
</script>

<div class="p-8 w-full max-w-6xl mx-auto">
	<h1 class="h1 mb-2 text-center">Transactions</h1>
	<p class="text-surface-400 mb-6 text-center">Select an account to view its transactions</p>

	<!-- Account Selector - Centered -->
	<div class="mb-8 flex flex-col items-center">
		<label for="account-select" class="block text-sm text-surface-400 mb-2">Select Account</label>
		<div class="relative w-full max-w-md">
			<select
				id="account-select"
				class="w-full p-3 pr-10 rounded-lg bg-surface-800 border border-surface-600 text-surface-50 appearance-none cursor-pointer"
				onchange={handleAccountSelect}
				value={currentSelectValue}
			>
				<option value="">-- Select an account --</option>
				{#each data.accounts as account}
					<option value="{account.bank_id}|{account.id}">
						{account.label || account.id} ({account.bank_id})
						{#if account.balance}
							- {account.balance.amount} {account.balance.currency}
						{/if}
					</option>
				{/each}
			</select>
			<ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-surface-400 pointer-events-none" />
		</div>

		{#if data.selectedAccount}
			<!-- Selected Account Info - Centered below dropdown -->
			<div class="card p-4 preset-filled-surface-50-950 mt-4 w-full max-w-md">
				<div class="flex items-center justify-center gap-3">
					<Wallet class="size-6 text-secondary-500" />
					<div class="text-center">
						<p class="font-semibold">{data.selectedAccount.label || 'Unnamed Account'}</p>
						<p class="text-sm text-surface-400 font-mono">{data.selectedAccount.id}</p>
						{#if data.selectedAccount.balance}
							<p class="text-xl font-semibold text-primary-400 mt-1">
								{data.selectedAccount.balance.amount} {data.selectedAccount.balance.currency}
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>

	{#if data.accounts.length === 0}
		<div class="card p-8 preset-filled-surface-50-950 text-center">
			<Wallet class="size-12 mx-auto mb-4 text-surface-400" />
			<p class="text-surface-400">No accounts found.</p>
			<a href="/populate" class="btn preset-filled-primary-500 mt-4">Populate Sandbox</a>
		</div>
	{:else if data.selectedAccount}

		<!-- Transactions Split View -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<!-- Incoming (Left) -->
			<div class="card preset-filled-surface-50-950">
				<div class="p-4 border-b border-surface-700 flex items-center gap-2">
					<ArrowDownLeft class="size-5 text-success-500" />
					<h2 class="font-semibold">Incoming</h2>
					<span class="text-sm text-surface-400">({incomingTransactions.length})</span>
				</div>
				<div class="divide-y divide-surface-700 max-h-[500px] overflow-y-auto">
					{#if incomingTransactions.length === 0}
						<div class="p-6 text-center text-surface-400">
							<p>No incoming transactions</p>
						</div>
					{:else}
						{#each incomingTransactions as txn}
							{@const link = getAccountLink(txn.other_account)}
							<div class="p-4 hover:bg-surface-800/50 transition-colors group">
								<a
									href={getTransactionUrl(data.selectedAccount.bank_id, data.selectedAccount.id, txn.id)}
									class="flex items-center justify-between"
								>
									<div class="min-w-0 flex-1">
										<p class="text-sm truncate group-hover:text-primary-400 transition-colors">
											{txn.details?.description || 'No description'}
										</p>
										<p class="text-xs text-surface-400">{formatDate(txn.details?.completed)}</p>
									</div>
									<div class="flex items-center gap-2 ml-3">
										<span class="font-semibold text-success-400">
											+{txn.details?.value?.amount} {txn.details?.value?.currency}
										</span>
										<ExternalLink class="size-4 text-surface-500 group-hover:text-primary-400 transition-colors" />
									</div>
								</a>
							{#if link}
								<div class="mt-2 text-xs">
									<span class="text-surface-500">From: </span>
									<a
										href="/transactions?bank={link.bankId}&account={link.accountId}"
										class="font-mono text-primary-400 hover:text-primary-300 hover:underline"
										onclick={(e) => e.stopPropagation()}
									>
										{link.accountId}
									</a>
								</div>
							{:else if txn.other_account?.id}
								<div class="mt-2 text-xs">
									<span class="text-surface-500">From: </span>
									<span class="font-mono text-surface-400">{txn.other_account.id}</span>
								</div>
							{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Outgoing (Right) -->
			<div class="card preset-filled-surface-50-950">
				<div class="p-4 border-b border-surface-700 flex items-center gap-2">
					<ArrowUpRight class="size-5 text-error-500" />
					<h2 class="font-semibold">Outgoing</h2>
					<span class="text-sm text-surface-400">({outgoingTransactions.length})</span>
				</div>
				<div class="divide-y divide-surface-700 max-h-[500px] overflow-y-auto">
					{#if outgoingTransactions.length === 0}
						<div class="p-6 text-center text-surface-400">
							<p>No outgoing transactions</p>
						</div>
					{:else}
						{#each outgoingTransactions as txn}
							{@const link = getAccountLink(txn.other_account)}
							<div class="p-4 hover:bg-surface-800/50 transition-colors group">
								<a
									href={getTransactionUrl(data.selectedAccount.bank_id, data.selectedAccount.id, txn.id)}
									class="flex items-center justify-between"
								>
									<div class="min-w-0 flex-1">
										<p class="text-sm truncate group-hover:text-primary-400 transition-colors">
											{txn.details?.description || 'No description'}
										</p>
										<p class="text-xs text-surface-400">{formatDate(txn.details?.completed)}</p>
									</div>
									<div class="flex items-center gap-2 ml-3">
										<span class="font-semibold text-error-400">
											{txn.details?.value?.amount} {txn.details?.value?.currency}
										</span>
										<ExternalLink class="size-4 text-surface-500 group-hover:text-primary-400 transition-colors" />
									</div>
								</a>
							{#if link}
								<div class="mt-2 text-xs text-right">
									<span class="text-surface-500">To: </span>
									<a
										href="/transactions?bank={link.bankId}&account={link.accountId}"
										class="font-mono text-primary-400 hover:text-primary-300 hover:underline"
										onclick={(e) => e.stopPropagation()}
									>
										{link.accountId}
									</a>
								</div>
							{:else if txn.other_account?.id}
								<div class="mt-2 text-xs text-right">
									<span class="text-surface-500">To: </span>
									<span class="font-mono text-surface-400">{txn.other_account.id}</span>
								</div>
							{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="card p-8 preset-filled-surface-50-950 text-center">
			<Wallet class="size-12 mx-auto mb-4 text-surface-400" />
			<p class="text-surface-400">Select an account from the dropdown above to view transactions.</p>
		</div>
	{/if}
</div>
