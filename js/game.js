class Game {
    constructor() {
        console.log('Game constructor starting...');
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        console.log('Canvas:', this.canvas);
        console.log('Context:', this.ctx);
        
        this.map = new Map(25, 19);
        this.collisionSystem = new CollisionSystem();
        this.ui = new UI(this);
        
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        
        this.isPaused = false;
        this.isGameOver = false;
        this.lastTime = 0;
        
        this.powerUpSpawnTime = 0;
        this.powerUpSpawnInterval = 10000;
        
        this.levelComplete = false;
        
        this.setupEventListeners();
        this.initLevel();
        
        console.log('Game initialized:', {
            player: this.player,
            enemies: this.enemies.length,
            bullets: this.bullets.length
        });
        
        // Ensure game starts properly
        this.render(); // Initial render
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            const key = e.code || e.key;
            console.log('Game keydown:', key);
            
            if (this.player) {
                switch(key) {
                    case 'KeyW':
                    case 'w':
                    case 'W':
                    case 'ArrowUp':
                        this.player.keys.up = true;
                        e.preventDefault();
                        break;
                    case 'KeyS':
                    case 's':
                    case 'S':
                    case 'ArrowDown':
                        this.player.keys.down = true;
                        e.preventDefault();
                        break;
                    case 'KeyA':
                    case 'a':
                    case 'A':
                    case 'ArrowLeft':
                        this.player.keys.left = true;
                        e.preventDefault();
                        break;
                    case 'KeyD':
                    case 'd':
                    case 'D':
                    case 'ArrowRight':
                        this.player.keys.right = true;
                        e.preventDefault();
                        break;
                    case 'Space':
                    case ' ':
                        this.player.keys.shoot = true;
                        e.preventDefault();
                        break;
                }
            }
            
            if (e.code === 'Escape') {
                this.togglePause();
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.code || e.key;
            if (this.player) {
                switch(key) {
                    case 'KeyW':
                    case 'w':
                    case 'W':
                    case 'ArrowUp':
                        this.player.keys.up = false;
                        break;
                    case 'KeyS':
                    case 's':
                    case 'S':
                    case 'ArrowDown':
                        this.player.keys.down = false;
                        break;
                    case 'KeyA':
                    case 'a':
                    case 'A':
                    case 'ArrowLeft':
                        this.player.keys.left = false;
                        break;
                    case 'KeyD':
                    case 'd':
                    case 'D':
                    case 'ArrowRight':
                        this.player.keys.right = false;
                        break;
                    case 'Space':
                    case ' ':
                        this.player.keys.shoot = false;
                        break;
                }
            }
        });
    }

    initLevel() {
        this.map.generateLevel(this.level);
        
        this.player = new Tank(64, 64, GAME_CONFIG.COLORS.PLAYER_TANK, true);
        
        const enemyCount = 3; // 固定3个敌人
        this.enemies = Enemy.spawnEnemies(enemyCount, this.map, this.level);
        
        this.bullets = [];
        this.powerUps = [];
        
        this.powerUpSpawnTime = Date.now();
        this.levelComplete = false;
        
        console.log('Level initialized:', this.level);
        console.log('Player:', this.player);
        console.log('Enemies:', this.enemies.length);
    }

    gameLoop(currentTime = 0) {
        if (this.isGameOver) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(deltaTime);
        }
        this.render(); // Always render, even when paused

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (!this.player || !this.player.active) {
            this.handlePlayerDeath();
            return;
        }

        // 传递二维数组
        this.player.update(deltaTime, this.map.map);
        
        if (this.player.keys.shoot) {
            const bullet = this.player.shoot();
            if (bullet) {
                this.bullets.push(bullet);
            }
        }

        for (const enemy of this.enemies) {
            enemy.update(deltaTime, this.map, this.player); // 敌人AI会处理自己的射击
            
            // 检查敌人是否应该射击，并处理子弹创建
            if (enemy.shouldShootThisFrame) {
                const bullet = enemy.shootSingleBullet();
                if (bullet) {
                    this.bullets.push(bullet);
                }
                enemy.shouldShootThisFrame = false;
            }
        }

        for (const bullet of this.bullets) {
            bullet.update(deltaTime);
        }

        for (const powerUp of this.powerUps) {
            powerUp.update(deltaTime);
        }

        this.collisionSystem.update(this.bullets, [this.player], this.enemies, this.powerUps, this.map, this);
        this.collisionSystem.cleanUp();

        this.spawnPowerUps();
        this.checkLevelComplete();

        this.ui.update();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.map.render(this.ctx);

        for (const powerUp of this.powerUps) {
            powerUp.render(this.ctx);
        }

        // 先渲染敌人坦克（底层）
        for (const enemy of this.enemies) {
            if (enemy.active) {
                enemy.render(this.ctx);
            }
        }

        // 最后渲染玩家坦克（确保在最上层）
        if (this.player && this.player.active) {
            this.player.render(this.ctx);
        }

        for (const bullet of this.bullets) {
            if (bullet.active) {
                bullet.render(this.ctx);
            }
        }

        this.ui.renderPowerUpEffects(this.ctx, this.player);
        this.ui.renderMinimap(this.ctx, this.map, this.player, this.enemies);
        this.ui.renderControls(this.ctx);
    }

    spawnPowerUps() {
        const now = Date.now();
        if (now - this.powerUpSpawnTime >= this.powerUpSpawnInterval) {
            const powerUp = PowerUp.spawnRandom(this.map);
            if (powerUp) {
                this.powerUps.push(powerUp);
            }
            this.powerUpSpawnTime = now;
            this.powerUpSpawnInterval = 8000 + Math.random() * 4000;
        }
    }

    checkLevelComplete() {
        const activeEnemies = this.enemies.filter(enemy => enemy.active);
        
        if (activeEnemies.length === 0 && !this.levelComplete) {
            this.levelComplete = true;
            this.completeLevel();
        }
    }

    completeLevel() {
        this.addScore(this.level * 100);
        
        setTimeout(() => {
            this.ui.showLevelComplete();
            this.level++;
            setTimeout(() => {
                this.initLevel();
            }, 2000);
        }, 500);
    }

    handlePlayerDeath() {
        this.lives--;
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            setTimeout(() => {
                this.player = new Tank(64, 64, GAME_CONFIG.COLORS.PLAYER_TANK, true);
            }, 1000);
        }
    }

    gameOver() {
        this.isGameOver = true;
        setTimeout(() => {
            this.ui.showGameOver();
        }, 1000);
    }

    addScore(points) {
        this.score += points;
    }

    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    pause() {
        this.isPaused = true;
        this.ui.showPauseMenu();
    }

    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
    }

    restart() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.initLevel();
        this.gameLoop();
    }
}

let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});