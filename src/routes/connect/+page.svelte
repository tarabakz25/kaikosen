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
		if (!targetUserId) {
			goto('/');
			return;
		}
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

<div class="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-12">
	{#if scannedProfile}
		<div class="text-center">
			<div
				class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-kaiko-accent text-3xl font-bold text-white"
			>
				{scannedProfile.nickname[0]}
			</div>
			<h1 class="text-2xl font-bold text-kaiko-text">{scannedProfile.nickname}</h1>
			<p class="text-kaiko-muted">{scannedProfile.schoolName}</p>
			<div class="mt-2 flex flex-wrap justify-center gap-1">
				{#each scannedProfile.tags as tag}
					<span
						class="rounded-full bg-kaiko-accent-muted px-2 py-0.5 text-xs text-kaiko-accent-dark"
						>#{tag}</span
					>
				{/each}
			</div>
		</div>

		<div class="w-full">
			<label class="mb-1 block text-sm font-medium text-kaiko-muted">二つ名（あだ名）</label>
			<input
				bind:value={alias}
				type="text"
				placeholder="例: 声がよく通る"
				class="w-full rounded-lg border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		{#if error}
			<p class="text-sm text-red-500">{error}</p>
		{/if}

		<button
			onclick={connect}
			disabled={!alias.trim() || connecting}
			class="w-full rounded-xl bg-kaiko-accent py-3 font-semibold text-white hover:bg-kaiko-accent-hover disabled:bg-kaiko-border disabled:text-kaiko-muted"
		>
			{connecting ? '追加中...' : '繋がりを追加する'}
		</button>

		<a href="/" class="text-sm text-kaiko-muted hover:text-kaiko-text">キャンセル</a>
	{:else}
		<p class="text-kaiko-muted">読み込み中...</p>
	{/if}
</div>
