<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { page } from '$app/state';

  let { children, data } = $props();

  const navItems = [
    { href: '/', icon: '🕸️', label: 'つながり' },
    { href: '/card', icon: '📷', label: 'カード' },
    { href: '/calendar', icon: '📅', label: 'イベント' },
    { href: '/account', icon: '👤', label: 'アカウント' },
  ];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="h-screen overflow-y-auto bg-kaiko-bg text-kaiko-text pb-16">
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
