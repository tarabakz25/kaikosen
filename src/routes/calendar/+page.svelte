<script lang="ts">
  let { data } = $props();

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="max-w-lg mx-auto px-4 py-6">
  <h1 class="text-2xl font-bold text-kaiko-text mb-6">イベント</h1>

  {#if data.events.length === 0}
    <p class="text-kaiko-muted text-center py-12">イベントはまだありません</p>
  {:else}
    <div class="space-y-3">
      {#each data.events as ev}
        <a href="/calendar/{ev.id}" class="block bg-kaiko-surface rounded-xl p-4 hover:bg-kaiko-surface-alt transition-colors border border-kaiko-border">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h2 class="font-semibold text-kaiko-text truncate">{ev.title}</h2>
              <p class="text-sm text-kaiko-muted mt-1">{formatDate(ev.startAt)}</p>
              {#if ev.location}
                <p class="text-sm text-kaiko-muted mt-0.5">📍 {ev.location}</p>
              {/if}
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              <span class="text-sm bg-kaiko-accent-muted text-kaiko-accent-dark px-2 py-0.5 rounded-full">{ev.attendeeCount}人参加</span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
