<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Chat from '$lib/components/chat/Chat.svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getChatList } from '$lib/apis/chats';
	import { KAI_SINGLE_ASSISTANT } from '$lib/kai';

	// Kai fork: in single-assistant mode "/" always resumes the user's most recent
	// conversation; a new chat is only created when the user has none yet.
	let ready = !KAI_SINGLE_ASSISTANT;

	onMount(async () => {
		if ($page.url.searchParams.get('error')) {
			toast.error($page.url.searchParams.get('error') || 'An unknown error occurred.');
		}

		if (KAI_SINGLE_ASSISTANT) {
			try {
				const chats = await getChatList(localStorage.token, 0);
				if (Array.isArray(chats) && chats.length > 0) {
					await goto(`/c/${chats[0].id}`, { replaceState: true });
					return;
				}
			} catch (e) {
				console.error('Kai: failed to load last chat', e);
			}
			ready = true;
		}
	});
</script>

{#if ready}
	<Chat />
{/if}
