<script lang='ts'>
    import ColorPicker from 'svelte-awesome-color-picker';
    import {Scale} from '../../lib/MusicTheory/Utils/Music/Scale'
    import * as MusicData from '../../lib/MusicTheory/Data/computedData.json'
    import Wrapper from 'svelte-awesome-color-picker';
    import { AppRail, AppRailTile, AppRailAnchor, AppShell, RangeSlider } from '@skeletonlabs/skeleton';
    import type {RgbaColor} from 'svelte-awesome-color-picker';
    import {Fretboard} from './Fretboard'
    import { onMount } from 'svelte';
    import Dropdown from '../Dropdown.svelte';

    import { popup } from '@skeletonlabs/skeleton';
    import type { PopupSettings } from '@skeletonlabs/skeleton';
    
     import { v4 as uuid4 } from 'uuid';
     const popupFeatured: PopupSettings = {
            // Represents the type of event that opens/closed the popup
            event: 'click',
            // Matches the data-popup value on your popup element
            target: 'popupFeatured',
            // Defines which side of your trigger the popup will appear
            placement: 'top',
            state: (e: Record<string, boolean>) => popupHandler()
        };
     const canvas_id = `c${(uuid4() as string).replaceAll('-', '')}`;
   

    let fb_color_a = {r:222,g:226,b:255,a:1};
    let fb_color_b = {r:255,g:231,b:255,a:1};
    let fb_color_c = {r:254,g:246,b:255,a:1};
    let rgb_arr = [{r:255,g:0,b:0,a:1},{r:255,g:0,b:0,a:1},{r:255,g:239,b:184,a:1},{r:255,g:225,b:225,a:1},{r:136,g:255,b:112,a:1},{r:226,g:197,b:255,a:1},{r:0,g:0,b:0,a:1},{r:152,g:163,b:255,a:1},{r:0,g:0,b:0,a:1},{r:251,g:251,b:251,a:1},{r:0,g:0,b:0,a:1},{r:255,g:213,b:179,a:1}];
    let rgb_text_arr = [{r:255,g:255,b:255,a:1},{r:255,g:255,b:255,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:26,g:3,b:3,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:256,g:256,b:256,a:1},{r:0,g:0,b:0,a:1}];
    let input_text = ''
    let FB = null as Fretboard | null
    let music_scale = [false, true, false, true, false, false, true, false, true, false, true, false];
    let music_scale_markers = [false, true, false, true, false, false, true, false, true, false, true, false];
    let music_scale_numbers = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0];
    let music_key = 0;
    let width = 1000;
    let height = 1000;
    let canvas = null as HTMLCanvasElement | null;
    let selected_val = undefined as string | undefined;
    let xscale = 1.0;
    let yscale = 1.0;    
    let xtrans = 22.0;
    let ytrans = 0.6;
    let dropdown = {} as Record<string,number>
    let tuning = [4,11,7,2,9,4]; 
    let tuning_octave = [4,3,3,3,2,2]
    $:tuningHandler(tuning)
    $:tuningOctaveHandler(tuning_octave)
    function tuningHandler(t:number[]) {
        if (FB) {
            FB.setTuning(tuning)
        }
    }
    function tuningOctaveHandler(t:number[]) {
        if (FB) {
            FB.setTuningOctave(tuning_octave)
        }
    }
    const notenames = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    MusicData.scales.forEach(scale => {
        if (scale.names) {
            dropdown = {...dropdown, ...{[scale.names[0]]:scale.binary}}
        }
    })

    let dropdown_vals = Object.keys(dropdown)
    let isOpen = false;
    $:dropdownHandler(selected_val,isOpen)
    $:keyHandler(music_key);
    $:mscaleHandler(music_scale);
    $:mColorHandler(rgb_arr);
    $:tColorHandler(rgb_text_arr);
    $:fretHandler(xtrans)
    function fretHandler(val: number) {
        if (FB) {
            FB.setFrets(val)
        }
    }
    $:setFBColorA(fb_color_a)
    $:setFBColorB(fb_color_b)
    $:setFBColorC(fb_color_c)
    function setFBColorA(v: RgbaColor) {
        const colors = [v.r/256, v.g/256, v.b/256, v.a];
        if (FB) {
            FB.setFBColors('a',colors)
        }
    }
    function setFBColorB(v: RgbaColor) {
        const colors = [v.r/256, v.g/256, v.b/256, v.a];
        if (FB) {
            FB.setFBColors('b',colors)
        }
    }
    function setFBColorC(v: RgbaColor) {
        const colors = [v.r/256, v.g/256, v.b/256, v.a];
        if (FB) {
            FB.setFBColors('c',colors)
        }
    }
    function dropdownHandler(val: string|undefined, isopen:boolean) {
        if (val &&!isopen) {
          const num=dropdown[val]
          if (num) {
            let c = 0
            for (const i of num.toString(2)) {
                music_scale[c] = i === '0' ? false : true
                music_scale_markers[c] = i === '0' ? false : true
                c+=1
            }
          }
        }
    }
    function mscaleHandler(val: boolean[]) {
        const mscale = val.map(i => i ? 1 : 0)
        if (FB) {
            const b = ''
            for (const i of mscale) {
                b.concat(i===0 ? '0':'1')
            }
            const n = parseInt(b,2)

            FB.setMusicScale(mscale)
        }
    }
    function buttonHandle() {
        if (FB) {
            const text_arr = input_text.split(' ')
            console.log(text_arr)
            FB.setCircleInput(text_arr)
        }
    }
    $:tmarkerHandler(music_scale_markers)
    function tmarkerHandler(val: boolean[]) {
        if (FB) {
            FB.setMarkerText(val)
        }
    }
    function keyHandler(val: number) {
        if (FB) {FB.setKey(val)};
    }

    function mColorHandler(rgbarr: RgbaColor[]) {
        const colors = rgbarr.map(v => [v.r/256, v.g/256, v.b/256, v.a]);
   
        if (FB) {FB.setMarkerColors(colors)};
    }
    function tColorHandler(rgbarr: RgbaColor[]) {
        const colors = rgbarr.map(v => [v.r/256, v.g/256, v.b/256, v.a]);
 
        if (FB) {FB.setMarkerTextColors(colors)};
    }
    function main(FB:Fretboard) {
        function render() {
            if (FB) {
                FB.render() 
            }
            requestAnimationFrame(render)
        }
        requestAnimationFrame(render)
    }
    function componentToHex(c:number) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
    }
    function rgbToHex(r:number, g:number, b:number) {
        return "#" + componentToHex(Math.round(r*256)) + componentToHex(Math.round(g*256)) + componentToHex(Math.round(b*256));
    }
    onMount(() => {
        if (canvas) {
            FB = new Fretboard({canvas: canvas, canvas_id: canvas_id, wrapper_id: 'fbwrapper'})
            FB.gettuning()
            main(FB)
        }
    });
    let copystate = ''
    function popupHandler() {
        function rgbats(a:number[]) {return `{r:${a[0]*256},g:${a[1]*256},b:${a[2]*256},a:${a[3]}}`}
        if (FB) {
            const fb_col_a = `[${FB.f_color_a.toString()}]`
            const fb_col_b = `[${FB.f_color_b.toString()}]`
            const fb_col_c = `[${FB.f_color_c.toString()}]`
            const marker_text_colors = `[${FB.marker_text_colors.map(ele => `[${ele.toString()}]`).join(',')}]`
            const marker_colors = `[${FB.marker_colors.map(ele => `[${ele.toString()}]`).join(',')}]`
            const fb_col_a_rgba = rgbats(FB.f_color_a) 
            const fb_col_b_rgba = rgbats(FB.f_color_b) 
            const fb_col_c_rgba = rgbats(FB.f_color_c) 
            const marker_text_colors_rgba = `[${FB.marker_text_colors.map(ele => rgbats(ele)).join(',')}]`
            const marker_colors_rgba = `[${FB.marker_colors.map(ele => rgbats(ele)).join(',')}]`
            const text_data = [
                'Fretboard.ts:',
                ``,
                `f_color_a = ${fb_col_a};`,
                `f_color_b = ${fb_col_b};`,
                `f_color_c = ${fb_col_c};`,
                `marker_colors = ${marker_colors};`,
                `marker_text_colors = ${marker_text_colors};`,
                ``,
                `Fretboard.svelte:`,
                ``,
                `let fb_color_a = ${fb_col_a_rgba};`,
                `let fb_color_b = ${fb_col_b_rgba};`,
                `let fb_color_c = ${fb_col_c_rgba};`,
                `let rgb_arr = ${marker_colors_rgba};`,
                `let rgb_text_arr = ${marker_text_colors_rgba};`,
            ].join('\n')
            copystate=text_data
        }
    }
</script>


<AppShell>
   
	

	<slot >
             <div class="card p-4 statepu shadow-xl pup" data-popup="popupFeatured">
                <div><p>{copystate}</p></div>
                <div class="arrow bg-surface-100-800-token" />
            </div>
          <div class="flex items-start ">
           
            <div class="scalewrapper grid grid-cols-1 ">
                <div class="dropdown-spacer">
                 <Dropdown defaultInputText='default' bind:isOpen={isOpen} bind:selected_val={selected_val} dropdownValues={dropdown_vals}/>
                 </div>
                 <div class="scale-spacer">
                {#each music_scale as interval, index}
                    <div class={`flex h-12 gap-2 items-center justify-center ${index % 2 === 0 ? ' colora' : ' colorb'}`}>

                        <div class={`flex h-10 items-center justify-center ${music_scale_markers[index%12] ? 'text-marker' : 'text-marker-b'} ${index % 2 === 0 ? ' colora' : ' colorb'}`}>
                            <div class="flex justify-center pl-1 pt-5">
                                <label class="relative inline-flex items-center mb-5 cursor-pointer">
                                    <input type="checkbox" value={interval} bind:checked={music_scale_markers[(index)%12]} class="sr-only peer">
                                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div class="flex justify-center ">
                                <ColorPicker label={""} bind:rgb={rgb_text_arr[(index)%12]}  />
                            </div>
                        </div>
                        <div class={`flex h-10 items-center justify-center ${music_scale[(index)%12] ? 'text-marker' : 'text-marker-b'}  ${index % 2 === 0 ? ' colora' : ' colorb'}`}>
                            <div class="flex justify-center pl-1 pt-5">
                                <label class="relative inline-flex items-center mb-5 cursor-pointer">
                                    <input type="checkbox" value={interval} bind:checked={music_scale[(index)%12]} class="sr-only peer">
                                    <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div class="flex justify-center ">
                                <ColorPicker label={""} bind:rgb={rgb_arr[(index)%12]}  />
                            </div>
                        </div>    
                        <div class="flex text-left ">
                            <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">{notenames[(index+music_key)%12]}</span>
                        </div>

                    
                    </div>
                {/each}
                
                </div>
                            

            </div>
            <div class=" flex grid grid grid-cols-1  items-start pr-15 pl-10">
                {#each tuning as n}
                    <div class={`text-[${rgbToHex(rgb_arr[(n+music_key)%12].r,rgb_arr[(n+music_key)%12].g,rgb_arr[(n+music_key)%12].b)}]`}>{notenames[n]}</div>
                {/each}
            </div>
            <div class="fbwrapper">
                <div id="fbwrapper" class="wrapper">
                    <canvas id={canvas_id} class="canvasinstance"  bind:this={canvas} ></canvas>
                </div>
                <div class="box">  
                    <label class="label" for="boxcontrols">

                        <div class="grid grid-cols-3 gap-2 pad">
                            <div>Tuning 0: {notenames[tuning[0]]}{tuning_octave[0]} </div>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning[0]} min={0} max={11} step={1} ></RangeSlider>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning_octave[0]} min={0} max={6} step={1} ></RangeSlider>
                            <div>Tuning 1: {notenames[tuning[1]]}{tuning_octave[1]} </div>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning[1]} min={0} max={11} step={1} ></RangeSlider>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning_octave[1]} min={0} max={6} step={1} ></RangeSlider>
                            <div>Tuning 2: {notenames[tuning[2]]}{tuning_octave[2]} </div>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning[2]} min={0} max={11} step={1} ></RangeSlider>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning_octave[2]} min={0} max={6} step={1} ></RangeSlider>
                            <div>Tuning 3: {notenames[tuning[3]]}{tuning_octave[3]} </div>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning[3]} min={0} max={11} step={1} ></RangeSlider>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning_octave[3]} min={0} max={6} step={1} ></RangeSlider>
                            <div>Tuning 4: {notenames[tuning[4]]}{tuning_octave[4]} </div>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning[4]} min={0} max={11} step={1} ></RangeSlider>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning_octave[4]} min={0} max={6} step={1} ></RangeSlider>
                            <div>Tuning 5: {notenames[tuning[5]]}{tuning_octave[5]} </div>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning[5]} min={0} max={11} step={1} ></RangeSlider>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={tuning_octave[5]} min={0} max={6} step={1} ></RangeSlider>
                            <div>N Frets: {xtrans} </div>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={xtrans} min={20} max={30} step={1} ></RangeSlider>
                            <div></div>
                            <div>Key: {notenames[music_key]} </div>
                            <RangeSlider for="boxcontrols" name="range-slider" bind:value={music_key} min={0} max={11} step={1} ></RangeSlider>    
                            <div></div>    
                        </div>
                        <div class="grid grid-cols-3 gap-2 pad color-fb-marker">            
                            <div class="flex justify-center ">
                                <ColorPicker label={""} bind:rgb={fb_color_a}  />
                            </div>
                            <div class="flex justify-center ">
                                <ColorPicker label={""} bind:rgb={fb_color_b}  />
                            </div>
                            <div class="flex justify-center ">
                                <ColorPicker label={""} bind:rgb={fb_color_c}  />
                            </div>
                        </div>
                        <div class="buttonIn"> 
                            <input type="text" class='my-input' bind:value={input_text} id="enter"> 
                            <button id="circleinput" class='input-button' on:click={buttonHandle}>↝</button> 
                        </div> 
                       <button class="btn variant-filled mt-5 pup" use:popup={popupFeatured}>Get State</button>
                    </label>

                </div>
            </div>
        </div>
    </slot>

</AppShell>



<style>
.dropdown-spacer {
    padding: 10px;

}
.scale-spacer {
    padding-left: 10px;
}
.canvasinstance {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    height: 14vw;
    width: 78vw;

}
.wrapper {
    left: 0;
    top: 0;
    position: relative;
    box-sizing: border-box;
    height: 14vw;
    width: 78vw;
      
}

.box {
  display: flex;
  flex-direction: row;
  padding: 1rem;
  gap: 1rem;
  align-items: center;

}
.pad {
    padding-left: 30px;
}
.clickyboi {
    
    width:50px;
    height:50px;
 
    
}
.text-marker {
    border: solid black 2px;
    border-radius: 20px;
}
.text-marker-b {
    border: solid rgba(88, 84, 84, 0.172) 2px;
    border-radius: 20px;
}
.color-fb-marker {
        border: solid black 2px;
        background-color: rgba(23, 22, 22, 0.466);
    border-radius: 20px;
    padding-top: 2vh;
    height: 6vh;
}
.fbwrapper {
   padding-left: 30px;
}
.tuningwrapper {
    min-width: 15vw;
    max-width: 15vw;
    min-height: 25vw;
    max-height: 25vw;

}
.scalewrapper {
    min-width: 15vw;
    max-width: 15vw;

}
.fb {
    width: 70vw
}
.colora {
  background: rgba(222,222,222, 1.0);
}

.colorb {
  background: rgb(240, 240, 240);
}
.pup {
    z-index: 100;
}
.statepu {
    width: 90vw;
    height: 50vh;
    overflow-y: auto;
    white-space: pre-wrap;
}
.colordropdown {
    padding-top: 0.3rem;
    width: 15vw;
}
    .buttonIn { 
        width: 300px; 
        position: relative; 
    } 
      
    .my-input { 
        margin: 0px; 
        padding: 0px; 
        width: 100%; 
        outline: none; 
        height: 30px; 
        border-radius: 5px; 
    } 
      
    .input-button { 
        position: absolute; 
        top: 0; 
        border-radius: 5px; 
        right: 0px; 
       
        border: none; 
        top: 2px; 
        height: 30px; 
        cursor: pointer; 
        color: white; 
        background-color: #1e90ff; 
        transform: translateX(2px); 
    } 
</style>