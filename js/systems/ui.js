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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';

        let y = 100;
        for (const [type, powerUp] of Object.entries(player.powerUps)) {
            const timeLeft = Math.ceil((powerUp.duration - (Date.now() - powerUp.startTime)) / 1000);
            ctx.fillText(`${type}: ${timeLeft}s`, 10, y);
            y += 20;
        }
        ctx.restore();
    }

    renderControls(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, GAME_CONFIG.CANVAS_HEIGHT - 60, 200, 50);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('WASD: Move | Space: Shoot | ESC: Pause', 15, GAME_CONFIG.CANVAS_HEIGHT - 40);
        ctx.fillText('Arrow keys also work!', 15, GAME_CONFIG.CANVAS_HEIGHT - 25);
        ctx.restore();
    }

    renderMinimap(ctx, map, player, enemies) {
        const minimapSize = 150;
        const minimapX = GAME_CONFIG.CANVAS_WIDTH - minimapSize - 10;
        const minimapY = 10;
        const scale = minimapSize / Math.max(map.width * map.tileSize, map.height * map.tileSize);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(minimapX, minimapY, minimapSize, minimapSize);

        ctx.strokeStyle = '#fff';
        ctx.strokeRect(minimapX, minimapY, minimapSize, minimapSize);

        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const tileType = map.getTile(x, y);
                if (tileType === GAME_CONFIG.TILE.TYPES.WALL || 
                    tileType === GAME_CONFIG.TILE.TYPES.DESTRUCTIBLE_WALL) {
                    ctx.fillStyle = '#666';
                    ctx.fillRect(
                        minimapX + x * map.tileSize * scale,
                        minimapY + y * map.tileSize * scale,
                        map.tileSize * scale,
                        map.tileSize * scale
                    );
                }
            }
        }

        ctx.fillStyle = '#0f0';
        ctx.fillRect(
            minimapX + player.position.x * scale - 2,
            minimapY + player.position.y * scale - 2,
            4, 4
        );

        ctx.fillStyle = '#f00';
        for (const enemy of enemies) {
            if (enemy.active) {
                ctx.fillRect(
                    minimapX + enemy.position.x * scale - 2,
                    minimapY + enemy.position.y * scale - 2,
                    4, 4
                );
            }
        }
    }
}