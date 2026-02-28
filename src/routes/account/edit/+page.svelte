<script lang="ts">
	import { goto } from '$app/navigation';
	import { PAST_CONTESTS } from '$lib/contests';

	let { data } = $props();

	let nickname = $state(data.userProfile?.nickname ?? '');
	let schoolName = $state(data.userProfile?.schoolName ?? '');
	let tagInput = $state('');
	let tags = $state<string[]>(data.userProfile?.tags ?? []);
	let pastContests = $state<string[]>(data.userProfile?.pastContests ?? []);
	let saving = $state(false);
	let message = $state('');

	function toggleContest(contest: string) {
		if (pastContests.includes(contest)) {
			pastContests = pastContests.filter((c) => c !== contest);
		} else {
			pastContests = [...pastContests, contest];
		}
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

<div class="max-w-lg mx-auto px-4 py-8">
	<div class="flex items-center gap-3 mb-6">
		<a href="/account" class="text-gray-400 hover:text-white transition-colors">← 戻る</a>
		<h1 class="text-2xl font-bold text-white">プロフィール編集</h1>
	</div>

	<div class="space-y-4">
		<div>
			<label class="mb-1 block text-sm font-medium text-gray-300">ニックネーム</label>
			<input
				bind:value={nickname}
				type="text"
				placeholder="例: 田中太郎"
				class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-gray-300">高専名</label>
			<input
				bind:value={schoolName}
				type="text"
				placeholder="例: 東京高専"
				class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-gray-300">タグ（スキル・興味）</label>
			<div class="mb-2 flex flex-wrap gap-2">
				{#each tags as tag}
					<span class="flex items-center gap-1 rounded-full bg-indigo-900 px-3 py-1 text-sm text-indigo-200">
						#{tag}
						<button onclick={() => removeTag(tag)} class="ml-1 hover:text-white">×</button>
					</span>
				{/each}
			</div>
			<input
				bind:value={tagInput}
				onkeydown={handleTagKeydown}
				onblur={addTag}
				type="text"
				placeholder="タグを入力してEnter (例: Rust, ロボット)"
				class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
			/>
		</div>

		<div>
			<p class="mb-2 text-sm font-medium text-gray-300">参加したことのあるコンテスト</p>
			<div class="flex flex-col gap-2">
				{#each PAST_CONTESTS as contest}
					<button
						type="button"
						onclick={() => toggleContest(contest)}
						class="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors {pastContests.includes(contest) ? 'border-indigo-500 bg-indigo-950 text-white' : 'border-gray-700 text-gray-400'}"
					>
						<span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border {pastContests.includes(contest) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600'}">
							{#if pastContests.includes(contest)}
								<svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
							{/if}
						</span>
						<span class="text-sm">{contest}</span>
					</button>
				{/each}
			</div>
		</div>

		{#if message}
			<p class="text-sm text-red-400">{message}</p>
		{/if}

		<button
			onclick={save}
			disabled={saving || !nickname || !schoolName}
			class="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500"
		>
			{saving ? '保存中...' : '保存する'}
		</button>
	</div>
</div>
