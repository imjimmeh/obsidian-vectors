<script lang="ts">
	import type { AIMessage } from "./message";

	export let message: AIMessage;

	$: sourcesShown = false;

	$: buttonText = sourcesShown ? "Hide" : "Show";

	function toggleDisplaySources() {
		sourcesShown = !sourcesShown;
	}
</script>

{#if message.sources && message.sources.length > 0}
	<div id="sources">
		{#if !sourcesShown}
			<span class="message-source-count"
				>From {message.sources.length} sources</span
			>
		{:else}
			{#each message.sources as source}
				<span class="message-source">{source}</span>
			{/each}
		{/if}

		<button id="toggle-sources" on:click={toggleDisplaySources}
			>{buttonText}</button
		>
	</div>
{/if}

<style>
	#sources {
		margin-top: 5px;
	}

	div#sources span {
		font-size: smaller;
		background-color: lightblue;
		border-radius: 5px;
		color: #111;
		padding: 3px 4px;
	}

	.message-source {
		margin-right: 5px;
	}

	button#toggle-sources {
		background-color: blue;
		color: white;
		border-radius: 5px;
	}
</style>
