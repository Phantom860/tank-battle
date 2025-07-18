class Enemy extends Tank {
    constructor(x, y, level = 1) {
        super(x, y, GAME_CONFIG.COLORS.ENEMY_TANK, false);
        this.level = level;
        this.maxHealth = GAME_CONFIG.ENEMY.MAX_HEALTH + (level - 1) * 10;
        this.health = this.maxHealth;
        this.speed = GAME_CONFIG.TANK.SPEED * 0.8; // 更平滑的移动速度
        this.targetPosition = new Vector2(x, y); // 目标位置
        this.isMoving = false;
        this.moveProgress = 0; // 移动进度（0-1）
        this.moveDuration = 300; // 移动一个格子所需时间（毫秒）
        this.nextMoveTime = 0;
        this.moveInterval = 1000 + Math.random() * 1000; // 每1-2秒决定一次移动
        
        // 射击系统 - 提高频率
        this.lastShotTime = 0;
        this.shootingInterval = 2000 + Math.random() * 2000; // 每2-4秒射击一次
        this.shootCooldown = Math.max(GAME_CONFIG.ENEMY.SHOOT_COOLDOWN - (level - 1) * 100, 1000);
        this.detectionRange = GAME_CONFIG.ENEMY.DETECTION_RANGE + (level - 1) * 20;
        this.shouldShootThisFrame = false; // 标记是否应该在当前帧射击
        
        // 网格坐标
        this.gridX = Math.floor(x / GAME_CONFIG.GRID_SIZE);
        this.gridY = Math.floor(y / GAME_CONFIG.GRID_SIZE);
        
        console.log('Enemy spawned at:', x, y, 'level:', level);
    }

    update(deltaTime, mapInstance, player) {
        if (!this.active) return;

        this.target = player;
        this.map = mapInstance;
        this.updateAI(deltaTime, mapInstance);
    }

    updateAI(deltaTime, map) {
        this.nextMoveTime += deltaTime;
        
        // 平滑移动系统
        if (this.isMoving) {
            this.moveProgress += deltaTime / this.moveDuration;
            if (this.moveProgress >= 1) {
                this.moveProgress = 1;
                this.isMoving = false;
                this.position = new Vector2(this.targetPosition.x, this.targetPosition.y);
            } else {
                // 插值计算当前位置
                const currentX = this.position.x + (this.targetPosition.x - this.position.x) * this.moveProgress;
                const currentY = this.position.y + (this.targetPosition.y - this.position.y) * this.moveProgress;
                this.position = new Vector2(currentX, currentY);
            }
        }
        
        // 决定下一个移动
        if (!this.isMoving && this.nextMoveTime >= this.moveInterval) {
            this.nextMoveTime = 0;
            this.decideNextMove(map);
        }
        
        // 定期射击
        this.periodicShooting();
    }

    decideNextMove(map) {
        const currentGridX = Math.floor(this.position.x / GAME_CONFIG.GRID_SIZE);
        const currentGridY = Math.floor(this.position.y / GAME_CONFIG.GRID_SIZE);
        
        // 四个可能的移动方向
        const directions = [
            { dx: 0, dy: -1, dir: 0, angle: -Math.PI/2 }, // 上
            { dx: 1, dy: 0, dir: 1, angle: 0 },          // 右
            { dx: 0, dy: 1, dir: 2, angle: Math.PI/2 },  // 下
            { dx: -1, dy: 0, dir: 3, angle: Math.PI }    // 左
        ];
        
        // 过滤可移动的方向
        const validDirections = directions.filter(d => {
            const newX = currentGridX + d.dx;
            const newY = currentGridY + d.dy;
            return map.isWalkable(newX, newY);
        });
        
        if (validDirections.length === 0) {
            // 无法移动，等待下一次决策
            return;
        }
        
        // 有一定概率继续当前方向，有一定概率随机改变方向
        let chosenDirection;
        if (Math.random() < 0.6 && validDirections.some(d => d.dir === this.direction)) {
            // 60%概率继续当前方向
            chosenDirection = validDirections.find(d => d.dir === this.direction) || validDirections[0];
        } else {
            // 40%概率随机选择新方向
            chosenDirection = validDirections[Math.floor(Math.random() * validDirections.length)];
        }
        
        this.direction = chosenDirection.dir;
        this.angle = chosenDirection.angle;
        
        // 设置新的目标位置
        const newX = (currentGridX + chosenDirection.dx) * GAME_CONFIG.GRID_SIZE;
        const newY = (currentGridY + chosenDirection.dy) * GAME_CONFIG.GRID_SIZE;
        
        // 确保在画布范围内
        this.targetPosition = new Vector2(
            clamp(newX, 0, GAME_CONFIG.CANVAS_WIDTH - this.width),
            clamp(newY, 0, GAME_CONFIG.CANVAS_HEIGHT - this.height)
        );
        
        // 开始平滑移动
        this.isMoving = true;
        this.moveProgress = 0;
    }



    periodicShooting() {
        const now = Date.now();
        
        // 确保每次只发射一颗子弹，增加更严格的检查
        if (now - this.lastShotTime >= this.shootingInterval && this.active) {
            this.lastShotTime = now;
            this.shouldShootThisFrame = true; // 设置标记，让游戏循环处理
        }
    }

    shootSingleBullet() {
        const barrelEnd = Vector2.fromAngle(this.angle, this.width / 2);
        const bulletX = this.position.x + this.width / 2 + barrelEnd.x - GAME_CONFIG.BULLET.WIDTH / 2;
        const bulletY = this.position.y + this.height / 2 + barrelEnd.y - GAME_CONFIG.BULLET.HEIGHT / 2;
        
        return new Bullet(bulletX, bulletY, this.angle, this, GAME_CONFIG.BULLET.DAMAGE);
    }

    hasLineOfSight(target) {
        const myPos = this.getCenterPosition();
        const targetPos = target.getCenterPosition();
        const direction = targetPos.subtract(myPos).normalize();
        
        const distance = myPos.distance(targetPos);
        const steps = Math.floor(distance / 10);
        
        for (let i = 1; i < steps; i++) {
            const checkPos = myPos.add(direction.multiply(i * 10));
            const gridPos = getGridPosition(checkPos);
            
            if (!this.map || !this.map.isWalkable(gridPos.x, gridPos.y)) {
                return false;
            }
        }
        
        return true;
    }

    render(ctx) {
        super.render(ctx);
        
        if (this.state === 'chase') {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.getCenterPosition().x, this.getCenterPosition().y, this.detectionRange, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    shoot() {
        const barrelEnd = Vector2.fromAngle(this.angle, this.width / 2);
        const bulletX = this.position.x + this.width / 2 + barrelEnd.x - GAME_CONFIG.BULLET.WIDTH / 2;
        const bulletY = this.position.y + this.height / 2 + barrelEnd.y - GAME_CONFIG.BULLET.HEIGHT / 2;
        
        return new Bullet(bulletX, bulletY, this.angle, this, GAME_CONFIG.BULLET.DAMAGE);
    }

    static spawnEnemies(count, map, level = 1) {
        const enemies = [];
        const attempts = 200; // 增加尝试次数
        
        // 收集所有可行走的位置
        const validPositions = [];
        for (let y = 1; y < map.height - 1; y++) {
            for (let x = 1; x < map.width - 1; x++) {
                if (map.isWalkable(x, y)) {
                    const pixelX = x * GAME_CONFIG.GRID_SIZE;
                    const pixelY = y * GAME_CONFIG.GRID_SIZE;
                    const distanceToSpawn = new Vector2(pixelX, pixelY).distance(new Vector2(64, 64));
                    if (distanceToSpawn > 150) { // 确保远离玩家出生点
                        validPositions.push({ x: pixelX, y: pixelY });
                    }
                }
            }
        }
        
        // 随机选择位置生成敌人
        for (let i = 0; i < count && validPositions.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * validPositions.length);
            const pos = validPositions.splice(randomIndex, 1)[0]; // 移除已选位置避免重叠
            enemies.push(new Enemy(pos.x, pos.y, level));
        }
        
        return enemies;
    }
}