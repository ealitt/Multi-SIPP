class State {
    constructor(pos, time, interval) {
        this.pos = pos;
        this.x = pos[0];
        this.y = pos[1];
        this.time = time;
        this.interval = interval;
        this.parent = undefined;
    }
}

class Cell {
    constructor(x, y, wall, scl=width/rows) {
        this.x = x;
        this.y = y;
        this.wall = wall;
        this.scl = scl;
        this.f = Infinity;
        this.g = Infinity;
        this.h = Infinity;
        this.state = new State([x,y], 0, [0, Infinity]);
        this.intervalList = [[0, Infinity]];
        this.parent = undefined;
    }
    get coord() {
        return [this.x * this.scl, this.y * this.scl];
    }
    get centerCoord() {
        return [this.x * this.scl + this.scl/2, this.y * this.scl + this.scl/2];
    }
}
