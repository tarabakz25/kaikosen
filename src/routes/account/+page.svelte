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
</script>

<div class="max-w-lg mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold text-kaiko-text mb-8">アカウント</h1>

	<div class="flex flex-col items-center gap-4">
		<!-- アイコン -->
		{#if data.user?.image}
			<img
				src={data.user.image}
				alt="アイコン"
				class="w-24 h-24 rounded-full object-cover border-2 border-kaiko-border"
			/>
		{:else}
			<div
				class="w-24 h-24 rounded-full bg-kaiko-accent flex items-center justify-center text-3xl font-bold text-white"
			>
				{data.userProfile?.nickname?.[0] ?? '?'}
			</div>
		{/if}

		<!-- ニックネーム・高専名 -->
		<div class="text-center">
			<p class="text-xl font-bold text-kaiko-text">{data.userProfile?.nickname ?? '未設定'}</p>
			<p class="text-kaiko-muted mt-1">{data.userProfile?.schoolName ?? '未設定'}</p>
		</div>

		<!-- タグ -->
		{#if (data.userProfile?.tags ?? []).length > 0}
			<div class="flex flex-wrap justify-center gap-1.5">
				{#each data.userProfile?.tags ?? [] as tag}
					<span class="text-sm bg-kaiko-accent-muted text-kaiko-accent-dark px-3 py-1 rounded-full">#{tag}</span>
				{/each}
			</div>
		{/if}

		<!-- アクション -->
		<div class="w-full space-y-3 mt-4">
			<a
				href="/account/edit"
				class="block w-full py-3 rounded-xl bg-kaiko-accent hover:bg-kaiko-accent-hover text-white font-semibold text-center transition-colors"
			>
				プロフィールを編集
			</a>
			<button
				onclick={signOut}
				class="w-full py-3 rounded-xl border border-kaiko-border text-kaiko-muted hover:text-kaiko-text hover:bg-kaiko-surface-alt transition-colors"
			>
				ログアウト
			</button>
		</div>

		<!-- テーマ切り替え -->
		<div class="w-full pt-6 mt-6 border-t border-kaiko-border">
			<p class="text-sm text-kaiko-muted mb-3">表示モード</p>
			<button
				type="button"
				role="switch"
				aria-checked={isDark}
				aria-label="ライトモードとダークモードを切り替え"
				onclick={toggleTheme}
				class="relative flex w-full max-w-[200px] mx-auto h-12 rounded-full bg-kaiko-surface-alt border border-kaiko-border overflow-hidden cursor-pointer transition-colors hover:border-kaiko-accent/50"
			>
				<span
					class="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-kaiko-accent transition-transform duration-200 {isDark
						? 'translate-x-full' : 'translate-x-0'}"
				></span>
				<span
					class="relative z-10 flex-1 flex items-center justify-center text-sm font-medium transition-colors {!isDark
						? 'text-white' : 'text-kaiko-muted'}"
				>
					ライト
				</span>
				<span
					class="relative z-10 flex-1 flex items-center justify-center text-sm font-medium transition-colors {isDark
						? 'text-white' : 'text-kaiko-muted'}"
				>
					ダーク
				</span>
			</button>
		</div>
	</div>
</div>
