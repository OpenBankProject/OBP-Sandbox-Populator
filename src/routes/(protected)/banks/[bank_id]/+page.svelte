<script lang="ts">
	import type { PageData } from './$types';
	import { ArrowLeft, Building, ArrowRightLeft, TrendingUp } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="p-8 w-full max-w-4xl mx-auto">
	<div class="mb-6">
		<a href="/banks" class="text-primary-400 hover:text-primary-300 flex items-center gap-1 text-sm">
			<ArrowLeft class="size-4" />
			Back to Banks
		</a>
	</div>

	{#if data.bank}
		<div class="flex items-center gap-3 mb-2">
			<Building class="size-8 text-secondary-500" />
			<h1 class="h1 font-mono">{data.bank_id}</h1>
		</div>
		<p class="text-surface-400 mb-8">{data.bank.full_name}</p>

		<div class="card p-6 preset-filled-surface-50-950 mb-6">
			<h2 class="h3 mb-4 flex items-center gap-2">
				<ArrowRightLeft class="size-5 text-secondary-500" />
				FX Rates
			</h2>

			{#if data.fxRates.length === 0}
				<p class="text-surface-400">No FX rates configured for this bank.</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b border-surface-700">
								<th class="text-left py-2 px-3 text-sm text-surface-400">From</th>
								<th class="text-left py-2 px-3 text-sm text-surface-400">To</th>
								<th class="text-right py-2 px-3 text-sm text-surface-400">Rate</th>
								<th class="text-right py-2 px-3 text-sm text-surface-400">Inverse</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-surface-700">
							{#each data.fxRates as rate}
								<tr class="hover:bg-surface-800/50">
									<td class="py-2 px-3 font-mono">{rate.from_currency_code}</td>
									<td class="py-2 px-3 font-mono">{rate.to_currency_code}</td>
									<td class="py-2 px-3 text-right font-semibold text-primary-400">
										{rate.conversion_value?.toFixed(6) || '-'}
									</td>
									<td class="py-2 px-3 text-right text-surface-400">
										{rate.inverse_conversion_value?.toFixed(6) || '-'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		{#if data.currencies.length > 0}
			<div class="card p-6 preset-filled-surface-50-950">
				<h2 class="h3 mb-4 flex items-center gap-2">
					<TrendingUp class="size-5 text-secondary-500" />
					Supported Currencies
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each data.currencies as currency}
						<span class="px-3 py-1 bg-surface-700 rounded font-mono text-sm">{currency}</span>
					{/each}
				</div>
			</div>
		{/if}
	{:else}
		<div class="card p-8 preset-filled-surface-50-950 text-center">
			<Building class="size-12 mx-auto mb-4 text-surface-400" />
			<p class="text-surface-400">Bank not found.</p>
			<a href="/banks" class="btn preset-filled-primary-500 mt-4">Back to Banks</a>
		</div>
	{/if}
</div>
