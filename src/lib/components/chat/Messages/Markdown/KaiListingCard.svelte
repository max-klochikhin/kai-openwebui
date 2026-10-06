<script lang="ts">
	import { decode } from 'html-entities';

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

	let active = 0;
	let failed = false;

	$: title = decode(listing.title ?? '').trim() || 'Listing';
	$: photos = (listing.thumbnail_urls ?? []).filter(Boolean);
	$: photo = photos[active] ?? photos[0];
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
	{#if photo && !failed}
		<div class="relative bg-gray-100 dark:bg-gray-850">
			<!-- svelte-ignore a11y-img-redundant-alt -->
			<img
				src={photo}
				alt={title}
				referrerpolicy="no-referrer"
				loading="lazy"
				class="h-44 w-full object-cover"
				on:error={() => (failed = true)}
			/>
			{#if photos.length > 1}
				<div class="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
					{#each photos as _, index}
						<button
							type="button"
							aria-label={`Photo ${index + 1}`}
							class="h-1.5 rounded-full transition-all {index === active
								? 'w-4 bg-white'
								: 'w-1.5 bg-white/60'}"
							on:click={() => {
								active = index;
								failed = false;
							}}
						/>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if listing.url}
		<a
			href={listing.url}
			target="_blank"
			rel="noreferrer"
			class="block p-3 space-y-1 !no-underline hover:bg-gray-50 dark:hover:bg-gray-850 transition"
		>
			<p class="text-sm leading-snug font-medium text-gray-900 dark:text-gray-100 !no-underline">{title}</p>
			{#if meta}
				<p class="text-xs text-gray-500 dark:text-gray-400 !no-underline">{meta}</p>
			{/if}
		</a>
	{:else}
		<div class="p-3 space-y-1">
			<p class="text-sm leading-snug font-medium">{title}</p>
			{#if meta}
				<p class="text-xs text-gray-500 dark:text-gray-400 !no-underline">{meta}</p>
			{/if}
		</div>
	{/if}
</article>
