<script lang="ts">
    
	
	export let ColorPickerWrapper;
	export let isOpen: boolean;
	export let isPopup: boolean;
	/* svelte-ignore unused-export-let */
	export let toRight;
</script>

<div
	class="wrapper"
	bind:this={ColorPickerWrapper}
	class:isOpen
	class:isPopup
	role={isPopup ? 'dialog' : undefined}
	aria-label="color picker"
    id="colorwrapper"
>
	<slot />
</div>

<style>
	div {
		padding: 8px 5px 5px 8px;
		background-color: white;
		margin-left: -4px;
		border: 1px solid black;
		border-radius: 12px;
		display: none;
		width: max-content;
	}
	.isOpen {
		display: block;
	}
	.isPopup {
        position: absolute;
        top: 0;
        left: 0;
		z-index: var(--picker-z-index, 2);
	}
</style>
