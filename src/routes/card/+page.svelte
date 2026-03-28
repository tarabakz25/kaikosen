<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import QRCode from 'qrcode';
	import jsQR from 'jsqr';

	let { data } = $props();

	let tab = $state<'show' | 'scan'>('show');
	let canvas = $state<HTMLCanvasElement | null>(null);
	let videoEl = $state<HTMLVideoElement | null>(null);
	let scanCanvas = $state<HTMLCanvasElement | null>(null);
	let stream: MediaStream | null = null;
	let scanLoopId: number | null = null;
	let pollIntervalId: ReturnType<typeof setInterval> | null = null;
	let scannedUserId = $state<string | null>(null);
	let scannedProfile = $state<{
		nickname: string;
		schoolName: string;
		avatarUrl: string | null;
	} | null>(null);
	let scannedAliasInput = $state('');
	let scannedSubmitting = $state(false);
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
			QRCode.toCanvas(canvas, url, {
				width: 240,
				margin: 2,
				color: { dark: '#1f2937', light: '#ffffff' }
			});
		}
	});

	async function startScan() {
		scanError = '';
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
			if (!videoEl) return;
			videoEl.srcObject = stream;
			videoEl.play();
			scanLoop();
		} catch {
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
					scannedProfile = null;
					scannedAliasInput = '';
					// スキャンしたことをサーバーに通知（相手の画面に二つ名登録モーダルを出すため）
					fetch('/api/connections/scanned', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ scannedUserId: uid })
					}).catch(() => {});
					// 相手のプロフィールを取得
					fetch(`/api/profile/${uid}`)
						.then((r) => (r.ok ? r.json() : null))
						.then((p) => {
							if (p)
								scannedProfile = {
									nickname: p.nickname,
									schoolName: p.schoolName,
									avatarUrl: p.avatarUrl
								};
						})
						.catch(() => {});
					return;
				}
			}
		}
		scanLoopId = requestAnimationFrame(scanLoop);
	}

	function stopScan() {
		if (scanLoopId) cancelAnimationFrame(scanLoopId);
		if (stream) {
			stream.getTracks().forEach((t) => t.stop());
			stream = null;
		}
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
			goto(resolve('/'));
		}
	}

	function stopPoll() {
		if (pollIntervalId) {
			clearInterval(pollIntervalId);
			pollIntervalId = null;
		}
	}

	onDestroy(() => {
		stopScan();
		stopPoll();
	});

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

<div class="mx-auto max-w-lg px-4 py-6">
	<h1 class="mb-4 text-2xl font-bold text-kaiko-text">マイカード</h1>

	<div class="mb-6 flex rounded-xl border border-kaiko-border bg-kaiko-surface-alt p-1">
		<button
			onclick={() => (tab = 'show')}
			class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors {tab === 'show'
				? 'bg-kaiko-accent text-white'
				: 'text-kaiko-muted'}"
		>
			表示
		</button>
		<button
			onclick={() => (tab = 'scan')}
			class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors {tab === 'scan'
				? 'bg-kaiko-accent text-white'
				: 'text-kaiko-muted'}"
		>
			スキャン
		</button>
	</div>

	{#if tab === 'show'}
		<div class="flex flex-col items-center gap-4">
			<div class="rounded-2xl border border-kaiko-border bg-kaiko-surface p-4">
				<canvas bind:this={canvas}></canvas>
			</div>
			{#if data.userProfile}
				<div class="text-center">
					<p class="text-lg font-semibold text-kaiko-text">{data.userProfile.nickname}</p>
					<p class="text-kaiko-muted">{data.userProfile.schoolName}</p>
					<div class="mt-2 flex flex-wrap justify-center gap-1">
						{#each data.userProfile.tags as tag (tag)}
							<span
								class="rounded-full bg-kaiko-accent-muted px-2 py-0.5 text-xs text-kaiko-accent-dark"
								>#{tag}</span
							>
						{/each}
					</div>
				</div>
			{/if}
			<p class="text-sm text-kaiko-muted">相手にスキャンしてもらおう</p>
		</div>
	{:else}
		<div class="flex flex-col items-center gap-4">
			{#if scanError}
				<p class="text-red-500">{scanError}</p>
			{:else}
				<div
					class="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-kaiko-border bg-kaiko-surface"
				>
					<video bind:this={videoEl} class="h-full w-full object-cover" playsinline muted></video>
					<canvas bind:this={scanCanvas} class="hidden"></canvas>
					<div
						class="pointer-events-none absolute inset-0 rounded-2xl border-2 border-kaiko-accent"
					></div>
				</div>
				<p class="text-sm text-kaiko-muted">QRコードをカメラに向けてください</p>
			{/if}
		</div>
	{/if}
</div>

{#if scannedUserId}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="scanned-alias-title"
	>
		<div
			class="w-full max-w-sm rounded-2xl border border-kaiko-border bg-kaiko-surface p-6 shadow-xl"
		>
			<h2 id="scanned-alias-title" class="mb-2 text-xl font-bold text-kaiko-text">
				QRコードをスキャンしました
			</h2>
			<p class="mb-4 text-sm text-kaiko-muted">この人に二つ名（あだ名）をつけてください</p>
			{#if scannedProfile}
				<div class="mb-4 flex items-center gap-3 rounded-lg bg-kaiko-surface-alt p-3">
					{#if scannedProfile.avatarUrl}
						<img
							src={scannedProfile.avatarUrl}
							alt=""
							class="h-12 w-12 rounded-full object-cover"
						/>
					{:else}
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-kaiko-accent text-lg font-bold text-white"
						>
							{scannedProfile.nickname?.[0] ?? '?'}
						</div>
					{/if}
					<div>
						<p class="font-medium text-kaiko-text">{scannedProfile.nickname}</p>
						<p class="text-sm text-kaiko-muted">{scannedProfile.schoolName}</p>
					</div>
				</div>
			{:else}
				<p class="mb-4 text-sm text-kaiko-muted">読み込み中...</p>
			{/if}
			<input
				bind:value={scannedAliasInput}
				type="text"
				placeholder="例: ロボット部の佐藤くん"
				class="mb-4 w-full rounded-lg border border-kaiko-border bg-kaiko-bg px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
			/>
			<div class="flex gap-3">
				<button
					onclick={() => {
						scannedUserId = null;
						scannedProfile = null;
						scannedAliasInput = '';
						tab = 'scan';
						startScan();
					}}
					class="flex-1 rounded-xl border border-kaiko-border py-3 text-kaiko-muted hover:text-kaiko-text"
				>
					キャンセル
				</button>
				<button
					onclick={async () => {
						if (!scannedUserId || !scannedAliasInput.trim()) return;
						scannedSubmitting = true;
						const res = await fetch('/api/connections/add', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ targetUserId: scannedUserId, alias: scannedAliasInput.trim() })
						});
						scannedSubmitting = false;
						if (res.ok) {
							goto(resolve('/'));
						}
					}}
					disabled={!scannedAliasInput.trim() || scannedSubmitting}
					class="flex-1 rounded-xl bg-kaiko-accent py-3 font-semibold text-white hover:bg-kaiko-accent-hover disabled:bg-kaiko-border disabled:text-kaiko-muted"
				>
					{scannedSubmitting ? '登録中...' : '登録する'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if pendingAlias}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="pending-alias-title"
	>
		<div
			class="w-full max-w-sm rounded-2xl border border-kaiko-border bg-kaiko-surface p-6 shadow-xl"
		>
			<h2 id="pending-alias-title" class="mb-2 text-xl font-bold text-kaiko-text">
				QRコードをスキャンされました
			</h2>
			<p class="mb-4 text-sm text-kaiko-muted">この人に二つ名（あだ名）をつけてください</p>
			{#if pendingAlias.targetProfile}
				<div class="mb-4 flex items-center gap-3 rounded-lg bg-kaiko-surface-alt p-3">
					{#if pendingAlias.targetProfile.avatarUrl}
						<img
							src={pendingAlias.targetProfile.avatarUrl}
							alt=""
							class="h-12 w-12 rounded-full object-cover"
						/>
					{:else}
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-kaiko-accent text-lg font-bold text-white"
						>
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
				placeholder="例: ひつまぶしの人"
				class="mb-4 w-full rounded-lg border border-kaiko-border bg-kaiko-bg px-4 py-3 text-kaiko-text placeholder-kaiko-muted focus:border-kaiko-accent focus:outline-none"
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
					class="flex-1 rounded-xl border border-kaiko-border py-3 text-kaiko-muted hover:text-kaiko-text"
				>
					後で
				</button>
				<button
					onclick={submitPendingAlias}
					disabled={!pendingAliasInput.trim() || pendingSubmitting}
					class="flex-1 rounded-xl bg-kaiko-accent py-3 font-semibold text-white hover:bg-kaiko-accent-hover disabled:bg-kaiko-border disabled:text-kaiko-muted"
				>
					{pendingSubmitting ? '登録中...' : '登録する'}
				</button>
			</div>
		</div>
	</div>
{/if}
