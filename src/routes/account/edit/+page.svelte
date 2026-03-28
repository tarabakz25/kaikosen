<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PAST_CONTESTS_TITLE } from '$lib/contests';
	import { supabase } from '$lib/auth-client';

	let { data } = $props();

	const maxYear = 2025;
	const years = Array.from({ length: maxYear - 1960 + 1 }, (_, i) => maxYear - i);

	type Role = 'student' | 'alumni' | 'company';

	const roleLabels: Record<Role, { label: string; schoolLabel: string; schoolPlaceholder: string }> =
		{
			student: { label: '現役高専生', schoolLabel: '高専名', schoolPlaceholder: '例: 東京高専' },
			alumni: { label: '高専OB', schoolLabel: '元高専名', schoolPlaceholder: '例: 東京高専' },
			company: { label: '企業', schoolLabel: '企業名', schoolPlaceholder: '例: 株式会社〇〇' }
		};

	let nickname = $state(data.userProfile?.nickname ?? '');
	let role = $state<Role>((data.userProfile?.role as Role) ?? 'student');
	let schoolName = $state(data.userProfile?.schoolName ?? '');
	let tagInput = $state('');
	let tags = $state<string[]>(data.userProfile?.tags ?? []);
	let pastContests = $state<string[]>(data.userProfile?.pastContests ?? []);
	let selectedContestId = $state(PAST_CONTESTS_TITLE[0].id);
	let selectedYear = $state(maxYear);
	let bioMessage = $state(data.userProfile?.message ?? '');
	let avatarUrl = $state<string | null>(data.userProfile?.avatarUrl ?? data.user?.image ?? null);
	let saving = $state(false);
	let errorMessage = $state('');
	let showCamera = $state(false);
	let videoEl = $state<HTMLVideoElement | null>(null);
	let stream = $state<MediaStream | null>(null);
	let capturing = $state(false);

	async function startCamera() {
		showCamera = true;
		await new Promise((r) => setTimeout(r, 100));
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 480 } }
			});
			if (videoEl) {
				videoEl.srcObject = stream;
				await videoEl.play();
			}
		} catch {
			errorMessage = 'カメラへのアクセスが拒否されました';
			showCamera = false;
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
		showCamera = false;
	}

	async function capturePhoto() {
		const userId = data.user?.id;
		if (!videoEl || !userId) return;
		capturing = true;
		try {
			const canvas = document.createElement('canvas');
			const size = Math.min(videoEl.videoWidth, videoEl.videoHeight);
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext('2d');
			if (!ctx) return;
			const sx = (videoEl.videoWidth - size) / 2;
			const sy = (videoEl.videoHeight - size) / 2;
			ctx.drawImage(videoEl, sx, sy, size, size, 0, 0, size, size);
			canvas.toBlob(
				async (blob) => {
					if (!blob) return;
					const path = `face/${userId}.png`;
					const { error } = await supabase.storage.from('assets').upload(path, blob, {
						contentType: 'image/png',
						upsert: true
					});
					if (error) {
						errorMessage = 'アップロードに失敗しました';
						return;
					}
					const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path);
					// キャッシュ回避のためタイムスタンプを付与（再撮影時に確実に反映）
					avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
					stopCamera();
				},
				'image/png',
				0.9
			);
		} finally {
			capturing = false;
		}
	}

	onDestroy(() => stopCamera());

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
		errorMessage = '';
		try {
			const res = await fetch('/api/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					nickname,
					role,
					schoolName,
					tags,
					pastContests,
					message: bioMessage,
					avatarUrl
				})
			});
			if (res.ok) {
				await goto(resolve('/account'), { invalidateAll: true });
			} else {
				errorMessage = '保存に失敗しました';
			}
		} catch {
			errorMessage = 'エラーが発生しました';
		}
		saving = false;
	}
</script>

<div class="mx-auto max-w-lg px-4 py-8">
	<div class="mb-6 flex items-center gap-3">
		<a href={resolve('/account')} class="text-kaiko-muted transition-colors hover:text-kaiko-text"
			>← 戻る</a
		>
		<h1 class="text-2xl font-bold text-kaiko-text">プロフィール編集</h1>
	</div>

	<div class="space-y-4">
		<!-- アイコン -->
		<div class="flex flex-col items-center gap-3">
			<div class="relative">
				{#if avatarUrl}
					<img
						src={avatarUrl}
						alt="アイコン"
						class="h-24 w-24 rounded-full border-2 border-kaiko-border object-cover"
					/>
				{:else}
					<div
						class="flex h-24 w-24 items-center justify-center rounded-full bg-kaiko-accent text-3xl font-bold text-white"
					>
						{nickname?.[0] ?? '?'}
					</div>
				{/if}
			</div>
			<button
				type="button"
				onclick={startCamera}
				class="rounded-lg border border-kaiko-border bg-kaiko-surface px-4 py-2 text-sm font-medium text-kaiko-text transition-colors hover:bg-kaiko-surface-alt"
			>
				画像を変更
			</button>
		</div>

		<div>
			<label class="mb-2 block text-sm font-medium text-kaiko-muted">ロール</label>
			<div class="grid grid-cols-3 gap-2">
				{#each Object.entries(roleLabels) as [value, { label }] (value)}
					<button
						type="button"
						onclick={() => (role = value as Role)}
						class="rounded-lg border py-2.5 text-sm font-medium transition-colors {role === value
							? 'border-kaiko-accent bg-kaiko-accent text-white'
							: 'border-kaiko-border bg-kaiko-surface text-kaiko-text hover:bg-kaiko-surface-alt'}"
					>
						{label}
					</button>
				{/each}
			</div>
		</div>

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
			<label class="mb-1 block text-sm font-medium text-kaiko-muted"
				>{roleLabels[role].schoolLabel}</label
			>
			<input
				bind:value={schoolName}
				type="text"
				placeholder={roleLabels[role].schoolPlaceholder}
				class="w-full rounded-lg border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		<div>
			<label class="mb-1 block text-sm font-medium text-kaiko-muted">タグ（スキル・興味）</label>
			<div class="mb-2 flex flex-wrap gap-2">
				{#each tags as tag (tag)}
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
			<p class="mb-2 text-sm font-medium text-kaiko-muted">参加したイベント</p>
			<div class="mb-3 flex flex-wrap gap-2">
				<select
					bind:value={selectedContestId}
					class="rounded-lg border border-kaiko-border bg-kaiko-surface px-3 py-2 text-sm text-kaiko-text focus:border-kaiko-accent focus:outline-none"
				>
					{#each PAST_CONTESTS_TITLE as contest (contest.id)}
						<option value={contest.id}>{contest.title}</option>
					{/each}
				</select>
				<select
					bind:value={selectedYear}
					class="rounded-lg border border-kaiko-border bg-kaiko-surface px-3 py-2 text-sm text-kaiko-text focus:border-kaiko-accent focus:outline-none"
				>
					{#each years as y (y)}
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
				{#each pastContests as entry (entry)}
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

		<div>
			<label class="mb-1 block text-sm font-medium text-kaiko-muted">自己紹介</label>
			<textarea
				bind:value={bioMessage}
				rows="3"
				placeholder="自己紹介を入力（任意）"
				class="w-full resize-none rounded-lg border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			></textarea>
		</div>

		{#if errorMessage}
			<p class="text-sm text-red-500">{errorMessage}</p>
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

{#if showCamera}
	<div
		class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
		role="dialog"
		aria-modal="true"
		aria-label="アイコン撮影"
	>
		<p class="mb-4 text-sm text-white">枠に顔を合わせて撮影してください</p>
		<div
			class="relative aspect-square w-full max-w-[320px] overflow-hidden rounded-full border-4 border-white"
		>
			<video bind:this={videoEl} class="h-full w-full object-cover" playsinline muted autoplay
			></video>
		</div>
		<div class="mt-6 flex gap-4">
			<button
				type="button"
				onclick={stopCamera}
				class="rounded-xl border border-white/50 px-6 py-3 text-white transition-colors hover:bg-white/10"
			>
				キャンセル
			</button>
			<button
				type="button"
				onclick={capturePhoto}
				disabled={capturing}
				class="rounded-xl bg-kaiko-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-kaiko-accent-hover disabled:opacity-50"
			>
				{capturing ? '撮影中...' : '撮影'}
			</button>
		</div>
	</div>
{/if}
