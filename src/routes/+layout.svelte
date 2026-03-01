<script lang="ts">

  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { page } from '$app/state';
  import { onMount } from 'svelte';

	let { children, data } = $props();


  const navItems = [
    { href: '/', icon: '🕸️', label: 'つながり' },
    { href: '/card', icon: '📷', label: 'カード' },
    { href: '/calendar', icon: '📅', label: 'イベント' },
    { href: '/account', icon: '👤', label: 'アカウント' },
  ]; 
  
  onMount(() => {
     const d = document;
     const config = {
       kitId: 'zkw7npd',
       scriptTimeout: 3000,
       async: true,
     };
 
     const h = d.documentElement;
     const t = setTimeout(() => {
       h.className = h.className.replace(/\bwf-loading\b/g, '') + ' wf-inactive';
     }, config.scriptTimeout);
 
     const tk = d.createElement('script');
     const legacyTk = tk as HTMLScriptElement & {
       onreadystatechange?: ((this: HTMLScriptElement & { readyState?: string }, ev: Event) => unknown) | null;
       readyState?: string;
     };
     let f = false;
     const s = d.getElementsByTagName('script')[0];
     let a: string | undefined;
 
     h.className += ' wf-loading';
     tk.src = `https://use.typekit.net/${config.kitId}.js`;
     tk.async = true;
     const handleLoad = function (this: HTMLScriptElement & { readyState?: string }) {
       a = this.readyState;
       if (f || (a && a !== 'complete' && a !== 'loaded')) return;
       f = true;
       clearTimeout(t);
       try {
         (window as Window & { Typekit?: { load: (cfg: unknown) => void } }).Typekit?.load(config);
       } catch {
         // no-op
       }
     };
     tk.addEventListener('load', () => handleLoad.call(legacyTk));
     legacyTk.onreadystatechange = function () {
       handleLoad.call(legacyTk);
     };
 
     s.parentNode?.insertBefore(tk, s);
   });
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
					{:else if item.logo}
						<img src={item.logo} alt="SENMYAKU" class="h-6 w-6 object-contain" />
					{:else}
						<span class="text-xl">{item.icon}</span>
					{/if}
					<span class="text-xs">{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
{/if}
