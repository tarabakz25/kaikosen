<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { getTheme, setTheme } from '$lib/theme';

	let { data } = $props();

	let isDark = $state(false);

	onMount(() => {
		isDark = getTheme() === 'dark';
	});

	function toggleTheme() {
		isDark = !isDark;
		setTheme(isDark ? 'dark' : 'light');
	}

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}

	function onAvatarError(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		img.classList.add('hidden');
		(img.nextElementSibling as HTMLElement)?.classList.remove('hidden');
	}
</script>

<div class="mx-auto max-w-lg px-4 py-8">
	<h1 class="mb-8 text-2xl font-bold text-kaiko-text">アカウント</h1>

	<div class="flex flex-col items-center gap-4">
		<!-- アイコン（profile.avatarUrl優先、なければOAuth画像） -->
		{#if data.userProfile?.avatarUrl ?? data.user?.image}
			<div class="relative h-24 w-24">
				<img
					src={data.userProfile?.avatarUrl ?? data.user?.image}
					alt="アイコン"
					class="h-24 w-24 rounded-full border-2 border-kaiko-border object-cover"
					onerror={onAvatarError}
				/>
				<div
					class="absolute inset-0 flex hidden items-center justify-center rounded-full border-2 border-kaiko-border bg-kaiko-accent text-3xl font-bold text-white"
				>
					{data.userProfile?.nickname?.[0] ?? '?'}
				</div>
			</div>
		{:else}
			<div
				class="flex h-24 w-24 items-center justify-center rounded-full bg-kaiko-accent text-3xl font-bold text-white"
			>
				{data.userProfile?.nickname?.[0] ?? '?'}
			</div>
		{/if}

		<!-- ニックネーム・高専名 -->
		<div class="w-full text-center">
			<p class="text-xl font-bold text-kaiko-text">{data.userProfile?.nickname ?? '未設定'}</p>
			<p class="mt-1 text-kaiko-muted">{data.userProfile?.schoolName ?? '未設定'}</p>
		</div>

		<!-- タグ -->
		{#if (data.userProfile?.tags ?? []).length > 0}
			<div class="flex flex-wrap justify-center gap-1.5">
				{#each data.userProfile?.tags ?? [] as tag}
					<span class="rounded-full bg-kaiko-accent-muted px-3 py-1 text-sm text-kaiko-accent-dark"
						>#{tag}</span
					>
				{/each}
			</div>
		{/if}
		<!-- 自己紹介（Twitter風） -->
		{#if (data.userProfile?.message ?? data.user?.message ?? '').trim()}
			<p class="w-full text-left text-[15px] leading-relaxed whitespace-pre-wrap text-kaiko-text">
				{(data.userProfile?.message ?? data.user?.message ?? '').trim()}
			</p>
		{/if}

		<!-- アクション -->
		<div class="mt-4 w-full space-y-3">
			<a
				href="/account/edit"
				class="block w-full rounded-xl bg-kaiko-accent py-3 text-center font-semibold text-white transition-colors hover:bg-kaiko-accent-hover"
			>
				プロフィールを編集
			</a>
			<button
				onclick={signOut}
				class="w-full rounded-xl border border-kaiko-border py-3 text-kaiko-muted transition-colors hover:bg-kaiko-surface-alt hover:text-kaiko-text"
			>
				ログアウト
			</button>
		</div>

		<!-- テーマ切り替え -->
		<div class="mt-6 w-full border-t border-kaiko-border pt-6">
			<p class="mb-3 text-sm text-kaiko-muted">表示モード</p>
			<button
				type="button"
				role="switch"
				aria-checked={isDark}
				aria-label="ライトモードとダークモードを切り替え"
				onclick={toggleTheme}
				class="relative mx-auto flex h-12 w-full max-w-[200px] cursor-pointer overflow-hidden rounded-full border border-kaiko-border bg-kaiko-surface-alt transition-colors hover:border-kaiko-accent/50"
			>
				<span
					class="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-kaiko-accent transition-transform duration-200 {isDark
						? 'translate-x-full'
						: 'translate-x-0'}"
				></span>
				<span
					class="relative z-10 flex flex-1 items-center justify-center text-sm font-medium transition-colors {!isDark
						? 'text-white'
						: 'text-kaiko-muted'}"
				>
					ライト
				</span>
				<span
					class="relative z-10 flex flex-1 items-center justify-center text-sm font-medium transition-colors {isDark
						? 'text-white'
						: 'text-kaiko-muted'}"
				>
					ダーク
				</span>
			</button>
		</div>
	</div>
</div>
