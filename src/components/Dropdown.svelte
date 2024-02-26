<script lang='ts'>
    import { onMount } from 'svelte';

    export let defaultInputText = '';
    export let dropdownValues = [] as string[];
    export let selected_val = defaultInputText
    
    // JavaScript to toggle the dropdown
    let dropdownButton = null as HTMLElement|null;  
    let dropdownMenu  = null as HTMLElement|null;  
    let searchInput  = null as HTMLInputElement|null;  
    export let isOpen = false; 
    
    // Function to toggle the dropdown state
    function toggleDropdown() {
        isOpen = !isOpen;
        dropdownMenu?.classList.toggle('hidden', !isOpen);
    }
    
    function clickVal(e: PointerEvent | MouseEvent) {
        const target = e.target as HTMLElement | null
        if (target) {
            const id = target.id.slice(2)
            const indx: number = +id
            selected_val = dropdownValues[indx]
        
        }
    }
    function releaseVal(e: PointerEvent | MouseEvent) {
        isOpen = false;
        dropdownMenu?.classList.toggle('hidden', true);
    }

    onMount(() => {
        if (dropdownButton && searchInput && dropdownMenu) {
            
            dropdownButton?.addEventListener('click', () => {
                toggleDropdown();
            });
            searchInput?.addEventListener('input', () => {
                const searchTerm = searchInput?.value.toLowerCase() as string;
                const items = dropdownMenu?.querySelectorAll('a');
                if (items) {
                    items.forEach((item) => {
                    const text = item.textContent?.toLowerCase();
                    
                    if (text?.includes(searchTerm)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }

                    });
                }
            });
            dropdownValues.forEach((val,index) => {
                document?.getElementById(`dv${index}`)?.addEventListener('pointermove', clickVal,{ passive: true })
                document?.getElementById(`dv${index}`)?.addEventListener('pointerdown', clickVal,{ passive: true })
                document?.getElementById(`dv${index}`)?.addEventListener('pointerup', releaseVal,{ passive: true })
                document?.getElementById(`dv${index}`)?.addEventListener('pointercancel', releaseVal,{ passive: true })
              
            })

        }
    });
</script>
<div class="relative group zzz">
        <button bind:this={dropdownButton} id="dropdown-button" class="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500">
          <span class="mr-2">{selected_val}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-2 -mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        <div  bind:this={dropdownMenu} id="dropdown-menu" class="hidden absolute left-0 mt-2 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-1 space-y-1">
          <!-- Search input -->
          <input bind:this={searchInput} id="search-input" class="block w-full px-4 py-2 text-gray-800 border rounded-md  border-gray-300 focus:outline-none" type="text" placeholder="Search items" autocomplete="off">
          <!-- Dropdown content goes here -->
          <div class="block scrollblock">
          {#each dropdownValues as val,index}
          <a href="#" id={`dv${index}`} class="block px-4 py-2 text-gray-700 hover:bg-gray-100 active:bg-blue-100 cursor-pointer rounded-md">{val}</a>
          {/each}
          </div>
        </div>
</div>
<style>
    .scrollblock{
        max-height: 40vh;
        overflow-y: scroll;
    }
    .zzz {
        z-index: 1000;
    }
</style>