<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import KaiListingCard from './KaiListingCard.svelte';

	// Body of a ```kai-listings fenced block: JSON produced by the Kai stream proxy.
	export let code = '';

	let root: HTMLElement | null = null;
	let isLast = false;
	let requested = false;

	$: data = (() => {
		try {
			return JSON.parse(code);
		} catch {
			return null;
		}
	})();
	$: listings = Array.isArray(data?.listings) ? data.listings : [];
	$: total = typeof data?.total === 'number' ? data.total : null;
	$: pageSize = data?.returned ?? listings.length;
	$: from = typeof data?.page === 'number' && listings.length ? data.page * pageSize + 1 : 1;
	$: hasMore = data?.has_more === true;

	// Short labels for the filters the assistant chose (category, attribute values, query, place).
	$: chips = (() => {
		if (!data) return [] as string[];
		const out: string[] = [];
		if (data.query) out.push(data.query);
		if (data.location) out.push(data.location);
		if (data.category) out.push(data.category.split(' > ').pop());
		if (data.attributes && typeof data.attributes === 'object') {
			for (const [name, value] of Object.entries(data.attributes)) {
				out.push(`${String(name).split('.').pop()}: ${String(value).split(',').join(', ')}`);
			}
		}
		return out;
	})();

	// Only the newest results block offers "show more".
	const refreshIsLast = () => {
		if (!root) return;
		const all = document.querySelectorAll('[data-kai-listings]');
		isLast = all.length > 0 && all[all.length - 1] === root;
	};
	onMount(() => {
		refreshIsLast();
		const timer = setInterval(refreshIsLast, 1500);
		return () => clearInterval(timer);
	});
	afterUpdate(refreshIsLast);

	const showMore = () => {
		requested = true;
		window.dispatchEvent(
			new CustomEvent('kai:submit', { detail: { text: 'Show more results (next page).' } })
		);
	};
</script>

<div bind:this={root} data-kai-listings>
	{#if !data}
		<p class="text-sm text-gray-500 dark:text-gray-400 my-2">…</p>
	{:else if data.ok === false}
		<p class="text-sm text-red-500 my-2">{data.error ?? 'Search failed'}</p>
	{:else if listings.length === 0}
		<p class="text-sm text-gray-500 dark:text-gray-400 my-2">No listings found.</p>
	{:else}
		<div class="flex w-full max-w-md flex-col gap-3 my-3">
			{#if chips.length}
				<div class="flex flex-wrap gap-1.5">
					{#each chips as chip}
						<span
							class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
							>{chip}</span
						>
					{/each}
				</div>
			{/if}
			{#if total !== null}
				<p class="text-xs text-gray-500 dark:text-gray-400">
					{from}–{from + listings.length - 1} / {total.toLocaleString()}
				</p>
			{/if}
			{#each listings as listing (listing.id ?? listing.url)}
				<KaiListingCard {listing} />
			{/each}
			{#if hasMore && isLast && !requested}
				<button
					type="button"
					class="self-start rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
					on:click={showMore}>Show more</button
				>
			{/if}
		</div>
	{/if}
</div>
