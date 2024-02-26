import { RenderEngine } from '../RenderEngine/RenderEngine';
import { PianoRollState } from './PianoRollState'
import {FpsCounter} from './test/Fps'



export class PianoRoll {
    canvas = null as null | HTMLCanvasElement;
    Render = null as null |  RenderEngine;
    State = null as null | PianoRollState;
    canvas_scale = [0,0];
    canvas_trans = [0,0]
    width = 1000;
    height = 1000;
    id = '';

    FPS: FpsCounter;
    _fps = 0;

    grid_range = {xa: 0, xb: 80, ya: 0, yb: 96};
    music_scale = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0]
    grid_labels = {
        x_labels: [] as string[],
        y_labels: [] as string[],
        x: [] as number[],
        y: [] as number[]
    }
 
    recalc_render_flag = true;

    constructor(data: {canvas: HTMLCanvasElement, canvas_id: string, wrapper_id: string}) {
        this.canvas = data.canvas;
        this.id = data.canvas_id;

        this.Render = new RenderEngine({canvas: this.canvas});
        this.State = new PianoRollState({canvas: this.canvas, wrapper_id: data.wrapper_id});
        this.State.canvas_id = this.id;

        this._resizeObserver.observe(this.canvas, {box: "device-pixel-content-box"})
        this._onResize()
        this.setScale({scale:[1,1]})
        this.setTrans({trans:[0,0]})
        
        this.FPS = new FpsCounter();
        this._onResize()
        
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
    _renderCtxInit() {
        if (this.canvas) {
            this.Render = new RenderEngine({canvas: this.canvas});
        }
    }
    _onResize() {

        if (this.State) {

            const rect = this.canvas?.getBoundingClientRect()
     
            const xa = rect?.x || 0
            const ya = rect?.y || 0
            this.State.height = this.height
            this.State.width = this.width
            this.State.canvas_range = {minX:xa,maxX: this.width+xa, minY:ya, maxY:this.height+ya};
            
            this.grid_labels = this.State.grid_render_data.grid_labels
        }
        if (!this.Render) { this._renderCtxInit() } else {
            this.Render.resizeHandler(this.width, this.height)
        }
            this.recalc_render_flag = true;
        
    }
    setScale(data: {scale: number[]}) {
        if (this.State) {
            this.State._setScale(data)
        }
    }
    setTrans(data: {trans: number[]}) {
        if (this.State) {
            this.State._setTrans(data)
        }
    }
    setFocus(focus: boolean) {
        if (this.State) {
            this.State._setFocus(focus)
        }
    }
    render() {
        
        if (!this?.Render || !this.State) { this._renderCtxInit() } else if (this?.Render?.contextLost) { this._renderCtxInit() } else {

            this.FPS.tick()
            this._fps = this.FPS.fps;
            this.State._genNoteRenderData()
            if (this.recalc_render_flag || this.State.recalc_grid_render_flag) {

                this.State._genGridRenderData()
                if (this.State.sidebar_enabled) {
                    this.State._genSidebarRenderData()
                }
                this.grid_labels = this.State.grid_render_data.grid_labels
                this.recalc_render_flag = false;
                this.State.recalc_grid_render_flag = false;
            }
            this.canvas_scale = this.State.canvas_scale
            this.canvas_trans = this.State.canvas_trans
            this.Render.render({
                attributeArrayF32List: [this.State.grid_render_data.grid_generator, this.State.note_render_data.note_data, ...(this.State.sidebar_enabled ? [this.State.sidebar_render_data.sidebar_data]:[])],
                numInstances: this.State.grid_render_data.generator_length + this.State.note_render_data.note_count + (this.State.sidebar_enabled ? this.State.sidebar_render_data.note_count : 0 )
            })
          
        };
    }
}