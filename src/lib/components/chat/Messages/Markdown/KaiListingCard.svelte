<script lang="ts">
	import { decode } from 'html-entities';
	import KaiPhotoMosaic from './KaiPhotoMosaic.svelte';

	export let listing: {
		id?: string;
		title?: string;
		price_text?: string | null;
		price_eur?: number | null;
		location?: string | null;
		posted_at?: string | null;
		url?: string | null;
		thumbnail_urls?: string[] | null;
	};

	$: title = decode(listing.title ?? '').trim() || 'Listing';
	$: photos = (listing.thumbnail_urls ?? []).filter(Boolean);
	$: rawPrice = listing.price_text ?? (listing.price_eur != null ? `${listing.price_eur} EUR` : null);
	$: price = rawPrice && rawPrice !== 'N/A' ? rawPrice : null;
	$: posted = (() => {
		if (!listing.posted_at) return null;
		const date = new Date(listing.posted_at);
		return Number.isNaN(date.getTime())
			? listing.posted_at.slice(0, 10)
			: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	})();
	$: meta = [price, listing.location ? decode(listing.location) : null, posted]
		.filter(Boolean)
		.join(' · ');
</script>

<article
	class="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
>
	{#if photos.length > 0}
		<KaiPhotoMosaic urls={photos} href={listing.url ?? null} {title} />
	{/if}

	{#if listing.url}
		<a
			href={listing.url}
			target="_blank"
			rel="noreferrer"
			class="block p-3 space-y-1 !no-underline hover:bg-gray-50 dark:hover:bg-gray-850 transition"
		>
			<p class="text-sm leading-snug font-medium text-gray-900 dark:text-gray-100 !no-underline">
				{title}
			</p>
			{#if meta}
				<p class="text-xs text-gray-500 dark:text-gray-400 !no-underline">{meta}</p>
			{/if}
		</a>
	{:else}
		<div class="p-3 space-y-1">
			<p class="text-sm leading-snug font-medium">{title}</p>
			{#if meta}
				<p class="text-xs text-gray-500 dark:text-gray-400">{meta}</p>
			{/if}
		</div>
	{/if}
</article>
