<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let title = $state('');
	let description = $state('');
	let startAt = $state('');
	let endAt = $state('');
	let location = $state('');
	let url = $state('');
	let imageUrl = $state('');
	let submitting = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		if (!title.trim()) {
			error = 'タイトルは必須です';
			return;
		}
		if (!startAt) {
			error = '開始日時は必須です';
			return;
		}
		submitting = true;
		try {
			const res = await fetch('/api/events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || null,
					startAt: new Date(startAt).toISOString(),
					endAt: endAt ? new Date(endAt).toISOString() : null,
					location: location.trim() || null,
					url: url.trim() || null,
					imageUrl: imageUrl.trim() || null
				})
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				error = body.message ?? 'イベントの作成に失敗しました';
				return;
			}
			const created = await res.json();
			goto(resolve('/calendar/[slug]', { slug: created.id }));
		} catch {
			error = 'ネットワークエラーが発生しました';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mx-auto max-w-lg px-4 py-6">
	<a
		href={resolve('/calendar')}
		class="mb-4 inline-block text-sm text-kaiko-muted hover:text-kaiko-text">← 戻る</a
	>
	<h1 class="mb-6 text-2xl font-bold text-kaiko-text">イベントを作成</h1>

	<form onsubmit={handleSubmit} class="space-y-5">
		<!-- タイトル -->
		<div>
			<label for="title" class="mb-1 block text-sm font-medium text-kaiko-text"
				>タイトル <span class="text-red-500">*</span></label
			>
			<input
				id="title"
				type="text"
				bind:value={title}
				placeholder="イベント名を入力"
				required
				class="w-full rounded-xl border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder:text-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		<!-- 開始日時 -->
		<div>
			<label for="startAt" class="mb-1 block text-sm font-medium text-kaiko-text"
				>開始日時 <span class="text-red-500">*</span></label
			>
			<input
				id="startAt"
				type="datetime-local"
				bind:value={startAt}
				required
				class="w-full rounded-xl border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		<!-- 終了日時 -->
		<div>
			<label for="endAt" class="mb-1 block text-sm font-medium text-kaiko-text">終了日時</label>
			<input
				id="endAt"
				type="datetime-local"
				bind:value={endAt}
				class="w-full rounded-xl border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		<!-- 場所 -->
		<div>
			<label for="location" class="mb-1 block text-sm font-medium text-kaiko-text">場所</label>
			<input
				id="location"
				type="text"
				bind:value={location}
				placeholder="例: 東京高専 体育館 / オンライン (Discord)"
				class="w-full rounded-xl border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder:text-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
			{#if location.trim()}
				<a
					href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(
						location.trim()
					)}"
					target="_blank"
					rel="noopener external"
					class="mt-1 inline-block text-xs text-kaiko-accent hover:underline"
				>
					Google マップで確認 ↗
				</a>
			{/if}
		</div>

		<!-- ディスクリプション -->
		<div>
			<label for="description" class="mb-1 block text-sm font-medium text-kaiko-text"
				>ディスクリプション</label
			>
			<textarea
				id="description"
				bind:value={description}
				rows={4}
				placeholder="イベントの説明を入力"
				class="w-full rounded-xl border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder:text-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			></textarea>
		</div>

		<!-- 詳細ページURL (optional) -->
		<div>
			<label for="url" class="mb-1 block text-sm font-medium text-kaiko-text">
				詳細ページURL <span class="text-xs text-kaiko-muted">(任意)</span>
			</label>
			<input
				id="url"
				type="url"
				bind:value={url}
				placeholder="https://example.com/event"
				class="w-full rounded-xl border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder:text-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
		</div>

		<!-- イベント画像URL (optional) -->
		<div>
			<label for="imageUrl" class="mb-1 block text-sm font-medium text-kaiko-text">
				イベント画像URL <span class="text-xs text-kaiko-muted">(任意・横画像推奨)</span>
			</label>
			<input
				id="imageUrl"
				type="url"
				bind:value={imageUrl}
				placeholder="https://example.com/image.jpg"
				class="w-full rounded-xl border border-kaiko-border bg-kaiko-surface px-4 py-3 text-kaiko-text placeholder:text-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
			{#if imageUrl.trim()}
				<img
					src={imageUrl.trim()}
					alt="プレビュー"
					class="mt-2 w-full rounded-xl object-cover"
					style="max-height: 200px;"
				/>
			{/if}
		</div>

		{#if error}
			<p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-xl bg-kaiko-accent py-3 font-semibold text-white transition-colors hover:bg-kaiko-accent-hover disabled:opacity-50"
		>
			{submitting ? '作成中...' : 'イベントを作成'}
		</button>
	</form>
</div>
