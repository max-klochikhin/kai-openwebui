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
		description?: string | null;
		distance_km?: number | null;
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
	$: place = listing.location ? decode(listing.location).trim() : '';
	$: mapsUrl = place
		? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place}, Deutschland`)}`
		: null;
	$: metaParts = [
		{ text: price },
		{ text: place || null, href: mapsUrl },
		{ text: listing.distance_km != null ? `${Math.round(listing.distance_km)} km` : null },
		{ text: posted }
	].filter((part) => part.text) as { text: string; href?: string | null }[];
	$: description = listing.description ? decode(listing.description) : null;
</script>

<article
	class="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
>
	{#if photos.length > 0}
		<KaiPhotoMosaic urls={photos} href={listing.url ?? null} {title} {metaParts} {description} />
	{/if}

	<div class="p-3 space-y-1">
		{#if listing.url}
			<a
				href={listing.url}
				target="_blank"
				rel="noreferrer"
				class="block text-sm leading-snug font-medium text-gray-900 dark:text-gray-100 !no-underline hover:underline"
				>{title}</a
			>
		{:else}
			<p class="text-sm leading-snug font-medium">{title}</p>
		{/if}
		{#if metaParts.length}
			<p class="text-xs text-gray-500 dark:text-gray-400">
				{#each metaParts as part, i}
					{#if i > 0}<span> · </span>{/if}
					{#if part.href}
						<a
							href={part.href}
							target="_blank"
							rel="noreferrer"
							class="underline decoration-dotted hover:text-gray-800 dark:hover:text-gray-200"
							title="Open in Google Maps">{part.text}</a
						>
					{:else}<span>{part.text}</span>{/if}
				{/each}
			</p>
		{/if}
		{#if description}
			<p class="line-clamp-3 text-xs text-gray-600 dark:text-gray-300">{description}</p>
		{/if}
	</div>
</article>
