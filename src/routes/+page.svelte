<script lang="ts">
	import { Database, Play, Zap } from '@lucide/svelte';
	import type { RootLayoutData } from './+layout.server';

	let { data }: { data: RootLayoutData } = $props();

	let isAuthenticated = $derived(!!data.email);
</script>

<div class="flex h-full w-full items-center justify-center p-8">
	<div class="w-full text-center">
		<h1 class="h1 mb-6">OBP Sandbox Populator</h1>

		<p class="text-lg text-surface-300 mb-8">
			Quickly populate your Open Bank Project sandbox with test data including banks, accounts,
			counterparties, FX rates, and historical transactions.
		</p>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
			<a href="/banks" class="card p-4 preset-filled-surface-50-950 hover:preset-filled-surface-100-900 transition-colors">
				<Zap class="size-8 mx-auto mb-2 text-secondary-500" />
				<h3 class="font-semibold mb-1">Banks</h3>
				<p class="text-sm text-surface-400">View banks and their FX rates</p>
			</a>

			<a href="/accounts" class="card p-4 preset-filled-surface-50-950 hover:preset-filled-surface-100-900 transition-colors">
				<Database class="size-8 mx-auto mb-2 text-secondary-500" />
				<h3 class="font-semibold mb-1">Accounts</h3>
				<p class="text-sm text-surface-400">View my accounts across all banks</p>
			</a>

			<a href="/transactions" class="card p-4 preset-filled-surface-50-950 hover:preset-filled-surface-100-900 transition-colors">
				<Play class="size-8 mx-auto mb-2 text-secondary-500" />
				<h3 class="font-semibold mb-1">Transactions</h3>
				<p class="text-sm text-surface-400">View transactions and transaction requests</p>
			</a>
		</div>

		{#if isAuthenticated}
			<a href="/populate" class="btn preset-filled-primary-500 text-lg px-8 py-3">
				<Database class="size-5 mr-2" />
				Populate
			</a>
		{:else}
			<div class="space-y-4">
				<p class="text-surface-400">Please log in to start populating your sandbox.</p>
				<a href="/login" class="btn preset-filled-primary-500 text-lg px-8 py-3"> Login to Start </a>
			</div>
		{/if}
	</div>
</div>
