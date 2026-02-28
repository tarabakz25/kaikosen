<script lang="ts">
	import { supabase } from '$lib/auth-client';
	import { goto } from '$app/navigation';

	let { data } = $props();

	async function signOut() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<div class="max-w-lg mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold text-white mb-8">アカウント</h1>

	<div class="flex flex-col items-center gap-4">
		<!-- アイコン -->
		{#if data.user?.image}
			<img
				src={data.user.image}
				alt="アイコン"
				class="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
			/>
		{:else}
			<div
				class="w-24 h-24 rounded-full bg-indigo-700 flex items-center justify-center text-3xl font-bold text-white"
			>
				{data.userProfile?.nickname?.[0] ?? '?'}
			</div>
		{/if}

		<!-- ニックネーム・高専名 -->
		<div class="text-center">
			<p class="text-xl font-bold text-white">{data.userProfile?.nickname ?? '未設定'}</p>
			<p class="text-gray-400 mt-1">{data.userProfile?.schoolName ?? '未設定'}</p>
		</div>

		<!-- タグ -->
		{#if (data.userProfile?.tags ?? []).length > 0}
			<div class="flex flex-wrap justify-center gap-1.5">
				{#each data.userProfile?.tags ?? [] as tag}
					<span class="text-sm bg-indigo-900 text-indigo-300 px-3 py-1 rounded-full">#{tag}</span>
				{/each}
			</div>
		{/if}

		<!-- アクション -->
		<div class="w-full space-y-3 mt-4">
			<a
				href="/account/edit"
				class="block w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center transition-colors"
			>
				プロフィールを編集
			</a>
			<button
				onclick={signOut}
				class="w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
			>
				ログアウト
			</button>
		</div>
	</div>
</div>
