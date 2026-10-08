<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';

	// Full-screen photo viewer: arrows, keyboard, swipe, preloads the neighbours.
	export let urls: string[] = [];
	export let index = 0;
	export let title = '';
	export let metaParts: { text: string; href?: string | null }[] = [];
	export let description: string | null = null;
	export let href: string | null = null;

	const dispatch = createEventDispatcher<{ close: void }>();
	let touchStartX: number | null = null;
	let touchStartY: number | null = null;
	let previousOverflow = '';

	$: count = urls.length;
	$: if (index >= count) index = Math.max(0, count - 1);

	const show = (next: number) => {
		if (count === 0) return;
		index = (next + count) % count;
	};
	const close = () => dispatch('close');

	const onKey = (event: KeyboardEvent) => {
		if (event.key === 'Escape') close();
		else if (event.key === 'ArrowRight') show(index + 1);
		else if (event.key === 'ArrowLeft') show(index - 1);
		else return;
		event.preventDefault();
		event.stopPropagation();
	};

	const onTouchStart = (event: TouchEvent) => {
		touchStartX = event.touches[0].clientX;
		touchStartY = event.touches[0].clientY;
	};
	const onTouchEnd = (event: TouchEvent) => {
		if (touchStartX === null || touchStartY === null) return;
		const dx = event.changedTouches[0].clientX - touchStartX;
		const dy = event.changedTouches[0].clientY - touchStartY;
		touchStartX = touchStartY = null;
		if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
		else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
	};

	// Move the overlay to <body> so no transformed ancestor in the chat can clip or offset it.
	const portal = (node: HTMLElement) => {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	};

	// Warm the cache for the neighbours.
	$: if (typeof window !== 'undefined') {
		for (const offset of [1, -1]) {
			const neighbour = urls[(index + offset + count) % count];
			if (neighbour) {
				const img = new Image();
				img.referrerPolicy = 'no-referrer';
				img.src = neighbour;
			}
		}
	}

	onMount(() => {
		previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		window.addEventListener('keydown', onKey, true);
	});
	onDestroy(() => {
		if (typeof document !== 'undefined') document.body.style.overflow = previousOverflow;
		if (typeof window !== 'undefined') window.removeEventListener('keydown', onKey, true);
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
	use:portal
	class="fixed inset-0 z-[99999] flex select-none flex-col bg-black/95 text-white"
	role="dialog"
	aria-modal="true"
	aria-label={title}
	on:click={close}
	on:touchstart={onTouchStart}
	on:touchend={onTouchEnd}
>
	<div class="flex items-center justify-between gap-3 px-4 py-3 text-sm">
		<span class="tabular-nums text-white/80">{index + 1} / {count}</span>
		<span class="flex-1"></span>
		<button
			type="button"
			class="rounded-full p-2 hover:bg-white/10"
			aria-label="Close"
			on:click|stopPropagation={close}
		>
			<svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
			</svg>
		</button>
	</div>

	<div class="relative flex min-h-0 flex-1 items-center justify-center px-2">
		{#key index}
			<img
				src={urls[index]}
				alt={title}
				referrerpolicy="no-referrer"
				class="max-h-full max-w-full object-contain"
				draggable="false"
				on:click|stopPropagation
			/>
		{/key}

		{#if count > 1}
			<button
				type="button"
				class="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 hover:bg-black/70"
				aria-label="Previous photo"
				on:click|stopPropagation={() => show(index - 1)}
			>
				<svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
			<button
				type="button"
				class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 hover:bg-black/70"
				aria-label="Next photo"
				on:click|stopPropagation={() => show(index + 1)}
			>
				<svg viewBox="0 0 24 24" class="size-6" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</button>
		{/if}
	</div>

	<div
		class="mx-auto flex max-h-[38vh] w-full max-w-2xl flex-col gap-2 overflow-y-auto px-4 py-3"
		on:click|stopPropagation
	>
		{#if title}
			<p class="text-base font-semibold leading-snug">{title}</p>
		{/if}
		{#if metaParts.length}
			<p class="text-sm text-white/70">
				{#each metaParts as part, i}
					{#if i > 0}<span> · </span>{/if}
					{#if part.href}
						<a
							href={part.href}
							target="_blank"
							rel="noreferrer"
							class="underline decoration-dotted hover:text-white"
							title="Open in Google Maps">{part.text}</a
						>
					{:else}<span>{part.text}</span>{/if}
				{/each}
			</p>
		{/if}
		{#if description}
			<p class="whitespace-pre-line text-sm leading-relaxed text-white/85">{description}</p>
		{/if}
		{#if href}
			<a
				{href}
				target="_blank"
				rel="noreferrer"
				class="mt-1 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-medium !no-underline hover:bg-white/25"
				>Open listing</a
			>
		{/if}
	</div>
</div>
