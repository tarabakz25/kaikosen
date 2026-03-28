<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { parseUtc } from '$lib/date';

	let { data } = $props();
	const ev = data.event;

	function toDatetimeLocal(d: Date | string | null) {
		if (!d) return '';
		const dt = parseUtc(d);
		// datetime-local requires "YYYY-MM-DDTHH:mm"
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
	}

	let title = $state(ev.title);
	let description = $state(ev.description ?? '');
	let startAt = $state(toDatetimeLocal(ev.startAt));
	let endAt = $state(toDatetimeLocal(ev.endAt));
	let location = $state(ev.location ?? '');
	let url = $state(ev.url ?? '');
	let imageUrl = $state(ev.imageUrl ?? '');
	let submitting = $state(false);
	let errorMsg = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		errorMsg = '';
		if (!title.trim()) {
			errorMsg = 'タイトルは必須です';
			return;
		}
		if (!startAt) {
			errorMsg = '開始日時は必須です';
			return;
		}
		submitting = true;
		try {
			const res = await fetch(`/api/events/${ev.id}`, {
				method: 'PATCH',
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
				errorMsg = body.message ?? 'イベントの更新に失敗しました';
				return;
			}
			goto(resolve('/calendar/[slug]', { slug: ev.id }));
		} catch {
			errorMsg = 'ネットワークエラーが発生しました';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mx-auto max-w-lg px-4 py-6">
	<a
		href={resolve('/calendar/[slug]', { slug: ev.id })}
		class="mb-4 inline-block text-sm text-kaiko-muted hover:text-kaiko-text"
	>
		← 戻る
	</a>
	<h1 class="mb-6 text-2xl font-bold text-kaiko-text">イベントを編集</h1>

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
					href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(location.trim())}"
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

		{#if errorMsg}
			<p class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{errorMsg}</p>
		{/if}

		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-xl bg-kaiko-accent py-3 font-semibold text-white transition-colors hover:bg-kaiko-accent-hover disabled:opacity-50"
		>
			{submitting ? '更新中...' : '変更を保存'}
		</button>
	</form>
</div>
