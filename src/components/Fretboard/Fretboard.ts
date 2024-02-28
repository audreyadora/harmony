import { RenderEngine } from '../RenderEngine/RenderEngine';
import {round_to, scale_value, mod} from "../PianoRoll/utils";
 import { v4 as uuid4 } from 'uuid'; 
const NoteNames = new Map([
   ['C',0],
   ['C#',1],
   ['D',2],
   ['D#',3],
   ['E',4],
   ['F',5],
   ['F#',6],
   ['G',7],
   ['G#',8],
   ['A',9],
   ['A#',10],
   ['B',11]]
)

function  parse_notes(arr: number[] | string[]) {
    if (typeof arr[0] === 'number') {
        return arr as number[];
    } else {
        const l = [] as number[]
        for (const note of arr) {
            const n = NoteNames.get(note as string)
            if (typeof n === 'number') {
                l.push(n)
            }
        }
        return l;
    }
}
export class Fretboard {
    canvas = null as null | HTMLCanvasElement;
    Render = null as null |  RenderEngine;
    canvas_scale = [1,1]
    canvas_trans = [0,0]

    width = 0;
    height = 0;
    id = '';
    n = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']


    state =  {
        frets: 27,
        music_scale : [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0],
        key: 0,
        tuning: parse_notes(['E','A','D','G','B','E']),
        strings: 6,
    }
    f_color_a = [0.8671875,0.8828125,0.99609375,1];
    f_color_b = [0.99609375,0.90234375,0.99609375,1];
    f_color_c = [0.9921875,0.9609375,0.99609375,1];
    marker_colors = [[0.99609375,0,0,1],[0.99609375,0,0,1],[0.99609375,0.93359375,0.71875,1],[0.99609375,0.87890625,0.87890625,1],[0.53125,0.99609375,0.4375,1],[0.8828125,0.76953125,0.99609375,1],[0,0,0,1],[0.59375,0.63671875,0.99609375,1],[0,0,0,1],[0.98046875,0.98046875,0.98046875,1],[0,0,0,1],[0.99609375,0.83203125,0.69921875,1]];
    marker_text_colors = [[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1],[0,0,0,1]];
    
    border_px = 1.5;
    color_intervals = [3,5,7,9,12,15,17,19,21,23];
    k = 1/(2**(1/12))
    fretboard_data = new Float32Array(0)
    marker_data = new Float32Array(0)
    recalc_render_flag = true;
    cell_count = 0;
    border_color = [0.0,0.0,0.0,1.0]
    throttle = 0;

    music_scale_markers = [false, true, false, true, false, false, true, false, true, false, true, false]
    label_id_list = [] as string[];
    wrapper_id: string;
    tuning_octave = [4,3,3,3,2,2,2,2,2,2]
    circle_input = {'C':[] as number[],'C#':[] as number[],'D':[] as number[],'D#':[] as number[],'E':[] as number[],'F':[] as number[],'F#':[] as number[],'G':[] as number[],'G#':[] as number[],'A':[] as number[],'A#':[] as number[],'B': [] as number[]}
    note_labels = {
            top: [] as number[],
            left: [] as number[],
            width: [] as number[],
            height: [] as number[],
            label: [] as string[],
            color: [] as string[],
            border: [] as boolean[]
        }
    constructor(data: {canvas: HTMLCanvasElement, canvas_id: string, wrapper_id: string}) {
        this.canvas = data.canvas;
        this.id = data.canvas_id;
        this.wrapper_id = data.wrapper_id;
        this.Render = new RenderEngine({canvas: this.canvas});
        this.Render.background_color = this.border_color;


        this._resizeObserver.observe(this.canvas, {box: "device-pixel-content-box"})
        this.canvas.addEventListener("pointerdown",this.onClick.bind(this))
    }
    _genid() {
        return `l${(uuid4() as string).replaceAll('-', '')}`
    }
    gettuning(){
        console.log(this.state.tuning)
    }
    setKey(key : number) {
        
        this.state.key = key
        this.recalc_render_flag = true
    }
    setCircleInput(input: string[]) {
        this.circle_input = {'C':[] as number[],'C#':[] as number[],'D':[] as number[],'D#':[] as number[],'E':[] as number[],'F':[] as number[],'F#':[] as number[],'G':[] as number[],'G#':[] as number[],'A':[] as number[],'A#':[] as number[],'B': [] as number[]}
        for (const token of input) {
            const ele = [] as string[];
            const s_ = [] as string[]
            for (let i=0; i<token.length; i++) {

                if (i<token.length-1) {
                    s_.push(token[i])
                } else {
                    ele.push(s_.join(''))
                    ele.push(token[i])
                }
                
            }
           
            if(( ele[0] === 'C')||( ele[0] ==='C#')||( ele[0] ==='D')||( ele[0] ==='D#')||( ele[0] ==='E')||( ele[0] ==='F')||( ele[0] ==='F#')||( ele[0] ==='G')||( ele[0] ==='G#')||( ele[0] ==='A')||( ele[0] ==='A#')||( ele[0] ==='B')) {
                this.circle_input[ele[0]].push(parseInt(ele[1]))
            }
        }
        this.recalc_render_flag = true
    }
    setMusicScale(music_scale : number[] ) {
        this.state.music_scale = music_scale
        this.recalc_render_flag = true
    }
    setTuning(tuning : number[] | string[]) {
        this.state.tuning = parse_notes(tuning)
        this.recalc_render_flag = true
    }
    setTuningOctave(tuning : number[]) {
        this.tuning_octave = tuning
        this.recalc_render_flag = true
    }
    setFrets(frets : number) {
        this.state.frets = frets+1
        this.recalc_render_flag = true
    }
    setStrings(strings : number) {
        this.state.strings = strings
        this.recalc_render_flag = true
    }
    setMarkerColors(colors : number[][]) {
        this.marker_colors = colors
        this.recalc_render_flag = true
    }
    setMarkerTextColors(colors : number[][]) {
        this.marker_text_colors = colors
        this.recalc_render_flag = true
    }
    setMarkerText(val: boolean[]) {
        this.music_scale_markers = val
        this.recalc_render_flag = true
    }
    onClick(e: PointerEvent | MouseEvent) {
       
    }
    setFBColors(type: 'a'|'b'|'c', colors: number[]) {
       
        switch(type) {
            case 'a': this.f_color_a = colors; break;
            case 'b': this.f_color_b = colors; break;
            case 'c': this.f_color_c = colors; break;
        }
        this.recalc_render_flag = true
    }
    _set_labels() {
        let label_flag = false;
        const wrapper = document?.getElementById(this.wrapper_id)
        const multiplier = this.Render?.multiplier||1
   
        if (wrapper) {

            //add ids if needed
            if (this.note_labels.label.length > this.label_id_list.length) {
                const index = this.note_labels.label.length-this.label_id_list.length
                for (let i=0; i<index ;i++) {
                    this.label_id_list.push(this._genid())
                }
            }

            //remove ids + divs if needed
            if (this.note_labels.label.length < this.label_id_list.length) {
                const label_id_list = [] as string[]
                const index = this.label_id_list.length - this.note_labels.label.length
                for (let i=0; i<this.note_labels.label.length ;i++) {
                    label_id_list.push(this.label_id_list[i])
                }
                for (let i=0; i<index ;i++) {
                    const label = document?.getElementById(this.label_id_list[i+this.note_labels.label.length])
                    if (label) {
                        wrapper.removeChild(label)
                    }
                }
                this.label_id_list = label_id_list
            }

            for (let i=0; i<this.label_id_list.length ;i++) {     
                let label = document?.getElementById(this.label_id_list[i])
                //add divs if needed
                if (!label) {
                    label_flag = true;
                    label = document.createElement('div')
                    label.id =  this.label_id_list[i]
                }
                const offset = this.note_labels.border[i] ? 4 : 0
                Object.assign(label.style,{
                        position: 'absolute',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bottom: `${(3+this.note_labels.top[i]-offset)/multiplier}px`,
                        left: `${(this.note_labels.left[i]-offset)/multiplier}px`,
                        width: `${(offset + this.note_labels.width[i])/multiplier}px`,
                        height: `${(offset + this.note_labels.height[i])/multiplier}px`,
                        color: this.note_labels.color[i],
                        ...(this.note_labels.border[i] ? {border: '1px solid black'} : {}),
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                })
                label.innerText = this.note_labels.label[i]
                if (label_flag) {
                    wrapper.appendChild(label)
                    label_flag = false
                }                
            }
        }

    }
    //30: 0.825
    //26 0.779
    //22: 0.717
    calcFretboard() {
        const w = this.width
        const h = this.height
        const fret_height = h/this.state.strings
        this.fretboard_data = new Float32Array(this.state.strings*this.state.frets*15)
        this.marker_data = new Float32Array(this.state.strings*this.state.frets*15)
        let fret_y = 0;
        let instance = 0;
        
     
        for (let i=0; i < this.state.strings; i += 1) {
            let w_remaining = w;
            let xa = 0;
            let xb = 0;
            for (let j=0; j < this.state.frets; j += 1) {
                
                const fret_length = w_remaining - (w_remaining * this.k);

                xb = xa + fret_length;
                const color_selected = j === 0 ? this.f_color_a : (this.color_intervals.includes(j) ? this.f_color_b :this.f_color_c)

                this.fretboard_data.set([
                    (round_to(xa,4)),
                    h - round_to(fret_y+fret_height,4),
                    (round_to(xb,4)),
                    h - round_to(fret_y,4),
                    color_selected[0],
                    color_selected[1],
                    color_selected[2],
                    color_selected[3],
                    0,0,0,0,
                    this.width,    
                    this.height, 0.25            
                ],instance *15)
                w_remaining = w_remaining - fret_length;
                xa = xb;
                instance  += 1;

                
            }
            fret_y += fret_height;
        }
        const offset_x = this.fretboard_data[((instance-1)*15)+2]
        this.note_labels = {
            top: [] as number[],
            left: [] as number[],
            width: [] as number[],
            height: [] as number[],
            label: [] as string[],
            color: [] as string[],
            border: [] as boolean[]
        }
        let c = 0;
        const size = 1/2
        for (let i=0; i < this.state.strings; i += 1) {
            const row_start = this.state.tuning[this.state.strings-i-1]
            for (let j=0; j < this.state.frets; j += 1) {
                const marker = this.state.music_scale[mod(row_start - this.state.key + j,12)] 
                const label = this.music_scale_markers[mod(row_start - this.state.key + j,12)]

                
                this.fretboard_data[(c*15)] =  scale_value(this.fretboard_data[(c*15)],0,offset_x,0,w-this.border_px) + this.border_px
                this.fretboard_data[(c*15)+1] =  scale_value(this.fretboard_data[(c*15)+1],0,w,0,w - this.border_px) + (i===this.state.strings-1 ? this.border_px : 0)
                this.fretboard_data[(c*15)+2] =  scale_value(this.fretboard_data[(c*15)+2],0,offset_x,0,w-this.border_px) 
                this.fretboard_data[(c*15)+3] =  scale_value(this.fretboard_data[(c*15)+3] ,0,w,0,w-this.border_px) - this.border_px 

                const fret_distance_x = this.fretboard_data[(c*15)+2] - this.fretboard_data[(c*15)+0]
                const fret_distance_y = this.fretboard_data[(c*15)+3] - this.fretboard_data[(c*15)+1]
                
                const marker_width = size * fret_distance_y
                const corner_rad = 0.478
                const offset_marker_x = (fret_distance_x - marker_width)/2
                const offset_y = (fret_distance_y - marker_width)/2
                if (marker) {


                    this.marker_data[(c*15)] = this.fretboard_data[(c*15)] + offset_marker_x
                    this.marker_data[(c*15)+1] = this.fretboard_data[(c*15)+1] + offset_y
                    this.marker_data[(c*15)+2] = this.fretboard_data[(c*15)+2] - offset_marker_x
                    this.marker_data[(c*15)+3] = this.fretboard_data[(c*15)+3] - offset_y
                    this.marker_data[(c*15)+4] = this.marker_colors[mod(row_start - this.state.key + j,12)][0]
                    this.marker_data[(c*15)+5] = this.marker_colors[mod(row_start - this.state.key + j,12)][1]
                    this.marker_data[(c*15)+6] = this.marker_colors[mod(row_start - this.state.key + j,12)][2]
                    this.marker_data[(c*15)+7] = this.marker_colors[mod(row_start - this.state.key + j,12)][3]
                    this.marker_data[(c*15)+8] = corner_rad*marker_width
                    this.marker_data[(c*15)+9] = corner_rad*marker_width
                    this.marker_data[(c*15)+10] = corner_rad*marker_width
                    this.marker_data[(c*15)+11] = corner_rad*marker_width
                    this.marker_data[(c*15)+12] = this.width
                    this.marker_data[(c*15)+13] = this.height
                    this.marker_data[(c*15)+14] = 0.25
                    instance+=1


                }
                if (label) {
                    
           
                    this.note_labels.border.push(false)
            
                    this.note_labels.top.push(this.fretboard_data[(c*15)+1] + offset_y)
                    this.note_labels.left.push(this.fretboard_data[(c*15)] + offset_marker_x)
                    this.note_labels.height.push((this.fretboard_data[(c*15)+3] - offset_y) - (this.fretboard_data[(c*15)+1] + offset_y))
                    this.note_labels.width.push((this.fretboard_data[(c*15)+2] - offset_marker_x)-(this.fretboard_data[(c*15)] + offset_marker_x))
                    this.note_labels.label.push(`${this.n[mod(row_start+j,12)]}${this.tuning_octave[i]+Math.floor((row_start+j)/12)}`)
                    this.note_labels.color.push(`rgba(${this.marker_text_colors[mod(row_start - this.state.key + j,12)][0]*256},${this.marker_text_colors[mod(row_start - this.state.key + j,12)][1]*256},${this.marker_text_colors[mod(row_start - this.state.key + j,12)][2]*256},${this.marker_text_colors[mod(row_start - this.state.key + j,12)][3]})`)
                }
                c+=1
            }
        }
        this._set_labels();
        this.cell_count = instance;
        
        
    }
    _resizeObserver = new ResizeObserver((entries:ResizeObserverEntry[]) => {
        for (const entry of entries) {
            if (entry?.target?.id === this.id) {
                this.height = entry.devicePixelContentBoxSize[0].blockSize;
                this.width = entry.devicePixelContentBoxSize[0].inlineSize;
                this._onResize();
                break;
            };
        };
    });

    _onResize() {
        if (!this.Render) { this._renderCtxInit() } else {
            this.Render.resizeHandler(this.width, this.height)
        }
        this.recalc_render_flag = true;
        
    }
    _renderCtxInit() {
        if (this.canvas) {
            this.Render = new RenderEngine({canvas: this.canvas});
            this.Render.resizeHandler(this.width, this.height)
            this.Render.background_color = this.border_color;
        }
    }
    setScale(data: {scale: number[]}) {
        this.canvas_scale = data.scale;            
        this.recalc_render_flag = true;
    }
    setTrans(data: {trans: number[]}) {
            this.canvas_trans = data.trans
            this.state.frets = data.trans[0]
            this.recalc_render_flag = true;        
    }
    render() {
        
        if (!this?.Render) { this._renderCtxInit() } else if (this?.Render?.contextLost) { this._renderCtxInit() } else {
            if (this.recalc_render_flag) {
                this.calcFretboard()
                this.recalc_render_flag = false;
            }
            if (this.fretboard_data.byteLength > 2) {
                
                this.Render.render({
                    attributeArrayF32List: [this.fretboard_data, this.marker_data],
                    numInstances: this.cell_count*15
                })
            }
            
        };
    }
}