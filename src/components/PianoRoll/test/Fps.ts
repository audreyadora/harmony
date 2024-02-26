import {now} from '../utils'
export class FpsCounter {
    counter = 0;
    fpsBuffer = 0;
    fps = 0;
    seconds = 0;
    before = 0;
    after = 0;
    fpsArray: number[] = [];
    reset() {
        this.counter = 0;
        this.fpsBuffer = 0;
        this.fps = 0;
        this.seconds = 0;
        this.before = 0;
        this.after = 0;
        this.fpsArray = [] as number[];
    }
    tick() {
        this.after = now();
        this.seconds = (this.after - this.before) / 1000;
        this.before = this.after;
        
        this.fpsBuffer = 1 / this.seconds;
        if (this.counter >= 20) {
            const sum = this.fpsArray.reduce(function(a,b) { return a + b });
            this.fps = sum / this.fpsArray.length;
            this.counter = 0;
        } else {
            if (this.fps !== Infinity) {
                this.fpsArray.push(this.fpsBuffer);
            }
            this.counter++;
        } 
    }
}