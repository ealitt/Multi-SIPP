function generateGrid(rows, cols) {
    let grid = [];
    let scl = width / rows;

    for (let x = 0; x < cols; x++) {
        grid[x] = new Array(rows);  
        for(let y = 0; y < rows; y++) {
            grid[x][y] = new Cell(x, y, false, scl);
        }
    }

    return grid;
}

function drawGrid(grid, drawBorder) {
    stroke(0, 0, 0);

    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            if(drawBorder) {
            strokeWeight(1);
            } else {
            strokeWeight(0);
            }

            if(grid[x][y].wall) {
            fill(0);
            } else {
            fill(255);
            }

            let coord = grid[x][y].coord;
            let scl = grid[x][y].scl;
            rect(coord[0], coord[1], scl+1, scl+1);
        }
    }
}

function clearObstacles(grid) {
    for (let x = 1; x < cols - 1; x++) {
        for (let y = 1; y < rows - 1; y++) {
            grid[x][y].wall = false;
        }
    }
    return grid;
}

function generateObstacles(grid, prob) {
    grid = clearObstacles(grid);
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            if (!noBorder && (x == 0 || x == cols - 1 || y == 0 || y == rows - 1)) {
                grid[x][y].wall = true;
            }
            if(random() < prob) {
                grid[x][y].wall = true;
            } 
        }
    }

    let fillCell = [];
    for (let x = 1; x < cols - 1; x++) {
        for (let y = 1; y < rows - 1; y++) {
            if(grid[x-1][y].wall && grid[x+1][y].wall && grid[x][y-1].wall && grid[x][y+1].wall) {
            fillCell.push([x, y]);
            }
        }
    }
    fillCell.forEach((cell) => {
        grid[cell[0]][cell[1]].wall = true;
    })

    return grid;
}

function mousePressed() {
    if(mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height){
    let scl = grid[0][0].scl;
    let gridCoord = [floor(mouseX / scl), floor(mouseY / scl)];
    grid[gridCoord[0]][gridCoord[1]].wall = !grid[gridCoord[0]][gridCoord[1]].wall;
    drawGrid(grid);
    console.log(gridCoord);
    }
}

function generateJSON(grid, robots) {
    let data = {
        agents: {},
        map: {
            dimensions: [rows, cols],
            obstacles: [],
        }
    }

    robots.forEach((robot) => {
        data.agents[robot.name] = {};
        data.agents[robot.name]['name'] = robot.name;
        data.agents[robot.name]['start'] = robot.start;
        data.agents[robot.name]['goal'] = robot.goal;
    })
    
    for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
            if(grid[x][y].wall) {
            // data.map.obstacles.push(`!!python/tuple [${x}, ${y}]`);
            data.map.obstacles.push([x, y]);
            }
        }
    }
    // console.log(data.map.obstacles);
    // console.log(YAML.stringify(data));
    console.log("Donwloading");
    download(JSON.stringify(data, null, 2), 'environment.json', 'application/json');
}

window.addEventListener('load', function () {
    document.getElementById('envDownload').addEventListener('click', () => {
      generateYML();
    });
  })
  