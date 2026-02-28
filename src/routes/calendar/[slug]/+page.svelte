<script lang="ts">
  import { goto } from '$app/navigation';

  let { data } = $props();
  let isAttending = $state(data.isAttending);
  let loading = $state(false);

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' });
  }

  async function toggleAttend() {
    if (!data.userId) { goto('/login'); return; }
    loading = true;
    const res = await fetch(`/api/events/${data.event.id}/attend`, { method: 'POST' });
    if (res.ok) {
      const body = await res.json();
      isAttending = body.attending;
    }
    loading = false;
  }
</script>

<div class="max-w-lg mx-auto px-4 py-6">
  <a href="/calendar" class="text-gray-400 hover:text-white text-sm mb-4 inline-block">← 戻る</a>

  <h1 class="text-2xl font-bold text-white mb-2">{data.event.title}</h1>

  <div class="space-y-1 mb-4">
    <p class="text-gray-300">🗓 {formatDate(data.event.startAt)}</p>
    {#if data.event.endAt}
      <p class="text-gray-400 text-sm">〜 {formatDate(data.event.endAt)}</p>
    {/if}
    {#if data.event.location}
      <p class="text-gray-300">📍 {data.event.location}</p>
    {/if}
  </div>

  {#if data.event.description}
    <p class="text-gray-300 mb-4 whitespace-pre-line">{data.event.description}</p>
  {/if}

  <div class="flex gap-3 mb-6">
    {#if data.event.url}
      <a href={data.event.url} target="_blank" rel="noopener" class="flex-1 text-center bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition-colors">
        詳細ページ ↗
      </a>
    {/if}
    {#if data.userId}
      <button
        onclick={toggleAttend}
        disabled={loading}
        class="flex-1 py-3 rounded-xl font-semibold transition-colors {isAttending ? 'bg-red-900 hover:bg-red-800 text-red-200' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}"
      >
        {isAttending ? '参加を取り消す' : '参加する'}
      </button>
    {/if}
  </div>

  <h2 class="text-lg font-semibold text-white mb-3">参加者 ({data.attendees.length}人)</h2>
  <div class="space-y-2">
    {#each data.attendees as attendee}
      {@const isConnection = data.connectionUserIds.includes(attendee.userId)}
      <div class="flex items-center gap-3 bg-gray-900 rounded-lg px-4 py-3">
        <div class="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {attendee.nickname?.[0] ?? '?'}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-medium truncate">{attendee.nickname ?? '不明'}</p>
          <p class="text-gray-400 text-xs truncate">{attendee.schoolName ?? ''}</p>
        </div>
        {#if isConnection}
          <span class="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">繋がり</span>
        {/if}
      </div>
    {/each}
  </div>
</div>
