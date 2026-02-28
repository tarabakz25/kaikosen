<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import QRCode from 'qrcode';
  import jsQR from 'jsqr';
  import { goto } from '$app/navigation';

  let { data } = $props();

  let tab = $state<'show' | 'scan'>('show');
  let canvas = $state<HTMLCanvasElement>(null as any);
  let videoEl = $state<HTMLVideoElement>(null as any);
  let scanCanvas = $state<HTMLCanvasElement>(null as any);
  let stream: MediaStream | null = null;
  let scanLoopId: number | null = null;
  let scannedUserId = $state<string | null>(null);
  let alias = $state('');
  let connecting = $state(false);
  let scanError = $state('');

  const userId = data.user?.id;

  onMount(() => {
    if (canvas && userId) {
      const url = `${location.origin}/connect?uid=${userId}`;
      QRCode.toCanvas(canvas, url, { width: 240, margin: 2, color: { dark: '#ffffff', light: '#111827' } });
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

  async function connect() {
    if (!scannedUserId || !alias.trim()) return;
    connecting = true;
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: scannedUserId, alias: alias.trim() })
    });
    connecting = false;
    if (res.ok) {
      scannedUserId = null;
      alias = '';
      goto('/');
    }
  }

  onDestroy(() => stopScan());

  $effect(() => {
    if (tab === 'scan') startScan();
    else stopScan();
  });
</script>

<div class="max-w-lg mx-auto px-4 py-6">
  <h1 class="text-2xl font-bold text-white mb-4">マイカード</h1>

  <div class="flex bg-gray-900 rounded-xl p-1 mb-6">
    <button onclick={() => tab = 'show'} class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors {tab === 'show' ? 'bg-indigo-600 text-white' : 'text-gray-400'}">
      表示
    </button>
    <button onclick={() => tab = 'scan'} class="flex-1 py-2 rounded-lg text-sm font-medium transition-colors {tab === 'scan' ? 'bg-indigo-600 text-white' : 'text-gray-400'}">
      スキャン
    </button>
  </div>

  {#if tab === 'show'}
    <div class="flex flex-col items-center gap-4">
      <div class="bg-gray-900 p-4 rounded-2xl">
        <canvas bind:this={canvas}></canvas>
      </div>
      {#if data.userProfile}
        <div class="text-center">
          <p class="text-white font-semibold text-lg">{data.userProfile.nickname}</p>
          <p class="text-gray-400">{data.userProfile.schoolName}</p>
          <div class="flex flex-wrap justify-center gap-1 mt-2">
            {#each data.userProfile.tags as tag}
              <span class="text-xs bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded-full">#{tag}</span>
            {/each}
          </div>
        </div>
      {/if}
      <p class="text-gray-500 text-sm">相手にスキャンしてもらおう</p>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-4">
      {#if scanError}
        <p class="text-red-400">{scanError}</p>
      {:else}
        <div class="relative w-full max-w-xs aspect-square bg-gray-900 rounded-2xl overflow-hidden">
          <video bind:this={videoEl} class="w-full h-full object-cover" playsinline muted></video>
          <canvas bind:this={scanCanvas} class="hidden"></canvas>
          <div class="absolute inset-0 border-2 border-indigo-500 rounded-2xl pointer-events-none"></div>
        </div>
        <p class="text-gray-400 text-sm">QRコードをカメラに向けてください</p>
      {/if}
    </div>
  {/if}
</div>

{#if scannedUserId}
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
    <div class="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
      <h2 class="text-xl font-bold text-white mb-2">繋がりを追加</h2>
      <p class="text-gray-400 text-sm mb-4">この人の二つ名（あだ名）を入力してください</p>
      <input
        bind:value={alias}
        type="text"
        placeholder="例: ロボット部の佐藤くん"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 mb-4"
      />
      <div class="flex gap-3">
        <button onclick={() => { scannedUserId = null; tab = 'scan'; startScan(); }} class="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400">
          キャンセル
        </button>
        <button onclick={connect} disabled={!alias.trim() || connecting} class="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-semibold">
          {connecting ? '登録中...' : '追加する'}
        </button>
      </div>
    </div>
  </div>
{/if}
