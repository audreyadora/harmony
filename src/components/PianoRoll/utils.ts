export function scale_value(val: number,val_range_min: number,val_range_max: number,target_range_min: number,target_range_max: number): number {
    return (((val - val_range_min) / (val_range_max - val_range_min)) * (target_range_max - target_range_min) + target_range_min);
};
export function trans_scale_range(scale: number, trans: number, range_min: number, range_max: number) {
    //scale trans range to limit viewport scroll to bounds 
    const scaled_t = ((trans * 100) * (1 - scale) * (range_max - range_min))/100 
    return [scaled_t, scaled_t + (scale * range_max)]
}
export function mod(n:number, m:number) {
    const remain = n % m;
    return Math.floor(remain >= 0 ? remain : remain + m);
};

export function trans_scale_range_vec2(scale: number[], trans: number[], range: {xa: number, xb: number, ya: number, yb: number}) {
    //scale trans range to limit viewport scroll to bounds 
    const [xa,xb,ya,yb] = [
        ...trans_scale_range(scale[0],trans[0],range.xa,range.xb),
        ...trans_scale_range(scale[1],trans[1],range.ya,range.yb)
    ]
    return {xa:xa,xb:xb,ya:ya,yb:yb}
}
export function round_to(num: number, n:number) {
   return Math.round(num * (10**n)) / (10**n)
}
export const bitutils = {
    arrtob: (arr: number[]) => {return arr.reduce((b,n,i)=> n === 1 ? b | 1 << i : b)},
    rotl: (x: number, n: number, l: number) => {return (x<<n) | (x>>(l-n))},
    rotr: (x: number, n: number, l: number) => {return (x>>(l-n)) | (x<<n)},
    get: (x:number, n: number) => {return (x >> n-1) & 1}
}

export function get_matching_indices<T>(array: T[], targetval: T): number[] {
    return array.reduce(function(a: number[], e:T, i: number) {if (e === targetval) a.push(i); return a;}, []);  
}

export function append_buffer(buffer1:ArrayBuffer, buffer2:ArrayBuffer) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};    
export function now() {
        return window?.performance && performance.now ? performance.now() : Date.now();
}

export function evalNoteResizeBounds(cursorx: number, targetxa: number, targetxb: number, resizeBounds: number) {
		return cursorx > targetxa + (targetxb - targetxa) * resizeBounds;
}


export function filter_bool_record(bool_record: Record<string | number, boolean>, bool: boolean) {
    return Object.keys(bool_record)
        .filter((k) => (bool_record[k] === bool))
}

export function delete_from_record<T>(id_list: string, record: Record<string, T>) {
    const new_record = record;
    for (const id of id_list) {
        delete new_record[id]
    }
    return new_record as Record<string,T>
}
export function union<T>(map: Map<string,T>,map_b: Map<string,T>): Map<string,T> {
    for (const item of map_b) {
        map.set(...item);
    }
  return map;
}
export function clamp(n: number, min:number, max: number) {
  return n <= min 
    ? min 
    : n >= max 
      ? max 
      : n
}