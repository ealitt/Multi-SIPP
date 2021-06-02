let settings;

let width = 800;
let height = width;

let rows = 20;
let cols = rows;

let grid = [];

let obstacleProbability = 0.25;
let numBots = 4;
let robots = [];

let noBorder = true;
let drawBorder = false;

let speed;

class SippSettings {
  constructor() {
    this.drawPath = true;
    this.drawBorder = true;
    this.initRobots = (() => robots = initRobots(grid, numBots));
    this.findPath = (() => SIPP(grid, robots));
    this.randomizeGrid = (() => {grid = generateObstacles(grid, obstacleProbability);
                                drawGrid(grid)});
    this.downloadJSON = (() => generateJSON(grid, robots));
  }
}

class Robot {
  constructor(name, start, goal) {
    this.name = name;
    this.start = start;
    this.goal = goal;
    this.x = start[0] * grid[0][0].scl;
    this.y = start[1] * grid[0][0].scl;
    this.moveX = 0;
    this.moveY = 0;
    this.step = 0;
    this.openSet = [];
    this.gridCopy = [];
    this.path = [];
    this.time = 0;
    this.color = [random(255), random(255), random(255), 50];
    this.stop = false;
  }
}

function guiSetup() {
  settings = new SippSettings();
  let gui = new dat.GUI();

  gui.add(settings, 'drawPath');
  gui.add(settings, 'drawBorder');
  gui.add(settings, 'initRobots');
  gui.add(settings, 'findPath');
  gui.add(settings, 'randomizeGrid');
  gui.add(settings, 'downloadJSON');
}



Array.prototype.containsArray = function(elem) {
  let hash = {};
  this.forEach((val) => {
    hash[val] = val;
  });
  return hash.hasOwnProperty(elem);
}

Array.prototype.removeAtIndex = function(index) {
  this.splice(index, 1);
}

Array.prototype.indexOfArray = function(elem) {
  let found = false;
  for(let index = 0; index < this.length; index++) {
    found = true;
    for(let num = 0; num < elem.length; num++) {
      if(this[index][num] != elem[num]) found = false;
    }
    if(found) return index;
  }
  return -1;
}

function randomIntRange(min, max) {
  return floor(Math.random() * ((max+1) - min) + min);
}

function getRandomCoord(grid) {
  return [randomIntRange(0, grid.length - 1), randomIntRange(0, grid.length - 1)];
}

function checkValidCell(data, cell) {
  let valid = true;
  data.forEach((elem) => {
    if (Object.values(elem).containsArray(cell)) {
      valid = false;
    }
  });
  return valid;
}

function getRandomValidCell(grid, robots) {
  let cell;
  let validCell = false;
  while (!validCell) {
    cell = getRandomCoord(grid);
    if (!grid[cell[0]][cell[1]].wall && checkValidCell(robots, cell)) {
      validCell = true;
    }
  }
  return cell;
}

function initRobots(grid, numBots) {
  let robots = [];

  for (let robot = 0; robot < numBots; robot++) {
    let start = getRandomValidCell(grid, robots);
    let goal = getRandomValidCell(grid, robots);
    
    robots.push(new Robot(`agent${robot}`, start, goal));
    robots[robot].gridCopy = [...grid];
  }
  
  // drawGrid(grid);
  drawRobotsAndGoals(robots);

  return robots;
}

function drawRobotsAndGoals(robots) {
  strokeWeight(1);
  stroke(0);
  let diameter = grid[0][0].scl * (2/3);
  robots.forEach((robot) => {
    // draw robot
    fill(robot.color[0], robot.color[1], robot.color[2], 200);
    rect(robot.x, robot.y, grid[0][0].scl, grid[0][0].scl);
    // draw goal
    let goal = robot['goal'];
    let goalPos = grid[goal[0]][goal[1]].centerCoord;
    ellipse(goalPos[0], goalPos[1], diameter);
  })
}

function initRandomEnvironment() {
  grid = generateGrid(rows, cols);
  grid = generateObstacles(grid, obstacleProbability);
  robots = initRobots(grid, numBots);

  return grid;
}

function initFromMap() {
  grid = generateGrid(map1.map.dimensions[0], map1.map.dimensions[1]);

  map1.map.obstacles.forEach((obstacle) => {
    grid[obstacle[0]][obstacle[1]].wall = true;
  })

  Object.values(map1.agents).forEach((robot, index) => {
    robots.push(new Robot(robot.name, robot.start, robot.goal));
    robots[index].gridCopy = [...grid];
  })

  return grid;
}

function getSuccessors(data, cell) {
  let successors = []
  let mTime = 1;
  let neighbors = getValidNeighbors(data, cell);
  neighbors.forEach((neighbor) => {
    let startTime = cell.time + mTime;
    let endTime = cell.interval[1] + mTime;

    grid[neighbor.x][neighbor.y].intervalList.forEach((interval) => {
      if(!(interval[0] > endTime || interval[1] < startTime)) {
        time = Math.max(startTime, interval[0]);
        cellState = new State([neighbor.x, neighbor.y], time, interval);
        successors.push(cellState);
      }
    })
  })

  return successors;
}

function isValidPos(data, pos) {
  if (pos[0] >= 0 && pos[0] < data.gridCopy.length &&
      pos[1] >= 0 && pos[1] < data.gridCopy.length) {
        if(!data.gridCopy[pos[0]][pos[1]].wall) {
          return true;
        }
  }
  return false
}

function getValidNeighbors(data, cell) {
  // let neighborCells = [];

  // let neighbors = [ 0, 1, 0,
  //                   1, 0, 1,
  //                   0, 1, 0 ];

  // let index = 0;
  // for (let y = 1; y >= -1; y--) {
  //   for (let x = -1; x <= 1; x++) {
  //     if (neighbors[index] != 0) {
  //       let xDir = cell.x + x;
  //       let yDir = cell.y + y;
  //       if (xDir >= 0 && xDir <= data.gridCopy.length - 1 &&
  //           yDir >= 0 && yDir <= data.gridCopy[0].length - 1 &&
  //           !data.gridCopy[xDir][yDir].wall) {
  //             neighborCells.push(data.gridCopy[xDir][yDir]);
  //           }
  //     }
  //     index += 1;
  //   }
  // }
  
  // return neighborCells;
  let neighbors = [];

  let up = [cell.x, cell.y + 1]
  if (isValidPos(data, up)) { neighbors.push(data.gridCopy[up[0]][up[1]]) }

  let down = [cell.x, cell.y - 1]
  if (isValidPos(data, down)) { neighbors.push(data.gridCopy[down[0]][down[1]]) }

  let left = [cell.x - 1, cell.y]
  if (isValidPos(data, left)) { neighbors.push(data.gridCopy[left[0]][left[1]]) }

  let right = [cell.x + 1, cell.y]
  if (isValidPos(data, right)) { neighbors.push(data.gridCopy[right[0]][right[1]]) }

  return neighbors;
}

function getHeuristic(a, b) {
  return Math.abs(Math.pow(a[0] - b[0], 2))+ Math.abs(Math.pow(a[1] - b[1], 2));
}

function findPath(robot) {
  let stopPathFinding = false;
  let cost = 1;
  let currentCell;
  let lastCell;

  for (let x = 0; x < robot.gridCopy.length; x++) {
    for (let y = 0; y < robot.gridCopy[x].length; y++) {
      robot.gridCopy[x][y].g = Infinity;
      robot.gridCopy[x][y].f = Infinity;
      robot.gridCopy[x][y].parent = undefined;
    }
  }
  robot.gridCopy[robot.start[0]][robot.start[1]].g = 0;
  robot.gridCopy[robot.start[0]][robot.start[1]].f = getHeuristic(robot.start, robot.goal);
  robot.openSet.push(new State(robot.start, 0, [0, Infinity]));
  
  while (robot.openSet.length != 0 && !stopPathFinding) {
    currentCell = robot.openSet[0];
    robot.openSet.removeAtIndex(0);

    // getSuccessors(robot, currentCell).forEach((successor) => {
    let successors = getSuccessors(robot, currentCell);
    for(let index = 0; index <= successors.length - 1; index++){
      let successor = successors[index];
      if(!stopPathFinding){
        if (robot.gridCopy[successor.x][successor.y].g > robot.gridCopy[currentCell.x][currentCell.y].g + cost) {
          robot.gridCopy[successor.x][successor.y].g = robot.gridCopy[currentCell.x][currentCell.y].g + cost;
          successor.parent = currentCell;
          if (successor.x == robot.goal[0] && successor.y == robot.goal[1]) {
            console.log("Found path!");
            stopPathFinding = true;
          }
          robot.gridCopy[successor.x][successor.y].f = robot.gridCopy[successor.x][successor.y].g + getHeuristic([successor.x, successor.y], robot.goal);
          robot.openSet.push(successor);
          lastCell = successor;
        }
      }
    }
    // })
  }

  let tempCell = lastCell;
  while (tempCell.parent) {
    robot.path.splice(0, 0, tempCell);
    tempCell = tempCell.parent;
  }
  robot.path.splice(0, 0, new State(robot.start, 0, [0, Infinity]));

  // let tempPath = [...robot.path];
  // robot.path.forEach((cell) => {
  //   if (cell.time > 0) {
  //     let pauseTime = cell.time - cell.parent.time;
  //     if (pauseTime > 1) {
  //       for (let pause = 0; pause < pauseTime; pause++) {
  //         tempPath.splice(tempPath.indexOf(cell), 0, new State(cell.pos, cell.time-pause));
  //       }
  //     }
  //   }
  // })
  // robot.path = tempPath;
  for (let index = robot.path.length - 1; index > 0; index--) {
    let pauseTime = robot.path[index].time - robot.path[index - 1].time;
    if (pauseTime > 1) {
      for (let pause = pauseTime; pause >= 0; pause--) {
        let step = robot.path[index-1];
        // lazy fix
        if (step.time + pause - 1 > 0) {
          robot.path.splice(index, 0, new State(step.pos, step.time + pause - 1, step.interval));
        }
      }
    }
  }

  return robot;
}

function drawPath(data) {
  if (data.path.length > 0) {
    if(data.path.length > 0){
      let scl = data.gridCopy[0][0].scl;
      noFill();
      stroke(data.color[0], data.color[1], data.color[2], 255);
      strokeWeight(scl / 4);
      beginShape();
      vertex(data.start[0] * scl + scl / 2, data.start[1] * scl + scl / 2);
      for (var i = 0; i < data.path.length; i++) {
        vertex(data.path[i].x * scl + scl / 2, data.path[i].y * scl + scl / 2);
      }
      endShape();
    }
  }
}

function splitInterval(grid, cell) {
  let intervals = grid[cell.x][cell.y].intervalList;

  intervals.forEach((interval) => {
    if (cell.time > interval[0] && cell.time < interval[1]) {
      let index = intervals.indexOfArray(interval);
      let start = interval[0];
      let end = interval[1];
      // intervals.removeAtIndex(index);
      // intervals.pop(index);
      intervals.splice(index, 0, [cell.time+1, end]);
      intervals.splice(index, 0, [start, cell.time-1]);
    }
  })
  grid[cell.x][cell.y].intervalList = intervals;

  return grid;
}

function updateDynamicObstacles(grid, robot) {
  robot.path.forEach((step) => {
    grid = splitInterval(grid, step);
  })

  return grid;
}

function SIPP(grid, robots) {
  robots.forEach((robot) => {
    robot = findPath(robot);
    console.log(robot.name);
    grid = updateDynamicObstacles(grid, robot);
    drawPath(robot);
  })
  return grid;
}

function setup(){
  guiSetup();

  let gridGenerator = createCanvas(width+2, height+2);
  gridGenerator.parent('canvas');
  // createCanvas(windowWidth, windowHeight);
  // background(0);

  grid = initRandomEnvironment();
  // grid = initFromMap();

  grid = SIPP(grid, robots);
  
  speed = grid[0][0].scl / step;
  robots.forEach((robot) => {
    getDirection(robot);
  })
}

let count = 0;
let step = 15;

function getDirection(robot) {
  if(robot.step < robot.path.length - 1) {
    let curr = [robot.path[robot.step].x, robot.path[robot.step].y];
    let next = [robot.path[robot.step+1].x, robot.path[robot.step+1].y];
    robot.moveX = next[0] - curr[0];
    robot.moveY = next[1] - curr[1];
    robot.step += 1;
  } else {
    robot.stop = true;
  }
}

function draw(){
  // background(255);
  drawGrid(grid, settings.drawBorder);
  drawRobotsAndGoals(robots);
  if(count < step) {
    robots.forEach((robot) => {
      if (settings.drawPath) { drawPath(robot) }
      
      if (!robot.stop) {
        robot.x += speed * robot.moveX;
        robot.y += speed * robot.moveY;
      }
    });
    count += 1;
  } else {
    robots.forEach((robot) => {
      if (settings.drawPath) { drawPath(robot) }

      getDirection(robot);
      count = 0;
    });
  }
}

