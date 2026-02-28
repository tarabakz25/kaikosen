<script lang="ts">
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Profile } from '$lib/types';

  let scannedProfile = $state<Profile | null>(null);
  let alias = $state('');
  let connecting = $state(false);
  let error = $state('');

  const targetUserId = page.url.searchParams.get('uid');

  onMount(async () => {
    if (!targetUserId) { goto('/'); return; }
    const res = await fetch(`/api/profile/${targetUserId}`);
    if (res.ok) scannedProfile = await res.json();
    else goto('/');
  });

  async function connect() {
    if (!alias.trim() || !targetUserId) return;
    connecting = true;
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, alias: alias.trim() })
    });
    connecting = false;
    if (res.ok) goto('/');
    else error = '接続に失敗しました';
  }
</script>

<div class="max-w-lg mx-auto px-4 py-12 flex flex-col items-center gap-6">
  {#if scannedProfile}
    <div class="text-center">
      <div class="w-20 h-20 rounded-full bg-indigo-700 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
        {scannedProfile.nickname[0]}
      </div>
      <h1 class="text-2xl font-bold text-white">{scannedProfile.nickname}</h1>
      <p class="text-gray-400">{scannedProfile.schoolName}</p>
      <div class="flex flex-wrap justify-center gap-1 mt-2">
        {#each scannedProfile.tags as tag}
          <span class="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">#{tag}</span>
        {/each}
      </div>
    </div>

    <div class="w-full">
      <label class="block text-sm font-medium text-gray-300 mb-1">二つ名（あだ名）</label>
      <input
        bind:value={alias}
        type="text"
        placeholder="例: ロボット部の先輩"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
    </div>

    {#if error}
      <p class="text-red-400 text-sm">{error}</p>
    {/if}

    <button
      onclick={connect}
      disabled={!alias.trim() || connecting}
      class="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-semibold"
    >
      {connecting ? '追加中...' : '繋がりを追加する'}
    </button>

    <a href="/" class="text-gray-500 text-sm hover:text-gray-300">キャンセル</a>
  {:else}
    <p class="text-gray-400">読み込み中...</p>
  {/if}
</div>
