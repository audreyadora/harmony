import { round_to,trans_scale_range} from "./utils";
export class Sidebar {
    state = false;
    collapsed_width = 0.005;
    expanded_width = 0.02;
    type = 'piano' as 'piano'|'other';
    key_colors_default = [[1,1,1,1],[0,0,0,1]];
    key_colors_highlight = [[1,1,1,1],[0,0,0,1]];
    sidebar_render_data = new Float32Array(0);
    sidebar_render_instances = 0;
    music_scale = [0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0];
    num_keys = 96;
    border_px = 1;
    border_color = [193/256,18/256,31/256,1];
    background_color = [0.255, 0.353, 0.467, 1.0]
    getRenderData(
        data: {
            canvas_scale: number[],
            canvas_trans: number[],
            canvas_range: { xa: number; xb: number; ya: number; yb: number }
        }
    ) {
        let element_range = [0,1]; 
        let element_count_y = 1;
        if (this.state) {
            element_range = trans_scale_range(data.canvas_scale[1],data.canvas_trans[1],0,this.num_keys);
            element_count_y = Math.ceil(element_range[1] - element_range[0])
        }
        
        const grid_start_offset_y = element_range[0]- Math.floor(element_range[0])
        const y_start = Math.floor(element_range[0])
        const w = data.canvas_range.xb - data.canvas_range.xa 
        const h = data.canvas_range.yb - data.canvas_range.ya 

        const note_dimensions= {
            w: w*(this.state ? this.expanded_width : this.collapsed_width),
            h: this.state ? ((h/data.canvas_scale[1])-(this.border_px*(this.num_keys+1)))/this.num_keys : h
        }
        const border_background_dimensions = {
            xa: 0,
            xb: w*(this.state ? this.expanded_width : this.collapsed_width),
            ya: 0,
            yb: h
        }

        const grid_coordinate_generator = {
            xa: (i: number) => {return i*(note_dimensions.w) + this.border_px},
            xb: (i: number) => {return grid_coordinate_generator.xa(i) + note_dimensions.w},
            ya: (i: number) => {return i*(note_dimensions.h + this.border_px) + this.border_px},
            yb: (i: number) => {return grid_coordinate_generator.ya(i) + note_dimensions.h},
        }
        
        
        if (this.sidebar_render_instances !== (element_count_y+1)*15) {
            this.sidebar_render_data = new Float32Array((element_count_y+1)*15)
        }
        let instance = 1;
        this.sidebar_render_data.set([
            border_background_dimensions.xa,h-border_background_dimensions.yb,
            border_background_dimensions.xb,h-border_background_dimensions.ya,
            ...this.background_color,
            0,0,0,0,w,h,0.25         
        ],0)
        for (let i=0; i < element_count_y; i += 1) {
        
            const selected_color = this.state ? (this.music_scale[(i+y_start)%12] === 0 ? this.key_colors_default[0] : this.key_colors_default[1]) : this.background_color

            const xa = 0
            const xb = note_dimensions.w
            const ya = grid_coordinate_generator.ya(i- grid_start_offset_y)  < data.canvas_range.ya ? data.canvas_range.ya : grid_coordinate_generator.ya(i- grid_start_offset_y ) 
            const yb = grid_coordinate_generator.yb(i- grid_start_offset_y)  > data.canvas_range.yb ? data.canvas_range.yb :  grid_coordinate_generator.yb(i- grid_start_offset_y ) 
                    
            this.sidebar_render_data.set([
                round_to(xa,4),
                h - round_to(yb,4),
                round_to(xb,4),
                h - round_to(ya,4),
                ...selected_color,
                0,0,0,0,w,h,0.25             
            ],instance*15)
            instance += 1;
        }
        this.sidebar_render_instances = instance
        return  {
            sidebar_data: this.sidebar_render_data,
            note_count: this.sidebar_render_instances
        }
    }
}
