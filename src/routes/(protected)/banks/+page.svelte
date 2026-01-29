<script lang="ts">
	import type { PageData } from './$types';
	import { Building, ExternalLink } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="p-8 w-full max-w-4xl mx-auto">
	<h1 class="h1 mb-2">Banks</h1>
	<p class="text-surface-400 mb-8">
		{data.banks.length} bank{data.banks.length !== 1 ? 's' : ''} available
	</p>

	{#if data.banks.length === 0}
		<div class="card p-8 preset-filled-surface-50-950 text-center">
			<Building class="size-12 mx-auto mb-4 text-surface-400" />
			<p class="text-surface-400">No banks found.</p>
			<a href="/populate" class="btn preset-filled-primary-500 mt-4">Create Banks</a>
		</div>
	{:else}
		<div class="card preset-filled-surface-50-950 divide-y divide-surface-700">
			{#each data.banks as bank}
				<a
					href="/banks/{bank.bank_id}"
					class="p-4 flex items-center justify-between hover:bg-surface-800/50 transition-colors"
				>
					<div class="flex items-center gap-3">
						<Building class="size-6 text-secondary-500" />
						<div>
							<p class="font-semibold">{bank.full_name}</p>
							<p class="text-sm text-surface-400 font-mono">{bank.bank_id}</p>
						</div>
					</div>
					<ExternalLink class="size-4 text-surface-400" />
				</a>
			{/each}
		</div>
	{/if}
</div>
