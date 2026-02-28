<script lang="ts">
  import { authClient } from '$lib/auth-client';
  import { goto } from '$app/navigation';

  let { data } = $props();

  let nickname = $state(data.userProfile?.nickname ?? '');
  let schoolName = $state(data.userProfile?.schoolName ?? '');
  let tagInput = $state('');
  let tags = $state<string[]>(data.userProfile?.tags ?? []);
  let saving = $state(false);
  let message = $state('');

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (t && !tags.includes(t)) {
      tags = [...tags, t];
    }
    tagInput = '';
  }

  function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag);
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }

  async function save() {
    saving = true;
    message = '';
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, schoolName, tags })
      });
      if (res.ok) {
        message = '保存しました';
        goto('/');
      } else {
        message = '保存に失敗しました';
      }
    } catch {
      message = 'エラーが発生しました';
    }
    saving = false;
  }

  async function signOut() {
    await authClient.signOut({ fetchOptions: { onSuccess: () => goto('/login') } });
  }
</script>

<div class="max-w-lg mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold text-white mb-6">プロフィール設定</h1>

  <div class="space-y-4">
    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">ニックネーム</label>
      <input
        bind:value={nickname}
        type="text"
        placeholder="例: 田中太郎"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">高専名</label>
      <input
        bind:value={schoolName}
        type="text"
        placeholder="例: 東京高専"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-300 mb-1">タグ（スキル・興味）</label>
      <div class="flex flex-wrap gap-2 mb-2">
        {#each tags as tag}
          <span class="flex items-center gap-1 bg-indigo-900 text-indigo-200 text-sm px-3 py-1 rounded-full">
            #{tag}
            <button onclick={() => removeTag(tag)} class="hover:text-white ml-1">×</button>
          </span>
        {/each}
      </div>
      <input
        bind:value={tagInput}
        onkeydown={handleTagKeydown}
        onblur={addTag}
        type="text"
        placeholder="タグを入力してEnter (例: Rust, ロボット)"
        class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
      />
    </div>

    {#if message}
      <p class="text-sm text-indigo-400">{message}</p>
    {/if}

    <button
      onclick={save}
      disabled={saving || !nickname || !schoolName}
      class="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
    >
      {saving ? '保存中...' : '保存する'}
    </button>

    <button
      onclick={signOut}
      class="w-full bg-transparent border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 font-medium py-3 rounded-lg transition-colors"
    >
      ログアウト
    </button>
  </div>
</div>
