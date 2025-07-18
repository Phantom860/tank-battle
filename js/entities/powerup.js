class PowerUp {
    constructor(x, y, type) {
        this.position = new Vector2(x, y);
        this.type = type;
        this.width = GAME_CONFIG.POWERUP.WIDTH;
        this.height = GAME_CONFIG.POWERUP.HEIGHT;
        this.active = true;
        this.animationOffset = 0;
    }

    update(deltaTime) {
        if (!this.active) return;
        
        this.animationOffset += deltaTime * 0.005;
    }

    render(ctx) {
        if (!this.active) return;

        const bounce = Math.sin(this.animationOffset) * 2;
        const x = this.position.x;
        const y = this.position.y + bounce;

        const color = this.getColor();
        
        ctx.save();
        ctx.translate(x + this.width / 2, y + this.height / 2);
        ctx.rotate(this.animationOffset * 0.5);
        
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        this.drawSymbol(ctx);
        
        ctx.restore();
    }

    drawSymbol(ctx) {
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let symbol = '?';
        switch (this.type) {
            case GAME_CONFIG.POWERUP.TYPES.HEALTH:
                symbol = '+';
                break;
            case GAME_CONFIG.POWERUP.TYPES.SPEED:
                symbol = '⚡';
                break;
            case GAME_CONFIG.POWERUP.TYPES.FIRE_RATE:
                symbol = '»';
                break;
            case GAME_CONFIG.POWERUP.TYPES.DAMAGE:
                symbol = '💥';
                break;
        }
        
        ctx.fillText(symbol, 0, 0);
    }

    getColor() {
        switch (this.type) {
            case GAME_CONFIG.POWERUP.TYPES.HEALTH:
                return GAME_CONFIG.COLORS.POWERUP_HEALTH;
            case GAME_CONFIG.POWERUP.TYPES.SPEED:
                return GAME_CONFIG.COLORS.POWERUP_SPEED;
            case GAME_CONFIG.POWERUP.TYPES.FIRE_RATE:
                return GAME_CONFIG.COLORS.POWERUP_FIRE_RATE;
            case GAME_CONFIG.POWERUP.TYPES.DAMAGE:
                return GAME_CONFIG.COLORS.POWERUP_DAMAGE;
            default:
                return '#ffffff';
        }
    }

    apply(tank) {
        switch (this.type) {
            case GAME_CONFIG.POWERUP.TYPES.HEALTH:
                tank.heal(25);
                break;
            case GAME_CONFIG.POWERUP.TYPES.SPEED:
                tank.addPowerUp('speed');
                break;
            case GAME_CONFIG.POWERUP.TYPES.FIRE_RATE:
                tank.addPowerUp('fireRate');
                break;
            case GAME_CONFIG.POWERUP.TYPES.DAMAGE:
                tank.addPowerUp('damage');
                break;
        }
    }

    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            width: this.width,
            height: this.height
        };
    }

    static spawnRandom(map) {
        const attempts = 100;
        for (let i = 0; i < attempts; i++) {
            const x = Math.floor(Math.random() * (GAME_CONFIG.CANVAS_WIDTH - GAME_CONFIG.POWERUP.WIDTH));
            const y = Math.floor(Math.random() * (GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.POWERUP.HEIGHT));
            
            const gridPos = getGridPosition(new Vector2(x, y));
            if (map.isWalkable(gridPos.x, gridPos.y)) {
                const types = Object.values(GAME_CONFIG.POWERUP.TYPES);
                const type = types[Math.floor(Math.random() * types.length)];
                return new PowerUp(x, y, type);
            }
        }
        return null;
    }
}