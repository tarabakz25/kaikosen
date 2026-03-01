<script lang="ts">
	import { goto } from '$app/navigation';

	let { data } = $props();

	let aliasInput = $state('');
	let submitting = $state(false);

	async function submitAlias() {
		if (!data.targetUserId || !aliasInput.trim()) return;
		submitting = true;
		const res = await fetch('/api/connections/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ targetUserId: data.targetUserId, alias: aliasInput.trim() })
		});
		submitting = false;
		if (res.ok) {
			goto('/');
		}
	}
</script>

<svelte:head>
	<title>二つ名を登録 - kaikosen</title>
</svelte:head>

<div class="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-12">
	<h1 class="text-xl font-bold text-kaiko-text">QRコードをスキャンしました</h1>
	<p class="text-sm text-kaiko-muted">この人に二つ名（あだ名）をつけてください</p>

	<div class="w-full max-w-sm rounded-xl border border-kaiko-border bg-kaiko-surface p-6">
		{#if data.targetProfile}
			<div class="mb-4 flex items-center gap-3 rounded-lg bg-kaiko-surface-alt p-3">
				{#if data.targetProfile.avatarUrl}
					<img
						src={data.targetProfile.avatarUrl}
						alt=""
						class="h-12 w-12 rounded-full object-cover"
					/>
				{:else}
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-kaiko-accent text-lg font-bold text-white"
					>
						{data.targetProfile.nickname?.[0] ?? '?'}
					</div>
				{/if}
				<div>
					<p class="font-medium text-kaiko-text">{data.targetProfile.nickname}</p>
					<p class="text-sm text-kaiko-muted">{data.targetProfile.schoolName}</p>
				</div>
			</div>
		{/if}
		<input
			bind:value={aliasInput}
			type="text"
			placeholder="例: ロボット部の佐藤くん"
			class="mb-4 w-full rounded-lg border border-kaiko-border bg-kaiko-bg px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
		/>
		<div class="flex gap-3">
			<a
				href="/card"
				class="flex-1 rounded-xl border border-kaiko-border py-3 text-center text-kaiko-muted transition-colors hover:text-kaiko-text"
			>
				キャンセル
			</a>
			<button
				onclick={submitAlias}
				disabled={!aliasInput.trim() || submitting}
				class="flex-1 rounded-xl bg-kaiko-accent py-3 font-semibold text-white transition-colors hover:bg-kaiko-accent-hover disabled:bg-kaiko-border disabled:text-kaiko-muted"
			>
				{submitting ? '登録中...' : '登録する'}
			</button>
		</div>
	</div>
</div>
