class CollisionSystem {
    constructor() {
        this.bullets = [];
        this.tanks = [];
        this.enemies = [];
        this.powerUps = [];
    }

    update(bullets, tanks, enemies, powerUps, map, game) {
        this.bullets = bullets;
        this.tanks = tanks;
        this.enemies = enemies;
        this.powerUps = powerUps;

        this.checkBulletCollisions(map, game);
        this.checkTankCollisions(game);
        this.checkPowerUpCollisions(game);
    }

    checkBulletCollisions(map, game) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet.active) continue;

            if (map.checkBulletCollision(bullet)) {
                bullet.onHit();
                continue;
            }

            let hit = false;
            const allTanks = [...this.tanks, ...this.enemies];

            for (const tank of allTanks) {
                if (!tank.active || tank === bullet.owner) continue;

                if (checkCollision(bullet.getBounds(), tank.getBounds())) {
                    tank.takeDamage(bullet.damage);
                    bullet.onHit();
                    hit = true;

                    if (bullet.owner && bullet.owner.isPlayer && !tank.active) {
                        game.addScore(tank instanceof Tank ? 100 : 50);
                    }

                    break;
                }
            }

            if (hit) {
                this.bullets.splice(i, 1);
            }
        }
    }

    checkTankCollisions(game) {
        const allTanks = [...this.tanks, ...this.enemies];

        for (let i = 0; i < allTanks.length; i++) {
            for (let j = i + 1; j < allTanks.length; j++) {
                const tank1 = allTanks[i];
                const tank2 = allTanks[j];

                if (!tank1.active || !tank2.active) continue;

                if (checkCollision(tank1.getBounds(), tank2.getBounds())) {
                    this.resolveTankCollision(tank1, tank2);
                }
            }
        }
    }

    resolveTankCollision(tank1, tank2) {
        const center1 = tank1.getCenterPosition();
        const center2 = tank2.getCenterPosition();
        const distance = center1.distance(center2);
        const minDistance = (tank1.width + tank2.width) / 2;

        if (distance < minDistance && distance > 0) {
            const overlap = minDistance - distance;
            const direction = center2.subtract(center1).normalize();

            const move1 = direction.multiply(overlap * 0.5);
            const move2 = direction.multiply(overlap * -0.5);

            tank1.position = tank1.position.add(move1);
            tank2.position = tank2.position.add(move2);

            tank1.position.x = clamp(tank1.position.x, 0, GAME_CONFIG.CANVAS_WIDTH - tank1.width);
            tank1.position.y = clamp(tank1.position.y, 0, GAME_CONFIG.CANVAS_HEIGHT - tank1.height);
            tank2.position.x = clamp(tank2.position.x, 0, GAME_CONFIG.CANVAS_WIDTH - tank2.width);
            tank2.position.y = clamp(tank2.position.y, 0, GAME_CONFIG.CANVAS_HEIGHT - tank2.height);
        }
    }

    checkPowerUpCollisions(game) {
        const player = game.player;
        if (!player || !player.active) return;

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (!powerUp.active) continue;

            if (checkCollision(player.getBounds(), powerUp.getBounds())) {
                powerUp.apply(player);
                powerUp.active = false;
                this.powerUps.splice(i, 1);
                game.addScore(25);
            }
        }
    }

    cleanUp() {
        this.bullets = this.bullets.filter(bullet => bullet.active);
        this.tanks = this.tanks.filter(tank => tank.active);
        this.enemies = this.enemies.filter(enemy => enemy.active);
        this.powerUps = this.powerUps.filter(powerUp => powerUp.active);
    }
}