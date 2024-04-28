<script lang="ts">
	import ChatMessageBox from "./ChatMessageBox.svelte";
</script>

<ChatMessageBox sender="AI"
	><div class="loading-message">
		Thinking<span class="loading"></span>
	</div></ChatMessageBox
>

<style>
	.loading-message {
		font-size: medium;
		color: #eee;
		font-style: italic;
	}

	/* Stolen from https://stackoverflow.com/questions/13014808/is-there-any-way-to-animate-an-ellipsis-with-css-animations */
	.loading:after {
		overflow: hidden;
		display: inline-block;
		vertical-align: bottom;
		-webkit-animation: ellipsis steps(4, end) 900ms infinite;
		animation: ellipsis steps(4, end) 900ms infinite;
		content: "\2026";
		/* ascii code for the ellipsis character */
		width: 0px;
	}

	@keyframes ellipsis {
		to {
			width: 40px;
		}
	}

	@-webkit-keyframes ellipsis {
		to {
			width: 40px;
		}
	}
</style>
