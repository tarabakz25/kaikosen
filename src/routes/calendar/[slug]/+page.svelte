<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { parseUtc } from '$lib/date';

	type FellowAttendee = { userId: string; nickname: string | null; avatarUrl: string | null };

	let { data } = $props();
	let isAttending = $state(data.isAttending);
	let loading = $state(false);
	let showThankYouPopup = $state(false);
	let fellowAttendees = $state<FellowAttendee[]>([]);
	let fellowLoading = $state(false);

	const myPastContests = data.userProfile?.pastContests ?? [];

	function formatDate(d: Date | string | null) {
		if (!d) return '';
		return parseUtc(d).toLocaleDateString('ja-JP', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			weekday: 'long',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const sortedAttendees = $derived(
		[...data.attendees].sort((a, b) => {
			const rank = (x: (typeof data.attendees)[0]) => {
				if (data.userId && x.userId === data.userId) return 0;
				if (data.connectionUserIds?.includes(x.userId)) return 1;
				return 2;
			};
			const common = (x: (typeof data.attendees)[0]) =>
				(x.pastContests ?? []).filter((c) => myPastContests.includes(c)).length;
			const rA = rank(a);
			const rB = rank(b);
			if (rA !== rB) return rA - rB;
			return common(b) - common(a);
		})
	);

	function commonCount(pastContests: string[] | null) {
		return (pastContests ?? []).filter((c) => myPastContests.includes(c)).length;
	}

	async function toggleAttend() {
		if (!data.userId) {
			goto(resolve('/login'));
			return;
		}
		loading = true;
		const res = await fetch(`/api/events/${data.event.id}/attend`, { method: 'POST' });
		if (res.ok) {
			const body = await res.json();
			const wasNotAttending = !isAttending;
			isAttending = body.attending;
			if (wasNotAttending && body.attending) {
				showThankYouPopup = true;
				fellowLoading = true;
				const fellowRes = await fetch(`/api/events/${data.event.id}/fellow-attendees`);
				if (fellowRes.ok) {
					fellowAttendees = await fellowRes.json();
				}
				fellowLoading = false;
			}
		}
		loading = false;
	}
</script>

<div class="mx-auto max-w-lg px-4 py-6">
	<a
		href={resolve('/calendar')}
		class="mb-4 inline-block text-sm text-kaiko-muted hover:text-kaiko-text">← 戻る</a
	>

	{#if data.event.imageUrl}
		<img
			src={data.event.imageUrl}
			alt={data.event.title}
			class="mb-4 w-full rounded-2xl object-cover"
			style="max-height: 220px;"
		/>
	{/if}

	<h1 class="mb-2 text-2xl font-bold text-kaiko-text">{data.event.title}</h1>

	<div class="mb-4 space-y-1">
		<p class="text-kaiko-text">🗓 {formatDate(data.event.startAt)}</p>
		{#if data.event.endAt}
			<p class="text-sm text-kaiko-muted">〜 {formatDate(data.event.endAt)}</p>
		{/if}
		{#if data.event.location}
			<p class="text-kaiko-text">📍 {data.event.location}</p>
		{/if}
	</div>

	{#if data.event.description}
		<p class="mb-4 whitespace-pre-line text-kaiko-text">{data.event.description}</p>
	{/if}

	<div class="mb-6 flex gap-3">
		{#if data.event.url}
			<a
				href={data.event.url}
				target="_blank"
				rel="noopener external"
				class="flex-1 rounded-xl border border-kaiko-border bg-kaiko-surface-alt py-3 text-center font-medium text-kaiko-text transition-colors hover:bg-kaiko-accent-muted"
			>
				詳細ページ ↗
			</a>
		{/if}
		{#if data.isOrganizer}
			<a
				href={resolve('/calendar/[slug]/edit', { slug: data.event.id })}
				class="flex-1 rounded-xl border border-kaiko-border bg-kaiko-surface-alt py-3 text-center font-medium text-kaiko-text transition-colors hover:bg-kaiko-accent-muted"
			>
				編集
			</a>
		{/if}
		{#if data.userId}
			<button
				onclick={toggleAttend}
				disabled={loading}
				class="flex-1 rounded-xl py-3 font-semibold transition-colors {isAttending
					? 'bg-red-100 text-red-700 hover:bg-red-200'
					: 'bg-kaiko-accent text-white hover:bg-kaiko-accent-hover'}"
			>
				{isAttending ? '参加を取り消す' : '参加する'}
			</button>
		{/if}
	</div>

	<h2 class="mb-3 text-lg font-semibold text-kaiko-text">参加者 ({data.attendees.length}人)</h2>

	{#if data.isOrganizer}
		{#if data.attendees.length === 0}
			<p class="text-sm text-kaiko-muted">まだ参加者はいません</p>
		{:else}
			<div class="overflow-hidden rounded-xl border border-kaiko-border">
				<table class="w-full text-sm">
					<thead class="bg-kaiko-surface-alt">
						<tr>
							<th class="px-4 py-3 text-left font-medium text-kaiko-muted">ニックネーム</th>
							<th class="px-4 py-3 text-left font-medium text-kaiko-muted">所属</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedAttendees as attendee (attendee.userId)}
							<tr class="border-t border-kaiko-border hover:bg-kaiko-surface-alt">
								<td class="px-4 py-3">
									<a
										href={attendee.userId === data.userId
											? resolve('/account')
											: resolve('/profile/[userId]', { userId: attendee.userId })}
										class="flex items-center gap-2 text-kaiko-accent hover:underline"
									>
										{#if attendee.avatarUrl}
											<img
												src={attendee.avatarUrl}
												alt=""
												class="h-6 w-6 shrink-0 rounded-full object-cover"
											/>
										{:else}
											<div
												class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-kaiko-accent text-xs font-bold text-white"
											>
												{attendee.nickname?.[0] ?? '?'}
											</div>
										{/if}
										<span class="truncate">{attendee.nickname ?? '不明'}</span>
									</a>
								</td>
								<td class="px-4 py-3 text-kaiko-muted">{attendee.schoolName ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else}
		<div class="space-y-2">
			{#each sortedAttendees as attendee (attendee.userId)}
				{@const isSelf = data.userId && attendee.userId === data.userId}
				{@const isConnection = !isSelf && data.connectionUserIds.includes(attendee.userId)}
				{@const common = commonCount(attendee.pastContests)}
				{@const rowClass =
					'flex items-center gap-3 rounded-lg border border-kaiko-border bg-kaiko-surface px-4 py-3 transition-colors hover:bg-kaiko-surface-alt'}
				{#snippet attendeeRowInner()}
					{#if attendee.avatarUrl}
						<img src={attendee.avatarUrl} alt="" class="h-8 w-8 shrink-0 rounded-full object-cover" />
					{:else}
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kaiko-accent text-sm font-bold text-white"
						>
							{attendee.nickname?.[0] ?? '?'}
						</div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium text-kaiko-text">{attendee.nickname ?? '不明'}</p>
						<p class="truncate text-xs text-kaiko-muted">{attendee.schoolName ?? ''}</p>
					</div>
					<div class="flex shrink-0 gap-1">
						{#if isSelf}
							<span
								class="rounded-full bg-kaiko-accent-muted px-2 py-0.5 text-xs text-kaiko-accent-dark"
								>自分</span
							>
						{:else}
							{#if common > 0}
								<span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
									>共通{common}</span
								>
							{/if}
							{#if isConnection}
								<span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800"
									>繋がり</span
								>
							{/if}
						{/if}
					</div>
				{/snippet}
				{#if isSelf}
					<a href={resolve('/account')} class={rowClass}>{@render attendeeRowInner()}</a>
				{:else}
					<a href={resolve('/profile/[userId]', { userId: attendee.userId })} class={rowClass}
						>{@render attendeeRowInner()}</a
					>
				{/if}
			{/each}
		</div>
	{/if}
</div>

{#if showThankYouPopup}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="thank-you-title"
	>
		<div
			class="w-full max-w-sm rounded-2xl border border-kaiko-border bg-kaiko-surface p-6 text-center shadow-xl"
		>
			<h2 id="thank-you-title" class="mb-4 text-xl font-bold text-kaiko-text">
				イベントへの参加が完了しました
			</h2>
			<p class="mb-4 text-sm text-kaiko-muted">ご参加いただきありがとうございます！</p>
			{#if fellowLoading}
				<p class="py-6 text-center text-sm text-kaiko-muted">読み込み中...</p>
			{:else}
				<div>
					<p class="mb-3 text-sm text-kaiko-muted">この人...見たことあるかも</p>
					<div
						class="mb-6 max-h-40 overflow-y-auto rounded-xl border border-kaiko-border bg-kaiko-bg"
					>
						{#each fellowAttendees as person (person.userId)}
							<div class="flex items-center gap-3 px-4 py-3">
								{#if person.avatarUrl}
									<img
										src={person.avatarUrl}
										alt=""
										class="h-10 w-10 shrink-0 rounded-full object-cover"
									/>
								{:else}
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kaiko-accent text-sm font-bold text-white"
									>
										{person.nickname?.[0] ?? '?'}
									</div>
								{/if}
								<p class="truncate font-medium text-kaiko-text">{person.nickname ?? '不明'}</p>
							</div>
						{/each}
					</div>
					<a
						href={resolve('/calendar')}
						class="block w-full rounded-xl bg-kaiko-accent py-3 font-semibold text-white transition-colors hover:bg-kaiko-accent-hover"
					>
						イベント一覧に戻る
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}
