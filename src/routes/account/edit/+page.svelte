<script lang="ts">
	import { goto } from '$app/navigation';
	import { PAST_CONTESTS_TITLE } from '$lib/contests';

	let { data } = $props();

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: currentYear - 1960 }, (_, i) => currentYear - i);

	let nickname = $state(data.userProfile?.nickname ?? '');
	let schoolName = $state(data.userProfile?.schoolName ?? '');
	let tagInput = $state('');
	let tags = $state<string[]>(data.userProfile?.tags ?? []);
	let pastContests = $state<string[]>(data.userProfile?.pastContests ?? []);
	let selectedContestId = $state(PAST_CONTESTS_TITLE[0].id);
	let selectedYear = $state(currentYear);
	let saving = $state(false);
	let message = $state('');

	function addPastContest() {
		const entry = `${selectedContestId}-${selectedYear}`;
		if (!pastContests.includes(entry)) {
			pastContests = [...pastContests, entry];
		}
	}

	function removePastContest(entry: string) {
		pastContests = pastContests.filter((c) => c !== entry);
	}

	function formatPastContest(entry: string): string {
		const i = entry.lastIndexOf('-');
		if (i === -1) return `${entry} (年不明)`;
		const contestId = entry.slice(0, i);
		const year = entry.slice(i + 1);
		const contest = PAST_CONTESTS_TITLE.find((c) => c.id === contestId);
		return `${contest?.title ?? contestId} (${year}年)`;
	}

	function addTag() {
		const t = tagInput.trim().replace(/^#/, '');
		if (t && !tags.includes(t)) {
			tags = [...tags, t];
		}
		tagInput = '';
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			addTag();
		}
	}

	async function save() {
		saving = true;
		message = '';
		try {
			const res = await fetch('/api/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nickname, schoolName, tags, pastContests })
			});
			if (res.ok) {
				goto('/account');
			} else {
				message = '保存に失敗しました';
			}
		} catch {
			message = 'エラーが発生しました';
		}
		saving = false;
	}
</script>

<div class="mx-auto max-w-lg px-4 py-8">
	<div class="mb-6 flex items-center gap-3">
		<a href="/account" class="text-kaiko-muted transition-colors hover:text-kaiko-text">← 戻る</a>
		<h1 class="text-2xl font-bold text-kaiko-text">プロフィール編集</h1>
	</div>

	<div class="space-y-4">
		<div>
			<label class="mb-1 block text-sm font-medium text-kaiko-muted">ニックネーム</label>
			<input
				bind:value={nickname}
				type="text"
				placeholder="例: 田中太郎"
				class="w-full rounded-lg border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-kaiko-muted">高専名</label>
			<input
				bind:value={schoolName}
				type="text"
				placeholder="例: 東京高専"
				class="w-full rounded-lg border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-kaiko-muted">タグ（スキル・興味）</label>
			<div class="mb-2 flex flex-wrap gap-2">
				{#each tags as tag}
					<span
						class="flex items-center gap-1 rounded-full bg-kaiko-accent-muted px-3 py-1 text-sm text-kaiko-accent-dark"
					>
						#{tag}
						<button onclick={() => removeTag(tag)} class="ml-1 hover:text-kaiko-text">×</button>
					</span>
				{/each}
			</div>
			<input
				bind:value={tagInput}
				onkeydown={handleTagKeydown}
				onblur={addTag}
				type="text"
				placeholder="タグを入力してEnter (例: Rust, ロボット)"
				class="w-full rounded-lg border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		<div>
			<p class="mb-2 text-sm font-medium text-kaiko-muted">参加したことのあるコンテスト</p>
			<div class="mb-3 flex flex-wrap gap-2">
				<select
					bind:value={selectedContestId}
					class="rounded-lg border border-kaiko-border bg-kaiko-surface px-3 py-2 text-sm text-kaiko-text focus:border-kaiko-accent focus:outline-none"
				>
					{#each PAST_CONTESTS_TITLE as contest}
						<option value={contest.id}>{contest.title}</option>
					{/each}
				</select>
				<select
					bind:value={selectedYear}
					class="rounded-lg border border-kaiko-border bg-kaiko-surface px-3 py-2 text-sm text-kaiko-text focus:border-kaiko-accent focus:outline-none"
				>
					{#each years as y}
						<option value={y}>{y}年</option>
					{/each}
				</select>
				<button
					type="button"
					onclick={addPastContest}
					class="rounded-lg bg-kaiko-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-kaiko-accent-hover"
				>
					追加
				</button>
			</div>
			<div class="flex flex-col gap-2">
				{#each pastContests as entry}
					<div
						class="flex items-center justify-between rounded-xl border border-kaiko-border bg-kaiko-surface px-4 py-3"
					>
						<span class="text-sm text-kaiko-text">{formatPastContest(entry)}</span>
						<button
							type="button"
							onclick={() => removePastContest(entry)}
							class="text-kaiko-muted transition-colors hover:text-red-500"
						>
							×
						</button>
					</div>
				{/each}
			</div>
		</div>

		{#if message}
			<p class="text-sm text-red-500">{message}</p>
		{/if}

		<button
			onclick={save}
			disabled={saving || !nickname || !schoolName}
			class="w-full rounded-lg bg-kaiko-accent py-3 font-semibold text-white transition-colors hover:bg-kaiko-accent-hover disabled:bg-kaiko-border disabled:text-kaiko-muted"
		>
			{saving ? '保存中...' : '保存する'}
		</button>
	</div>
</div>
