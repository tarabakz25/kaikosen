<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import logo from '$lib/assets/logo.webp';
  import { page, navigating } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';

  let { children, data } = $props();

  const navItems = [
    { href: '/', icon: '🕸️', label: 'つながり' },
    { href: '/card', icon: '📷', label: 'カード' },
    { href: '/calendar', icon: '📅', label: 'イベント' },
    { href: '/account', icon: '👤', label: 'アカウント' },
  ];

  // Global pending connection polling (QRスキャンされた側の自動リダイレクト)
  let pollIntervalId: ReturnType<typeof setInterval> | null = null;

  function startGlobalPoll() {
    if (pollIntervalId || !data.user) return;
    pollIntervalId = setInterval(async () => {
      if (page.url.pathname.startsWith('/connect')) return;
      const res = await fetch('/api/connections?pending=true');
      if (!res.ok) return;
      const body = await res.json();
      if (body.pending) {
        stopGlobalPoll();
        goto(`/connect?uid=${body.pending.userId}`);
      }
    }, 2000);
  }

  function stopGlobalPoll() {
    if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
  }

  onDestroy(stopGlobalPoll);

  onMount(() => {
     startGlobalPoll();

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

{#if navigating.to}
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-kaiko-bg/60 backdrop-blur-sm pointer-events-none">
    <div class="landolt-ring"></div>
  </div>
{/if}

<div class="h-screen overflow-y-auto bg-kaiko-bg text-kaiko-text pb-16">
  {#if data.user}
  <header class="sticky top-0 z-40 bg-kaiko-bg px-4 py-2">
    <img src={logo} alt="kaikosen" class="h-8 object-contain" />
  </header>
  {/if}
  {@render children()}
</div>

{#if data.user}
<nav class="fixed bottom-0 left-0 right-0 bg-kaiko-surface border-t border-kaiko-border z-50 shadow-sm">
  <div class="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
    {#each navItems as item}
      {@const isActive = page.url.pathname === item.href || (item.href !== '/' && page.url.pathname.startsWith(item.href))}
      <a href={item.href} class="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors {isActive ? 'text-kaiko-accent' : 'text-kaiko-muted hover:text-kaiko-text'}">
        <span class="text-xl">{item.icon}</span>
        <span class="text-xs">{item.label}</span>
      </a>
    {/each}
  </div>
</nav>
{/if}

<style>
  .landolt-ring {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 5px solid var(--color-kaiko-accent);
    border-right-color: transparent;
    animation: landolt-spin 0.75s linear infinite;
  }

  @keyframes landolt-spin {
    to { transform: rotate(360deg); }
  }
</style>
