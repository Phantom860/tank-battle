class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2(0, 0);
        return new Vector2(this.x / mag, this.y / mag);
    }

    distance(other) {
        return this.subtract(other).magnitude();
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    static fromAngle(angle, magnitude = 1) {
        return new Vector2(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function getGridPosition(worldPos) {
    return new Vector2(
        Math.floor(worldPos.x / GAME_CONFIG.GRID_SIZE),
        Math.floor(worldPos.y / GAME_CONFIG.GRID_SIZE)
    );
}

function getWorldPosition(gridPos) {
    return new Vector2(
        gridPos.x * GAME_CONFIG.GRID_SIZE,
        gridPos.y * GAME_CONFIG.GRID_SIZE
    );
}

function isValidGridPosition(gridX, gridY, map) {
    return gridX >= 0 && gridX < map[0].length &&
           gridY >= 0 && gridY < map.length;
}

function playSound(soundName, volume = 0.5) {
    const audio = new Audio(`assets/sounds/${soundName}.wav`);
    audio.volume = volume;
    audio.play().catch(() => {});
}

function drawRotatedRect(ctx, x, y, width, height, angle, color) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    ctx.restore();
}

function drawTank(ctx, x, y, width, height, angle, color) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(angle);
    
    ctx.fillStyle = color;
    ctx.fillRect(-width / 2, -height / 2, width, height);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(-width / 2 + 2, -height / 2 + 2, width - 4, height - 4);
    
    ctx.fillStyle = color;
    ctx.fillRect(-width / 2 + 4, -height / 2 + 4, width - 8, height - 8);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(0, -height / 4, width / 2, height / 2);
    
    ctx.restore();
}