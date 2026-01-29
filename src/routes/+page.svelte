<script lang="ts">
	import { Database, Play, Shield, Zap } from '@lucide/svelte';
	import type { RootLayoutData } from './+layout.server';

	let { data }: { data: RootLayoutData } = $props();

	let isAuthenticated = $derived(!!data.email);
</script>

<div class="flex h-full w-full items-center justify-center p-8">
	<div class="max-w-2xl text-center">
		<h1 class="h1 mb-6">OBP Sandbox Populator</h1>

		<p class="text-lg text-surface-300 mb-8">
			Quickly populate your Open Bank Project sandbox with test data including banks, accounts,
			counterparties, FX rates, and historical transactions.
		</p>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
			<div class="card p-4 preset-filled-surface-50-950">
				<Database class="size-8 mx-auto mb-2 text-secondary-500" />
				<h3 class="font-semibold mb-1">Banks & Accounts</h3>
				<p class="text-sm text-surface-400">Create multiple banks with accounts for testing</p>
			</div>

			<div class="card p-4 preset-filled-surface-50-950">
				<Shield class="size-8 mx-auto mb-2 text-secondary-500" />
				<h3 class="font-semibold mb-1">Counterparties</h3>
				<p class="text-sm text-surface-400">Add sample businesses as counterparties</p>
			</div>

			<div class="card p-4 preset-filled-surface-50-950">
				<Zap class="size-8 mx-auto mb-2 text-secondary-500" />
				<h3 class="font-semibold mb-1">FX Rates</h3>
				<p class="text-sm text-surface-400">Configure exchange rates between currencies</p>
			</div>

			<div class="card p-4 preset-filled-surface-50-950">
				<Play class="size-8 mx-auto mb-2 text-secondary-500" />
				<h3 class="font-semibold mb-1">Transactions</h3>
				<p class="text-sm text-surface-400">Generate historical transaction data</p>
			</div>
		</div>

		{#if isAuthenticated}
			<a href="/populate" class="btn preset-filled-primary-500 text-lg px-8 py-3">
				<Database class="size-5 mr-2" />
				Start Populating
			</a>
		{:else}
			<div class="space-y-4">
				<p class="text-surface-400">Please log in to start populating your sandbox.</p>
				<a href="/login" class="btn preset-filled-primary-500 text-lg px-8 py-3"> Login to Start </a>
			</div>
		{/if}
	</div>
</div>
