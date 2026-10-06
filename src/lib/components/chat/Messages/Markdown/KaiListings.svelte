<script lang="ts">
	import KaiListingCard from './KaiListingCard.svelte';

	// Body of a ```kai-listings fenced block: JSON produced by the Kai stream proxy.
	export let code = '';

	$: data = (() => {
		try {
			return JSON.parse(code);
		} catch {
			return null;
		}
	})();
	$: listings = Array.isArray(data?.listings) ? data.listings : [];
	$: total = typeof data?.total === 'number' ? data.total : null;
	$: from = typeof data?.page === 'number' && listings.length ? data.page * (data.returned ?? listings.length) + 1 : 1;
</script>

{#if !data}
	<p class="text-sm text-gray-500 dark:text-gray-400 my-2">…</p>
{:else if data.ok === false}
	<p class="text-sm text-red-500 my-2">{data.error ?? 'Search failed'}</p>
{:else if listings.length === 0}
	<p class="text-sm text-gray-500 dark:text-gray-400 my-2">No listings found.</p>
{:else}
	<div class="flex w-full max-w-md flex-col gap-3 my-3">
		{#if total !== null}
			<p class="text-xs text-gray-500 dark:text-gray-400">
				{from}–{from + listings.length - 1} / {total.toLocaleString()}
			</p>
		{/if}
		{#each listings as listing (listing.id ?? listing.url)}
			<KaiListingCard {listing} />
		{/each}
	</div>
{/if}
