import {scale_value, trans_scale_range_vec2} from './utils'

type InteractionsData = {
    canvas_scale?: number[];
    canvas_trans?: number[];
    grid?: {
        x: number;
        y: number;
    };
    cursor_start?: {
        x: number;
        y: number;
    };
    snap_to_grid?: {
        x: boolean;
        y: boolean;
    };
    _is_interacting?: boolean;
}

export class Interactions {
    state = {
        canvas_scale: [1,1],
        canvas_trans: [0,0],
        grid: {x: 10,y: 10},
        cursor_start: {x: 0, y: 0},
        snap_to_grid: {x: false, y: false},       
        _is_interacting: false
    }
    constructor(state: InteractionsData) {
        this.state = {
           ...this.state,
           ...state
        }
    }

    _snap_coordinates(point_vec: {x:number,y:number}, snap_type?: ('round' | 'ceil' | 'floor')) {
        let snap = Math.round
        if (snap_type === 'ceil') {
            snap = Math.ceil
        } else if (snap_type === 'floor') {
            snap = Math.floor
        } 
        if (this.state.snap_to_grid.x) {
            const x_interval = 100/this.state.grid.x
            point_vec.x =  x_interval * snap(point_vec.x/x_interval) 
        }
        if (this.state.snap_to_grid.y) {
            const y_interval = 100/this.state.grid.y
            point_vec.y =  y_interval * snap(point_vec.y/y_interval)
        }
        return point_vec
    }

    _base_to_viewport_coordinates(base_coordinates: {x: number, y: number}, ctx?: InteractionsData) {
        if (ctx) {this.state = {...this.state, ...ctx }}
        const viewport_range = trans_scale_range_vec2(this.state.canvas_scale,this.state.canvas_trans, {xa:0,xb:100,ya:0,yb:100})
        return {
            x: scale_value(base_coordinates.x,0,100,viewport_range.xa,viewport_range.xb), 
            y: scale_value(base_coordinates.y,0,100,viewport_range.ya,viewport_range.yb)
        }
    }

    get_trans_delta(cursor_base_coordinates: {x: number, y: number}, ctx?: InteractionsData) {
        if (ctx) {this.state = {...this.state, ...ctx }}
        if (!this.state._is_interacting) {
            this.state._is_interacting = true;
            this.state.cursor_start = this._base_to_viewport_coordinates(cursor_base_coordinates)
            return {x:0, y:0}
        } else {
            const cursor = this._base_to_viewport_coordinates(cursor_base_coordinates)
            return this._snap_coordinates({
                x: cursor.x - this.state.cursor_start.x,
                y: cursor.y - this.state.cursor_start.y,
            })
        }
    }
    get_grid_cell(cursor_base_coordinates: {x: number, y: number},dimensions:{w:number, h:number}, ctx?: InteractionsData) {
        if (ctx) {this.state = {...this.state,...{snap_to_grid: {x: true, y: true}}, ...ctx }}
        const cursor = this._base_to_viewport_coordinates(cursor_base_coordinates)
        const _dimensions = {x: dimensions.w*(100/this.state.grid.x), y: dimensions.h*(100/this.state.grid.y)}
        const cell = this._snap_coordinates({
            x: cursor.x,
            y: cursor.y,
        }, 'floor')
        this.state.snap_to_grid = {x: false, y: false}
        return {
            xa: cell.x, xb: cell.x + _dimensions.x, ya: cell.y, yb: cell.y + _dimensions.y
        }
        
    }
    release() {
        this.state._is_interacting = false
        this.state.cursor_start = {x: 0, y: 0}
    }
}