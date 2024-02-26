import { scale_value, trans_scale_range_vec2, round_to, evalNoteResizeBounds} from "./utils";
import RBush from "rbush";
import {Interactions} from './Interactions'
import {QuadData} from './Quad'
import type {NoteProps, NoteDataProps, NoteData} from './types'

const DefaultNoteDataProps = {
    note_color_selected : [1.0,0.0,1.0, 1.0],
    note_color_unselected : [0.0,0.0,1.0, 1.0],
    border_px : 1 ,
    corner_radius : 1,
    snap_trans_x: true,
    snap_trans_y: true,
    snap_resize_x: false,
    float_length: 15,
    resize_bounds: 0.9
} 
const DefaultNoteData  = {
    note_render_data: new Float32Array(0),
    note_render_data_length: 0,
    start_cursor: {x:0, y:0},
    visible_note_count: 0,
    render_state: false
}

export class Note {
    NoteDataProps: NoteDataProps = DefaultNoteDataProps;
    NoteData: NoteData = DefaultNoteData;
    NoteDataTree: RBush<{ id: string; minX: number; minY: number; maxX: number; maxY: number; }>;
    Notes = new QuadData()
    _selected = {
        y: [] as number[]
    }
    _interaction = new Interactions({})
    _isTranslating = false;
    _reset_delta = false;
    _note_start_data = new Map([]) as Map<string, {xa:number, xb:number, ya:number, yb:number}>;
    vnc = 0;
    _offsetx = 0;
    resize_min_limit = 0.05
    constructor(data:NoteProps) {
        this.NoteDataProps = {
            ...this.NoteDataProps,
            ...data
        }
        this.NoteDataTree = new RBush()
    }
    noteClicked(data: {cursor:{x:number,y:number}, canvas_scale:number[], canvas_trans: number[]}) {
        const cursor_viewport_coordinates = this._interaction._base_to_viewport_coordinates({x:data.cursor.x,y:data.cursor.y},{canvas_scale: data.canvas_scale, canvas_trans: data.canvas_trans})
        const notes_in_bounds = this.Notes.search({
            xa: cursor_viewport_coordinates.x , 
            xb: cursor_viewport_coordinates.x, 
            ya: cursor_viewport_coordinates.y, 
            yb: cursor_viewport_coordinates.y})
        if (notes_in_bounds.length > 0) {
            return {
                id: notes_in_bounds[0].id,
                in_resize_bounds: evalNoteResizeBounds(cursor_viewport_coordinates.x, notes_in_bounds[0].minX, notes_in_bounds[0].maxX, this.NoteDataProps.resize_bounds)
            }
        } 
        return false;
    }
    noteBounded(data: {range:{xa:number,xb:number, ya:number, yb: number}, canvas_scale:number[], canvas_trans: number[]}) {
        const cursor_viewport_coordinates_a = this._interaction._base_to_viewport_coordinates({x:data.range.xa,y:data.range.ya},{canvas_scale: data.canvas_scale, canvas_trans: data.canvas_trans})
        const cursor_viewport_coordinates_b = this._interaction._base_to_viewport_coordinates({x:data.range.xb,y:data.range.yb},{canvas_scale: data.canvas_scale, canvas_trans: data.canvas_trans})
        const notes_in_bounds = this.Notes.search({
            xa: cursor_viewport_coordinates_a.x , 
            xb: cursor_viewport_coordinates_b.x, 
            ya: cursor_viewport_coordinates_a.y, 
            yb: cursor_viewport_coordinates_b.y})
        if (notes_in_bounds.length > 0) {
            return {
                id_list: notes_in_bounds.map(note => note.id)
            }
        } 
        return false;
    }
    addNoteByCursor(data: {
        cursor: { x: number, y: number },
        canvas_scale: number[],
        canvas_trans: number[],
        grid_range: { xa: number; xb: number; ya:  number;  yb: number }
    }) {
        
        const cell_coordinates = this._interaction.get_grid_cell(data.cursor, 
            {w: 4, h: 1}, {
            canvas_scale: data.canvas_scale,
            canvas_trans: data.canvas_trans,
            grid: {x: data.grid_range.xb,y: data.grid_range.yb}})
        this.Notes.insert({xa:[cell_coordinates.xa], xb:[cell_coordinates.xb], ya:[cell_coordinates.ya], yb:[cell_coordinates.yb], select_state:true})
        this.NoteData.render_state = true;
    }
    addNotes(data: {xa:number[]; xb:number[]; ya:number[]; yb:number[], select_state:  boolean|boolean[]}) {
        this.Notes.insert(data)
        this.NoteData.render_state = true;
    }

    translateSelectedNotes(data: {
        cursor: { x: number, y: number },
        canvas_scale: number[],
        canvas_trans: number[],
        grid_range: { xa: number; xb: number; ya:  number;  yb: number }
    }) {
        const selected_notes = this.Notes.filterCurrentSelectStateIDs({select_state:true})
    
        if (!this._interaction.state._is_interacting) {
            this._note_start_data = this.Notes.getInstancedVecData([...selected_notes])
        } 

        if (!this.NoteDataProps.snap_trans_x) {
            this._reset_delta = true;
        } 

        const translate_delta = this._interaction.get_trans_delta(data.cursor, {
            canvas_scale: data.canvas_scale,
            canvas_trans: data.canvas_trans,
            grid: {x: data.grid_range.xb,y: data.grid_range.yb},
            snap_to_grid: {x: this.NoteDataProps.snap_trans_x,y: true}
        })
        const update_data = {
            id_list: [] as string[],
            xa: [] as number[],
            xb: [] as number[],
            ya: [] as number[],
            yb: [] as number[]
        }
        for (const id of selected_notes) {
            const note = this._note_start_data.get(id)
            
            if (note) { 
      
                update_data.id_list.push(id)
                update_data.xa.push((this._reset_delta && this.NoteDataProps.snap_trans_x) ? (100/data.grid_range.xb) * Math.floor((note.xa + translate_delta.x)/(100/data.grid_range.xb)) :  note.xa + translate_delta.x)
                update_data.xb.push(note.xb + translate_delta.x)
                update_data.ya.push(note.ya + translate_delta.y)
                update_data.yb.push(note.yb + translate_delta.y)
            }
        }

        if (this._reset_delta && this.NoteDataProps.snap_trans_x) {
            this._reset_delta = false;
        }
        this.Notes.update(update_data)
        this.NoteData.render_state = true;
      
    }
    releaseNotes() {

        this._interaction.release()
        this.NoteData.render_state = true;  
    }

    resizeSelectedNotes(data: {
        cursor: {x: number, y: number},
        canvas_scale: number[],
        canvas_trans: number[],
        grid_range: { xa: number; xb: number; ya: number;  yb: number }
    }) {

        const selected_notes = this.Notes.filterCurrentSelectStateIDs({select_state:true})
    
        if (!this._interaction.state._is_interacting) {
            this._note_start_data = this.Notes.getInstancedVecData([...selected_notes])
        }
        
        const translate_delta = this._interaction.get_trans_delta(data.cursor, {
            canvas_scale: data.canvas_scale,
            canvas_trans: data.canvas_trans,
            grid: {x: data.grid_range.xb,y: data.grid_range.yb},
            snap_to_grid: {x: false,y: true}
        })
        const update_data = {
            id_list: [] as string[],
            xa: [] as number[],
            xb: [] as number[],
            ya: [] as number[],
            yb: [] as number[]
        }
        for (const id of selected_notes) {
            const note = this._note_start_data.get(id)
            if (note) { 
                const xb = (note.xb + translate_delta.x) - note.xa < 5*data.canvas_scale[0] ?  note.xa + 5*data.canvas_scale[0]  :  note.xb + translate_delta.x;
                update_data.id_list.push(id)
                update_data.xa.push(note.xa)
                update_data.xb.push(xb)
                update_data.ya.push(note.ya)
                update_data.yb.push(note.yb)
            }
        }
        this.Notes.update(update_data)
        this.NoteData.render_state = true;      
    }

    duplicateSelectedNotes() {
        const selected_notes = this.Notes.filterCurrentSelectStateIDs({select_state:true})
        const copied_note_data = this.Notes.getDeinstancedVecData([...selected_notes])
        this.Notes.setCurrentSelectStateAll({select_state:false})
        this.Notes.insert({
            xa: copied_note_data.get('xa') || [], 
            xb: copied_note_data.get('xb')|| [], 
            ya: copied_note_data.get('ya')|| [], 
            yb: copied_note_data.get('yb')|| [], 
            select_state: true
        })
    }

    setStartCursor(data: {cursor: {x:number,y:number}}) {
        this.NoteData.start_cursor = data.cursor;
    }

    renderFlag() {
        return this.NoteData.render_state
    }

    getRenderData(
        data: {
            canvas_scale: number[],
            canvas_trans: number[],
            canvas_range: { xa: number; xb: number; ya: number; yb: number },
            offset_x: number
        }
    ) {
        const viewport_range = trans_scale_range_vec2(data.canvas_scale, data.canvas_trans, {xa:0 ,xb:100,ya:0,yb:100})
        const notes_in_bounds = this.Notes.search(viewport_range)
        this.NoteData.visible_note_count = notes_in_bounds.length

        if (this.NoteData.note_render_data_length !== this.NoteData.visible_note_count*this.NoteDataProps.float_length) {
            this.NoteData.note_render_data_length = this.NoteData.visible_note_count*this.NoteDataProps.float_length
            this.NoteData.note_render_data = new Float32Array(this.NoteData.note_render_data_length)
        }

        for (let i=0; i < this.NoteData.visible_note_count; i += 1) {
            const id = notes_in_bounds[i].id
            if (id) {
                const selected = this.Notes._get_current_select_state(id)
                const note_color = selected ? this.NoteDataProps.note_color_selected : this.NoteDataProps.note_color_unselected;
                const xa = scale_value(
                                notes_in_bounds[i].minX < viewport_range.xa ? viewport_range.xa : notes_in_bounds[i].minX, 
                                viewport_range.xa, viewport_range.xb, 
                                0, data.canvas_range.xb - data.canvas_range.xa 
                            ) + (notes_in_bounds[i].minX < viewport_range.xa ? 0 : data.offset_x)
               
                const xb = scale_value(
                                notes_in_bounds[i].maxX > viewport_range.xb ? viewport_range.xb : notes_in_bounds[i].maxX, 
                                viewport_range.xa, viewport_range.xb, 
                                0, data.canvas_range.xb - data.canvas_range.xa
                            ) + (notes_in_bounds[i].minX < viewport_range.xa ? 0 : data.offset_x)
                
                const ya = scale_value(
                                notes_in_bounds[i].minY < viewport_range.ya ? viewport_range.ya : notes_in_bounds[i].minY, 
                                viewport_range.ya, viewport_range.yb, 
                                0, data.canvas_range.yb - data.canvas_range.ya
                            ) + 1
                const yb = scale_value(
                                notes_in_bounds[i].maxY > viewport_range.yb ? viewport_range.yb : notes_in_bounds[i].maxY, 
                                viewport_range.ya, viewport_range.yb, 
                                0, data.canvas_range.yb - data.canvas_range.ya
                            ) - 1
                  
                this.NoteData.note_render_data.set([
                    xa,
                    (data.canvas_range.yb -  data.canvas_range.ya) - round_to(yb,4),
                    xb-xa <= 4 ?  xa + 4: xb,
                    (data.canvas_range.yb -  data.canvas_range.ya) - round_to(ya,4),
                    note_color[0],
                    note_color[1],
                    note_color[2],
                    note_color[3],
                    1,1,1,1,
                    data.canvas_range.xb -  data.canvas_range.xa,    
                    data.canvas_range.yb -  data.canvas_range.ya, 0.25            
                ],i*this.NoteDataProps.float_length)
            }

        }
 
        return {
            note_data: this.NoteData.note_render_data,
            note_count: this.NoteData.visible_note_count,
        }
    }

    commitRender() {
        this.NoteData.render_state = false;
    }
}