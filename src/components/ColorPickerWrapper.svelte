<script lang="ts">
    
	import { portal } from "svelte-portal";
	export let ColorPickerWrapper;
	export let isOpen: boolean;
	export let isPopup: boolean;
	/* svelte-ignore unused-export-let */
	export let toRight;
</script>

<div
    use:portal={"#test"}
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
        top: 0px;
        left: 0px;
		z-index: var(--picker-z-index, 2);
	}
</style>
