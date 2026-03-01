<script lang="ts">
  import { onDestroy } from 'svelte';
  import QRCode from 'qrcode';
  import jsQR from 'jsqr';

  let { data } = $props();

  let tab = $state<'show' | 'scan'>('show');
  let canvas = $state<HTMLCanvasElement>(null as any);
  let videoEl = $state<HTMLVideoElement>(null as any);
  let scanCanvas = $state<HTMLCanvasElement>(null as any);
  let stream: MediaStream | null = null;
  let scanLoopId: number | null = null;
  let pollIntervalId: ReturnType<typeof setInterval> | null = null;
  let scannedUserId = $state<string | null>(null);
  let scanError = $state('');
  let pendingAlias = $state<{
    targetUserId: string;
    targetProfile: { nickname: string; schoolName: string; avatarUrl: string | null } | null;
  } | null>(null);
  let pendingAliasInput = $state('');
  let pendingSubmitting = $state(false);

  const userId = data.user?.id;

  $effect(() => {
    if (canvas && userId) {
      const url = `${location.origin}/connect?uid=${userId}`;
      QRCode.toCanvas(canvas, url, { width: 240, margin: 2, color: { dark: '#1f2937', light: '#ffffff' } });
    }
  });

  async function startScan() {
    scanError = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoEl.srcObject = stream;
      videoEl.play();
      scanLoop();
    } catch (e) {
      scanError = 'カメラへのアクセスが拒否されました';
    }
  }

  function scanLoop() {
    if (!videoEl || !scanCanvas) return;
    const ctx = scanCanvas.getContext('2d');
    if (!ctx) return;

    if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
      scanCanvas.width = videoEl.videoWidth;
      scanCanvas.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0);
      const imageData = ctx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result) {
        const url = new URL(result.data);
        const uid = url.searchParams.get('uid');
        if (uid && uid !== userId) {
          stopScan();
          scannedUserId = uid;
          // スキャンしたことをサーバーに通知（相手の画面に二つ名登録モーダルを出すため）
          fetch('/api/connections/scanned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scannedUserId: uid })
          }).catch(() => {});
          return;
        }
      }
    }
    scanLoopId = requestAnimationFrame(scanLoop);
  }

  function stopScan() {
    if (scanLoopId) cancelAnimationFrame(scanLoopId);
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  }

  function startPoll() {
    if (pollIntervalId) return;
    pollIntervalId = setInterval(async () => {
      const res = await fetch('/api/connections?pending=true');
      if (!res.ok) return;
      const body = await res.json();
      if (body.pending && !pendingAlias) {
        stopPoll();
        pendingAlias = {
          targetUserId: body.pending.targetUserId,
          targetProfile: body.pending.targetProfile
        };
      }
    }, 2000);
  }

  async function submitPendingAlias() {
    if (!pendingAlias || !pendingAliasInput.trim()) return;
    pendingSubmitting = true;
    const res = await fetch(`/api/connections/${pendingAlias.targetUserId}/alias`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: pendingAliasInput.trim() })
    });
    pendingSubmitting = false;
    if (res.ok) {
      pendingAlias = null;
      pendingAliasInput = '';
      startPoll();
    }
  }

  function stopPoll() {
    if (pollIntervalId) { clearInterval(pollIntervalId); pollIntervalId = null; }
  }

  onDestroy(() => { stopScan(); stopPoll(); });

  $effect(() => {
    if (tab === 'scan') {
      startScan();
      stopPoll();
    } else {
      stopScan();
      if (!pendingAlias) startPoll();
    }
  });
</script>

<div class="max-w-lg mx-auto px-4 py-6">
  <h1 class="text-2xl font-bold text-kaiko-text mb-4">マイカード</h1>

  <div class="flex bg-kaiko-surface-alt rounded-xl p-1 mb-6 border border-kaiko-border">
    <button onclick={() => tab = 'show'} class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors {tab === 'show' ? 'bg-kaiko-accent text-white' : 'text-kaiko-muted'}">
      表示
    </button>
    <button onclick={() => tab = 'scan'} class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors {tab === 'scan' ? 'bg-kaiko-accent text-white' : 'text-kaiko-muted'}">
      スキャン
    </button>
  </div>

  {#if tab === 'show'}
    <div class="flex flex-col items-center gap-4">
      <div class="bg-kaiko-surface p-4 rounded-2xl border border-kaiko-border">
        <canvas bind:this={canvas}></canvas>
      </div>
      {#if data.userProfile}
        <div class="text-center">
          <p class="text-kaiko-text font-semibold text-lg">{data.userProfile.nickname}</p>
          <p class="text-kaiko-muted">{data.userProfile.schoolName}</p>
          <div class="flex flex-wrap justify-center gap-1 mt-2">
            {#each data.userProfile.tags as tag}
              <span class="text-xs bg-kaiko-accent-muted text-kaiko-accent-dark px-2 py-0.5 rounded-full">#{tag}</span>
            {/each}
          </div>
        </div>
      {/if}
      <p class="text-kaiko-muted text-sm">相手にスキャンしてもらおう</p>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-4">
      {#if scanError}
        <p class="text-red-500">{scanError}</p>
      {:else}
        <div class="relative w-full max-w-xs aspect-square bg-kaiko-surface rounded-2xl overflow-hidden border border-kaiko-border">
          <video bind:this={videoEl} class="w-full h-full object-cover" playsinline muted></video>
          <canvas bind:this={scanCanvas} class="hidden"></canvas>
          <div class="absolute inset-0 border-2 border-kaiko-accent rounded-2xl pointer-events-none"></div>
        </div>
        <p class="text-kaiko-muted text-sm">QRコードをカメラに向けてください</p>
      {/if}
    </div>
  {/if}
</div>

{#if scannedUserId}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
    <div class="bg-kaiko-surface rounded-2xl p-6 w-full max-w-sm shadow-xl border border-kaiko-border">
      <h2 class="text-xl font-bold text-kaiko-text mb-2">QRコードをスキャンしました</h2>
      <p class="text-kaiko-muted text-sm mb-4">この人のプロフィールを確認できます</p>
      <div class="flex gap-3">
        <button onclick={() => { scannedUserId = null; tab = 'scan'; startScan(); }} class="flex-1 py-3 rounded-xl border border-kaiko-border text-kaiko-muted hover:text-kaiko-text">
          キャンセル
        </button>
        <a href="/profile/{scannedUserId}" class="flex-1 py-3 rounded-xl bg-kaiko-accent hover:bg-kaiko-accent-hover text-white font-semibold text-center">
          プロフィールを見る
        </a>
      </div>
    </div>
  </div>
{/if}

{#if pendingAlias}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="pending-alias-title">
    <div class="bg-kaiko-surface rounded-2xl p-6 w-full max-w-sm shadow-xl border border-kaiko-border">
      <h2 id="pending-alias-title" class="text-xl font-bold text-kaiko-text mb-2">QRコードをスキャンされました</h2>
      <p class="text-kaiko-muted text-sm mb-4">この人に二つ名（あだ名）をつけてください</p>
      {#if pendingAlias.targetProfile}
        <div class="flex items-center gap-3 mb-4 p-3 rounded-lg bg-kaiko-surface-alt">
          {#if pendingAlias.targetProfile.avatarUrl}
            <img src={pendingAlias.targetProfile.avatarUrl} alt="" class="h-12 w-12 rounded-full object-cover" />
          {:else}
            <div class="h-12 w-12 rounded-full bg-kaiko-accent flex items-center justify-center text-white font-bold text-lg">
              {pendingAlias.targetProfile.nickname?.[0] ?? '?'}
            </div>
          {/if}
          <div>
            <p class="font-medium text-kaiko-text">{pendingAlias.targetProfile.nickname}</p>
            <p class="text-sm text-kaiko-muted">{pendingAlias.targetProfile.schoolName}</p>
          </div>
        </div>
      {/if}
      <input
        bind:value={pendingAliasInput}
        type="text"
        placeholder="例: ロボット部の佐藤くん"
        class="w-full bg-kaiko-bg border border-kaiko-border rounded-lg px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:outline-none focus:border-kaiko-accent mb-4"
      />
      <div class="flex gap-3">
        <button
          onclick={async () => {
            if (!pendingAlias) return;
            await fetch(`/api/connections/${pendingAlias.targetUserId}`, { method: 'DELETE' });
            pendingAlias = null;
            pendingAliasInput = '';
            startPoll();
          }}
          class="flex-1 py-3 rounded-xl border border-kaiko-border text-kaiko-muted hover:text-kaiko-text"
        >
          後で
        </button>
        <button
          onclick={submitPendingAlias}
          disabled={!pendingAliasInput.trim() || pendingSubmitting}
          class="flex-1 py-3 rounded-xl bg-kaiko-accent hover:bg-kaiko-accent-hover disabled:bg-kaiko-border disabled:text-kaiko-muted text-white font-semibold"
        >
          {pendingSubmitting ? '登録中...' : '登録する'}
        </button>
      </div>
    </div>
  </div>
{/if}
