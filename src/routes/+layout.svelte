<script lang="ts">
	import '../app.css';
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/state';

	// Lucide Icons
	import { Home, Database, LogOut, User, Menu } from '@lucide/svelte';

	import { env } from '$env/dynamic/public';
	import type { RootLayoutData } from './+layout.server';

	let { data, children } = $props();

	let isAuthenticated = $state(false);
	let displayMode: 'dark' | 'light' = $state('dark');

	if (data.email) {
		isAuthenticated = true;
	} else {
		isAuthenticated = false;
	}

	// Menu items
	let menuItems = $state([
		{
			label: 'Home',
			href: '/',
			iconComponent: Home
		},
		{
			label: 'Populate Sandbox',
			href: '/populate',
			iconComponent: Database,
			requiresAuth: true
		}
	]);

	// Default logo URL
	const defaultLogoUrl = '/logo2x-1.png';
	const defaultDarkLogoUrl = '/obp_logo.png';
	let lightLogoUrl = $state(env.PUBLIC_LOGO_URL || defaultLogoUrl);
	let darkLogoUrl = $state(env.PUBLIC_DARK_LOGO_URL || defaultDarkLogoUrl);

	let logoUrl = $derived.by(() => {
		return displayMode === 'dark' ? darkLogoUrl : lightLogoUrl;
	});

	let logoWidth = $state(env.PUBLIC_LOGO_WIDTH || '100%');
</script>

<div
	class="grid h-screen w-full grid-cols-[auto_1fr] divide-x divide-solid divide-surface-100-900 overflow-hidden"
>
	<div class="h-full">
		<Navigation
			layout="sidebar"
			class="grid h-full grid-rows-[auto_1fr_auto] gap-4 preset-filled-primary-50-950"
		>
			<Navigation.Header class="p-4">
				<a href="/" class="flex w-full items-center justify-center">
					<img class="block" style="width: {logoWidth};" src={logoUrl} alt="OBP Logo" />
				</a>
			</Navigation.Header>

			<Navigation.Content class="">
				<!-- Main Menu Group -->
				<Navigation.Group>
					<Navigation.Menu class="flex flex-col gap-2 px-2">
						{#each menuItems as item}
							{@const Icon = item.iconComponent}
							{#if !item.requiresAuth || isAuthenticated}
								<a
									href={item.href}
									class="btn w-full justify-start gap-3 px-2 hover:preset-tonal"
									class:preset-filled-primary-50-950={page.url.pathname === item.href}
									class:border={page.url.pathname === item.href}
									class:border-solid-secondary-500={page.url.pathname === item.href}
									title={item.label}
									aria-label={item.label}
								>
									<Icon class="size-5" />
									<span>{item.label}</span>
								</a>
							{/if}
						{/each}
					</Navigation.Menu>
				</Navigation.Group>
			</Navigation.Content>

			<Navigation.Footer class="p-4">
				<div class="flex flex-wrap items-center gap-3 text-xs text-surface-800-200">
					<a
						href="https://github.com/OpenBankProject"
						class="flex items-center gap-2 hover:text-tertiary-400"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img
							class="h-4"
							alt="github logo"
							src={displayMode === 'dark' ? '/github-mark-white.svg' : '/github-mark.svg'}
						/>
						GitHub
					</a>
					<span class="text-surface-500">|</span>
					<span> TESOBE 2011-2025 </span>
				</div>
			</Navigation.Footer>
		</Navigation>
	</div>
	<div
		class="h-full bg-conic-250 from-30% via-40% to-50% dark:from-primary-950 dark:via-secondary-500/70 dark:to-primary-950"
	>
		<div class="flex flex-col backdrop-blur-2xl" style="height: calc(100vh - 80px);">
			<div
				class="bg-opacity-0 flex items-center justify-end p-4"
				style="height: 80px; flex-shrink: 0;"
			>
				{#if isAuthenticated}
					<span class="mx-4 flex items-center gap-2 text-surface-200">
						<User class="size-4" />
						{data.username}
					</span>
					<button type="button" class="btn preset-outlined-primary-500">
						<a href="/logout" class="flex items-center gap-2">
							<LogOut class="size-4" />
							Logout
						</a>
					</button>
				{:else}
					<button type="button" class="btn preset-filled-surface-950-50">
						<a href="/login">Login</a>
					</button>
				{/if}
			</div>

			<main class="flex flex-col overflow-auto" style="height: calc(100vh - 80px);">
				{@render children()}
			</main>
		</div>
	</div>
</div>
