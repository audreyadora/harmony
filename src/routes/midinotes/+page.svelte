
<script lang='ts'>
    import { RangeSlider, Accordion, AccordionItem, FileDropzone} from '@skeletonlabs/skeleton';
    import { Pane, Splitpanes } from 'svelte-splitpanes';
    import {scaleGridX} from '../../components/PianoRoll/Grid'
    import { onMount } from 'svelte';
    import  {Note} from '../../components/PianoRoll/Note'
    import { Midi } from '@tonejs/midi'
    import { scale_value, now, mod} from "../../components/PianoRoll/utils";
    import {PianoRoll} from '../../components/PianoRoll/PianoRoll'
    import { v4 as uuid4 } from 'uuid';
    import type {RgbaColor} from 'svelte-awesome-color-picker';
    import {Fretboard} from '../../components/Fretboard/Fretboard'
    import Dropdown from '../../components/Dropdown.svelte';
    import ColorPicker, { ChromeVariant } from 'svelte-awesome-color-picker';
	import ColorPickerWrapper from '../../components/ColorPickerWrapper.svelte';
    import * as MusicData from '../../lib/MusicTheory/Data/computedData.json'
    import Table from '../../components/Table.svelte'
    import {scaleLookup} from '../../lib/scaleLookup'

   
    import F7Sparkles from '~icons/f7/sparkles'
    import CarbonTuning from '~icons/carbon/tuning'
    import F7Tuningfork from '~icons/f7/tuningfork'
    import MdiMusicClefBass from '~icons/mdi/music-clef-bass'
    import BitcoinIconsVisibleFilled from '~icons/bitcoin-icons/visible-filled'
    import BitcoinIconsHiddenOutline from '~icons/bitcoin-icons/hidden-outline'

    
    const  note_names = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    
    const music_data_bin = Object.fromEntries(MusicData.scales.map(s => [s.binary.toString(2), s.binary]))
    const music_data_names = Object.fromEntries(MusicData.scales.map(s => [s.binary.toString(2), (s.names || [''])[0]]))
    const music_data_binary_strings = Object.keys(music_data_bin)
    const music_data_lookup = new Array(12).fill([] as number[])
    const bin_range = [...Array(4095).keys()].map(k => k.toString(2).length < 12 ? [...Array(12-k.toString(2).length).fill('0'),k.toString(2)].join('') : k.toString(2))

    let music_key = 0;
    let colorpicker = null as HTMLDivElement|null;

    $:keyHandler(music_key)
    function keyHandler(val: number) {
        if (FB) {FB.setKey(val)};
    }
    
    let kp = {
        kpShift: false
    }

   
    let listboxIntervals = [] as number[]
    let interval_color_input = {r:255,g:0,b:0,a:1}
    let interval_colors_selected_indices = [] as number[]

    let interval_marker_colors = [{r:255,g:0,b:0,a:1},{r:255,g:0,b:0,a:1},{r:255,g:239,b:184,a:1},{r:255,g:239,b:184,a:1},{r:136,g:255,b:112,a:1},{r:226,g:197,b:255,a:1},{r:226,g:197,b:255,a:1},{r:152,g:163,b:255,a:1},{r:152,g:163,b:255,a:1},{r:255,g:213,b:179,a:1},{r:255,g:213,b:179,a:1},{r:255,g:213,b:179,a:1}];
    let interval_text_colors = [{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1},{r:0,g:0,b:0,a:1}];
    
    let fb_color_a = {r:221.13,g:225.12,b:254,a:1}
    let fb_color_b = {r:254,g:230,b:254,a:1}
    let fb_color_c = {r:253,g:245,b:254,a:1}



    function setFBColorA(v: RgbaColor) {
        console.log(v)
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
    let interval_popup_state_array = [...new Array(24).fill(false)] as boolean[]
    let interval_popup_state = false; 
    
    let intervalMarkersVisible = [false, true, false, true, false, false, true, false, true, false, true, false];
    let intervalMarkersTextVisible = [false, true, false, true, false, false, true, false, true, false, true, false];

    let fretboardTuning = [8,1,6,11,4,9,2,7,11,4]
    let numStrings = 6
    let minStrings = 2
    let maxStrings = 10
    let numFrets = 21



    $:intervalColorPickerPopupHandler(interval_popup_state_array)
    $:intervalColorHandler(interval_color_input)
    $:fretboardTuningHandler(fretboardTuning)
    $:fretboardFretCountHandler(numFrets)
    $:fretboardStringCountHandler(numStrings)

    function markerColorInputPopupHandler(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const bounds = (document.getElementById("colorwrapper") as HTMLElement).getBoundingClientRect();

        const cursor = {x: event.pageX, y: event.pageY}
        if (!(
            cursor.x < bounds.x+bounds.width &&
			cursor.x > bounds.x &&
			cursor.y < bounds.y+bounds.height &&
			cursor.y > bounds.y
        )) {
            interval_popup_state = false;
            window.removeEventListener('pointerdown', markerColorInputPopupHandler)
        }
        
    }
    function intervalColorMarkerSelectClickHandler(i: number) {
        intervalMarkersVisible[i] = !intervalMarkersVisible[i]
    }
    function intervalColorMarkerTextSelectClickHandler(i: number) {
        intervalMarkersTextVisible[i] = !intervalMarkersTextVisible[i]
    }
    function markerColorInputClickHandler(event: MouseEvent) {
        if (!interval_popup_state) {
            interval_popup_state = true;   
            window.addEventListener('pointerdown', markerColorInputPopupHandler)
            
        }
        const target = event.target as HTMLElement;
        const id = parseInt(`${target.id.length>2? target.id[2]:''}${target.id.length>3? target.id[3]:''}`)
      
        if (kp.kpShift) {
            if (interval_colors_selected_indices.includes(id)) {
                interval_colors_selected_indices = interval_colors_selected_indices.filter(i => i!==id)
            } else {
                interval_colors_selected_indices.push(id)
                Object.assign(target.style, {
                    backgroundColor: `rgba(${Object.values(interval_color_input).map(c => `${c}`).join(',')});`
                })
                if (id < 12) {
                    interval_marker_colors[id] = interval_color_input
                } else if (id < 24) {
                    interval_text_colors[id-12] = interval_color_input 
                } else if (id === 24) {
                    fb_color_a = interval_color_input
                } else if (id === 25) {
                    fb_color_b = interval_color_input
                } else if (id === 26) {
                    fb_color_c = interval_color_input
                }
            }
        } else {
            interval_colors_selected_indices = [id]
            if (id < 12) {
                interval_color_input = interval_marker_colors[id]
            } else if (id < 24) {
                    interval_color_input = interval_text_colors[id-12]
            } else if (id === 24) {
                    interval_color_input = fb_color_a
            } else if (id === 25) {
                    interval_color_input = fb_color_b
            } else if (id === 26) {
                    interval_color_input = fb_color_c
            }
        }

    }

    function intervalColorHandler(interval_color_input: {
        r: number;
        g: number;
        b: number;
        a: number;
    }) {
        
        for (const index of interval_colors_selected_indices) {
            console.log(index)
            if (index < 12) {
                interval_marker_colors[index] = interval_color_input
                fretboardMarkerColorHandler(interval_marker_colors)
    
            } else if (index < 24) {
                interval_text_colors[index-12] = interval_color_input 
                fretboardTextColorHandler(interval_text_colors)

            } else if (index === 24) {
                fb_color_a = interval_color_input
                setFBColorA(fb_color_a)
            } else if (index === 25) {
                fb_color_b = interval_color_input
                setFBColorB(fb_color_b)
            } else if (index === 26) {
                fb_color_c = interval_color_input
                setFBColorC(fb_color_c)
            }
        }
    }

    function fretboardTuningHandler(fretboardTuning: number[]) {
        const tuning = fretboardTuning.filter((n,i) => i >= maxStrings-numStrings)
        if (FB) {FB.setTuning(tuning)};
    }
    function fretboardFretCountHandler(numFrets: number) {
        if (FB) {FB.setFrets(numFrets)};
    }
    function fretboardStringCountHandler(numStrings: number) {
        if (FB) {FB.setStrings(numStrings)};
    }
    function fretboardMarkerColorHandler(rgbarr: RgbaColor[]) {
        const colors = rgbarr.map(v => [v.r/256, v.g/256, v.b/256, v.a]);
        if (FB) {FB.setMarkerColors(colors)};
    }
    function fretboardTextColorHandler(rgbarr: RgbaColor[]) {
        console.log(rgbarr)
        const colors = rgbarr.map(v => [v.r/256, v.g/256, v.b/256, v.a]);
        if (FB) {FB.setMarkerTextColors(colors)};
    }

    function intervalColorPickerPopupHandler(popuparr: boolean[]) {
        let color_flag = false;
        for (const flag of popuparr) {
            if (flag) {
                color_flag = true;
                break;
            }
        }
        interval_popup_state = color_flag
    }
  
  


    let dropdown = {} as Record<string,number>
    let selected_val = undefined as string | undefined;
    let fretboard_selected_midi_toggle = true;
    MusicData.scales.forEach(scale => {
        if (scale.names) {
            dropdown = {...dropdown, ...{[scale.names[0]]:scale.binary}}
        }
    })

    let dropdown_vals = Object.keys(dropdown)
    let isOpen = false;
    $:dropdownHandler(selected_val,isOpen)

    $:intervalMarkerVisibleHandler(intervalMarkersVisible);
    $:intervalMarkerTextVisibleHandler(intervalMarkersTextVisible)

    function intervalMarkerVisibleHandler(val: boolean[]) {
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
    function intervalMarkerTextVisibleHandler(val: boolean[]) {
        if (FB) {
            FB.setMarkerText(val)
        }
    }
    type ErrorListener = (this: FileReader, ev: ProgressEvent<FileReader>) => void;
    type SuccessCallback = (file: ArrayBufferLike | string | null) => void;
    const error_callback = function (this: FileReader, ev: ProgressEvent<FileReader>) { console.log('error: ', ev)}
    
    function readFileAsArrayBuffer(file: File, success: SuccessCallback, error=error_callback as ErrorListener) {
        var fr = new FileReader();
        fr.addEventListener('error', error, false);
        if (fr.readAsBinaryString) {
            fr.addEventListener('load', function (this: FileReader, ev: ProgressEvent<FileReader>) {
             
                var r = this.result 
                if (typeof r === 'string') {
                    var result = new Uint8Array(r.length);
                    for (var i = 0; i < r.length; i++) {
                        result[i] = r.charCodeAt(i);
                    }
                    success(result.buffer);
                }
                
            }, false);
            return fr.readAsBinaryString(file);
        } else {
            fr.addEventListener('load', function () {
                success(this.result);
            }, false);
            return fr.readAsArrayBuffer(file);
        }
    }
    function stringToArrayBuffer(str: string) {
        const arr = new Uint8Array(str.length / 8);
        for(let i = 0; i<str.length; i+=8) {
            arr[i/8] = parseInt(str.slice(i, i+8), 2);
        }
        return arr;
    }
    function dropdownHandler(val: string|undefined, isopen:boolean) {
        if (val &&!isopen) {
          const num=dropdown[val]
          if (num) {
            let c = 0
            for (const i of num.toString(2)) {
                intervalMarkersVisible[c] = i === '0' ? false : true
                intervalMarkersTextVisible[c] = i === '0' ? false : true
                c+=1
            }
          }
        }
    }
    function setMidi(file: ArrayBufferLike | string | null) {
        let result: ArrayBuffer | ArrayLike<number>
        if (file) {
            if (typeof file === 'string') {
                result = stringToArrayBuffer(file)
            } else {
                result = file
            }
            const midi = new Midi(result)
        
            notes_data = (
                midi.tracks[0].notes as noteData[]
                ).map(
                    (note)=> (
                        {
                            pitch:96-note.midi,
                            offset:note.time,
                            duration:note.duration
                        }
                )
            )

            const measures = Math.floor((bpm/meter) * (notes_data[notes_data.length-1].offset/60))
            const length_seconds = (measures * meter * 60)/bpm

            for (let i=0; i<notes_data.length; i++) {
                notes_.xa.push(scale_value(notes_data[i].offset, 0, length_seconds, 0, 100))
                notes_.xb.push(scale_value(notes_data[i].offset + notes_data[i].duration, 0, length_seconds, 0, 100))
                notes_.ya.push(scale_value(notes_data[i].pitch, 0, 96, 0, 100))
                notes_.yb.push(scale_value(notes_data[i].pitch+1, 0, 96, 0, 100))
            }

            if (Piano) {
                if (Piano.State) {
                    Piano.State._setNoteData(notes_)
                    Piano.State.grid_measures = measures
                }
            }
                            
        
        }
    }
    
            
    function onChangeHandler(e: Event): void {
        if (files && Piano) {
            readFileAsArrayBuffer(files[0],setMidi)
        }
    }
    let files: FileList;
    const bpm = 120;
    const meter = 4;
    async function getMidi(url:string) {
        const midi = await Midi.fromUrl(url)
        return midi
    }
    const notes_ = {
        xa: [] as number[],
        xb: [] as number[],
        ya: [] as number[],
        yb: [] as number[],
        select_state: false 
    }
    let notes_data = [] as {
        pitch: number,
        offset: number,
        duration: number
    }[]
    type noteData = {
        midi: number,               // midi number, e.g. 60
        time: number,               // time in seconds
        ticks: number,              // time in ticks
        name: string,               // note name, e.g. "C4",
        pitch: string,              // the pitch class, e.g. "C",
        octave : number,            // the octave, e.g. 4
        velocity: number,           // normalized 0-1 velocity
        duration: number,           // duration in seconds between noteOn and noteOff
    };
	let multiplier = 1;
	
	let parentDimensions = { width: 0, height: 0 } as { width: number, height: number };
    

    let canvas = null as HTMLCanvasElement | null;
    let fb_canvas = null as HTMLCanvasElement | null;

    let currentTile: boolean = true;
    
    let intervalMarkersVisible_numbers = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0];
    
    let width = 1000;
    let height = 1000;
    let sidebarleft = null as HTMLElement | null;
    let sidebartop = null as HTMLElement | null;

    let grid_labels = {
        x: [] as number[],
        y: [] as number[],
        x_labels: [] as string[],
        y_labels: [] as string[]
    }

    let xscale = 2.0;
    let yscale = 1.0;    
    let xtrans = 1.0;
    let ytrans = 0.0;
    // Simple example, see optional options for more configuration.
let grid_subdivisions = 4;
let grid_measures = 0;
let grid_time_div = 0;
let grid_zoom_divider = 0;
let labelflag = false;
    let Piano = null as PianoRoll | null;
    let FB  = null as Fretboard | null;
    let SelectedRow = {} as Record<string,any>

    $:rowHandler(SelectedRow)
    
    //let FB = null as Fretboard | null
    $:scaleHandler(xscale, 'zoom');
    $:scaleHandler(yscale, 'scale');
    $:scaleHandler(xtrans, 'zoom');
    $:scaleHandler(ytrans, 'trans');
    

    function scaleHandler(val: number, vtype: 'scale' | 'trans' | 'zoom') {
        switch(vtype) {
            case('zoom'): if (Piano) {
                Piano.State?._setZoomSpeed(xtrans,xscale)
            } break;
            case('scale'): if (Piano) {
                
                
                grid_subdivisions = Piano.State?.grid_subdivisions || 0
            } break;
            case('trans'): if (Piano) {Piano.setTrans({trans: [xtrans, ytrans]})} break;
        }
    }
   
    let numInstances = 0;

    const canvas_id = `c${(uuid4() as string).replaceAll('-', '')}`;
    const fretboard_id = `c${(uuid4() as string).replaceAll('-', '')}`;
    let cachedNumGridInstances = 0;

    let scroll_x = 0;
    let scroll_y = 0;
    let timer = 0;



    const MidiNote = new Note({});



    function throttle() {
        let time_now = now()
        if (time_now > timer+500) {
            timer = now()
        }
    }
    function scrollHandler(event: WheelEvent) {
        scroll_x = event.deltaX
        scroll_y = event.deltaY
        throttle()
    }

    let x_scale  = 1;
    let subdiv = 4;

    $: onScaleX(xscale) 
    function onScaleX(scalex: number) {
        const { _grid_subdiv, _grid_scale_x }= scaleGridX({
            scale_x: scalex,
            grid_measures: grid_measures,
            grid_time_div: grid_time_div,
            grid_zoom_divider: grid_zoom_divider
        })
        subdiv = _grid_subdiv
        x_scale = _grid_scale_x
    }


    let max_labels = 20;
    function setGridLabels(data: {
        x: number[];
        y: number[];
        x_labels: string[];
        y_labels: string[];
    }) {
        
        if (data.x_labels.length > max_labels ) {
            const x_label_spacer = Math.ceil(data.x_labels.length/max_labels);
            const labels = [] as string[]
            const x = [] as number[]
            for (let i=0; i<data.x_labels.length; i+= x_label_spacer) {
                labels.push(data.x_labels[i])
                x.push(data.x[i])
            }

            data.x_labels = labels
            data.x = x
        }
        grid_labels = data;
    }
    let viselements = 0;
    let selected_notes = [] as number[]
    let selected_scale = new Array(12).fill('0') as string[]
    let selected_scale_array = [] as string[]
    let selected_note_data = {} as Record<string,number[]>
    let matches_arr = {} as Record<string,string[]>
    let scale_names = [] as string[]
    let scale_keys = [] as string[]
    let scale_data = {} as Record<string,string[]>
    let filtered_scale_data = {} as Record<string,string[]>
    let scale_kl = 0
    let scale_k_arr = [] as number[]
    let scale_key_filter = {} as Record<string,boolean>
    let selected_keys = [] as string[]
    let selected_x = [] as number[]
    let sorted_intervals = [] as string[]
    const td = [{position:0,scale:'',key:''}]
    let TableData = [] as Record<string,any>[]
    let sorted_note_vertices = [] as number[][]
    const color_pallette = [[255, 255, 204, 256],[255, 204, 153, 256],[255, 204, 204, 256],[255, 153, 204, 256],[255, 204, 255, 256],[204, 153, 255, 256],
                            [204, 204, 255, 256],[153, 204, 255, 256],[204, 255, 255, 256],[153, 255, 204, 256],[204, 255, 204, 256],[204, 255, 153, 256]].map(c => [c[0]/256,c[1]/256,c[2]/256,c[3]/256])
    const text_colors = [...new Array(12).fill(0).map(n => [0,0,0,1])]
    function setSelectedNotes(selected: number[]) {
        if (selected.length > 1) {
            selected_note_data = {} as Record<string,number[]>
            selected_scale = new Array(12).fill('0')
            selected_scale_array = [] as string[]
            let notes = [...new Array(...new Set(selected.map(n  => mod(n,12))))] as number[]
            notes.forEach(n => {
                selected_scale[n] = '1'
            })
            sorted_note_vertices = selected.map((n,i) => [selected_x[i],n])
            sorted_note_vertices.sort((a:number[],b:number[])=> a[0]-b[0])
            sorted_intervals = sorted_note_vertices.map(n_arr => `${note_names[mod(n_arr[1],12)]}${Math.floor(n_arr[1]/12) - 2}`)
       
            if (FB) {
                FB.setMusicScale(selected_scale.map(s => s==='0' ? 0 : 1))
                FB.setMarkerText(selected_scale.map(s => s==='0' ? false : true))
            }
            scale_data = {} as Record<string,string[]>
            scale_kl = 0;
            scale_key_filter = {} as Record<string,boolean>
            for (let j=0; j<12; j++) {
                const selected_bin= [] as string[]
                for (let k=0; k<12; k++) {
                    selected_bin.push(selected_scale[mod((j+k),12)])
                }
                const scales = scaleLookup(selected_bin.join(''))
                for (let i=0; i<scales.length; i++) {
                    if (music_data_names[scales[i]]) {
                        if (!(note_names[j] in scale_key_filter)) {
                            scale_key_filter = {...scale_key_filter, ...{[note_names[j]]: true}}
                        }
                        if (music_data_names[scales[i]] in scales) {
                            scale_data[music_data_names[scales[i]]].push(note_names[j])
                        } else {
                            scale_data = {...scale_data, ...{[music_data_names[scales[i]]]: [note_names[j]] as string[]}}
                        }

                    }
                }

            }
            TableData = Object.keys(scale_data).map(k => ({'scale': k, 'key': scale_data[k][0]}))

            for (let i=0; i<selected.length; i++) {
                const n = mod(selected[i],12)
                const o = Math.floor(selected[i]/12)
                if (n in selected_note_data) {
                    selected_note_data[n].push(o)
                } else {
                    selected_note_data = {...selected_note_data, ...{[`${n}`]:[o] as number[]}}
                }
            }
        }
         
        }


    $:setSelectedNotes(selected_notes)
    function rowHandler(sr: Record<string,any>) {
       
      
        if ('key' in sr) {
            music_key = note_names.indexOf(sr['key'])
        } else {
            music_key = 0
        }

        keyHandler(music_key)

        if ('scale' in sr) {
            selected_val = sr['scale']
            const num=dropdown[sr['scale']]
            if (num) {
                let c = 0;
                for (const i of num.toString(2)) {
                    intervalMarkersVisible[c] = i === '0' ? false : true
                    intervalMarkersTextVisible[c] = i === '0' ? false : true
                    c+=1
                }
            }
        } else {
            if (FB) {
                FB.setMusicScale(selected_scale.map(s => s==='0' ? 0 : 1))
                FB.setMarkerText(selected_scale.map(s => s==='0' ? false : true))
            }
        }
        
        
    }
    function main(Piano:PianoRoll) {
        
        function render() {

            if (Piano) {
                setGridLabels(Piano.grid_labels)
                multiplier = Piano.Render?.multiplier || 1;
                viselements = Piano.State?.note_render_data.note_count || 0;
                const selected_ = [] as number[]
                selected_x = [] as number[]
                if (Piano.State) {
                    [...Piano.State.Notes.Notes.filterCurrentSelectStateIDs({select_state: true})].forEach(
                        id => {
                            const data = Piano?.State?.Notes.Notes.data_map.get(id)
                            if (data) {
                                selected_.push(96-Math.ceil(scale_value(data.ya,0,100,0,96)))
                                selected_x.push(data.xa)
                            }
                        }
                    )
                }
                selected_notes = selected_
                Piano.render() 
            }
            if (FB) {
                FB.render()
            }
            requestAnimationFrame(render)
        }
        requestAnimationFrame(render)
    }


        onMount(() => {
            if (canvas && fb_canvas) {
              
               
                FB = new Fretboard({canvas: fb_canvas, canvas_id: fretboard_id, wrapper_id: 'fbwrapper'})
                Piano = new PianoRoll({canvas: canvas, canvas_id: canvas_id, wrapper_id:"midinotewrapper"})
                FB.setMarkerTextColors(text_colors)
                FB.setMarkerColors(color_pallette)
                FB.setKey(0)
                scaleHandler(0,'zoom')
                main(Piano)
                
             
            }
        });
function onKeyDown(e: KeyboardEvent) {
    if (e.key==='Shift') {
        kp.kpShift = true;
    }
    if (Piano) {
        Piano.State?._onKeyDown(e)
    }
}
function onKeyUp(e: KeyboardEvent) {
    if (e.key==='Shift') {
        kp.kpShift = false;
    }
    if (Piano) {
        Piano.State?._onKeyUp(e)
    }
}
</script>

<Splitpanes class="modern-theme" style="height: 100%">
	<Pane size={22}>
        <div class="sidebarcontainer">
           
            <div class="sidebar-tl">
                {#if interval_popup_state} 
                <div class="colorpicker center-h">
                    <ColorPicker components={{wrapper: ColorPickerWrapper }} isOpen={interval_popup_state} label={''} isInput={false} isPopup={false} bind:rgb={interval_color_input}/>
                </div>
                {:else}
            
                <FileDropzone class="fdz" name="files" accept=".mid, .MID" bind:files={files} on:change={onChangeHandler}>
                    <svelte:fragment slot="lead">💫</svelte:fragment>
                    <svelte:fragment slot="message"><span style="font-weight:bold">Select a file </span>or drag and drop</svelte:fragment>
                    <svelte:fragment slot="meta">accepts '.mid'</svelte:fragment>
                </FileDropzone>
        
            
                <span class="badge variant-ghost-surface">Visible Notes: {viselements}</span>
                <div class="dropdown-spacer">
                    <Dropdown defaultInputText='default' bind:isOpen={isOpen} bind:selected_val={selected_val} dropdownValues={dropdown_vals}/>
                </div>

                
                {/if}
            </div>
            
            <div class="accordion-control text-left w-full flex items-center space-x-4 py-2 px-4 hover:bg-primary-hover-token rounded-container-token ">
                <div class="accordion-lead"><MdiMusicClefBass/></div>
                <div class="accordion-summary flex-1"><b>Key: {note_names[music_key]}</b>
                    <RangeSlider for="boxcontrols" name="range-slider" bind:value={music_key} min={0} max={11} step={1} ></RangeSlider>   
                </div>
            </div>
            <div class="acc-scroll-y">
                <Accordion autocollapse > 
                    <AccordionItem>
                        <svelte:fragment slot="summary">
                            <div>
                                <b>Tuning: {fretboardTuning.filter((n,i) => i > maxStrings - numStrings - 1).map(n => note_names[n]).join(' ')}</b>
                            </div>
                        </svelte:fragment>
                        <svelte:fragment slot="lead"><F7Tuningfork/></svelte:fragment>
                        <svelte:fragment slot="content">
                            <div class="scale-parent">
                                {#each [...Array(numStrings).fill(0)] as a,i}
                                    <div class="scale-wrapper" style={`background-color: rgba(var(${i%2 === 0 ?  '--color-surface-50' : '--color-surface-100' }))`}>
                                        <RangeSlider for="boxcontrols" name="range-slider" bind:value={fretboardTuning[maxStrings-i-1]} min={0} max={11} step={1} ></RangeSlider>  
                                        <div>{note_names[fretboardTuning[maxStrings-i-1]]}</div>
                                    </div>
                                {/each}
                            </div>
                        </svelte:fragment>
                    </AccordionItem>
                    <AccordionItem open>
                        <svelte:fragment slot="summary"><b>Markers</b></svelte:fragment>
                        <svelte:fragment slot="lead"><F7Sparkles/></svelte:fragment>
                        <svelte:fragment slot="content">
                            <div class="interval-parent">
                                <div class="interval-wrapper" style={`background-color: rgba(var(--color-surface-400)); justify-items: start;`}>
                                    <div><span style="font-weight: bold; padding-left: 0.4rem; color: rgba(var(--color-surface-50));">Marker</span></div>
                                    <div><span style="font-weight: bold; padding-left: 0.4rem; color: rgba(var(--color-surface-50));">Text</span></div>
                                    <div><span style="font-weight: bold; padding-left: 1.2rem; color: rgba(var(--color-surface-50));">I</span></div>
                                    <div><span style="font-weight: bold; padding-left: 0.2rem; padding-right: 0.2rem; color: rgba(var(--color-surface-50));">Note</span></div>
                                </div>
                                {#each [...Array(12).fill(0)] as a,i}
                                    <div class="interval-wrapper" style={`background-color: rgba(var(${i%2 === 0 ?  '--color-surface-50' : '--color-surface-200' }))`}>
                                        
                                        <div class={`colorselector-wrapper ${intervalMarkersVisible[(i)%12] ? 'text-marker' : 'text-marker-b'}`}>
                                            <div class="colorselector-marker" id={`cm${i}`} on:click={markerColorInputClickHandler} style ={`background-color: rgba(${Object.values(interval_marker_colors[(i)%12]).map(c => `${c}`).join(',')});`} />
                                            <button on:click={()=>{intervalColorMarkerSelectClickHandler(i%12)}}> 
                                                {#if intervalMarkersVisible[(i)%12]}
                                                    <BitcoinIconsVisibleFilled style="color: rgba(var(--color-surface-400));"/>
                                                {:else}
                                                    <BitcoinIconsHiddenOutline style="color: rgba(var(--color-surface-400));"/>
                                                {/if}
                                            </button>
                                        </div>
                                        <div class={`colorselector-wrapper ${intervalMarkersTextVisible[(i)%12] ? 'text-marker' : 'text-marker-b'}`}>
                                            <div class="colorselector-marker" id={`cm${i+12}`} on:click={markerColorInputClickHandler} style ={`background-color: rgba(${Object.values(interval_text_colors[(i)%12]).map(c => `${c}`).join(',')});`} />
                                            <button on:click={()=>{intervalColorMarkerTextSelectClickHandler(i%12)}}> 
                                                {#if intervalMarkersTextVisible[(i)%12]}
                                                    <BitcoinIconsVisibleFilled style="color: rgba(var(--color-surface-400));"/>
                                                {:else}
                                                    <BitcoinIconsHiddenOutline style="color: rgba(var(--color-surface-400));"/>
                                                {/if}
                                            </button>
                                        </div>
                                        
                                        <div id={`im${i+12}`}>{i}</div>
                                        <div>{note_names[mod(i+music_key,12)]}</div>
                                        <div></div>
                                    </div>
                                {/each}
                            </div>
                        </svelte:fragment>
                        
                    </AccordionItem>
                    <AccordionItem>
                        <svelte:fragment slot="summary"><b>Fretboard</b></svelte:fragment>
                        <svelte:fragment slot="lead"><CarbonTuning/></svelte:fragment>
                        <svelte:fragment slot="content">
                            <div class="scale-parent">
                                <div class="fretboard-wrapper" >
                                    <div><b>Strings: {numStrings}</b></div>
                                    <RangeSlider for="boxcontrols" name="range-slider" bind:value={numStrings} min={2} max={10} step={1} ></RangeSlider>  
                                </div>
                                <div class="fretboard-wrapper" >
                                    <div><b>Frets: {numFrets}</b></div>
                                    <RangeSlider for="boxcontrols" name="range-slider" bind:value={numFrets} min={12} max={27} step={1} ></RangeSlider>  
                                </div>
                                <div class="fretboard-wrapper" >
                                    <div><b>Base Fret Color</b></div>
                                    <div class="colorselector-marker bord" id={`cm24`} on:click={markerColorInputClickHandler} style ={`background-color: rgba(${Object.values(fb_color_a).map(c => `${c}`).join(',')});`} />
                                    
                                </div>
                                <div class="fretboard-wrapper" >
                                    <div><b>Marker Fret Color</b></div>
                                    <div class="colorselector-marker bord" id={`cm25`} on:click={markerColorInputClickHandler} style ={`background-color: rgba(${Object.values(fb_color_b).map(c => `${c}`).join(',')});`} />
                                    
                                </div>
                                <div class="fretboard-wrapper" >
                                    <div><b>0th Fret Color</b></div>
                                    <div class="colorselector-marker bord" id={`cm26`} on:click={markerColorInputClickHandler} style ={`background-color: rgba(${Object.values(fb_color_c).map(c => `${c}`).join(',')});`} />
                                    
                                </div>
                        </svelte:fragment>
                        
                    </AccordionItem>
                
                </Accordion>
            </div>
        </div>
    </Pane>
	<Pane>
		<Splitpanes class="modern-theme" horizontal="{true}">
			<Pane size={20}>
                <div id="fbwrapper" class="wrapper noselect" draggable="false">
                    <canvas id={fretboard_id} class="fbinstance noselect"  bind:this={fb_canvas} ></canvas>
                </div>
            </Pane>
            <Pane size={25}>
                
                {sorted_intervals.join(' ↝ ')}
            </Pane>
                <Pane  size={50}>
                <Splitpanes class="modern-theme" >
                    <Pane size={5}>
                        
                    </Pane>
                    <Pane minSize={10} >
                        <div class="container noselect" draggable="false" >
                            <div class="timeline noselect " bind:this={sidebartop} draggable="false" >
                                {#each grid_labels.x_labels as x_label,i} 
                                    
                                    <span class="fade-in-text" style={`position: absolute; font-size: 0.65rem; bottom:-5px; left:${grid_labels.x[i]/multiplier}px;`}>{x_label}</span>

                                 {/each}
                            </div>
                            <div class="piano_roll noselect" draggable="false" id="midinotewrapper">
                                <canvas class="canvasinstance noselect"  draggable="false" id={canvas_id} bind:this={canvas} />
                            </div>
                        </div>
                    </Pane>
                </Splitpanes>
            </Pane>
			<Pane size={5}>
                
            </Pane>
		</Splitpanes>
	</Pane>
	<Pane size={10}>
        
        <div class="scale-table"> 
            <Table ColumnOrder={['Key', 'Scale']} TableFilter={'key'} Data={TableData} bind:SelectedRow={SelectedRow}/>
        </div>
    </Pane> 
</Splitpanes>

<svelte:window
	draggable="false"
	on:keydown={onKeyDown}
	on:keyup={onKeyUp}
/>
<style>
    .acc-scroll-y {
        position: relative;
        display: flex;
        min-width: 100%;
        max-width: 100%;
        overflow-y: auto;
        max-height: 100%;
    }
    .center-h {
        display: flex;
        justify-content: center;
    }
    .colorpicker {
        position: absolute;
        top: 0px;
        left: 0px;
        z-index: 100;
        width: 100%;
        height: 100%;
      
    }
:global(.splitpanes__pane) {
  background-color: #b8bedd;
  justify-content: center;
  align-items: center;
  display: flex;
  position: relative;
}
:global(:root) {
    --picker-height: 15vh;
   
}
.sidebar-tl {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: start;
    width: 100%;
    height: 100%;
    padding-top: 0px;
    min-height: 27vh;
    max-height: 27vh;
    gap: 0.6rem;
}
.fdz {
    height: 20vh;
}
.bord {
    border: solid 1px rgba(var(--color-secondary-400));
    border-radius: 3px;
}
.container {
  display: grid; 
  width: 100%;
  height: 100%;
  grid-template-columns: 1fr; 
  grid-template-rows: 1rem 1fr; 
  gap: 0px 0px; 
  grid-template-areas: 
    "timeline "
    "piano_roll "; 
}
.interval-parent {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-items: center;
    width: 100%;
    height: max-content;
    border: solid 1px rgba(var(--color-secondary-400));
    border-radius: 3px;
    overflow: hidden;
   
}
.scale-parent {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-items: center;
    width: 100%;
    height: 100%;
    border: solid 1px rgba(var(--color-secondary-400));
    border-radius: 3px;
    overflow: hidden;
   
}

.timeline { 
    grid-area: timeline; 
    position: relative;
    box-sizing: border-box;
    background-color: #aeb2dae3;
}
.piano_roll { 
    grid-area: piano_roll; 
    position: relative;
    box-sizing: border-box;
    background-color: #b8bedd;
}
.sidebar { 
    grid-area: sidebar; 
    position: relative;
    box-sizing: border-box;
    background-color: #b8bedd
}
.fbinstance {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    height: 100%;
    width: 100%;

}
.colorselector-wrapper {
    width: 100%;
    height: 100%;
    display: grid;
    align-items: center;
    justify-items: center;
    grid-template-columns: 1fr 1fr ;
    grid-template-rows: 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;
}
.colorselector-wrapper:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
.colorselector-wrapper:nth-child(2) { grid-area: 1 / 2 / 2 / 3; }

.colorselector-marker {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 1rem;
}
.fretboard-wrapper {
    width: 100%;
    height: 2rem;
    padding: 1px;
    display: grid;
    align-items: center;
    justify-items: left;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

}
.fretboard-wrapper:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
.fretboard-wrapper:nth-child(2) { grid-area: 1 / 2 / 2 / 3; }

.interval-wrapper {
    width: 100%;
    height: 2rem;
    padding: 1px;
    display: grid;
    align-items: center;
    justify-items: center;
    grid-template-columns: 2fr 2fr repeat(2, 1fr);
    grid-template-rows: 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

}
.interval-wrapper:nth-child(1) { grid-area: 1 / 1 / 2 / 2; }
.interval-wrapper:nth-child(2) { grid-area: 1 / 2 / 2 / 3; }
.interval-wrapper:nth-child(3) { grid-area: 1 / 3 / 2 / 4; }
.interval-wrapper:nth-child(4) { grid-area: 1 / 4 / 2 / 5; }

.scale-wrapper {
    
    width: 100%;
    height: 100%;
    padding: 1px;
    display: grid;
    align-items: center;
    justify-items: left;
    grid-template-columns: 90% 10%;
    grid-template-rows: 1fr;
    grid-column-gap: 0px;
    grid-row-gap: 0px;

}
.scale-wrapper:nth-child(1) { 
    
    grid-area: 1 / 1 / 2 / 2; 
   
    min-width: 100%;
    max-width: 100%;
}
.scale-wrapper:nth-child(2) { grid-area: 1 / 2 / 2 / 3; }



.dropdown-spacer {
    padding: 10px;

}
.sidebarcontainer {
    position: relative;
    padding-top: 0px;
    padding-left: 0.6rem;
    padding-right: 0.6rem;
    width: 100%;
    height: 93vh;
    display: flex;
    flex-direction: column;
    justify-content: start;
    gap: 0.6rem;
}

.canvasinstance {
    position: absolute;
    top: 0;
    left: 0;
    box-sizing: border-box;
    height: 100%;
    width: 100%;

}
.wrapper {
    position: relative;
    box-sizing: border-box;
    height: 100%;
    width: 100%;
}
.box {
  display: flex;
  flex-direction: row;
  padding: 1rem;
  gap: 1rem;
  align-items: center;
}
.scale-table {
    width: 100%;
    height: 80vh;
    overflow:hidden;
}
.scale-table > table > thead {

    position: fixed;
    width: 100%;
    z-index: 1; 
}
.pad {
    padding-right: 30px;
}
.clickyboi {
    
    width:50px;
    height:50px;
 
    
}
.scalewrapper {
    width: 10vw
}
.colora {
  background: rgba(222,222,222, 1.0);
}

.colorb {
  background: rgb(240, 240, 240);
}
.slidyboi {

}
.colordropdown {
    padding-top: 0.3rem;
    width: 15vw;
}
.noselect {
    -webkit-touch-callout: none !important;
    -webkit-user-select: none !important;
    -webkit-user-drag: none !important;
    -khtml-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    user-select: none !important;
}
.fade-in-text {
  animation: fadeIn 0.5s;
  -webkit-animation: fadeIn 0.5s;
  -moz-animation: fadeIn 0.5s;
  -o-animation: fadeIn 0.5s;
  -ms-animation: fadeIn 0.5s;
    color: #010000;
}
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
.text-marker {
    border: solid rgba(var(--color-surface-400)) 1px;
    border-radius: 20px;
}
.text-marker-b {

}
</style>