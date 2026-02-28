<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { GraphNode, GraphEdge } from '$lib/types';

  let { data } = $props();

  let svgEl: SVGSVGElement;
  let selectedNode = $state<GraphNode | null>(null);
  let selectedAlias = $state<string | null>(null);
  let currentUserId = $state<string | null>(null);
  let graphEdges = $state<GraphEdge[]>([]);

  function schoolColor(schoolName: string): string {
    let hash = 0;
    for (const c of schoolName) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
  }

  onMount(async () => {
    const res = await fetch('/api/graph');
    if (!res.ok) return;
    const { nodes, edges, currentUserId: uid }: { nodes: GraphNode[], edges: GraphEdge[], currentUserId: string } = await res.json();
    currentUserId = uid;
    graphEdges = edges;

    if (nodes.length === 0) return;

    const width = svgEl.clientWidth || 375;
    const height = svgEl.clientHeight || 500;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (e) => g.attr('transform', e.transform.toString()))
    );

    const sim = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges as any).id((d: any) => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = g.append('g').selectAll('line')
      .data(edges).enter().append('line')
      .attr('stroke', '#374151').attr('stroke-width', 1.5);

    const node = g.append('g').selectAll('circle')
      .data(nodes).enter().append('circle')
      .attr('r', 18)
      .attr('fill', (d) => schoolColor(d.schoolName))
      .attr('stroke', '#1f2937').attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        selectedNode = d;
        const edge = graphEdges.find((e) => e.source === currentUserId && e.target === d.id);
        selectedAlias = edge?.alias ?? null;
      });

    const label = g.append('g').selectAll('text')
      .data(nodes).enter().append('text')
      .text((d) => d.nickname)
      .attr('text-anchor', 'middle').attr('dy', 32)
      .attr('fill', '#d1d5db').attr('font-size', 11)
      .style('pointer-events', 'none');

    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    node.call(
      d3.drag<SVGCircleElement, any>()
        .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on('end', (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
    );
  });
</script>

<div class="relative w-full" style="height: calc(100vh - 4rem - 4rem);">
  <svg bind:this={svgEl} class="w-full h-full"></svg>

  {#if data.userProfile && (data.userProfile as any).tags?.length === 0}
    <div class="absolute top-4 left-4 right-4 bg-indigo-900/80 text-indigo-200 text-sm px-4 py-3 rounded-xl">
      プロフィールを設定してグラフに表示されよう →
      <a href="/account" class="underline font-medium">設定</a>
    </div>
  {/if}
</div>

{#if selectedNode}
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onclick={() => { selectedNode = null; selectedAlias = null; }}>
    <div class="bg-gray-900 rounded-2xl w-full max-w-lg p-6" onclick={(e) => e.stopPropagation()}>
      <div class="flex items-center gap-4 mb-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white" style="background-color: {schoolColor(selectedNode.schoolName)}">
          {selectedNode.nickname[0]}
        </div>
        <div>
          <h2 class="text-xl font-bold text-white">{selectedNode.nickname}</h2>
          <p class="text-gray-400">{selectedNode.schoolName}</p>
          {#if selectedAlias}
            <p class="text-indigo-400 text-sm mt-0.5">二つ名: {selectedAlias}</p>
          {/if}
        </div>
      </div>
      <div class="flex flex-wrap gap-1.5">
        {#each selectedNode.tags as tag}
          <span class="text-sm bg-indigo-900 text-indigo-300 px-3 py-1 rounded-full">#{tag}</span>
        {/each}
      </div>
      <button onclick={() => { selectedNode = null; selectedAlias = null; }} class="mt-4 w-full py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white transition-colors">
        閉じる
      </button>
    </div>
  </div>
{/if}
