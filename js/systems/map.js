class Map {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tileSize = GAME_CONFIG.TILE.SIZE;
        this.map = this.generateMap();
    }

    generateMap() {
        const map = [];
        
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                if (x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1) {
                    row.push(GAME_CONFIG.TILE.TYPES.WALL);
                } else {
                    row.push(GAME_CONFIG.TILE.TYPES.EMPTY);
                }
            }
            map.push(row);
        }

        // Add more walls and destructible walls for better visibility
        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (x % 4 === 0 && y % 4 === 0 && !(x < 5 && y < 5)) {
                    map[y][x] = GAME_CONFIG.TILE.TYPES.WALL;
                } else if ((x + y) % 7 === 0 && !(x < 4 && y < 4)) {
                    map[y][x] = GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL;
                } else if (Math.random() < 0.08 && !(x < 4 && y < 4)) {
                    map[y][x] = Math.random() < 0.7 ? 
                        GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL : 
                        GAME_CONFIG.TILE.TYPES.WALL;
                } else if (Math.random() < 0.05) {
                    map[y][x] = GAME_CONFIG.TILE.TYPES.GRASS;
                }
            }
        }

        // Ensure spawn area is clear
        map[1][1] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[1][2] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[1][3] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[2][1] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[2][2] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[2][3] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[3][1] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[3][2] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[3][3] = GAME_CONFIG.TILE.TYPES.EMPTY;

        return map;
    }

    loadFromArray(mapArray) {
        this.map = mapArray;
        this.height = mapArray.length;
        this.width = mapArray[0].length;
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return GAME_CONFIG.TILE.TYPES.WALL;
        }
        return this.map[y][x];
    }

    setTile(x, y, tileType) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.map[y][x] = tileType;
            return true;
        }
        return false;
    }

    isWalkable(x, y) {
        const tileType = this.getTile(x, y);
        return tileType === GAME_CONFIG.TILE.TYPES.EMPTY || 
               tileType === GAME_CONFIG.TILE.TYPES.GRASS;
    }

    isDestructible(x, y) {
        return this.getTile(x, y) === GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL;
    }

    destroyTile(x, y) {
        if (this.isDestructible(x, y)) {
            this.setTile(x, y, GAME_CONFIG.TILE.TYPES.EMPTY);
            return true;
        }
        return false;
    }

    render(ctx) {
        // Fill background to avoid black screen
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileType = this.map[y][x];
                const tileColor = TILE_COLORS[tileType];
                
                if (tileType !== GAME_CONFIG.TILE.TYPES.EMPTY) {
                    ctx.fillStyle = tileColor;
                    ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                    
                    ctx.strokeStyle = '#333';
                    ctx.strokeRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                } else {
                    // Render empty tiles with a dark color to show grid
                    ctx.fillStyle = '#111';
                    ctx.fillRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                    ctx.strokeStyle = '#222';
                    ctx.strokeRect(
                        x * this.tileSize,
                        y * this.tileSize,
                        this.tileSize,
                        this.tileSize
                    );
                }
            }
        }
    }

    checkBulletCollision(bullet) {
        const bounds = bullet.getBounds();
        
        // 检查子弹周围的4个主要格子
        const checkPositions = [
            getGridPosition(new Vector2(bounds.x, bounds.y)),
            getGridPosition(new Vector2(bounds.x + bounds.width, bounds.y)),
            getGridPosition(new Vector2(bounds.x, bounds.y + bounds.height)),
            getGridPosition(new Vector2(bounds.x + bounds.width, bounds.y + bounds.height))
        ];
        
        for (const gridPos of checkPositions) {
            const tileType = this.getTile(gridPos.x, gridPos.y);
            if (tileType === GAME_CONFIG.TILE.TYPES.WALL || 
                tileType === GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL) {
                
                const tileBounds = {
                    x: gridPos.x * this.tileSize,
                    y: gridPos.y * this.tileSize,
                    width: this.tileSize,
                    height: this.tileSize
                };
                
                if (checkCollision(bounds, tileBounds)) {
                    if (tileType === GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL) {
                        this.destroyTile(gridPos.x, gridPos.y);
                    }
                    return true;
                }
            }
        }
        return false;
    }

    findPath(start, end) {
        const startGrid = getGridPosition(start);
        const endGrid = getGridPosition(end);
        
        if (!this.isWalkable(endGrid.x, endGrid.y)) {
            return [];
        }

        const openSet = [startGrid];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(`${startGrid.x},${startGrid.y}`, 0);
        fScore.set(`${startGrid.x},${startGrid.y}`, this.heuristic(startGrid, endGrid));

        while (openSet.length > 0) {
            openSet.sort((a, b) => {
                const fA = fScore.get(`${a.x},${a.y}`) || Infinity;
                const fB = fScore.get(`${b.x},${b.y}`) || Infinity;
                return fA - fB;
            });

            const current = openSet.shift();
            const currentKey = `${current.x},${current.y}`;

            if (current.x === endGrid.x && current.y === endGrid.y) {
                return this.reconstructPath(cameFrom, current);
            }

            closedSet.add(currentKey);

            for (const neighbor of this.getNeighbors(current)) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(neighborKey)) continue;

                const tentativeGScore = (gScore.get(currentKey) || Infinity) + 1;

                if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                    continue;
                }

                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore + this.heuristic(neighbor, endGrid));
            }
        }

        return [];
    }

    getNeighbors(pos) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, { x: 1, y: 0 },
            { x: 0, y: 1 }, { x: -1, y: 0 }
        ];

        for (const dir of directions) {
            const newX = pos.x + dir.x;
            const newY = pos.y + dir.y;

            if (this.isWalkable(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        const currentKey = `${current.x},${current.y}`;

        while (cameFrom.has(currentKey)) {
            const prev = cameFrom.get(currentKey);
            path.unshift(prev);
            currentKey = `${prev.x},${prev.y}`;
        }

        return path;
    }

    generateLevel(level) {
        const width = 25;
        const height = 19;
        
        const map = [];
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                    row.push(GAME_CONFIG.TILE.TYPES.WALL);
                } else {
                    row.push(GAME_CONFIG.TILE.TYPES.EMPTY);
                }
            }
            map.push(row);
        }

        const wallDensity = Math.min(0.3 + level * 0.05, 0.5);
        for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
                if (Math.random() < wallDensity && !(x < 4 && y < 4)) {
                    if (Math.random() < 0.7) {
                        map[y][x] = GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL;
                    } else {
                        map[y][x] = GAME_CONFIG.TILE.TYPES.WALL;
                    }
                }
            }
        }

        map[1][1] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[1][2] = GAME_CONFIG.TILE.TYPES.EMPTY;
        map[2][1] = GAME_CONFIG.TILE.TYPES.EMPTY;

        this.loadFromArray(map);
    }
}