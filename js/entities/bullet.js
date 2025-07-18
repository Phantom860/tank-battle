class Bullet {
    constructor(x, y, angle, owner, damage = GAME_CONFIG.BULLET.DAMAGE) {
        this.position = new Vector2(x, y);
        this.velocity = Vector2.fromAngle(angle, GAME_CONFIG.BULLET.SPEED);
        this.angle = angle;
        this.width = GAME_CONFIG.BULLET.WIDTH;
        this.height = GAME_CONFIG.BULLET.HEIGHT;
        this.damage = damage;
        this.owner = owner;
        this.lifetime = GAME_CONFIG.BULLET.LIFETIME;
        this.active = true;
    }

    update(deltaTime) {
        if (!this.active) return;

        this.position = this.position.add(this.velocity);
        this.lifetime -= deltaTime;

        if (this.lifetime <= 0 || 
            this.position.x < 0 || 
            this.position.x > GAME_CONFIG.CANVAS_WIDTH || 
            this.position.y < 0 || 
            this.position.y > GAME_CONFIG.CANVAS_HEIGHT) {
            this.active = false;
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = GAME_CONFIG.COLORS.BULLET;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        ctx.restore();
    }

    getBounds() {
        return {
            x: this.position.x - this.width / 2,
            y: this.position.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    onHit() {
        this.active = false;
    }
}