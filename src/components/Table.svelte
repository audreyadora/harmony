<script lang='ts'>
    import { writable } from 'svelte/store';


 
export let ColumnOrder = [] as string[]
export let Data = [] as Record<string,any>[]
export let Colors = {}
export let TableFilter = false as string | false
export let Indexed = false as boolean
export let SelectedRow = {} as Record<string,any>

let TableData = [] as Record<string,any>[]
let sortKey = writable('id'); // default sort key
let sortDirection = writable(1); // default sort direction (ascending)
let sortItems = writable(TableData.slice()); // make a copy of the items array

$:tableDataPreProcess(Data)
function tableDataPreProcess(data: Record<string,any>[]) {
    TableData = data.map((d,i) => ({...d,id:i,_hidden:false}))
    sortItems = writable(TableData.slice())
    table_filter_handler(TableFilter)
}

let FilterData = {} as Record<string,boolean>
let SelectedKeys = [] as string[]
let Headers = [] as string[][]
let SortData = {} as Record<string,boolean>
let RowOrder = [] as number[]

let TableDataFiltered = [] as Record<string,any>[]

let selectedRow = [] as boolean[]
let selectedRowIndex = [] as number[]

$:table_filter_handler(TableFilter)
function table_filter_handler(tablefilter: false|string){
    if (tablefilter) {
        const first_row = Object.keys(Data[0] || {})
        if (first_row.includes(tablefilter)) {
            const data = [...new Set(Data.map(ele => ele[tablefilter]))].toSorted()
            if (data.length > 0) {
                FilterData = Object.fromEntries(data.map(f => [f,true]))
            }
        }
    }
}

function toggle_filter(key: string): void {
        if (key in FilterData && $sortItems) {
            FilterData[key] = !FilterData[key] 
            SelectedKeys = Object.keys(FilterData).filter(k => FilterData[k])
            if (typeof(TableFilter) === 'string') {
                const filtered = [...$sortItems].map(row => ({...row, ...(row[(TableFilter as string)] === key ? {_hidden: !FilterData[key]} : {})}))
                sortItems.set(filtered)
            }
            
        }

}


  // Define a function to sort the items
  const sortTable = (key: string) => {
    // If the same key is clicked, reverse the sort direction
    if ($sortKey === key) {
      sortDirection.update((val) => -val);
    } else {
      sortKey.set(key);
      sortDirection.set(1);
    }
  };

  $: {
    const key = $sortKey;
    const direction = $sortDirection;
    const sorted = [...$sortItems].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) {
        return -direction;
      } else if (aVal > bVal) {
        return direction;
      }
      return 0;
    });
    sortItems.set(sorted);
  }

let colors_default = {

}
function rowFilter(items: Record<string, any>[]) {
    const filtered_items = [] as Record<string, any>[]
    selectedRow = [] as boolean[]
    selectedRowIndex = [] as number[]
    for (let i = 0; i < items.length; i++) {
        if (items[i]._hidden!== true) {
            let row = {} as  Record<string, any>
            for (const k of Object.keys(items[i])) {
                if (k!== 'id' && k!== '_hidden') {
                    row = {...row, [k]: items[i][k]}
                    selectedRow.push(false)
                    selectedRowIndex.push(i)
                }
            }
            filtered_items.push(row)
        }
    }
    return filtered_items
}
function clickHandler(row:Record<string,any>,i: number) {
    if (selected_index === i) {
        selected_index = -1
        SelectedRow = {}
        
    } else {
        selected_index = i
        SelectedRow = row
    }
    
}
let selected_index = -1
</script>
<div class="table-wrapper rounded-md">
    <div class="table-filter" style='background-color: rgba(var(--color-surface-50) / 1);'>
        {#if TableFilter}
            {#each Object.keys(FilterData) as k}
                <button
                    class="chip {FilterData[k] ? 'variant-filled' : 'variant-soft'}"
                    on:click={() => { toggle_filter(k); }}
                    on:keypress
                >
                    {#if FilterData[k]}<span>✓</span>{/if}
                    <span>{k}</span>
                </button>
            {/each}
        {/if}
    </div>
    <table class="table-header">
        <thead>
            <tr>
                {#if TableData.length > 0}
                    {#each Object.keys(TableData[0]) as col,i}
                    {#if (col !== 'id' && col !== '_hidden')}
                    <th id={`${i}`} on:click={() => {sortTable(col)}} style='background-color: rgba(var(--color-surface-300) / 1);'>{col==='id' ? ' ' : col.charAt(0).toUpperCase() + col.slice(1)}</th>
                    {/if}
                    {/each}

                {/if}
            </tr>
        </thead>
    </table>
    <div class="table-body-wrapper">
        <table class="table-body">
            <tbody>
                {#if $sortItems}
                {#each rowFilter($sortItems) as row, i}
                    <tr>
                        {#each Object.keys(row) as k}
                     
                            <td on:click={()=>{clickHandler(row,i)}} style={` background-color: ${ selected_index === i ? 'red;' : ( i%2 === 0 ? 'rgba(var(--color-surface-50) / 1);' : 'rgba(var(--color-surface-200) / 1);')}`}>
                                {row[k]}
                            </td>
                   
                        {/each}
                      
                    </tr>
                {/each}
                {/if}
            </tbody>
        </table>
    </div>
</div>

<style>
    .table-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 0px;
        padding: 0px;
        overflow-y: hidden;
    }
    .table-filter {
        min-height: 1.5rem;
        width: 100%;
  
    }
    .table-header {
        min-height: 1.5rem;
        width: 100%;
     
    }

    .table-header > thead > tr > th {
        border-right: solid 1px rgba(var(--color-secondary-100) / 1);
    }:hover {
        background-color: rgba(var(--color-surface-100) / 1);
    } 
    .table-body-wrapper {
        min-height: 100%;
        width: 100%;
        overflow-y: auto;
    }
    .table-body {
        width: 100%;
    }
    .table-body > tbody > tr > td {
        width: 100%;
    }:hover {

    } 
</style>