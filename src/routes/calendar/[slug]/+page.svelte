<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { parseUtc } from '$lib/date';

	type FellowAttendee = { userId: string; nickname: string | null; avatarUrl: string | null };
	type ConnectionAttendee = {
		userId: string;
		nickname: string | null;
		schoolName: string | null;
		role: string | null;
		avatarUrl: string | null;
	};

	let { data } = $props();
	let isAttending = $state(data.isAttending);
	let loading = $state(false);
	let showThankYouPopup = $state(false);
	let fellowAttendees = $state<FellowAttendee[]>([]);
	let fellowLoading = $state(false);

	let selectedConnectionAttendee = $state<ConnectionAttendee | null>(null);
	let connectionDetails = $state<{
		connectedAt: string | null;
		alias: string | null;
		sharedEvents: Array<{
			id: string;
			title: string;
			startAt: string;
			endAt: string | null;
			location: string | null;
		}>;
	} | null>(null);
	let connectionDetailsLoading = $state(false);

	$effect(() => {
		const attendee = selectedConnectionAttendee;
		if (!attendee) {
			connectionDetails = null;
			return;
		}
		connectionDetailsLoading = true;
		fetch(`/api/connections/${attendee.userId}/details`)
			.then((r) => r.json())
			.then((d) => {
				if (selectedConnectionAttendee?.userId === attendee.userId) {
					connectionDetails = d;
					connectionDetailsLoading = false;
				}
			})
			.catch(() => {
				if (selectedConnectionAttendee?.userId === attendee.userId) {
					connectionDetails = null;
					connectionDetailsLoading = false;
				}
			});
	});

	function formatConnectionDate(d: Date | string | null) {
		if (!d) return '';
		return parseUtc(d).toLocaleDateString('ja-JP', {
			month: 'short',
			day: 'numeric',
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatEventDate(d: Date | string | null) {
		if (!d) return '';
		return parseUtc(d).toLocaleDateString('ja-JP', {
			month: 'short',
			day: 'numeric',
			weekday: 'short'
		});
	}

	const myPastContests = data.userProfile?.pastContests ?? [];

	function avatarColor(str: string): string {
		let hash = 0;
		for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
		return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
	}

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

	<h1 class="mb-1 text-2xl font-bold text-kaiko-text">{data.event.title}</h1>

	{#if data.organizerProfile}
		<div class="mb-3 flex items-center gap-2">
			{#if data.organizerProfile.avatarUrl}
				<img
					src={data.organizerProfile.avatarUrl}
					alt={data.organizerProfile.nickname}
					class="h-7 w-7 rounded-full object-cover"
				/>
			{:else}
				<div
					class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
					style="background-color: {avatarColor(data.organizerProfile.nickname)}"
				>
					{data.organizerProfile.nickname[0]}
				</div>
			{/if}
			<span class="text-sm text-kaiko-muted">{data.organizerProfile.nickname}</span>
		</div>
	{/if}

	<div class="mb-4 space-y-1">
		<p class="text-kaiko-text">🗓 {formatDate(data.event.startAt)}</p>
		{#if data.event.endAt}
			<p class="text-sm text-kaiko-muted">〜 {formatDate(data.event.endAt)}</p>
		{/if}
		{#if data.event.location}
			<p class="text-kaiko-text">
				📍
				<a
					href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(
						data.event.location
					)}"
					target="_blank"
					rel="noopener external"
					class="underline hover:text-kaiko-accent">{data.event.location}</a
				>
			</p>
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
									{#snippet dashboardAttendeeInner()}
										<div class="relative shrink-0">
											{#if attendee.avatarUrl}
												<img
													src={attendee.avatarUrl}
													alt=""
													class="h-6 w-6 rounded-full object-cover"
												/>
											{:else}
												<div
													class="flex h-6 w-6 items-center justify-center rounded-full bg-kaiko-accent text-xs font-bold text-white"
												>
													{attendee.nickname?.[0] ?? '?'}
												</div>
											{/if}
											<span
												class="absolute right-0 bottom-0 h-2 w-2 rounded-full border border-white {attendee.role ===
												'company'
													? 'bg-orange-500'
													: attendee.role === 'alumni'
														? 'bg-green-500'
														: 'bg-blue-500'}"
											></span>
										</div>
										<span class="truncate">{attendee.nickname ?? '不明'}</span>
									{/snippet}
									{#if attendee.userId === data.userId}
										<a
											href={resolve('/account')}
											class="flex items-center gap-2 text-kaiko-accent hover:underline"
											>{@render dashboardAttendeeInner()}</a
										>
									{:else}
										<a
											href={resolve('/profile/[userId]', { userId: attendee.userId })}
											class="flex items-center gap-2 text-kaiko-accent hover:underline"
											>{@render dashboardAttendeeInner()}</a
										>
									{/if}
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
					<div class="relative shrink-0">
						{#if attendee.avatarUrl}
							<img src={attendee.avatarUrl} alt="" class="h-8 w-8 rounded-full object-cover" />
						{:else}
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-kaiko-accent text-sm font-bold text-white"
							>
								{attendee.nickname?.[0] ?? '?'}
							</div>
						{/if}
						<span
							class="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border border-white {attendee.role ===
							'company'
								? 'bg-orange-500'
								: attendee.role === 'alumni'
									? 'bg-green-500'
									: 'bg-blue-500'}"
						></span>
					</div>
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
				{:else if isConnection}
					<button
						class={rowClass + ' w-full text-left'}
						onclick={() => {
							selectedConnectionAttendee = {
								userId: attendee.userId,
								nickname: attendee.nickname,
								schoolName: attendee.schoolName,
								role: attendee.role,
								avatarUrl: attendee.avatarUrl
							};
						}}>{@render attendeeRowInner()}</button
					>
				{:else}
					<a href={resolve('/profile/[userId]', { userId: attendee.userId })} class={rowClass}
						>{@render attendeeRowInner()}</a
					>
				{/if}
			{/each}
		</div>
	{/if}
</div>

{#if selectedConnectionAttendee}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		onclick={() => (selectedConnectionAttendee = null)}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="w-full max-w-lg rounded-2xl border border-kaiko-border bg-kaiko-surface p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center gap-4">
				{#if selectedConnectionAttendee.avatarUrl}
					<img
						src={selectedConnectionAttendee.avatarUrl}
						alt={selectedConnectionAttendee.nickname ?? ''}
						class="h-14 w-14 rounded-full border-2 border-kaiko-border object-cover"
					/>
				{:else}
					<div
						class="flex h-14 w-14 items-center justify-center rounded-full bg-kaiko-accent text-xl font-bold text-white"
					>
						{selectedConnectionAttendee.nickname?.[0] ?? '?'}
					</div>
				{/if}
				<div>
					{#if connectionDetails?.alias}
						<p class="text-sm text-kaiko-muted">「{connectionDetails.alias}」でおなじみ</p>
					{/if}
					<h2 class="text-xl font-bold text-kaiko-text">
						{selectedConnectionAttendee.nickname ?? '不明'}
					</h2>
					<p class="text-kaiko-muted">{selectedConnectionAttendee.schoolName ?? ''}</p>
					<span
						class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium {selectedConnectionAttendee.role ===
						'company'
							? 'bg-orange-100 text-orange-700'
							: selectedConnectionAttendee.role === 'alumni'
								? 'bg-green-100 text-green-700'
								: 'bg-blue-100 text-blue-700'}"
					>
						{selectedConnectionAttendee.role === 'company'
							? '企業'
							: selectedConnectionAttendee.role === 'alumni'
								? '卒業生'
								: selectedConnectionAttendee.role === 'student'
									? '高専生'
									: '—'}
					</span>
				</div>
			</div>

			{#if connectionDetailsLoading}
				<div class="mb-4 text-sm text-kaiko-muted">読み込み中…</div>
			{:else if connectionDetails}
				{@const timelineItems = (() => {
					const list: Array<{
						type: 'connection' | 'event';
						date: string;
						label?: string;
						event?: { id: string; title: string; startAt: string; location: string | null };
					}> = [];
					if (connectionDetails.connectedAt) {
						list.push({
							type: 'connection',
							date: connectionDetails.connectedAt,
							label: '繋がった日'
						});
					}
					for (const ev of connectionDetails.sharedEvents) {
						list.push({ type: 'event', date: ev.startAt, event: ev });
					}
					return list.sort((a, b) => parseUtc(a.date).getTime() - parseUtc(b.date).getTime());
				})()}
				{#if timelineItems.length > 0}
					<div class="mb-4 space-y-3">
						<h3 class="text-sm font-semibold text-kaiko-text">つながりの履歴</h3>
						<ul class="space-y-2">
							{#each timelineItems as item (`${item.type}-${item.date}-${item.event?.id ?? ''}`)}
								<li class="flex items-start gap-3 text-sm">
									<span class="shrink-0 text-kaiko-muted">
										{item.type === 'connection'
											? formatConnectionDate(item.date)
											: formatEventDate(item.date)}
									</span>
									{#if item.type === 'connection'}
										<span class="text-kaiko-text">🔗 {item.label}</span>
									{:else if item.event}
										<span class="flex flex-col gap-0.5">
											<a
												href={resolve('/calendar/[slug]', { slug: item.event.id })}
												class="text-kaiko-accent hover:underline"
											>
												{item.event.title}
											</a>
											{#if item.event.location}
												<span class="text-xs text-kaiko-muted">📍 {item.event.location}</span>
											{/if}
										</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}

			<button
				onclick={() => (selectedConnectionAttendee = null)}
				class="mt-4 w-full rounded-xl border border-kaiko-border py-3 text-kaiko-muted transition-colors hover:bg-kaiko-surface-alt hover:text-kaiko-text"
			>
				閉じる
			</button>
		</div>
	</div>
{/if}

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
