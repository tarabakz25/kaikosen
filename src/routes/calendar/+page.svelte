<script lang="ts">
	import { parseUtc } from '$lib/date';

	let { data } = $props();

	function formatDate(d: Date | string) {
		return parseUtc(d).toLocaleDateString('ja-JP', {
			month: 'short',
			day: 'numeric',
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function avatarColor(str: string): string {
		let hash = 0;
		for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
		return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
	}
</script>

<div class="mx-auto max-w-lg px-4 py-6">
	<h1 class="mb-6 text-2xl font-bold text-kaiko-text">イベント</h1>

	{#if data.events.length === 0}
		<p class="py-12 text-center text-kaiko-muted">イベントはまだありません</p>
	{:else}
		<div class="space-y-3">
			{#each data.events as ev}
				<a
					href="/calendar/{ev.id}"
					class="block rounded-xl border border-kaiko-border bg-kaiko-surface p-4 transition-colors hover:bg-kaiko-surface-alt"
				>
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0 flex-1">
							<h2 class="truncate font-semibold text-kaiko-text">{ev.title}</h2>
							<p class="mt-1 text-sm text-kaiko-muted">{formatDate(ev.startAt)}</p>
							{#if ev.location}
								<p class="mt-0.5 text-sm text-kaiko-muted">📍 {ev.location}</p>
							{/if}
						</div>
						<div class="flex shrink-0 flex-col items-end gap-1">
							<span
								class="rounded-full bg-kaiko-accent-muted px-2 py-0.5 text-sm text-kaiko-accent-dark"
								>{ev.attendeeCount}人参加</span
							>
						</div>
					</div>
					{#if ev.connectedAttendees?.length > 0}
						<div class="mt-2 flex items-center gap-2">
							<span class="text-xs text-kaiko-muted">参戦中</span>
							<div class="flex -space-x-2">
								{#each ev.connectedAttendees as attendee}
									{#if attendee.avatarUrl}
										<img
											src={attendee.avatarUrl}
											alt={attendee.nickname}
											class="h-6 w-6 rounded-full border-2 border-kaiko-surface object-cover"
											title={attendee.nickname}
										/>
									{:else}
										<div
											class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-kaiko-surface text-xs font-bold text-white"
											style="background-color: {avatarColor(attendee.userId)}"
											title={attendee.nickname}
										>
											{attendee.nickname[0]}
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				</a>
			{/each}
		</div>
	{/if}
</div>
