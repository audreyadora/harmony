import { scale_value, trans_scale_range_vec2, round_to} from "./utils";
import type {GridDataGenerator} from './types'


let GridData = {
    canvas_scale : [1,1],
    canvas_trans : [0,0],
    g_color_a : [0.867,0.867,0.867, 1.0],
    g_color_b : [0.840,0.840,0.840, 1.0],
    g_color_c : [0.938,0.938,0.938, 1.0],
    g_color_d : [0.902,0.902,0.902, 1.0],
    border_px : 1 ,
    music_scale : [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0] ,
    grid_color_interval : 4,
    grid_zoom_divider : 10,
    grid_time_div : 4,
    grid_measures : 20,
    grid_range: {xa: 0, xb: 16, ya: 0, yb: 96},
    canvas_range: {xa: 0, xb: 100, ya: 0, yb: 100},
    offset_x: 0,
    max_visible_subdivisions: 180
} 

export function scaleGridX(data: {
    scale_x: number;
    grid_measures: number;
    grid_time_div: number;
    grid_zoom_divider: number;
}) {
    let grid_scale_x: number;

    const grid_scale_instance_x = data.grid_zoom_divider - Math.ceil(data.scale_x*data.grid_zoom_divider)
    const grid_subdiv = 2**(2+grid_scale_instance_x)

    const x_range_min = (data.grid_zoom_divider - grid_scale_instance_x - 1)/data.grid_zoom_divider
    const x_range_max = (data.grid_zoom_divider - grid_scale_instance_x )/data.grid_zoom_divider

    if (grid_scale_instance_x === 0) {
        grid_scale_x = scale_value(data.scale_x,x_range_min,x_range_max, data.grid_time_div/data.grid_measures, 1)
    } else if (grid_scale_instance_x === data.grid_zoom_divider-1) {
        grid_scale_x = scale_value(data.scale_x,x_range_min,x_range_max, 0, (data.grid_time_div*8)/(data.grid_measures*grid_subdiv))
    } else {
        grid_scale_x = scale_value(data.scale_x,x_range_min,x_range_max, (data.grid_time_div*4)/(data.grid_measures*grid_subdiv), (data.grid_time_div*8)/(data.grid_measures*grid_subdiv))
    }
    return {
        _grid_subdiv: grid_subdiv,
        _grid_scale_x: grid_scale_x
    }
}
function timeline_label(marker_depth: number, time_div_base: number, s_arr=[] as string[],index=0) {
    let stack = [] as string[]
    for (let i=0; i<time_div_base; i++) {
        if (s_arr.length === 0) {
            stack.push(`.${i}`)
        } else {
            for (let j=0; j<s_arr.length; j++) {
                stack.push(`.${i}${s_arr[j]}`)
            }
        }
    }
    if (index < marker_depth-1) {
        index+=1
        stack = timeline_label(marker_depth,time_div_base,stack,index)
    } 
    return stack
}
function* timeline_label_generator(measure_start: number, measure_end: number, marker_depth: number, time_div_base: number) {
    const labels = marker_depth < 2 ? ['.0'] : timeline_label(marker_depth-1,time_div_base)
    const label_len = labels.length 

    for (let i=0; i<measure_end-measure_start; i+=1) {
        for (let j=0;j<label_len; j++) {
            yield `${i+measure_start}${labels[j]}`
        }
    }
}
function getMarkerDepth(viewport_offset: number,viewport_count:number, max_depth: number, subdivs_per_measure: number, time_div_base: number){
    const measure_start = Math.floor(viewport_offset / subdivs_per_measure)
    const measure_start_subdivs = measure_start * subdivs_per_measure
    for (let i=1;i<max_depth+1;i++) {
        if (subdivs_per_measure <= time_div_base**i || i === max_depth) {
            const meter = 2**(i===1?0:i)
            const marker_intervals = (1/meter)*subdivs_per_measure
            const start_offset_vp = Math.ceil((viewport_offset - measure_start_subdivs)/marker_intervals)
            const end_offset_vp = Math.ceil(((viewport_count+viewport_offset) - measure_start_subdivs)/marker_intervals) 
            const measure_end = Math.ceil((viewport_offset+viewport_count) / subdivs_per_measure)

            return {
                meter: meter,
                marker_intervals: marker_intervals,
                start_subdiv_offset: (measure_start_subdivs + start_offset_vp*marker_intervals) - viewport_offset,
                timeline_labels: [...timeline_label_generator(measure_start,measure_end,i,time_div_base)].filter((ele,i)=> (i>=start_offset_vp && i<=end_offset_vp))
            }
        }
    }
    return false
}

export const generateGridData = (data: GridDataGenerator) => {

    GridData = {
        ...GridData,
        ...data
    }
    let xb = GridData.grid_range.xb

    if ((GridData.grid_range.xb - GridData.grid_range.xa) * GridData.canvas_scale[0] > GridData.max_visible_subdivisions) {
        xb = GridData.grid_range.xa + (GridData.max_visible_subdivisions/GridData.canvas_scale[0])
    }

    const element_count = {x: xb-GridData.grid_range.xa, y: GridData.grid_range.yb-GridData.grid_range.ya}

    const x_count_actual = (GridData.grid_range.xb-GridData.grid_range.xa)

    const element_range = trans_scale_range_vec2(GridData.canvas_scale, GridData.canvas_trans, {...GridData.grid_range, xb: xb})

    const element_range_actual = trans_scale_range_vec2(GridData.canvas_scale, GridData.canvas_trans, GridData.grid_range)
    const grid_cell_rect = {
        xa: Math.floor(element_range.xa),
        ya: Math.floor(element_range.ya),
        xb: Math.ceil(element_range.xb),
        yb: Math.ceil(element_range.yb)
    }

    const grid_cell_count = {x: grid_cell_rect.xb-grid_cell_rect.xa, y: grid_cell_rect.yb-grid_cell_rect.ya}
    const grid_start_offset = {x: element_range.xa - grid_cell_rect.xa, y: element_range.ya - grid_cell_rect.ya}
    const w = GridData.canvas_range.xb - GridData.canvas_range.xa 
    const h = GridData.canvas_range.yb - GridData.canvas_range.ya 

    const note_dimensions= {
        w: ((w/GridData.canvas_scale[0])-(GridData.border_px*(element_count.x+1)))/element_count.x,
        h: ((h/GridData.canvas_scale[1])-(GridData.border_px*(element_count.y+1)))/element_count.y
    }

    const grid_coordinate_generator = {
        xa: (i: number) => {return i*(note_dimensions.w + GridData.border_px) + GridData.border_px},
        xb: (i: number) => {return grid_coordinate_generator.xa(i) + note_dimensions.w},
        ya: (i: number) => {return i*(note_dimensions.h + GridData.border_px) + GridData.border_px},
        yb: (i: number) => {return grid_coordinate_generator.ya(i) + note_dimensions.h},
    }
    
    
    const grid_data = new Float32Array(grid_cell_count.x*grid_cell_count.y*15)
    let instance = 0;

    const col_a = [GridData.g_color_a,GridData.g_color_c]
    const col_b = [GridData.g_color_b,GridData.g_color_d]

    const color_column_group_init = grid_cell_rect.xa % (GridData.grid_color_interval*2) > GridData.grid_color_interval-1 ? true : false;
    const color_column_index_init = grid_cell_rect.xa % GridData.grid_color_interval;
    
    const subdivs_per_measure = x_count_actual/GridData.grid_measures
    
    const markers = getMarkerDepth(Math.floor(element_range_actual.xa) ,Math.ceil(element_range_actual.xb) - Math.floor(element_range_actual.xa),4,subdivs_per_measure,GridData.grid_time_div)
    let marker_offset = markers ? (markers.start_subdiv_offset >= 0 ? markers.start_subdiv_offset : 0) : 0
    const marker_label_count= markers ? markers.timeline_labels.length : 0;

    const grid_labels = {
                x_labels: [] as string[],
                y_labels: [] as string[],
                x: [] as number[],
                y: [] as number[]
            }
    let color_column_group = color_column_group_init;
    let color_column_index = color_column_index_init;
    let c = 0;
            
    for (let i=0; i < grid_cell_count.y; i += 1) {
        const color_group = [col_a[GridData.music_scale[(i+grid_cell_rect.ya)%12]],col_b[GridData.music_scale[(i+grid_cell_rect.ya)%12]]]

        for (let j=0; j < grid_cell_count.x; j += 1) {

            if (color_column_index === GridData.grid_color_interval) {
                color_column_group = !color_column_group;
                color_column_index = 0;
            }


            const selected_color = color_column_group ? color_group[1] : color_group[0]

            const xa = grid_coordinate_generator.xa(j-grid_start_offset.x) < GridData.canvas_range.xa ? GridData.canvas_range.xa + GridData.offset_x : grid_coordinate_generator.xa(j-grid_start_offset.x) + GridData.offset_x 
            const xb = grid_coordinate_generator.xb(j-grid_start_offset.x) + GridData.offset_x > GridData.canvas_range.xb ? GridData.canvas_range.xb : grid_coordinate_generator.xb(j-grid_start_offset.x) + GridData.offset_x 
            const ya = grid_coordinate_generator.ya(i-grid_start_offset.y) < GridData.canvas_range.ya ? GridData.canvas_range.ya : grid_coordinate_generator.ya(i-grid_start_offset.y)
            const yb = grid_coordinate_generator.yb(i-grid_start_offset.y) > GridData.canvas_range.yb ? GridData.canvas_range.yb : grid_coordinate_generator.yb(i-grid_start_offset.y)
            
            if (markers) {
                if ((i===0) && (j===marker_offset) && (marker_offset<=marker_label_count*markers.marker_intervals)) {
                grid_labels.x.push(xa)
                grid_labels.x_labels.push(markers.timeline_labels[c])
                marker_offset += markers.marker_intervals

                c+=1
                }
            }
            grid_data.set([
                xa,
                h - round_to(yb,4),
                round_to(xb,4),
                h - round_to(ya,4),
                selected_color[0],
                selected_color[1],
                selected_color[2],
                selected_color[3],
                0,0,0,0,
                (GridData.canvas_range.xb-GridData.canvas_range.xa),    
                (GridData.canvas_range.yb-GridData.canvas_range.ya), 0.25            
            ],instance*15)

            color_column_index += 1;
            instance += 1;
        }
        color_column_group = color_column_group_init;
        color_column_index = color_column_index_init;
    }
    return {
        grid_generator: grid_data,
        generator_length: instance,
        grid_labels: grid_labels
    }
}
