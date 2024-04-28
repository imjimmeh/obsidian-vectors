<script lang="ts">
	import type { AIMessage } from "./message";

	export let message: AIMessage;

	$: displaySources = false;
</script>

{#if message.sources && message.sources.length > 0}
	<div class="sources">
		{#if !displaySources}
			<span class="message-source-count"
				>From {message.sources.length} sources</span
			>
		{:else}
			{#each message.sources as source}
				<span class="message-source">{source}</span>
			{/each}
		{/if}
	</div>
{/if}

<style>
	.message-source {
		font-size: smaller;
		margin-right: 5px;
		background-color: lightblue;
		border-radius: 5px;
		color: #222;
	}
</style>
