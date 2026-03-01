<script lang="ts">
	import { PAST_CONTESTS_TITLE } from '$lib/contests';
	import { parseUtc } from '$lib/date';

	let { data } = $props();

	function formatEventDate(d: string | Date): string {
		return parseUtc(d).toLocaleDateString('ja-JP', {
			month: 'short',
			day: 'numeric',
			weekday: 'short',
			year: 'numeric'
		});
	}

	const participationList = $derived.by(() => {
		const sharedEvents = new Set(data.sharedEventIds ?? []);
		const sharedContests = new Set(data.sharedPastContestEntries ?? []);
		const items: Array<{
			type: 'contest' | 'event';
			label: string;
			year?: string;
			date?: string | Date;
			eventId?: string;
			isShared: boolean;
		}> = [];
		for (const entry of data.profile?.pastContests ?? []) {
			const i = entry.lastIndexOf('-');
			const year = i >= 0 ? entry.slice(i + 1) : '';
			const contest = PAST_CONTESTS_TITLE.find((c) => c.id === entry.slice(0, i));
			items.push({
				type: 'contest',
				label: contest?.title ?? entry,
				year,
				isShared: sharedContests.has(entry)
			});
		}
		for (const ev of data.attendedEvents ?? []) {
			items.push({
				type: 'event',
				label: ev.title,
				date: ev.startAt,
				eventId: ev.id,
				isShared: sharedEvents.has(ev.id)
			});
		}
		items.sort((a, b) => {
			const dateA = a.date ? parseUtc(a.date).getTime() : (a.year ? new Date(`${a.year}-01-01`).getTime() : 0);
			const dateB = b.date ? parseUtc(b.date).getTime() : (b.year ? new Date(`${b.year}-01-01`).getTime() : 0);
			return dateB - dateA;
		});
		return items;
	});

	function onAvatarError(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		img.classList.add('hidden');
		(img.nextElementSibling as HTMLElement)?.classList.remove('hidden');
	}
</script>

<svelte:head>
	<title>{data.profile?.nickname ?? 'プロフィール'} - kaikosen</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-8">
	<button
		type="button"
		onclick={() => history.back()}
		class="mb-4 inline-block text-sm text-kaiko-muted transition-colors hover:text-kaiko-text"
		>← 戻る</button
	>

	<div class="flex flex-col items-center gap-4">
		<!-- アイコン -->
		{#if data.profile?.avatarUrl}
			<div class="relative h-24 w-24">
				<img
					src={data.profile.avatarUrl}
					alt="アイコン"
					class="h-24 w-24 rounded-full border-2 border-kaiko-border object-cover"
					onerror={onAvatarError}
				/>
				<div
					class="absolute inset-0 hidden items-center justify-center rounded-full border-2 border-kaiko-border bg-kaiko-accent text-3xl font-bold text-white"
				>
					{data.profile?.nickname?.[0] ?? '?'}
				</div>
			</div>
		{:else}
			<div
				class="flex h-24 w-24 items-center justify-center rounded-full bg-kaiko-accent text-3xl font-bold text-white"
			>
				{data.profile?.nickname?.[0] ?? '?'}
			</div>
		{/if}

		<!-- ニックネーム・高専名 -->
		<div class="w-full text-center">
			<p class="text-xl font-bold text-kaiko-text">{data.profile?.nickname ?? '不明'}</p>
			<p class="mt-1 text-kaiko-muted">{data.profile?.schoolName ?? ''}</p>
		</div>

		<!-- タグ -->
		{#if (data.profile?.tags ?? []).length > 0}
			<div class="flex flex-wrap justify-center gap-1.5">
				{#each data.profile?.tags ?? [] as tag}
					<span class="rounded-full bg-kaiko-accent-muted px-3 py-1 text-sm text-kaiko-accent-dark"
						>#{tag}</span
					>
				{/each}
			</div>
		{/if}

		<!-- 自己紹介 -->
		{#if (data.profile?.message ?? '').trim()}
			<p class="w-full text-left text-[15px] leading-relaxed whitespace-pre-wrap text-kaiko-text">
				{(data.profile?.message ?? '').trim()}
			</p>
		{/if}

		<!-- 参加したイベント・コンテスト一覧 -->
		{#if participationList.length > 0}
			<div class="w-full">
				<h2 class="mb-2 text-sm font-medium text-kaiko-muted">参加したイベント・コンテスト</h2>
				<ul class="space-y-1.5">
					{#each participationList as item}
						<li>
							{#if item.type === 'event' && item.eventId}
								<a
									href="/calendar/{item.eventId}"
									class="block rounded-lg px-3 py-2 text-sm text-kaiko-text transition-colors hover:bg-kaiko-surface-alt {item.isShared
										? 'border-2 border-kaiko-accent bg-kaiko-accent-muted/30'
										: 'border border-kaiko-border bg-kaiko-surface'}"
								>
									<span class="font-medium">{item.label}</span>
									{#if item.isShared}
										<span class="ml-2 rounded-full bg-kaiko-accent px-2 py-0.5 text-xs text-white"
											>共通</span
										>
									{/if}
									{#if item.date}
										<span class="ml-2 text-xs text-kaiko-muted">{formatEventDate(item.date)}</span>
									{/if}
								</a>
							{:else}
								<div
									class="rounded-lg px-3 py-2 text-sm text-kaiko-text {item.isShared
										? 'border-2 border-kaiko-accent bg-kaiko-accent-muted/30'
										: 'border border-kaiko-border bg-kaiko-surface'}"
								>
									<span class="font-medium">{item.label}</span>
									{#if item.isShared}
										<span class="ml-2 rounded-full bg-kaiko-accent px-2 py-0.5 text-xs text-white"
											>共通</span
										>
									{/if}
									{#if item.year}
										<span class="ml-2 text-xs text-kaiko-muted">{item.year}年</span>
									{/if}
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- 自分の場合はアカウントへ -->
		{#if data.isSelf}
			<a
				href="/account"
				class="mt-4 block w-full rounded-xl bg-kaiko-accent py-3 text-center font-semibold text-white transition-colors hover:bg-kaiko-accent-hover"
			>
				アカウント設定
			</a>
		{/if}
	</div>
</div>
