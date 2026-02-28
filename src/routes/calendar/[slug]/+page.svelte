<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';

  const PAST_CONTESTS = ['高専プロコン', '高専ロボコン', '高専ハッカソン', '競技プログラミング', '高専生交流LT'];

  let { data } = $props();
  let isAttending = $state(data.isAttending);
  let loading = $state(false);

  // localStorage から過去コンテスト選択を復元 (null = 未設定 → モーダルを表示)
  let selectedPastContests = $state<string[] | null>(
    browser
      ? (localStorage.getItem('kaikosen_pastContests') !== null
          ? (JSON.parse(localStorage.getItem('kaikosen_pastContests')!) as string[])
          : null)
      : null
  );

  let showContestModal = $state(false);
  let tempSelectedContests = $state<string[]>([]);

  function formatDate(d: Date | string | null) {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' });
  }

  const sortedAttendees = $derived(
    [...data.attendees].sort((a, b) => {
      const sel = selectedPastContests ?? [];
      const commonA = a.pastContests.filter((c) => sel.includes(c)).length;
      const commonB = b.pastContests.filter((c) => sel.includes(c)).length;
      return commonB - commonA;
    })
  );

  function commonCount(pastContests: string[]) {
    const sel = selectedPastContests ?? [];
    return pastContests.filter((c) => sel.includes(c)).length;
  }

  async function doAttend() {
    loading = true;
    const res = await fetch(`/api/events/${data.event.id}/attend`, { method: 'POST' });
    if (res.ok) {
      const body = await res.json();
      isAttending = body.attending;
    }
    loading = false;
  }

  async function toggleAttend() {
    if (!data.userId) { goto('/login'); return; }
    // 「参加する」かつ過去コンテスト未設定 → モーダルを開く
    if (!isAttending && selectedPastContests === null) {
      tempSelectedContests = [];
      showContestModal = true;
      return;
    }
    await doAttend();
  }

  function toggleTempContest(contest: string) {
    if (tempSelectedContests.includes(contest)) {
      tempSelectedContests = tempSelectedContests.filter((c) => c !== contest);
    } else {
      tempSelectedContests = [...tempSelectedContests, contest];
    }
  }

  async function confirmContests() {
    selectedPastContests = [...tempSelectedContests];
    if (browser) localStorage.setItem('kaikosen_pastContests', JSON.stringify(selectedPastContests));
    showContestModal = false;
    await doAttend();
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
    {#each sortedAttendees as attendee}
      {@const isConnection = data.connectionUserIds.includes(attendee.userId)}
      {@const common = commonCount(attendee.pastContests)}
      <div class="flex items-center gap-3 bg-gray-900 rounded-lg px-4 py-3">
        <div class="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {attendee.nickname?.[0] ?? '?'}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-medium truncate">{attendee.nickname ?? '不明'}</p>
          <p class="text-gray-400 text-xs truncate">{attendee.schoolName ?? ''}</p>
        </div>
        <div class="flex gap-1 shrink-0">
          {#if common > 0}
            <span class="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full">共通{common}個</span>
          {/if}
          {#if isConnection}
            <span class="text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">繋がり</span>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

{#if showContestModal}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
    <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
      <h2 class="text-xl font-bold text-white mb-1">過去に参加したコンテスト</h2>
      <p class="text-gray-400 text-sm mb-4">共通参加者を強調表示するために使います</p>
      <div class="flex flex-col gap-2 mb-6">
        {#each PAST_CONTESTS as contest}
          <button
            onclick={() => toggleTempContest(contest)}
            class="flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors {tempSelectedContests.includes(contest) ? 'border-indigo-500 bg-indigo-950 text-white' : 'border-gray-700 text-gray-400'}"
          >
            <span class="w-4 h-4 rounded border flex items-center justify-center shrink-0 {tempSelectedContests.includes(contest) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'}">
              {#if tempSelectedContests.includes(contest)}
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              {/if}
            </span>
            <span class="text-sm">{contest}</span>
          </button>
        {/each}
      </div>
      <div class="flex gap-3">
        <button onclick={() => showContestModal = false} class="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400">
          キャンセル
        </button>
        <button onclick={confirmContests} class="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
          確定して参加
        </button>
      </div>
    </div>
  </div>
{/if}
