<script lang="ts">
	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import type { SimulationLinkDatum, SimulationNodeDatum } from 'd3';
	import { resolve } from '$app/paths';
	import { parseUtc } from '$lib/date';
	import type { GraphNode, GraphEdge } from '$lib/types';

	type GraphSimNode = GraphNode & SimulationNodeDatum;
	type GraphSimLink = SimulationLinkDatum<GraphSimNode> & {
		alias: string;
		sharedEventCount: number;
	};

	let { data } = $props();

	function formatConnectionDate(d: string): string {
		return parseUtc(d).toLocaleDateString('ja-JP', {
			month: 'short',
			day: 'numeric',
			weekday: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatEventDate(d: string): string {
		return parseUtc(d).toLocaleDateString('ja-JP', {
			month: 'short',
			day: 'numeric',
			weekday: 'short'
		});
	}

	let svgEl: SVGSVGElement;
	let selectedNode = $state<GraphNode | null>(null);
	let selectedAlias = $state<string | null>(null);
	let connectionDetails = $state<{
		connectedAt: string | null;
		sharedEvents: Array<{
			id: string;
			title: string;
			startAt: string;
			endAt: string | null;
			location: string | null;
		}>;
	} | null>(null);

	function schoolColor(schoolName: string): string {
		let hash = 0;
		for (const c of schoolName) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
		const hue = Math.abs(hash) % 360;
		return `hsl(${hue}, 65%, 55%)`;
	}

	function themeColor(name: string, fallback: string): string {
		const v = getComputedStyle(document.documentElement)
			.getPropertyValue(`--color-kaiko-${name}`)
			.trim();
		return v || fallback;
	}

	function flameFilter(count: number): string | null {
		if (count >= 6) return 'url(#flame-3)';
		if (count >= 3) return 'url(#flame-2)';
		if (count >= 1) return 'url(#flame-1)';
		return null;
	}

	$effect(() => {
		const node = selectedNode;
		if (!node) {
			connectionDetails = null;
			return;
		}
		const targetId = node.id;
		fetch(`/api/connections/${targetId}/details`)
			.then((r) => r.json())
			.then((d) => {
				if (selectedNode?.id === targetId) connectionDetails = d;
			})
			.catch(() => {
				if (selectedNode?.id === targetId) connectionDetails = null;
			});
	});

	onMount(async () => {
		const res = await fetch('/api/graph');
		if (!res.ok) return;
		const {
			nodes,
			edges,
			currentUserId: uid
		}: { nodes: GraphNode[]; edges: GraphEdge[]; currentUserId: string } = await res.json();
		if (nodes.length === 0) return;

		// sharedEventCountのルックアップマップ (D3がedges変換する前に構築)
		const sharedCountMap: Record<string, number> = {};
		for (const e of edges) {
			if (e.source === uid) {
				sharedCountMap[e.target] = e.sharedEventCount;
			}
		}

		const width = svgEl.clientWidth || 375;
		const height = svgEl.clientHeight || 500;

		const svg = d3.select(svgEl);
		svg.selectAll('*').remove();

		// SVGフィルター定義
		const defs = svg.append('defs');

		// 炎エフェクトフィルター (3段階)
		const flameConfigs = [
			{ id: 'flame-1', blur: 3, alphaBoost: 2 },
			{ id: 'flame-2', blur: 5, alphaBoost: 2.5 },
			{ id: 'flame-3', blur: 8, alphaBoost: 3 }
		];
		for (const cfg of flameConfigs) {
			const filter = defs
				.append('filter')
				.attr('id', cfg.id)
				.attr('x', '-80%')
				.attr('y', '-80%')
				.attr('width', '260%')
				.attr('height', '260%');
			filter
				.append('feGaussianBlur')
				.attr('in', 'SourceGraphic')
				.attr('stdDeviation', cfg.blur)
				.attr('result', 'blur');
			filter
				.append('feColorMatrix')
				.attr('in', 'blur')
				.attr('type', 'matrix')
				// 橙色グロー: R強調, G中程度, B=0, alpha増幅
				.attr('values', `2 0 0 0 0  0.6 0 0 0 0  0 0 0 0 0  0 0 0 ${cfg.alphaBoost} -0.5`)
				.attr('result', 'orange');
			const merge = filter.append('feMerge');
			merge.append('feMergeNode').attr('in', 'orange');
			merge.append('feMergeNode').attr('in', 'SourceGraphic');
		}

		// アバター用clipPath (objectBoundingBox で位置更新不要)
		for (const n of nodes) {
			defs
				.append('clipPath')
				.attr('id', `clip-${n.id}`)
				.attr('clipPathUnits', 'objectBoundingBox')
				.append('circle')
				.attr('cx', 0.5)
				.attr('cy', 0.5)
				.attr('r', 0.5);
		}

		const g = svg.append('g');

		svg.call(
			d3
				.zoom<SVGSVGElement, unknown>()
				.scaleExtent([0.3, 3])
				.on('zoom', (e) => g.attr('transform', e.transform.toString()))
		);

		const simLinks: GraphSimLink[] = edges.map((e) => ({
			source: e.source,
			target: e.target,
			alias: e.alias,
			sharedEventCount: e.sharedEventCount
		}));

		const sim = d3
			.forceSimulation(nodes as GraphSimNode[])
			.force(
				'link',
				d3
					.forceLink(simLinks)
					.id((d) => (d as GraphSimNode).id)
					.distance(80)
			)
			.force('charge', d3.forceManyBody().strength(-200))
			.force('center', d3.forceCenter(width / 2, height / 2));

		const linkColor = themeColor('border', '#d1d5db');
		const textColor = themeColor('text', '#1f2937');
		const strokeColor = themeColor('text', '#1f2937');

		const link = g
			.append('g')
			.selectAll('line')
			.data(simLinks)
			.enter()
			.append('line')
			.attr('stroke', linkColor)
			.attr('stroke-width', 1.5);

		// ノードをgroupとして作成
		const node = g
			.append('g')
			.selectAll<SVGGElement, GraphSimNode>('g')
			.data(nodes as GraphSimNode[])
			.enter()
			.append('g')
			.style('cursor', 'pointer')
			.on('click', (_, d) => {
				selectedNode = d;
				selectedAlias = null;
				// aliasを別途ルックアップ (edgesはD3変換後なので sharedCountMapと同様に事前マップを使う)
				for (const e of edges) {
					if (e.source === uid && e.target === d.id) {
						selectedAlias = e.alias || null;
						break;
					}
				}
			});

		// 各ノードにアバター or 頭文字を描画
		node.each(function (d) {
			const el = d3.select(this);
			const filter = flameFilter(sharedCountMap[d.id] ?? 0);
			if (filter) el.attr('filter', filter);

			if (d.avatarUrl) {
				// ストローク用サークル
				el.append('circle')
					.attr('r', 19)
					.attr('fill', schoolColor(d.schoolName))
					.attr('stroke', strokeColor)
					.attr('stroke-width', 2);
				// アバター画像 (clipPathで円形)
				el.append('image')
					.attr('href', d.avatarUrl)
					.attr('x', -18)
					.attr('y', -18)
					.attr('width', 36)
					.attr('height', 36)
					.attr('clip-path', `url(#clip-${d.id})`);
			} else {
				// フォールバック: 頭文字
				el.append('circle')
					.attr('r', 18)
					.attr('fill', schoolColor(d.schoolName))
					.attr('stroke', strokeColor)
					.attr('stroke-width', 2);
				el.append('text')
					.attr('text-anchor', 'middle')
					.attr('dy', '0.35em')
					.attr('fill', '#fff')
					.attr('font-size', 14)
					.attr('font-weight', 'bold')
					.style('pointer-events', 'none')
					.text(d.nickname[0]);
			}
		});

		const label = g
			.append('g')
			.selectAll('text')
			.data(nodes as GraphSimNode[])
			.enter()
			.append('text')
			.text((d) => d.nickname)
			.attr('text-anchor', 'middle')
			.attr('dy', 32)
			.attr('fill', textColor)
			.attr('font-size', 11)
			.style('pointer-events', 'none');

		sim.on('tick', () => {
			link
				.attr('x1', (d) => (d.source as GraphSimNode).x ?? 0)
				.attr('y1', (d) => (d.source as GraphSimNode).y ?? 0)
				.attr('x2', (d) => (d.target as GraphSimNode).x ?? 0)
				.attr('y2', (d) => (d.target as GraphSimNode).y ?? 0);
			node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
			label.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
		});

		node.call(
			d3
				.drag<SVGGElement, GraphSimNode>()
				.on('start', (e, d) => {
					if (!e.active) sim.alphaTarget(0.3).restart();
					d.fx = d.x;
					d.fy = d.y;
				})
				.on('drag', (e, d) => {
					d.fx = e.x;
					d.fy = e.y;
				})
				.on('end', (e, d) => {
					if (!e.active) sim.alphaTarget(0);
					d.fx = null;
					d.fy = null;
				})
		);
	});
</script>

<div class="relative w-full" style="height: calc(100vh - 4rem - 4rem);">
	<svg bind:this={svgEl} class="h-full w-full"></svg>

	{#if data.userProfile && (data.userProfile.tags?.length ?? 0) === 0}
		<div
			class="absolute top-4 right-4 left-4 rounded-xl border border-kaiko-accent/30 bg-kaiko-accent-muted/90 px-4 py-3 text-sm text-kaiko-accent-dark"
		>
			プロフィールを設定してグラフに表示されよう →
			<a href={resolve('/account')} class="font-medium underline">設定</a>
		</div>
	{/if}
</div>

{#if selectedNode}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
		onclick={() => (selectedNode = null)}
	>
		<div
			class="w-full max-w-lg rounded-2xl border border-kaiko-border bg-kaiko-surface p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-4 flex items-center gap-4">
				{#if selectedNode.avatarUrl}
					<img
						src={selectedNode.avatarUrl}
						alt={selectedNode.nickname}
						class="h-14 w-14 rounded-full border-2 object-cover"
						style="border-color: {schoolColor(selectedNode.schoolName)}"
					/>
				{:else}
					<div
						class="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
						style="background-color: {schoolColor(selectedNode.schoolName)}"
					>
						{selectedNode.nickname[0]}
					</div>
				{/if}
				<div>
					{#if selectedAlias}
						<p class="text-sm text-kaiko-muted">「{selectedAlias}」でおなじみ</p>
					{/if}
					<h2 class="text-xl font-bold text-kaiko-text">{selectedNode.nickname}</h2>
					<p class="text-kaiko-muted">{selectedNode.schoolName}</p>
				</div>
			</div>

			<div class="mb-4 flex flex-wrap gap-1.5">
				{#each selectedNode.tags as tag (tag)}
					<span class="rounded-full bg-kaiko-accent-muted px-3 py-1 text-sm text-kaiko-accent-dark"
						>#{tag}</span
					>
				{/each}
			</div>

			{#if selectedNode.message}
				<p class="mb-4 text-sm text-kaiko-muted">{selectedNode.message}</p>
			{/if}

			{#if connectionDetails}
				{@const timelineItems = (() => {
					const list: Array<{
						type: 'connection' | 'event';
						date: string;
						label?: string;
						event?: { id: string; title: string; startAt: string; location: string | null };
					}> = [];
					if (connectionDetails.connectedAt) {
						list.push({
							type: 'connection',
							date: connectionDetails.connectedAt,
							label: '繋がった日'
						});
					}
					for (const ev of connectionDetails.sharedEvents) {
						list.push({ type: 'event', date: ev.startAt, event: ev });
					}
					return list.sort((a, b) => parseUtc(a.date).getTime() - parseUtc(b.date).getTime());
				})()}
				{#if timelineItems.length > 0}
					<div class="mb-4 space-y-3">
						<h3 class="text-sm font-semibold text-kaiko-text">つながりの履歴</h3>
						<ul class="space-y-2">
							{#each timelineItems as item (`${item.type}-${item.date}-${item.event?.id ?? ''}`)}
								<li class="flex items-start gap-3 text-sm">
									<span class="shrink-0 text-kaiko-muted"
										>{item.type === 'connection'
											? formatConnectionDate(item.date)
											: formatEventDate(item.date)}</span
									>
									{#if item.type === 'connection'}
										<span class="text-kaiko-text">🔗 {item.label}</span>
									{:else if item.event}
										<span class="flex flex-col gap-0.5">
											<a
												href={resolve('/calendar/[slug]', { slug: item.event.id })}
												class="text-kaiko-accent hover:underline"
											>
												{item.event.title}
											</a>
											{#if item.event.location}
												<span class="text-xs text-kaiko-muted">📍 {item.event.location}</span>
											{/if}
										</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			{:else if selectedNode}
				<div class="mb-4 text-sm text-kaiko-muted">読み込み中…</div>
			{/if}

			<button
				onclick={() => (selectedNode = null)}
				class="mt-4 w-full rounded-xl border border-kaiko-border py-3 text-kaiko-muted transition-colors hover:bg-kaiko-surface-alt hover:text-kaiko-text"
			>
				閉じる
			</button>
		</div>
	</div>
{/if}
