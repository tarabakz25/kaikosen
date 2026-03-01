<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children, data } = $props();

	const navItems = [
		{ href: '/', icon: '🕸️', label: 'SENMYAKU' },
		{ href: '/card', icon: '📷', label: '交換' },
		{ href: '/calendar', icon: '📅', label: 'イベント' },
		{ href: '/account', icon: '👤', label: 'アカウント' }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="h-screen overflow-y-auto bg-kaiko-bg pb-16 text-kaiko-text">
	{@render children()}
</div>

{#if data.user}
	<nav
		class="fixed right-0 bottom-0 left-0 z-50 border-t border-kaiko-border bg-kaiko-surface shadow-sm"
	>
		<div class="mx-auto flex h-16 max-w-lg items-center justify-around px-4">
			{#each navItems as item}
				{@const isActive =
					page.url.pathname === item.href ||
					(item.href !== '/' && page.url.pathname.startsWith(item.href))}
				{@const isAccount = item.href === '/account'}
				{@const avatarUrl = data.userProfile?.avatarUrl ?? data.user?.image}
				<a
					href={item.href}
					class="flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition-colors {isActive
						? 'text-kaiko-accent'
						: 'text-kaiko-muted hover:text-kaiko-text'}"
				>
					{#if isAccount && avatarUrl}
						<img src={avatarUrl} alt="" class="h-6 w-6 rounded-full object-cover" />
					{:else}
						<span class="text-xl">{item.icon}</span>
					{/if}
					<span class="text-xs">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
{/if}
