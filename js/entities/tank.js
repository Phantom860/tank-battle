class Tank {
    constructor(x, y, color, isPlayer = false) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(0, 0);
        this.angle = 0;
        this.width = GAME_CONFIG.TANK.WIDTH;
        this.height = GAME_CONFIG.TANK.HEIGHT;
        this.color = color;
        this.isPlayer = isPlayer;
        
        this.maxHealth = GAME_CONFIG.TANK.MAX_HEALTH;
        this.health = this.maxHealth;
        this.speed = GAME_CONFIG.TANK.SPEED;
        this.rotationSpeed = GAME_CONFIG.TANK.ROTATION_SPEED;
        this.shootCooldown = GAME_CONFIG.TANK.SHOOT_COOLDOWN;
        this.lastShotTime = 0;
        
        this.active = true;
        this.powerUps = {};
        
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            shoot: false
        };
        
        if (isPlayer) {
            this.setupControls();
        }
    }

    setupControls() {
        console.log('Setting up controls for player tank');
        // Controls will be set up globally in Game class
    }

    update(deltaTime, map) {
        if (!this.active) return;

        if (this.isPlayer) {
            this.handlePlayerInput();
        }

        this.updatePosition(map); // 传递map参数
        this.updatePowerUps(deltaTime);
    }

    handlePlayerInput() {
        let moveSpeed = this.speed;
        
        if (this.powerUps.speed) {
            moveSpeed *= 1.5;
        }

        // Reset velocity
        this.velocity = new Vector2(0, 0);

        // WASD as cardinal directions (like classic tank games)
        if (this.keys.up) {
            this.velocity.y = -moveSpeed;
        } else if (this.keys.down) {
            this.velocity.y = moveSpeed;
        }
        
        if (this.keys.left) {
            this.velocity.x = -moveSpeed;
        } else if (this.keys.right) {
            this.velocity.x = moveSpeed;
        }

        // Set tank rotation to match movement direction
        if (this.velocity.magnitude() > 0) {
            this.angle = this.velocity.angle();
        }
    }

// 优化移动-碰撞-回退机制，允许轻微偏移通过狭窄路径
    updatePosition(map) {
        if (this.velocity.magnitude() === 0) return;

        // 尝试移动并检测碰撞
        const newPosition = this.position.add(this.velocity);
        
        // 边界检查
        newPosition.x = clamp(newPosition.x, 0, GAME_CONFIG.CANVAS_WIDTH - this.width);
        newPosition.y = clamp(newPosition.y, 0, GAME_CONFIG.CANVAS_HEIGHT - this.height);

        // 宽松碰撞检测 - 检查坦克中心点和四个角点
        const margin = 2; // 边缘余量，允许轻微偏移
        const checkPoints = [
            new Vector2(newPosition.x + margin, newPosition.y + margin),
            new Vector2(newPosition.x + this.width - margin, newPosition.y + margin),
            new Vector2(newPosition.x + margin, newPosition.y + this.height - margin),
            new Vector2(newPosition.x + this.width - margin, newPosition.y + this.height - margin),
            new Vector2(newPosition.x + this.width/2, newPosition.y + this.height/2) // 中心点
        ];

        let canMove = true;
        for (const point of checkPoints) {
            const gridX = Math.floor(point.x / GAME_CONFIG.GRID_SIZE);
            const gridY = Math.floor(point.y / GAME_CONFIG.GRID_SIZE);
            
            if (isValidGridPosition(gridX, gridY, map)) {
                const tileType = map[gridY][gridX];
                if (tileType === GAME_CONFIG.TILE.TYPES.WALL ||
                    tileType === GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL ||
                    tileType === GAME_CONFIG.TILE.TYPES.WATER) {
                    canMove = false;
                    break;
                }
            }
        }

        if (canMove) {
            this.position = newPosition;
        } else {
            // 碰撞发生时尝试部分移动
            const partialVelocity = this.velocity.multiply(0.5);
            const partialPosition = this.position.add(partialVelocity);
            
            // 检查部分移动是否可行
            let partialCanMove = true;
            for (const point of checkPoints) {
                const adjustedPoint = point.add(partialVelocity);
                const gridX = Math.floor(adjustedPoint.x / GAME_CONFIG.GRID_SIZE);
                const gridY = Math.floor(adjustedPoint.y / GAME_CONFIG.GRID_SIZE);
                
                if (isValidGridPosition(gridX, gridY, map)) {
                    const tileType = map[gridY][gridX];
                    if (tileType === GAME_CONFIG.TILE.TYPES.WALL ||
                        tileType === GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL ||
                        tileType === GAME_CONFIG.TILE.TYPES.WATER) {
                        partialCanMove = false;
                        break;
                    }
                }
            }
            
            if (partialCanMove) {
                this.position = partialPosition;
            } else {
                this.velocity = new Vector2(0, 0);
            }
        }
    }

    handleMapCollision(map) {
        const gridPos = getGridPosition(this.position);
        const tankGridWidth = Math.ceil(this.width / GAME_CONFIG.GRID_SIZE);
        const tankGridHeight = Math.ceil(this.height / GAME_CONFIG.GRID_SIZE);

        for (let dy = 0; dy < tankGridHeight; dy++) {
            for (let dx = 0; dx < tankGridWidth; dx++) {
                const checkX = gridPos.x + dx;
                const checkY = gridPos.y + dy;

                if (isValidGridPosition(checkX, checkY, map)) {
                    const tileType = map[checkY][checkX];
                    if (tileType === GAME_CONFIG.TILE.TYPES.WALL || 
                        tileType === GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL ||
                        tileType === GAME_CONFIG.TILE.TYPES.WATER) {
                        
                        const tileBounds = {
                            x: checkX * GAME_CONFIG.GRID_SIZE,
                            y: checkY * GAME_CONFIG.GRID_SIZE,
                            width: GAME_CONFIG.GRID_SIZE,
                            height: GAME_CONFIG.GRID_SIZE
                        };

                        const tankBounds = this.getBounds();
                        
                        if (checkCollision(tankBounds, tileBounds)) {
                            this.handleTileCollision(tileBounds);
                        }
                    }
                }
            }
        }
    }

    handleTileCollision(tileBounds) {
        const tankBounds = this.getBounds();
        
        const overlapX = Math.min(tankBounds.x + tankBounds.width, tileBounds.x + tileBounds.width) - 
                        Math.max(tankBounds.x, tileBounds.x);
        const overlapY = Math.min(tankBounds.y + tankBounds.height, tileBounds.y + tileBounds.height) - 
                        Math.max(tankBounds.y, tileBounds.y);

        if (overlapX < overlapY) {
            if (tankBounds.x < tileBounds.x) {
                this.position.x = tileBounds.x - this.width;
            } else {
                this.position.x = tileBounds.x + tileBounds.width;
            }
        } else {
            if (tankBounds.y < tileBounds.y) {
                this.position.y = tileBounds.y - this.height;
            } else {
                this.position.y = tileBounds.y + tileBounds.height;
            }
        }

        this.velocity = new Vector2(0, 0);
    }

    shoot() {
        const now = Date.now();
        const cooldown = this.powerUps.fireRate ? this.shootCooldown * 0.5 : this.shootCooldown;
        
        if (now - this.lastShotTime >= cooldown) {
            const barrelEnd = Vector2.fromAngle(this.angle, this.width / 2);
            const bulletX = this.position.x + this.width / 2 + barrelEnd.x - GAME_CONFIG.BULLET.WIDTH / 2;
            const bulletY = this.position.y + this.height / 2 + barrelEnd.y - GAME_CONFIG.BULLET.HEIGHT / 2;
            
            const damage = this.powerUps.damage ? GAME_CONFIG.BULLET.DAMAGE * 2 : GAME_CONFIG.BULLET.DAMAGE;
            
            this.lastShotTime = now;
            return new Bullet(bulletX, bulletY, this.angle, this, damage);
        }
        return null;
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.active = false;
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addPowerUp(type) {
        this.powerUps[type] = {
            startTime: Date.now(),
            duration: GAME_CONFIG.POWERUP.DURATION
        };
    }

    updatePowerUps(deltaTime) {
        const now = Date.now();
        for (const [type, powerUp] of Object.entries(this.powerUps)) {
            if (now - powerUp.startTime >= powerUp.duration) {
                delete this.powerUps[type];
            }
        }
    }

    render(ctx) {
        if (!this.active) return;

        drawTank(ctx, this.position.x, this.position.y, this.width, this.height, this.angle, this.color);

        const healthPercentage = this.health / this.maxHealth;
        const barWidth = this.width;
        const barHeight = 4;
        const barY = this.position.y - 10;

        ctx.fillStyle = '#333';
        ctx.fillRect(this.position.x, barY, barWidth, barHeight);

        ctx.fillStyle = healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.position.x, barY, barWidth * healthPercentage, barHeight);
    }

    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }

    getCenterPosition() {
        return new Vector2(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        );
    }
}