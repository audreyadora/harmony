import { EventPipeline } from './EventPipeline';
import { Note } from './Note';
import { scaleGridX, generateGridData } from './Grid'
import type {EventData, StateModifiers, StateKeypress,EType, KType, CType} from './types'
import {StateModifierData, StateKeypressData,KeyboardControlSettings} from './Constants'
import {scale_value, now, clamp} from './utils'
import { Sidebar } from './Sidebar'


//using separate map for Event Type structs for faster index check on pointer events 
const mapEventType = new Map([
    ['pointerdown', false],
    ['pointermove', false],
    ['pointerup', false],
    ['pointercancel', false],
    ['pointerenter', false],
    ['pointerover', false],
    ['pointerout', false],
    ['pointerleave', false],
    ['wheel', false],
    ['dblclick', false],
    ['canvasresize', false],
    ['keydownevent', false],
    ['keyupevent', false],
    ['coreevent', false],
    ['eNone', false],
]);
function evalNoteSelectState(
    noteID: string,
    currentTarget: string,
    noteSelectState: boolean,
    notePrevSelectState: boolean,
    kpShift: boolean,
    kpCtrl: boolean,
    notesTransformed: boolean
) {
    return notesTransformed
        ? noteID === currentTarget
            ? true
            : noteSelectState
        : noteID === currentTarget
        ? kpShift || kpCtrl
            ? !notePrevSelectState
            : true
        : kpShift || kpCtrl
        ? noteSelectState
        : false;
}


export class PianoRollState {
    actions = {
        clickNote: this.clickNote.bind(this),
        clickCanvas: this.clickCanvas.bind(this),
        clickSidebar: this.clickSidebar.bind(this),
        canvasExit: this.canvasExit.bind(this),
        doubleClickCanvas: this.doubleClickCanvas.bind(this),
        doubleClickNote: this.doubleClickNote.bind(this),
        duplicateNotes: this.duplicateNotes.bind(this),
        transSelector: this.transSelector.bind(this),
        transNotes: this.transNotes.bind(this),
        resizeNotes: this.resizeNotes.bind(this),
        resetViewport: this.resetViewport.bind(this),
        hoverNote: this.hoverNote.bind(this),
        hoverCanvas: this.hoverCanvas.bind(this),
        releaseSelector: this.releaseSelector.bind(this),
        releaseNotes: this.releaseNotes.bind(this),
        zoomX: this.zoomX.bind(this), 
        zoomY: this.zoomY.bind(this), 
        zoomXY: this.zoomXY.bind(this), 
        transX: this.transX.bind(this),
        transY: this.transY.bind(this),
        kpEventSelectAll: this.kpEventSelectAll.bind(this),
        kpEventControl: this.kpEventControl.bind(this),
        kpEventShift: this.kpEventShift.bind(this),
        kpEventAlt: this.kpEventAlt.bind(this), 
        kpEventCopy: this.kpEventCopy.bind(this),
        kpEventCut: this.kpEventCut.bind(this),
        kpEventPaste: this.kpEventPaste.bind(this),
        kpEventUndo: this.kpEventUndo.bind(this),
        kpEventRedo: this.kpEventRedo.bind(this),
        kpEventDelete: this.kpEventDelete.bind(this),
        kpEventSidebarToggle: this.kpEventSidebarToggle.bind(this),
        kpEventTransX: this.kpEventTransX.bind(this),
        kpEventTransY: this.kpEventTransY.bind(this),
        kuEventCtrl: this.kuEventCtrl.bind(this),
        kuEventShift: this.kuEventShift.bind(this),
        kuEventAlt: this.kuEventAlt.bind(this), 
        kuEventTransX: this.kuEventTransX.bind(this),
        kuEventTransY: this.kuEventTransY.bind(this),
        focus: this.focus.bind(this),
        loadData: this.loadData.bind(this),
        modifyData: this.modifyData.bind(this)
    };

    canvas: HTMLCanvasElement;
    canvas_scale  = [1,1];
    canvas_trans = [0,0];
    canvas_range = {minX: 0, maxX: 100, minY: 0, maxY: 100};
    canvas_id = '';

    width = 0;
    height = 0;

    cursor_style = {
        resize: 'e-resize',
        move: 'move',
        default: 'default'
    } as Record<string,string>

    grid_render_data = {
        grid_generator: new Float32Array(0),
        generator_length: 0,
        grid_labels: {
            x_labels: [] as string[],
            y_labels: [] as string[],
            x: [] as number[],
            y: [] as number[]
        }

    }

    note_render_data = {
        note_data: new Float32Array(0),
        note_count: 0
    }

    sidebar_render_data = {
        sidebar_data: new Float32Array(0),
        note_count: 0
    }
    sidebar_enabled = true;
    grid_measures = 20;
    grid_subdivisions = 4;
    grid_time_div = 4;
    grid_zoom_divider = 10;
    grid_scale_x = 0;
 
    grid_range = {xa: 0, xb: 80, ya: 0, yb: 96};
  
    Notes = new Note({});
    Sidebar = new Sidebar();
    max_visible_subdivisions = 180
    
    
    multiplier = 1;
    state = {
        modifiers: StateModifierData,
        keypress: StateKeypressData,
        selector_start: {x:0, y:0},
        event_data: { targetID: '', cursor: {x:0, y:0}},
        zoom_delta: 1,
        zoom_speed_xy: 0.0001,
        zoom_speed_x: 0.0001,
        zoom_speed_y: 0.001,
        trans_speed_x: 0.1,
        trans_speed_y: 0.1,
        buffer: false,
        resize_bounds_flag: false,
        _current_target: '',
        _minScale: 0.0001,
        _maxScale: 1 - 0.0001,
        _xscale: 1,
        _yscale: 1
    }

    wrapper_id: string;
    recalc_note_render_flag = true;  
    recalc_grid_render_flag = true;  
    debounce = 500;
    timer = 0;
    scroll = {
        x: 0,
        y: 0
    }
    constructor(data: ({canvas: HTMLCanvasElement, wrapper_id: string})) {
        this.canvas = data.canvas;
   
        this._setFocus(true)
        
        this.wrapper_id = data.wrapper_id

        this.grid_render_data = generateGridData({
                grid_range: this.grid_range,
                canvas_range: {xa:0,xb: this.width, ya:0, yb:this.height},
                canvas_scale : this.canvas_scale,
                canvas_trans : this.canvas_trans
        })
    }
    _throttle() {
        const time_now = now()
        if (time_now > this.timer+this.debounce) {
            this.timer = now()
        }
    }

    _setNoteData(data: { xa: number[]; xb: number[]; ya: number[]; yb: number[]; select_state: boolean;}) {
        this.Notes = new Note({});
        this._appendNoteData(data)
    }
    _appendNoteData(data: { xa: number[]; xb: number[]; ya: number[]; yb: number[]; select_state: boolean;}) {
        this.Notes.addNotes(data)
        this.recalc_note_render_flag = true;
    }
    _setScale(data: {scale: number[]}) {
        const {_grid_subdiv, _grid_scale_x }= scaleGridX({scale_x: data.scale[0], grid_measures: this.grid_measures, grid_time_div: this.grid_time_div, grid_zoom_divider: this.grid_zoom_divider})

        this.grid_scale_x = _grid_scale_x
        this.grid_subdivisions = _grid_subdiv
        
        this.canvas_scale = [_grid_scale_x,data.scale[1]];
        this.recalc_grid_render_flag = true;
        return {scale: this.canvas_scale, trans: this.canvas_trans, grid_subdivisions: _grid_subdiv, grid_measures: this.grid_measures, grid_time_div: this.grid_time_div, grid_zoom_divider: this.grid_zoom_divider}
    }
    _setTrans(data: {trans: number[]}) {
        this.canvas_trans = data.trans
        this.recalc_grid_render_flag = true;
    }
    _setZoomSpeed(n:number,s:number) {
        this.state.zoom_speed_xy = n * (10**-s)
        this.state.zoom_speed_x = n * (10**-s)
        this.state.zoom_speed_y = n * (10**-s)
        this.state.trans_speed_x = n * (10**-s)
        this.state.trans_speed_y = n * (10**-s)
    }
    _setFocus(focus: boolean) {
        this.state.modifiers.paneFocused = focus;

        if (focus) {
            window?.addEventListener('pointerenter', this._pointerEventHandler.bind(this), { passive: true });
            window?.addEventListener('pointerover', this._pointerEventHandler.bind(this), { passive: true });
            window?.addEventListener('dblclick', this._pointerEventHandler.bind(this), { passive: true });
            window?.addEventListener('pointerdown', this._pointerEventHandler.bind(this), { passive: true });
            window?.addEventListener('pointermove', this._pointerEventHandler.bind(this), { passive: true });
            window?.addEventListener('pointerup', this._pointerEventHandler.bind(this), { passive: true });
            window?.addEventListener('pointercancel', this._pointerEventHandler.bind(this), { passive: true });
            window?.addEventListener('wheel', this._scrollHandler.bind(this), { passive: true });

        } else {
            window?.removeEventListener('pointerenter', this._pointerEventHandler);
            window?.removeEventListener('pointerover', this._pointerEventHandler);
            window?.removeEventListener('dblclick', this._pointerEventHandler);
            window?.removeEventListener('pointerdown', this._pointerEventHandler);
            window?.removeEventListener('pointermove', this._pointerEventHandler);
            window?.removeEventListener('pointerup', this._pointerEventHandler);
            window?.removeEventListener('pointercancel', this._pointerEventHandler);
            window?.removeEventListener('wheel', this._scrollHandler);

        }
    }
    
    _genGridRenderData() {
        this.grid_render_data = generateGridData({
            grid_range: {xa: 0, xb: this.grid_subdivisions*this.grid_measures , ya: 0, yb: 96},
            grid_measures: this.grid_measures,
            canvas_range:  {xa:0,xb: this.width, ya:0, yb:this.height},
            canvas_scale : [this.grid_scale_x,this.canvas_scale[1]],
            canvas_trans : this.canvas_trans,
            offset_x: this.sidebar_enabled ? (this.Sidebar.state ? this.Sidebar.expanded_width : this.Sidebar.collapsed_width) * this.width : 0
        })
    }
    _genNoteRenderData() {
        this.note_render_data = this.Notes.getRenderData({
            canvas_range:{xa: 0 ,xb:this.width,ya:0,yb:this.height},
            canvas_scale:[this.grid_scale_x,this.canvas_scale[1]],
            canvas_trans: this.canvas_trans,
            offset_x: this.sidebar_enabled ? (this.Sidebar.state ? this.Sidebar.expanded_width : this.Sidebar.collapsed_width) * this.width : 0
        })
    }
    _genSidebarRenderData() {
        this.sidebar_render_data = this.Sidebar.getRenderData({
            canvas_range:{xa:0,xb:this.width,ya:0,yb:this.height},
            canvas_scale:[this.grid_scale_x,this.canvas_scale[1]],
            canvas_trans: this.canvas_trans
        })
    }
    _scrollHandler(event: WheelEvent) {

        this.multiplier = window?.devicePixelRatio || 1
        const cursor = {
            x: scale_value((event.clientX - this.canvas_range.minX)*this.multiplier,0,this.canvas_range.maxX- this.canvas_range.minX,0,100), 
            y: scale_value((event.clientY - this.canvas_range.minY)*this.multiplier,0, this.canvas_range.maxY - this.canvas_range.minY,0,100)
        }
        if ((cursor.x < 101) && (cursor.x >= 0) && (cursor.y < 101) && (cursor.y >= 0)) {
            this.state.zoom_delta = Math.sign(event.deltaY)
            
            const eventData = {
                        targetID: 'canvas',  
                        cursor: cursor,
                        cType: 'canvas',
                        eType: event.type as EType,
                        kType: 'kpNone' as KType
                } as EventData;
            
            if (!this.state.buffer) {
            
                this.dispatch({
                        eventData: eventData,
                        stateModifiers: {...this.state.modifiers},
                        stateKeypress: {...this.state.keypress},
                })
            }
        }
        this._throttle()
        
    }
    _pointerEventHandler(event: MouseEvent | PointerEvent) {

        if (mapEventType.has(event.type)) {
            this.multiplier = window?.devicePixelRatio || 1
            const cursor = {
                x: scale_value((event.clientX - this.canvas_range.minX)*this.multiplier,0,this.canvas_range.maxX- this.canvas_range.minX,0,100), 
                y: scale_value((event.clientY - this.canvas_range.minY)*this.multiplier,0, this.canvas_range.maxY - this.canvas_range.minY,0,100)
            }
        
        if ((cursor.x < 101) && (cursor.x >= -10) && (cursor.y < 101) && (cursor.y >= 0)) {
                const intersectsNotes = this.Notes.noteClicked({cursor: cursor, canvas_scale: this.canvas_scale, canvas_trans: this.canvas_trans})
                const sidebar_w = this.Sidebar.state ? this.Sidebar.expanded_width * 100 : this.Sidebar.collapsed_width * 100;

                let cType = 'canvas'
                if (intersectsNotes) {
                    this.state.resize_bounds_flag = intersectsNotes.in_resize_bounds;
                    cType = 'note'
                } else if (cursor.x < sidebar_w) {
                    cType = 'sidebar'
                }
            
                const eventData = {
                            targetID: intersectsNotes ? intersectsNotes.id : this.canvas_id,   
                            cursor: cursor,
                            cType: cType as CType,
                            eType: event.type as EType,
                            kType: 'kpNone' as KType
                    } as EventData;
            
                if (!this.state.buffer) {
                    this.dispatch({
                            eventData: eventData,
                            stateModifiers: {...this.state.modifiers},
                            stateKeypress: {...this.state.keypress},
                    })
                }
            }
        }
        return false;
    }

    _keyEventHandler(e: KeyboardEvent, eType: 'keydownevent'|'keyupevent') {
        let kType = null as null | string;
        for (const kp in KeyboardControlSettings) {
            if (
                KeyboardControlSettings[kp].key === e.key &&
                (KeyboardControlSettings[kp].modifier === 'Shift'
                    ? e.shiftKey
                    : KeyboardControlSettings[kp].modifier === 'Control'
                    ? e.ctrlKey
                    : KeyboardControlSettings[kp].modifier === 'Alt'
                    ? e.altKey
                    : KeyboardControlSettings[kp].modifier === ''
                    ? true
                    : false)
            ) {
                kType = kp;
                break;
            }
        }
        if (kType) {
            if (!this.state.buffer) {
                this.dispatch({
                    eventData: {
                        targetID: this.canvas_id,   
                        cursor: {x:0, y:0},
                        cType: 'canvas' as CType,
                        eType: eType as EType,
                        kType: kType as KType
                    },
                    stateModifiers: {...this.state.modifiers},
                    stateKeypress: {...this.state.keypress},
                })
            }
        }
    }

    _onKeyDown(e: KeyboardEvent) {
        return this._keyEventHandler(e, 'keydownevent');
    }

    _onKeyUp(e: KeyboardEvent) {
        return this._keyEventHandler(e, 'keyupevent');
    }
    dispatch(data: {
            eventData: EventData;
            stateModifiers: StateModifiers;
            stateKeypress: StateKeypress;
        }) {
            
        const result = EventPipeline({
            	...data.eventData,
                stateModifiers: data.stateModifiers,
                stateKeypress: data.stateKeypress
        }) 
        if (result) {
            this.state.buffer = true;
            this.state.modifiers = result.stateModifiers
            this.state.keypress = result.stateKeypress
            this.state.event_data = result.eventData
            this.actions[result.callbackKey]()
        }
            return this.state.buffer = false;
    }

    clickNote(){
        this.state._current_target = this.state.event_data.targetID
        this.Notes.Notes.setCurrentSelectState({id_list: [this.state.event_data.targetID],select_state:[true]})

        this.state.modifiers = {
            ...this.state.modifiers,
            isDragging: !this.state.resize_bounds_flag,
            isResizing: this.state.resize_bounds_flag,
            notesTransformed: false,
            isCopying: this.state.keypress.kpCtrl,
            notesDuplicated: false
		}
        return this.state.buffer = false;
    }
    clickCanvas(){
        this.Notes.Notes.setCurrentSelectStateAll({select_state: false})
        this.state.selector_start = this.state.event_data.cursor 
        this.state.modifiers.isSelecting = true
        let selector = document.getElementById(`s${this.canvas_id}`)
        if (selector) {
            selector.remove()
        }
        selector = document.createElement('div') as HTMLElement
        const parent = document.getElementById(this.wrapper_id)
        if (selector && parent) {
            selector.id = `s${this.canvas_id}`
            Object.assign(selector.style, {
                position: 'absolute',
                visibility: 'hidden',
                top: '0px',
                left: '0px',
                width: '0px',
                height: '0px'
            })
            parent.appendChild(selector)

        }
        return this.state.buffer = false;
    }    
    clickSidebar() {
        return this.state.buffer = false;
    }
    canvasExit(){
        this.releaseSelector()
    }
    doubleClickCanvas(){
        this.releaseNotes()
        this.Notes.addNoteByCursor({
            cursor: this.state.event_data.cursor,
            canvas_scale: this.canvas_scale,
            canvas_trans: this.canvas_trans,
            grid_range: {xa: 0, xb: this.grid_subdivisions*this.grid_measures, ya: 0, yb: this.grid_range.yb},
        })
        return this.state.buffer = false;
    }
    doubleClickNote(){
        this.Notes.Notes.remove({id_list: [this.state.event_data.targetID]})
        return this.state.buffer = false;
    }
    duplicateNotes(){
        
        this.state._current_target = '';
        this.Notes.duplicateSelectedNotes()
        this.state.modifiers = {
            ...this.state.modifiers,
            isCopying: true,
			notesDuplicated: true
		}
        return this.state.buffer = false;
    }
    transSelector(){
        this.state.modifiers.isSelecting = true
		const targetWidth = Math.abs(this.state.event_data.cursor.x - this.state.selector_start.x);
		const targetHeight = Math.abs(this.state.event_data.cursor.y - this.state.selector_start.y);
		const targetx = this.state.event_data.cursor.x  < this.state.selector_start.x? this.state.event_data.cursor.x : this.state.selector_start.x;
		const targety = this.state.event_data.cursor.y < this.state.selector_start.y ? this.state.event_data.cursor.y : this.state.selector_start.y;



        const selector = document.getElementById(`s${this.canvas_id}`)
        if (selector) {
            const tRect = {
                xa: targetx,
                xb: targetx + targetWidth,
                ya: targety,
                yb: targety + targetHeight
            };
            const in_bounds = this.Notes.noteBounded({range: tRect, canvas_scale: this.canvas_scale, canvas_trans: this.canvas_trans})
            const scaled_trect = {
                xa: scale_value(
                    tRect.xa/this.multiplier,
                    0, 100, 
                    0, this.canvas_range.maxX - this.canvas_range.minX
                ),   
                xb: scale_value(
                    tRect.xb/this.multiplier,
                    0, 100, 
                    0, this.canvas_range.maxX - this.canvas_range.minX
                ),  
                ya: scale_value(
                    tRect.ya/this.multiplier,
                    0, 100, 
                    0, this.canvas_range.maxY - this.canvas_range.minY
                ),  
                yb: scale_value(
                    tRect.yb/this.multiplier,
                    0, 100, 
                    0, this.canvas_range.maxY - this.canvas_range.minY
                ),  
            }
            Object.assign(selector.style, {
                position: 'absolute',
                border: '1px dashed black',
			    visibility: 'visible',
                width: `${scaled_trect.xb-scaled_trect.xa}px`,
                height: `${scaled_trect.yb-scaled_trect.ya}px`,
                top: `${scaled_trect.ya}px`,
                left: `${scaled_trect.xa}px`
            })
            this.Notes.Notes.setCurrentSelectStateAll({select_state: false})
            if (in_bounds) {
                this.Notes.Notes.setCurrentSelectState({id_list: in_bounds.id_list, select_state: Array(in_bounds.id_list.length).fill(true)})
            }
        }
        return this.state.buffer = false;
    }
    transNotes(){
        if (this.state.keypress.kpShift && this.Notes.NoteDataProps.snap_trans_x) {
            this.Notes.NoteDataProps.snap_trans_x = false;
        } else if (!this.state.keypress.kpShift && !this.Notes.NoteDataProps.snap_trans_x) {
            this.Notes.NoteDataProps.snap_trans_x = true;
        }
        this.Notes.translateSelectedNotes({
            cursor: this.state.event_data.cursor,
            canvas_scale: this.canvas_scale,
            canvas_trans: this.canvas_trans,
            grid_range: {xa: 0, xb: this.grid_subdivisions*this.grid_measures, ya: 0, yb: this.grid_range.yb},
        }) 

        this.state.modifiers = {
            ...this.state.modifiers,
            notesTransformed: true
		}
        return this.state.buffer = false;
    }
    resizeNotes(){
        this.Notes.resizeSelectedNotes({
            cursor: this.state.event_data.cursor,
            canvas_scale: this.canvas_scale,
            canvas_trans: this.canvas_trans,
            grid_range: {xa: 0, xb: this.grid_subdivisions*this.grid_measures, ya: 0, yb: this.grid_range.yb},
        })
        this.state.modifiers = {
            ...this.state.modifiers,
            notesTransformed: true
		}
        return this.state.buffer = false;
    }
    hoverNote(){
        if (this.state.resize_bounds_flag) {
            Object.assign(this.canvas.style, {cursor: this.cursor_style.resize})
        } else {
            Object.assign(this.canvas.style, {cursor: this.cursor_style.move})
        }
        return this.state.buffer = false;
    }
    hoverCanvas(){
        if (this.state.modifiers.isSelecting) {
            const selector = document.getElementById(`s${this.canvas_id}`)
            if (selector) {
                selector.remove()
            }
            this.state.modifiers.isSelecting = false
        }
        Object.assign(this.canvas.style, {cursor: this.cursor_style.default})
        return this.state.buffer = false;
    }
    releaseSelector(){
          
        const selector = document.getElementById(`s${this.canvas_id}`)
        if (selector) {
            selector.remove()
        }
        this.state.modifiers.isSelecting = false
        this.state.selector_start = {x:0,y:0}
        return this.state.buffer = false;
    }
    releaseNotes(){

        Object.assign(this.canvas.style, {cursor: this.cursor_style.default})

        const selectedNotes = [...this.Notes.Notes.filterCurrentSelectStateIDs({select_state: true})]

        if (this.state.modifiers.notesTransformed) {
            this.Notes.Notes.commitUpdates({id_list: selectedNotes})
        }
        
        this.Notes.releaseNotes()
        
        const select_state = Object.fromEntries(
            selectedNotes.map((id) => [
            id,
            evalNoteSelectState(
                id,
                this.state._current_target,
                true,
                this.Notes.Notes._get_previous_select_state(id),
                this.state.keypress.kpShift,
                this.state.keypress.kpCtrl, 
                this.state.modifiers.notesTransformed
            )
        ]))
    
        this.Notes.Notes.setCurrentSelectState({id_list: Object.keys(select_state), select_state: Object.values(select_state)}) 

        this.state.modifiers = {
            ...this.state.modifiers,
            isDragging: false,
            isResizing: false,
            isCopying: false,
            isSelecting: false,
            notesDuplicated: false,
            notesTransformed: false
        }

        return this.state.buffer = false;
        
    }
    resetViewport() {
        this._setScale({scale: [1,1]});
        this._setTrans({trans: [0,0]});
        this.recalc_grid_render_flag = true;
        return this.state.buffer = false;
        
    }
    zoomX() {
        const zoom = this.state.zoom_delta * this.state.zoom_speed_x

        this.state._xscale = clamp(this.state._xscale+zoom,0,1)

        const {_grid_subdiv, _grid_scale_x }= scaleGridX({scale_x: this.state._xscale, grid_measures: this.grid_measures, grid_time_div: this.grid_time_div, grid_zoom_divider: this.grid_zoom_divider})

        const trans = {
            x: this._calc_zoom_trans(this.state.event_data.cursor.x, this.canvas_scale[0], _grid_scale_x, this.canvas_trans[0]),
        }

        this.grid_scale_x = _grid_scale_x
        this.grid_subdivisions = _grid_subdiv
        
        this.canvas_scale = [_grid_scale_x,this.canvas_scale[1]];
        this.canvas_trans = [clamp(trans.x,0,1),this.canvas_trans[1]];

        this.recalc_grid_render_flag = true;
        
        return this.state.buffer = false;
    }
    zoomY() {
        const zoom = this.state.zoom_delta * this.state.zoom_speed_y

        this.state._yscale = clamp(this.state._yscale+zoom,0,1)
        const trans = {
            y: this._calc_zoom_trans(this.state.event_data.cursor.y, this.canvas_scale[1], this.state._yscale,  this.canvas_trans[1])
        }

        
        this.canvas_scale = [this.canvas_scale[0],this.state._yscale];
        this.canvas_trans = [this.canvas_trans[0],clamp(trans.y,0,1)];

        this.recalc_grid_render_flag = true;
        
        return this.state.buffer = false;       
    }
    _calc_zoom_trans(c: number, sa: number, sb: number,ta: number) {
        return ((ta*100*(1-sa)) - c*(sb-sa))/(100*(1-sb)) || 0
    }
    zoomXY() {
        const zoom = this.state.zoom_delta * this.state.zoom_speed_xy

        this.state._xscale = clamp(this.state._xscale+zoom/3,0,1)
        this.state._yscale = clamp(this.state._yscale+zoom,0,1)

        const {_grid_subdiv, _grid_scale_x }= scaleGridX({scale_x: this.state._xscale, grid_measures: this.grid_measures, grid_time_div: this.grid_time_div, grid_zoom_divider: this.grid_zoom_divider})

        const trans = {
            x: this._calc_zoom_trans(this.state.event_data.cursor.x, this.canvas_scale[0], _grid_scale_x, this.canvas_trans[0]),
            y: this._calc_zoom_trans(this.state.event_data.cursor.y, this.canvas_scale[1], this.state._yscale,  this.canvas_trans[1])
        }

        this.grid_scale_x = _grid_scale_x
        this.grid_subdivisions = _grid_subdiv
        
        this.canvas_scale = [_grid_scale_x,this.state._yscale];
        this.canvas_trans = [clamp(trans.x,0,1),clamp(trans.y,0,1)];

        this.recalc_grid_render_flag = true;
        
        return this.state.buffer = false;
    }
    transX() {
      
    
        const trans_x = this.state.zoom_delta * this.state.trans_speed_x
        this.canvas_trans = [clamp(this.canvas_trans[0] + trans_x,0,1),this.canvas_trans[1]];
        this.recalc_grid_render_flag = true;

        return this.state.buffer = false;
      
    }
    transY() {
        const trans_y = this.state.zoom_delta * this.state.trans_speed_y
        this.canvas_trans = [this.canvas_trans[0], clamp(this.canvas_trans[1] + trans_y,0,1)];
        this.recalc_grid_render_flag = true;
        return this.state.buffer = false;
    }
    kpEventTransX() {
        this.state.keypress = {
        ...this.state.keypress,
        kpTransX: true
        }
        return this.state.buffer = false;
    }
    kpEventTransY() {
        this.state.keypress = {
        ...this.state.keypress,
        kpTransY: true
        }
        return this.state.buffer = false;
    }
    kpEventSelectAll(){
        this.Notes.Notes.setCurrentSelectStateAll({select_state: true})
        this.Notes.NoteData.render_state = true;
        return this.state.buffer = false;
    }
    kpEventControl(){
        this.state.keypress = {
            ...this.state.keypress,
            kpCtrl: true
        }
        return this.state.buffer = false;
    }
    kpEventShift(){
        this.state.keypress = {
            ...this.state.keypress,
            kpShift: true
        }
        return this.state.buffer = false;
    };
    kpEventAlt(){
        this.state.keypress = {
            ...this.state.keypress,
            kpAlt: true
        }
        return this.state.buffer = false;
    };
    kpEventCopy(){
        this.Notes.Notes.copySelected()
        return this.state.buffer = false;
    };
    kpEventCut(){
        const selectedNotes = [...this.Notes.Notes.filterCurrentSelectStateIDs({select_state: true})]
        this.Notes.Notes.copySelected()
        this.Notes.Notes.remove({id_list:selectedNotes})
        this.Notes.NoteData.render_state = true;
        return this.state.buffer = false;
    };
    kpEventPaste(){
        const clipboard = {
            xa: this.Notes.Notes.clipboard.get('xa') || [],
            xb: this.Notes.Notes.clipboard.get('xb') || [],
            ya: this.Notes.Notes.clipboard.get('ya') || [],
            yb: this.Notes.Notes.clipboard.get('yb') || [],
            select_state: true
        }
        this.Notes.Notes.setCurrentSelectStateAll({select_state: false})
        this.Notes.Notes.insert(clipboard)
        this.Notes.NoteData.render_state = true;
        return this.state.buffer = false;

    };
    kpEventUndo(){
      
        this.Notes.Notes.undo()
        this.Notes.NoteData.render_state = true;
        return this.state.buffer = false;
    };
    kpEventRedo(){
      
        this.Notes.Notes.redo()
        this.Notes.NoteData.render_state = true;
        return this.state.buffer = false;
    };
    kpEventDelete(){
        const selectedNotes = [...this.Notes.Notes.filterCurrentSelectStateIDs({select_state: true})]
        this.Notes.Notes.remove({id_list: selectedNotes})
        this.Notes.NoteData.render_state = true;
        return this.state.buffer = false;
    };
    kpEventSidebarToggle(){
        this.Sidebar.state = !this.Sidebar.state;
        this.recalc_grid_render_flag = true;
        return this.state.buffer = false;
    };
    kuEventCtrl(){
        this.state.keypress = {
            ...this.state.keypress,
            kpCtrl: false
        }
        return this.state.buffer = false;
    };
    kuEventShift(){
        this.state.keypress = {
            ...this.state.keypress,
            kpShift: false
        }
        return this.state.buffer = false;
    };
    kuEventAlt(){
        this.state.keypress = {
            ...this.state.keypress,
            kpAlt: false
        }
        return this.state.buffer = false;
    };
    kuEventTransX() {
        this.state.keypress = {
        ...this.state.keypress,
        kpTransX: false
        }
        return this.state.buffer = false;
    }
    kuEventTransY() {
        this.state.keypress = {
        ...this.state.keypress,
        kpTransY: false
        }
        return this.state.buffer = false;
    }
    focus(){
        return this.state.buffer = false;
    }
    loadData(){
        return this.state.buffer = false;
    }
    modifyData(){
        return this.state.buffer = false;
    }
}