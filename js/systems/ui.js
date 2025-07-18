class UI {
    constructor(game) {
        this.game = game;
        this.scoreElement = document.getElementById('score');
        this.healthElement = document.getElementById('health');
        this.livesElement = document.getElementById('lives');
        this.levelElement = document.getElementById('level');
    }

    update() {
        this.scoreElement.textContent = `Score: ${this.game.score}`;
        this.healthElement.textContent = `Health: ${this.game.player.health}`;
        this.livesElement.textContent = `Lives: ${this.game.lives}`;
        this.levelElement.textContent = `Level: ${this.game.level}`;
    }

    showGameOver() {
        const overlay = this.createOverlay();
        overlay.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #ff4444; font-size: 48px; margin-bottom: 20px;">Game Over</h2>
                <p style="font-size: 24px; margin-bottom: 20px;">Final Score: ${this.game.score}</p>
                <p style="font-size: 18px; margin-bottom: 30px;">Level Reached: ${this.game.level}</p>
                <button onclick="location.reload()" style="
                    padding: 15px 30px;
                    font-size: 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Play Again</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    showLevelComplete() {
        const overlay = this.createOverlay();
        overlay.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #44ff44; font-size: 48px; margin-bottom: 20px;">Level ${this.game.level} Complete!</h2>
                <p style="font-size: 24px; margin-bottom: 30px;">Score: ${this.game.score}</p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    padding: 15px 30px;
                    font-size: 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Next Level</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    showPauseMenu() {
        const overlay = this.createOverlay();
        overlay.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #ffff44; font-size: 48px; margin-bottom: 30px;">Paused</h2>
                <button onclick="this.parentElement.parentElement.remove(); game.resume();" style="
                    padding: 15px 30px;
                    font-size: 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px;
                ">Resume</button>
                <button onclick="location.reload()" style="
                    padding: 15px 30px;
                    font-size: 20px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px;
                ">Restart</button>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;
        return overlay;
    }

    renderPowerUpEffects(ctx, player) {
        if (Object.keys(player.powerUps).length === 0) return;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        // 移到地图上方显示
        ctx.fillRect(10, GAME_CONFIG.CANVAS_HEIGHT - 190, 120, 25 + Object.keys(player.powerUps).length * 15);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        let y = GAME_CONFIG.CANVAS_HEIGHT - 175;
        for (const [type, powerUp] of Object.entries(player.powerUps)) {
            const timeLeft = Math.ceil((powerUp.duration - (Date.now() - powerUp.startTime)) / 1000);
            ctx.fillText(`${type}: ${timeLeft}s`, 15, y);
            y += 15;
        }
        ctx.restore();
    }

    renderControls(ctx) {
        // 完全移除游戏区域内的操作提示，改用HTML元素显示在画面外
    }

    renderMinimap(ctx, map, player, enemies) {
        // 完全移除游戏区域内的小地图，改用HTML元素显示在画面外
    }

    renderPowerUpEffects(ctx, player) {
        // 完全移除游戏区域内的道具效果提示，改用HTML元素显示在画面外
    }

    renderExternalUI(map, player, enemies) {
        this.renderExternalMinimap(map, player, enemies);
        this.renderExternalPowerups(player);
    }

    renderExternalMinimap(map, player, enemies) {
        const minimapCanvas = document.getElementById('minimapCanvas');
        if (!minimapCanvas) return;
        
        const ctx = minimapCanvas.getContext('2d');
        const minimapSize = 150;
        const scale = minimapSize / Math.max(map.width * map.tileSize, map.height * map.tileSize);

        ctx.clearRect(0, 0, minimapSize, minimapSize);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, minimapSize, minimapSize);
        
        ctx.strokeStyle = '#666';
        ctx.strokeRect(0, 0, minimapSize, minimapSize);

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tileType = map.getTile(x, y);
                if (tileType === GAME_CONFIG.TILE.TYPES.WALL || 
                    tileType === GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL) {
                    ctx.fillStyle = '#666';
                    ctx.fillRect(
                        x * map.tileSize * scale,
                        y * map.tileSize * scale,
                        map.tileSize * scale,
                        map.tileSize * scale
                    );
                }
            }
        }

        ctx.fillStyle = '#0f0';
        ctx.fillRect(
            player.position.x * scale - 2,
            player.position.y * scale - 2,
            4, 4
        );

        ctx.fillStyle = '#f00';
        for (const enemy of enemies) {
            if (enemy.active) {
                ctx.fillRect(
                    enemy.position.x * scale - 2,
                    enemy.position.y * scale - 2,
                    4, 4
                );
            }
        }
    }

    renderExternalPowerups(player) {
        const powerupsContainer = document.getElementById('activePowerups');
        if (!powerupsContainer) return;

        powerupsContainer.innerHTML = '';
        
        if (Object.keys(player.powerUps).length === 0) {
            powerupsContainer.innerHTML = '<p>无激活道具</p>';
            return;
        }

        for (const [type, powerUp] of Object.entries(player.powerUps)) {
            const timeLeft = Math.ceil((powerUp.duration - (Date.now() - powerUp.startTime)) / 1000);
            const div = document.createElement('div');
            div.textContent = `${type}: ${timeLeft}秒`;
            powerupsContainer.appendChild(div);
        }
    }
}