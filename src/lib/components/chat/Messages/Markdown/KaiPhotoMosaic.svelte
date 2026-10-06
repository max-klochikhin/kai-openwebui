<script lang="ts">
	import { onMount } from 'svelte';

	// Telegram-like album: every photo is shown, tiles follow each photo's orientation and size.
	export let urls: string[] = [];
	export let href: string | null = null;
	export let title = '';

	const DEFAULT_RATIO = 4 / 3;
	const PRELOAD_TIMEOUT_MS = 8000;

	type Block =
		| { kind: 'row'; idx: number[]; aspect: number }
		| { kind: 'trio'; idx: [number, number, number]; aspect: number };

	let items: { url: string; ratio: number }[] = [];
	let ready = false;

	// CDN sizes: $_57 = 1600 px (about 600 KB), $_20 = 800 px (about 120 KB).
	const sized = (url: string) => url.replace('rule=$_57', 'rule=$_20');
	const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

	function measure(url: string): Promise<{ url: string; ratio: number } | null> {
		return new Promise((resolve) => {
			const img = new Image();
			const timer = setTimeout(() => resolve({ url, ratio: DEFAULT_RATIO }), PRELOAD_TIMEOUT_MS);
			img.onload = () => {
				clearTimeout(timer);
				resolve({
					url,
					ratio: img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : DEFAULT_RATIO
				});
			};
			img.onerror = () => {
				clearTimeout(timer);
				resolve(null);
			};
			img.referrerPolicy = 'no-referrer';
			img.src = url;
		});
	}

	onMount(async () => {
		const measured = await Promise.all(urls.filter(Boolean).map((u) => measure(sized(u))));
		items = measured.filter((m): m is { url: string; ratio: number } => m !== null);
		ready = true;
	});

	function buildLayout(ratios: number[]): Block[] {
		const n = ratios.length;
		const wide = (i: number) => ratios[i] > 1.25;
		if (n === 0) return [];
		if (n === 1) return [{ kind: 'row', idx: [0], aspect: clamp(ratios[0], 0.85, 1.8) }];
		if (n === 2) {
			if (ratios[0] > 1.3 && ratios[1] > 1.3) {
				return [
					{ kind: 'row', idx: [0], aspect: clamp(ratios[0], 1.2, 2) },
					{ kind: 'row', idx: [1], aspect: clamp(ratios[1], 1.2, 2) }
				];
			}
			return [{ kind: 'row', idx: [0, 1], aspect: clamp(ratios[0] + ratios[1], 1.3, 2.6) }];
		}
		if (n === 3 && !wide(0)) {
			return [{ kind: 'trio', idx: [0, 1, 2], aspect: 1.25 }];
		}

		const rows: number[][] = [];
		let start = 0;
		if (wide(0)) {
			rows.push([0]);
			start = 1;
		}
		let current: number[] = [];
		let sum = 0;
		for (let i = start; i < n; i++) {
			current.push(i);
			sum += ratios[i];
			if (sum >= 2.8 || current.length === 4) {
				rows.push(current);
				current = [];
				sum = 0;
			}
		}
		if (current.length) {
			if (current.length === 1 && rows.length > 1 && rows[rows.length - 1].length >= 3) {
				current.unshift(rows[rows.length - 1].pop() as number);
			}
			rows.push(current);
		}
		return rows.map((idx) => ({
			kind: 'row' as const,
			idx,
			aspect: clamp(
				idx.reduce((acc, i) => acc + ratios[i], 0),
				idx.length === 1 ? 1.3 : 1.4,
				3.6
			)
		}));
	}

	$: blocks = ready ? buildLayout(items.map((i) => i.ratio)) : [];
</script>

{#if !ready}
	<div class="w-full bg-gray-100 dark:bg-gray-850 animate-pulse" style="aspect-ratio: 4 / 3"></div>
{:else if items.length > 0}
	<div class="flex flex-col gap-0.5 overflow-hidden">
		{#each blocks as block}
			{#if block.kind === 'trio'}
				<div
					class="grid gap-0.5"
					style="grid-template-columns: 2fr 1fr; grid-template-rows: 1fr 1fr; aspect-ratio: {block.aspect}"
				>
					{#each block.idx as i, pos}
						<svelte:element
							this={href ? 'a' : 'div'}
							{href}
							target={href ? '_blank' : undefined}
							rel={href ? 'noreferrer' : undefined}
							class="block overflow-hidden bg-gray-100 dark:bg-gray-850 {pos === 0 ? 'row-span-2' : ''}"
						>
							<img
								src={items[i].url}
								alt={title}
								referrerpolicy="no-referrer"
								class="h-full w-full object-cover"
							/>
						</svelte:element>
					{/each}
				</div>
			{:else}
				<div class="flex gap-0.5" style="aspect-ratio: {block.aspect}">
					{#each block.idx as i}
						<svelte:element
							this={href ? 'a' : 'div'}
							{href}
							target={href ? '_blank' : undefined}
							rel={href ? 'noreferrer' : undefined}
							class="block min-w-0 overflow-hidden bg-gray-100 dark:bg-gray-850"
							style="flex: {items[i].ratio} 1 0%"
						>
							<img
								src={items[i].url}
								alt={title}
								referrerpolicy="no-referrer"
								class="h-full w-full object-cover"
							/>
						</svelte:element>
					{/each}
				</div>
			{/if}
		{/each}
	</div>
{/if}
