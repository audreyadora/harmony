import { union } from "./utils";
import RBush from "rbush";
import { v4 as uuid4 } from 'uuid';
function equalsCallback (a: Vec, b:Vec) {
        return (a as Vec).id === (b as Vec).id; 
};
type Vec = { id: string; minX: number; minY: number; maxX: number; maxY: number; }
type StateHistoryEvent = |
    {
        type: 'add' 
        payload: {xa: number[], xb: number[], ya: number[], yb: number[], select_state: boolean[]|boolean, id_list: string[]}
    } |
    {
        type: 'remove' 
        payload: {xa: number[], xb: number[], ya: number[], yb: number[], id_list: string[]}
    } |
    {
        type: 'update'
        payload: {xa: number[], xb: number[], ya: number[], yb: number[], id_list: string[]}
    }

type StateHistory = StateHistoryEvent[]
function new_state_history_entry(type: 'add' |'remove' | 'update') {
    return {
        type: type,
        payload: {
            xa: [], 
            xb: [], 
            ya: [], 
            yb: [], 
            id_list: [],
            ...type==='add' ? {select_state: false as boolean[]|boolean} : {}
        }
    } as StateHistoryEvent
}
export class QuadData {    
    data_tree = new RBush() as RBush<Vec>;
    data_map = new Map([]) as Map<string, {xa:number, xb:number, ya:number, yb:number}>;
    select_map_t = new Map([]) as Map<string, number>;
    select_map_f = new Map([]) as Map<string, number>;
    previous_select_map_t = new Map([]) as Map<string, number>;
    previous_select_map_f = new Map([]) as Map<string, number>;
    state_history_index = -1;
    state_history_length = 0;
    state_history = [] as StateHistory;
    state_history_flag = false;
    clipboard = new Map([
        ['xa',[] as number[]],
        ['xb',[] as number[]],
        ['ya',[] as number[]],
        ['yb',[] as number[]]
    ])
    num_instances = 0;
    _branch() {
        const index = this.state_history_length - this.state_history_index - 1
        this.state_history_length = this.state_history_index + 1
        for (let i = 0; i < index; ++i) {
            this.state_history.pop()
        }    
    }
    _apply_state(type: 'undo'|'redo') {
        this.state_history_flag = true;
        const state = this.state_history[this.state_history_index]
 

        switch (state.type) {
            case ('add'):
                if (type === 'undo') {
                    this.remove({id_list: state.payload.id_list})
                } else if (type === 'redo') {
                    this.insert(state.payload)
                }
                break;
            case ('remove'):
                if (type === 'undo') {
                    this.insert({...state.payload, select_state: true})
                } else if (type === 'redo') {
                    this.remove({id_list: state.payload.id_list})
                } 
                break;
            case ('update'):
                if (type === 'undo') {
                    if (this.state_history_index > 0) {
                        const previous_state = this.state_history[this.state_history_index-1]
                        this.update({
                            xa: previous_state.payload.xa,
                            xb: previous_state.payload.xb,
                            ya: previous_state.payload.ya,
                            yb: previous_state.payload.yb,
                            id_list: previous_state.payload.id_list
                        })
                    }
                } else if (type === 'redo') {
                    this.update(state.payload)
                } 
                break;
        }
        this.state_history_flag = false;
    }
    _genID() {return  `n${(uuid4() as string).replaceAll('-', '')}`}
    
    _get_current_select_state(id:string) {
        return this.select_map_t.has(id)
    }
    _get_previous_select_state(id:string) {
        return this.previous_select_map_t.has(id)
    }
    _set_current_select_state(id: string, state: boolean) {
        if (state) {       
            this.select_map_t.set(id, 0)
            this.select_map_f.delete(id)
        } else {
            this.select_map_f.set(id, 0)
            this.select_map_t.delete(id)
        }      
    }
    _set_previous_select_state(id: string, state: boolean) {
        if (state) {       
            this.previous_select_map_t.set(id, 0)
            this.previous_select_map_f.delete(id)
        } else {
            this.previous_select_map_f.set(id, 0)
            this.previous_select_map_t.delete(id)
        }      
    }

    undo() {
        if (this.state_history_index > -1) {
            this._apply_state('undo')
            this.state_history_index -=1
        }
    }
    redo() {
        if (this.state_history_index < this.state_history_length - 1) {
            this.state_history_index +=1
            this._apply_state('redo')
        }
    }
    search(data: {xa: number, xb: number, ya: number, yb: number}) {
        return this.data_tree.search({minX: data.xa, minY: data.ya, maxX: data.xb,maxY: data.yb})
    }
    insert(data: {xa: number[], xb: number[], ya: number[], yb: number[], select_state: boolean[]|boolean, id_list?: string[]}) {
        if (!this.state_history_flag && this.state_history_index !== this.state_history_length - 1) {this._branch()}

        const select = typeof data.select_state === 'boolean'
        const select_state = select? data.select_state as boolean : true
        const id_list = [] as string[];

        for (let i = 0; i < data.xa.length; ++i) {
            const id = data.id_list ? data.id_list[i] : this._genID();
            if (!this.state_history_flag) {
                id_list.push(id)
            }

            const vec = { minX: data.xa[i],minY: data.ya[i],maxX: data.xb[i],maxY: data.yb[i],id: id} as Vec;
            const vec_select_state = select ? select_state : (data.select_state as boolean[])[i]

            this.data_tree.insert(vec);
            this.data_map.set(id, {xa: data.xa[i], ya: data.ya[i], xb: data.xb[i], yb: data.yb[i]})

            this._set_previous_select_state(id, vec_select_state)
            this._set_current_select_state(id, vec_select_state)
            this.num_instances += 1;
        }

        if (!this.state_history_flag) {
            const history_event = new_state_history_entry('add')
            history_event.payload = {xa: data.xa, xb: data.xb, ya: data.ya, yb: data.yb, select_state: data.select_state, id_list: id_list}
            this.state_history_length += 1;
            this.state_history_index += 1;
            this.state_history.push(history_event)
        }

    }
    update(data: {xa: number[], xb: number[], ya: number[], yb: number[], id_list: string[]}) {
        if (!this.state_history_flag && this.state_history_index !== this.state_history_length - 1) {this._branch()}
        for (let i = 0; i < data.xa.length; ++i) {
            const vec = this.data_map.get(data.id_list[i])
            if (vec) {
                this.data_tree.remove({...{minX: vec.xa, maxX: vec.xb, minY: vec.ya, maxY: vec.yb}, id: data.id_list[i]} as Vec, equalsCallback)
                this.data_tree.insert({ minX: data.xa[i],minY: data.ya[i],maxX: data.xb[i],maxY: data.yb[i],id: data.id_list[i]} as Vec);
                this.data_map.set(data.id_list[i], {xa: data.xa[i], xb: data.xb[i], ya: data.ya[i], yb: data.yb[i]})
            }

        }
    }
    commitUpdates(data: {id_list: string[]}) {
        const history_event = new_state_history_entry('update')
        for (let i = 0; i < data.id_list.length; ++i) {
            const vec = this.data_map.get(data.id_list[i])
            if (vec) {
                history_event.payload.id_list.push(data.id_list[i])
                history_event.payload.xa.push(vec.xa)
                history_event.payload.xb.push(vec.xb)
                history_event.payload.ya.push(vec.ya)
                history_event.payload.yb.push(vec.yb)
            }
        }
        this.state_history_length += 1;
        this.state_history_index += 1;
        this.state_history.push(history_event)
    }
    remove(data: {id_list: string[]}) {
        if (!this.state_history_flag && this.state_history_index !== this.state_history_length - 1) {this._branch()}

        const history_event = new_state_history_entry('remove')

        for (let i = 0; i < data.id_list.length; ++i) {
            const vec = this.data_map.get(data.id_list[i])

            if (vec) {
                this.data_tree.remove({...{minX: vec.xa, maxX: vec.xb, minY: vec.ya, maxY: vec.yb}, id: data.id_list[i]} as Vec, equalsCallback)
                this.data_map.delete(data.id_list[i])
                this.select_map_t.delete(data.id_list[i])
                this.select_map_f.delete(data.id_list[i])
                this.previous_select_map_t.delete(data.id_list[i])
                this.previous_select_map_f.delete(data.id_list[i])
                this.num_instances -= 1;

                if (!this.state_history_flag) {
                    history_event.payload.id_list.push(data.id_list[i])
                    history_event.payload.xa.push(vec.xa)
                    history_event.payload.xb.push(vec.xb)
                    history_event.payload.ya.push(vec.ya)
                    history_event.payload.yb.push(vec.yb)
                }
            }
        }
        if (!this.state_history_flag) {
            this.state_history_length += 1;
            this.state_history_index += 1;
            this.state_history.push(history_event)
        }

    }
    getInstancedVecData(id_list: string[]) {
        const vec_map = new Map([]) as Map<string, {xa:number, xb:number, ya:number, yb:number}>;
        for (const id of id_list) {
            const vec = this.data_map.get(id)
            if (vec) {
                vec_map.set(id, vec)
            }
        }
        return vec_map
    }
    getDeinstancedVecData(id_list: string[]) {
        const xa = [] as number[]
        const xb = [] as number[]
        const ya = [] as number[]
        const yb = [] as number[]
        for (const id of id_list) {
            const vec = this.data_map.get(id)
            if (vec) {
                xa.push(vec.xa)
                xb.push(vec.xb)
                ya.push(vec.ya)
                yb.push(vec.yb)
            }
        }
        return new Map([['xa',xa],['xb',xb],['ya',ya],['yb',yb]])
    }
    copySelected() {
        this.clipboard = this.getDeinstancedVecData([...this.select_map_t.keys()])
    }
    setCurrentSelectStateAll(data: {select_state: boolean}) {
        this.previous_select_map_t = new Map(this.select_map_t)
        this.previous_select_map_f = new Map(this.select_map_f)
        if (data.select_state) {
            this.select_map_t = union(this.select_map_t,this.select_map_f)
            this.select_map_f = new Map([]) as Map<string, number>;
        } else {
            this.select_map_f = union(this.select_map_t,this.select_map_f)
            this.select_map_t = new Map([]) as Map<string, number>;
        }
            
    }
    setCurrentSelectState(data: {id_list: string[], select_state: boolean[]}) {
        for (let i = 0; i < data.id_list.length; ++i) {
            if (this.data_map.has(data.id_list[i])) {
                this._set_previous_select_state(data.id_list[i],this._get_current_select_state(data.id_list[i]))
                this._set_current_select_state(data.id_list[i], data.select_state[i])
            } else {
                this._set_previous_select_state(data.id_list[i], data.select_state[i])
                this._set_current_select_state(data.id_list[i], data.select_state[i])
            }
        }
    }
    filterCurrentSelectStateIDs(data: {select_state: boolean}) {
        if (data.select_state) {
            return this.select_map_t.keys()
        } else {
            return this.select_map_f.keys()
        }
    }
    filterPreviousSelectStateIDs(data: {select_state: boolean}) {
        if (data.select_state) {
            return this.previous_select_map_t.keys()
        } else {
            return this.previous_select_map_f.keys()
        }
    }
    getIDs() {
        return this.data_map.keys()
    }



}